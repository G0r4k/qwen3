import { useStore } from '../store';
import { ChatMessage } from '../types';
import { ExecutionPlan, PlanStep, ToolCall } from '../types/plan';
import { executeTool, getDeveloperPrompt, getDirectorPrompt, getVerifierPrompt, parseToolCall, ToolContext } from '../tools';
import { v4 as uuidv4 } from 'uuid';

export function useOllama() {
  const { 
    ollamaConfig, 
    addMessage, 
    setGenerating, 
    setCurrentPhase, 
    addTerminalLine,
    files,
    workspaceName,
    setCurrentPlan,
    updatePlanStep,
    updatePlanStatus,
    setWorkspaceFiles
  } = useStore();

  const streamChat = async (
    messages: { role: string; content: string }[],
    model: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    const response = await fetch(`${ollamaConfig.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: ollamaConfig.temperature,
          num_predict: ollamaConfig.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullContent += json.message.content;
            onChunk?.(json.message.content);
          }
        } catch {}
      }
    }

    return fullContent;
  };

  // Generate plan - ULTRA-SIMPLE for small models
  const generatePlan = async (userRequest: string): Promise<ExecutionPlan> => {
    const fileList = getFileList();
    const directorPrompt = getDirectorPrompt();
    
    const systemPrompt = `${directorPrompt}

Current files:
${fileList || '(empty workspace)'}

User request: ${userRequest}

Create the plan NOW.`;

    const response = await streamChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Create the plan.' }
    ], ollamaConfig.directorModel);
    
    // Parse simple format: GOAL: ... STEP 1: ... STEP 2: ...
    try {
      const goalMatch = response.match(/GOAL:\s*(.+)/i);
      const goal = goalMatch ? goalMatch[1].trim() : userRequest;
      
      const stepMatches = [...response.matchAll(/STEP\s*(\d+):\s*([^-]+)\s*-\s*(.+)/gi)];
      
      if (stepMatches.length > 0) {
        return {
          id: uuidv4(),
          goal,
          steps: stepMatches.map((match, idx) => ({
            id: `step-${idx + 1}`,
            title: match[2].trim(),
            description: match[3].trim(),
            status: 'pending' as const
          })),
          status: 'planning',
          createdAt: new Date()
        };
      }
      
      throw new Error('No steps found');
    } catch (error) {
      // Fallback: create simple plan
      return {
        id: uuidv4(),
        goal: userRequest,
        steps: [{
          id: 'step-1',
          title: 'Execute request',
          description: userRequest,
          status: 'pending'
        }],
        status: 'planning',
        createdAt: new Date()
      };
    }
  };

  // Execute step - ULTRA-SIMPLE for small models
  const executeStep = async (step: PlanStep, plan: ExecutionPlan): Promise<PlanStep> => {
    const fileList = getFileList();
    const developerPrompt = getDeveloperPrompt();

    const systemPrompt = `${developerPrompt}

Current files:
${fileList}

Your task: ${step.title}
Details: ${step.description}

START NOW. Use ACTION: write_file to create files.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Execute the step. Create the files now.' }
    ];

    const toolCalls: ToolCall[] = [];
    let summary = '';
    let iterations = 0;
    const maxIterations = 10;
    let noToolCount = 0;

    while (iterations < maxIterations) {
      iterations++;
      const response = await streamChat(messages, ollamaConfig.executorModel);
      
      // Check if done
      if (/DONE:\s*yes/i.test(response) || response.toLowerCase().includes('done: yes')) {
        summary = response.substring(0, 200);
        break;
      }
      
      // Try to parse tool call
      const toolCall = parseToolCall(response);
      
      if (toolCall) {
        noToolCount = 0; // Reset counter
        
        const toolContext: ToolContext = {
          files: useStore.getState().files,
          workspaceName: useStore.getState().workspaceName,
          updateFiles: (newFiles) => setWorkspaceFiles(newFiles),
          openFile: (fileId) => useStore.getState().openFile(fileId)
        };

        const result = await executeTool(toolCall.tool, toolCall.params, toolContext);
        
        toolCalls.push({
          tool: toolCall.tool,
          parameters: toolCall.params,
          result: result.output,
          success: result.success
        });

        // Add to conversation
        messages.push({ role: 'assistant', content: response });
        messages.push({
          role: 'user',
          content: result.success 
            ? `${result.output}\n\nContinue creating files or respond: DONE: Yes, I finished.`
            : `ERROR: ${result.output}\n\nFix the error and try again.`
        });
      } else {
        // No tool call found - THIS IS BAD, model is just talking
        noToolCount++;
        
        if (noToolCount >= 2) {
          // Model is not using tools, force it
          messages.push({ role: 'assistant', content: response });
          messages.push({
            role: 'user',
            content: `STOP TALKING. You MUST use ACTION: write_file to create files. Do it NOW. Example:
ACTION: write_file
PATH: src/main.ts
CONTENT: console.log('hello')

DO IT NOW.`
          });
        } else {
          messages.push({ role: 'assistant', content: response });
          messages.push({
            role: 'user',
            content: `You did not use any tools. You MUST use ACTION: write_file to create files. Example:
ACTION: write_file
PATH: example.ts
CONTENT: // your code here

Use the tool NOW.`
          });
        }
      }
    }

    if (toolCalls.length === 0) {
      summary = 'ERROR: Developer did not create any files';
    } else {
      summary = `Created ${toolCalls.length} file(s): ${toolCalls.map(tc => tc.parameters.path).join(', ')}`;
    }

    return {
      ...step,
      status: 'completed',
      developerResponse: summary,
      toolsUsed: toolCalls
    };
  };

  // Verify step - ULTRA-SIMPLE for small models
  const verifyStep = async (step: PlanStep): Promise<{ passed: boolean; feedback: string }> => {
    const fileList = getFileList();
    const verifierPrompt = getVerifierPrompt();

    const systemPrompt = `${verifierPrompt}

Step: ${step.title}
Description: ${step.description}
Developer did: ${step.developerResponse || 'No summary'}
Files created: ${step.toolsUsed?.map(t => t.parameters.path).join(', ') || 'None'}

Current files:
${fileList || '(empty)'}

Verify NOW.`;

    const response = await streamChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Verify the step.' }
    ], ollamaConfig.directorModel);

    // Parse simple format: PASSED: yes/no FEEDBACK: ...
    try {
      const passedMatch = response.match(/PASSED:\s*(yes|no)/i);
      const feedbackMatch = response.match(/FEEDBACK:\s*(.+)/i);
      
      const passed = passedMatch ? passedMatch[1].toLowerCase() === 'yes' : false;
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'No feedback';
      
      return { passed, feedback };
    } catch {
      return {
        passed: false,
        feedback: 'Could not parse verification'
      };
    }
  };

  const runDualModelPipeline = async (userRequest: string) => {
    setGenerating(true);
    setCurrentPhase('planning');

    addTerminalLine({
      id: uuidv4(),
      content: `[Director] Planning...`,
      type: 'info',
      timestamp: new Date()
    });

    try {
      // Phase 1: Generate plan
      const plan = await generatePlan(userRequest);
      setCurrentPlan(plan);

      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `📋 Plan: ${plan.goal}\n\n${plan.steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}`,
        timestamp: new Date(),
        model: ollamaConfig.directorModel,
        phase: 'planning'
      });

      // Phase 2: Execute each step
      setCurrentPhase('executing');
      updatePlanStatus('executing');

      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        
        addTerminalLine({
          id: uuidv4(),
          content: `\n[Step ${i + 1}/${plan.steps.length}] ${step.title}`,
          type: 'info',
          timestamp: new Date()
        });

        updatePlanStep(step.id, { status: 'in_progress' });

        // Execute step
        const completedStep = await executeStep(step, plan);
        updatePlanStep(step.id, completedStep);

        addTerminalLine({
          id: uuidv4(),
          content: `[Developer] ${completedStep.developerResponse}`,
          type: 'output',
          timestamp: new Date()
        });

        // Phase 3: Verify
        setCurrentPhase('verifying');
        const verification = await verifyStep(completedStep);
        updatePlanStep(step.id, { 
          verificationResult: verification,
          status: verification.passed ? 'verified' : 'failed'
        });

        addTerminalLine({
          id: uuidv4(),
          content: `[Director] ${verification.passed ? '✓' : '✗'} ${verification.feedback}`,
          type: verification.passed ? 'info' : 'error',
          timestamp: new Date()
        });

        setCurrentPhase('executing');
      }

      updatePlanStatus('completed');
      addTerminalLine({
        id: uuidv4(),
        content: `\n✓ Complete!`,
        type: 'info',
        timestamp: new Date()
      });

    } catch (error: any) {
      updatePlanStatus('failed');
      addTerminalLine({
        id: uuidv4(),
        content: `[Error] ${error.message}`,
        type: 'error',
        timestamp: new Date()
      });
    } finally {
      setGenerating(false);
      setCurrentPhase('idle');
    }
  };

  const getFileList = (): string => {
    const { files } = useStore.getState();
    const list: string[] = [];

    const traverse = (nodes: typeof files, path: string = '') => {
      for (const node of nodes) {
        const fullPath = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file') {
          list.push(fullPath);
        }
        if (node.children) traverse(node.children, fullPath);
      }
    };

    traverse(files);
    return list.length > 0 ? list.join('\n') : '(empty workspace)';
  };

  const checkConnection = async (): Promise<{ connected: boolean; error?: string }> => {
    try {
      const res = await fetch(`${ollamaConfig.baseUrl}/api/tags`);
      return { connected: res.ok };
    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  };

  const listModels = async (): Promise<string[]> => {
    try {
      const res = await fetch(`${ollamaConfig.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  };

  return {
    runDualModelPipeline,
    checkConnection,
    listModels
  };
}
