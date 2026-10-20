import { useStore } from '../store';
import { ChatMessage } from '../types';
import { ExecutionPlan, PlanStep, ToolCall } from '../types/plan';
import { executeTool, getToolPrompt, parseToolCall, ToolContext } from '../tools';
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

  // Generate plan - optimized for small models
  const generatePlan = async (userRequest: string): Promise<ExecutionPlan> => {
    const fileList = getFileList();
    
    const systemPrompt = `You are the DIRECTOR. Create a step-by-step plan.

Current files:
${fileList}

Respond ONLY with JSON:
{"goal":"brief goal","steps":[{"id":"1","title":"step title","description":"what to do"}]}

Keep it simple. Max 5 steps.`;

    const response = await streamChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userRequest }
    ], ollamaConfig.directorModel);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: uuidv4(),
        goal: parsed.goal || userRequest,
        steps: (parsed.steps || []).map((step: any, idx: number) => ({
          id: step.id || `step-${idx + 1}`,
          title: step.title || `Step ${idx + 1}`,
          description: step.description || '',
          status: 'pending' as const
        })),
        status: 'planning',
        createdAt: new Date()
      };
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

  // Execute step - optimized for small models
  const executeStep = async (step: PlanStep, plan: ExecutionPlan): Promise<PlanStep> => {
    const fileList = getFileList();
    const toolPrompt = getToolPrompt();

    const systemPrompt = `You are the DEVELOPER. Execute this step using tools.

${toolPrompt}

Current files:
${fileList}

Step to execute: ${step.title}
Description: ${step.description}

Use tools to make changes. When done, respond with {"done":true,"summary":"what you did"}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Execute the step now.' }
    ];

    const toolCalls: ToolCall[] = [];
    let summary = '';
    let iterations = 0;
    const maxIterations = 8;

    while (iterations < maxIterations) {
      iterations++;
      const response = await streamChat(messages, ollamaConfig.executorModel);
      
      // Check if done
      if (response.includes('"done"') && response.includes('true')) {
        const summaryMatch = response.match(/"summary"\s*:\s*"([^"]+)"/);
        summary = summaryMatch ? summaryMatch[1] : 'Step completed';
        break;
      }
      
      // Try to parse tool call
      const toolCall = parseToolCall(response);
      
      if (toolCall) {
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
            ? `Tool result: ${result.output}\n\nContinue or respond with {"done":true,"summary":"..."}`
            : `Tool failed: ${result.output}\n\nTry again or respond with {"done":true,"summary":"..."}`
        });
      } else {
        // No tool call found, treat as summary
        summary = response.substring(0, 200);
        break;
      }
    }

    return {
      ...step,
      status: 'completed',
      developerResponse: summary,
      toolsUsed: toolCalls
    };
  };

  // Verify step - optimized for small models
  const verifyStep = async (step: PlanStep): Promise<{ passed: boolean; feedback: string }> => {
    const fileList = getFileList();

    const systemPrompt = `You are the DIRECTOR verifying work.

Step: ${step.title}
Description: ${step.description}
Developer did: ${step.developerResponse || 'No summary'}
Tools used: ${step.toolsUsed?.length || 0}

Current files:
${fileList}

Respond ONLY with JSON:
{"passed":true/false,"feedback":"brief feedback"}`;

    const response = await streamChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Verify the step.' }
    ], ollamaConfig.directorModel);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        passed: parsed.passed === true,
        feedback: parsed.feedback || 'No feedback'
      };
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
