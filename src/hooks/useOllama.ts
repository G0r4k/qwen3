import { useStore } from '../store';
import { ChatMessage } from '../types';
import { ExecutionPlan, PlanStep, ToolCall } from '../types/plan';
import { executeTool, getToolDefinitions, ToolContext } from '../tools';
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
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body from Ollama');
    }

    const reader = response.body.getReader();
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
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullContent;
  };

  const generatePlan = async (userRequest: string): Promise<ExecutionPlan> => {
    const fileContext = getFileContext();
    const toolDefs = getToolDefinitions();

    const systemPrompt = `You are the DIRECTOR AI - a senior software architect. Your job is to analyze user requests and create a detailed step-by-step implementation plan.

IMPORTANT: You do NOT write code yourself. You create a plan that will be executed by the DEVELOPER AI.

For each step, provide:
1. A clear title
2. A detailed description of what needs to be done
3. Specific files to create/modify
4. Expected outcome

Available tools for the Developer:
${toolDefs.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Current workspace structure:
${fileContext}

Respond in this EXACT JSON format:
{
  "goal": "Brief description of the overall goal",
  "steps": [
    {
      "id": "step-1",
      "title": "Step title",
      "description": "Detailed description of what to do"
    }
  ]
}

Be specific and actionable. Each step should be completable by the Developer using the available tools.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userRequest }
    ];

    const response = await streamChat(messages, ollamaConfig.directorModel);
    
    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      const plan: ExecutionPlan = {
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

      return plan;
    } catch (error) {
      throw new Error(`Failed to parse plan from Director: ${error}`);
    }
  };

  const executeStep = async (step: PlanStep, plan: ExecutionPlan): Promise<PlanStep> => {
    const fileContext = getFileContext();
    const toolDefs = getToolDefinitions();

    const systemPrompt = `You are the DEVELOPER AI - an expert programmer. You execute implementation steps using the available tools.

You MUST use the tools to make changes to the workspace. Do NOT just describe what to do - actually DO it using the tools.

Available tools:
${toolDefs.map(t => `- ${t.name}: ${t.description}`).join('\n')}

To use a tool, respond with JSON in this format:
{
  "tool": "tool_name",
  "parameters": { ... }
}

You can use multiple tools in sequence. After each tool use, you'll see the result and can continue.

When you're done with the step, respond with:
{
  "done": true,
  "summary": "Brief summary of what was accomplished"
}

Current workspace:
${fileContext}

Your task:
${step.description}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Execute step: ${step.title}` }
    ];

    const toolCalls: ToolCall[] = [];
    let summary = '';
    let maxIterations = 10; // Prevent infinite loops

    while (maxIterations > 0) {
      const response = await streamChat(messages, ollamaConfig.executorModel);
      
      // Try to parse tool call
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Check if done
          if (parsed.done) {
            summary = parsed.summary || 'Step completed';
            break;
          }
          
          // Execute tool
          if (parsed.tool) {
            const toolContext: ToolContext = {
              files: useStore.getState().files,
              workspaceName: useStore.getState().workspaceName,
              updateFiles: (newFiles) => setWorkspaceFiles(newFiles),
              addTerminalLine: (line) => {
                addTerminalLine({
                  id: uuidv4(),
                  content: line.content,
                  type: line.type,
                  timestamp: new Date()
                });
              }
            };

            const result = await executeTool(parsed.tool, parsed.parameters || {}, toolContext);
            
            toolCalls.push({
              tool: parsed.tool,
              parameters: parsed.parameters,
              result: result.output,
              success: result.success
            });

            // Add tool result to messages
            messages.push({
              role: 'assistant',
              content: response
            });
            messages.push({
              role: 'user',
              content: result.success 
                ? `Tool executed successfully:\n${result.output}\n\nContinue with the next action or mark as done.`
                : `Tool failed: ${result.error}\n\nTry again or use a different approach.`
            });

            continue;
          }
        }
      } catch (error) {
        // Not JSON, treat as summary
        summary = response;
        break;
      }

      maxIterations--;
    }

    return {
      ...step,
      status: 'completed',
      developerResponse: summary,
      toolsUsed: toolCalls
    };
  };

  const verifyStep = async (step: PlanStep, plan: ExecutionPlan): Promise<{ passed: boolean; feedback: string }> => {
    const fileContext = getFileContext();

    const systemPrompt = `You are the DIRECTOR AI verifying the work of the DEVELOPER AI.

Review the step that was just completed and verify it was done correctly.

Original step:
Title: ${step.title}
Description: ${step.description}

Developer's summary:
${step.developerResponse || 'No summary provided'}

Tools used:
${step.toolsUsed?.map(t => `- ${t.tool}: ${t.success ? '✓' : '✗'} ${JSON.stringify(t.parameters)}`).join('\n') || 'None'}

Current workspace state:
${fileContext}

Respond in this EXACT JSON format:
{
  "passed": true/false,
  "feedback": "Detailed feedback on what was done well and what needs improvement"
}

Be thorough but fair. If the step was completed correctly, mark it as passed.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Verify the completed step' }
    ];

    const response = await streamChat(messages, ollamaConfig.directorModel);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        passed: parsed.passed || false,
        feedback: parsed.feedback || 'No feedback provided'
      };
    } catch (error) {
      return {
        passed: false,
        feedback: `Failed to parse verification: ${error}`
      };
    }
  };

  const runDualModelPipeline = async (userRequest: string) => {
    setGenerating(true);
    setCurrentPhase('planning');

    addTerminalLine({
      id: uuidv4(),
      content: `[Director] Analyzing request...`,
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
        content: `## 📋 Implementation Plan\n\n**Goal:** ${plan.goal}\n\n**Steps:**\n${plan.steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}`,
        timestamp: new Date(),
        model: ollamaConfig.directorModel,
        phase: 'planning'
      });

      addTerminalLine({
        id: uuidv4(),
        content: `[Director] Plan created with ${plan.steps.length} steps`,
        type: 'info',
        timestamp: new Date()
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

        // Update step status
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

        // Phase 3: Verify step
        setCurrentPhase('verifying');
        addTerminalLine({
          id: uuidv4(),
          content: `[Director] Verifying step ${i + 1}...`,
          type: 'info',
          timestamp: new Date()
        });

        const verification = await verifyStep(completedStep, plan);
        updatePlanStep(step.id, { 
          verificationResult: verification,
          status: verification.passed ? 'verified' : 'failed'
        });

        addTerminalLine({
          id: uuidv4(),
          content: `[Director] ${verification.passed ? '✓ Verified' : '✗ Failed'}: ${verification.feedback}`,
          type: verification.passed ? 'info' : 'error',
          timestamp: new Date()
        });

        setCurrentPhase('executing');
      }

      // All steps completed
      updatePlanStatus('completed');
      addTerminalLine({
        id: uuidv4(),
        content: `\n✓ All steps completed successfully!`,
        type: 'info',
        timestamp: new Date()
      });

      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `## ✅ Implementation Complete\n\nAll ${plan.steps.length} steps have been executed and verified.\n\n${plan.steps.map((s, i) => `${i + 1}. ${s.title} - ${s.verificationResult?.passed ? '✓' : '✗'}`).join('\n')}`,
        timestamp: new Date(),
        model: ollamaConfig.directorModel,
        phase: 'executing'
      });

    } catch (error: any) {
      updatePlanStatus('failed');
      addTerminalLine({
        id: uuidv4(),
        content: `[Error] ${error.message}`,
        type: 'error',
        timestamp: new Date()
      });
      
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      });
    } finally {
      setGenerating(false);
      setCurrentPhase('idle');
    }
  };

  const getFileContext = (): string => {
    const { files } = useStore.getState();
    const context: string[] = [];

    const traverse = (nodes: typeof files, path: string = '') => {
      for (const node of nodes) {
        const fullPath = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file' && node.content) {
          context.push(`--- ${fullPath} ---\n${node.content}\n`);
        }
        if (node.children) traverse(node.children, fullPath);
      }
    };

    traverse(files);
    return context.join('\n');
  };

  const checkConnection = async (): Promise<{ connected: boolean; error?: string }> => {
    try {
      const res = await fetch(`${ollamaConfig.baseUrl}/api/tags`);
      if (res.ok) {
        return { connected: true };
      }
      return { connected: false, error: `HTTP ${res.status}` };
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
    streamChat,
    checkConnection,
    listModels,
    getFileContext
  };
}
