import { useStore } from '../store';
import { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function useOllama() {
  const { ollamaConfig, addMessage, setGenerating, setCurrentPhase, addTerminalLine } = useStore();

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
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullContent;
  };

  const generateWithDirector = async (userPrompt: string, fileContext: string): Promise<string> => {
    const systemPrompt = `You are a senior software architect and code director. Your job is to analyze the user's request and create a detailed implementation plan. 

Given the current codebase context and the user's request, provide:
1. A brief analysis of what needs to be done
2. A step-by-step plan for implementation
3. Specific instructions for the executor model about what code to write

Be concise but precise. Focus on actionable steps.

Current files context:
${fileContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const assistantId = uuidv4();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: ollamaConfig.directorModel,
      phase: 'planning',
    };
    addMessage(assistantMsg);

    const result = await streamChat(messages, ollamaConfig.directorModel, (chunk) => {
      // Update the last message content incrementally
      useStore.setState(state => ({
        messages: state.messages.map(m => 
          m.id === assistantId ? { ...m, content: m.content + chunk } : m
        ),
      }));
    });

    return result;
  };

  const generateWithExecutor = async (plan: string, userPrompt: string, fileContext: string): Promise<string> => {
    const systemPrompt = `You are an expert code executor. You receive implementation plans and turn them into actual code.

Based on the plan provided, generate the actual code implementation. Rules:
- Write clean, well-structured code
- Include necessary imports
- Add brief comments for complex logic
- Use the exact file paths mentioned in the plan
- Format code blocks with file paths like: \`\`\`filepath:src/file.ts

Current files context:
${fileContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `User request: ${userPrompt}\n\nImplementation plan:\n${plan}` },
    ];

    const assistantId = uuidv4();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: ollamaConfig.executorModel,
      phase: 'executing',
    };
    addMessage(assistantMsg);

    const result = await streamChat(messages, ollamaConfig.executorModel, (chunk) => {
      useStore.setState(state => ({
        messages: state.messages.map(m => 
          m.id === assistantId ? { ...m, content: m.content + chunk } : m
        ),
      }));
    });

    return result;
  };

  const runDualModelPipeline = async (userPrompt: string) => {
    setGenerating(true);
    setCurrentPhase('planning');

    addTerminalLine({
      id: uuidv4(),
      content: `[Director] Analyzing request with ${ollamaConfig.directorModel}...`,
      type: 'info',
      timestamp: new Date(),
    });

    // Get file context
    const fileContext = getFileContext();

    try {
      // Phase 1: Director analyzes and plans
      const plan = await generateWithDirector(userPrompt, fileContext);

      addTerminalLine({
        id: uuidv4(),
        content: `[Director] Plan generated. Passing to executor...`,
        type: 'info',
        timestamp: new Date(),
      });

      // Phase 2: Executor implements
      setCurrentPhase('executing');
      
      addTerminalLine({
        id: uuidv4(),
        content: `[Executor] Implementing with ${ollamaConfig.executorModel}...`,
        type: 'info',
        timestamp: new Date(),
      });

      await generateWithExecutor(plan, userPrompt, fileContext);

      addTerminalLine({
        id: uuidv4(),
        content: `[Executor] Implementation complete.`,
        type: 'info',
        timestamp: new Date(),
      });

    } catch (error: any) {
      addTerminalLine({
        id: uuidv4(),
        content: `[Error] ${error.message}`,
        type: 'error',
        timestamp: new Date(),
      });
      
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error.message}. Make sure Ollama is running at ${ollamaConfig.baseUrl} and the model "${ollamaConfig.directorModel}" is installed.`,
        timestamp: new Date(),
      });
    } finally {
      setGenerating(false);
      setCurrentPhase('idle');
    }
  };

  const getFileContext = (): string => {
    const { files } = useStore.getState();
    const context: string[] = [];

    const traverse = (nodes: typeof files) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content) {
          context.push(`--- ${node.name} ---\n${node.content}\n`);
        }
        if (node.children) traverse(node.children);
      }
    };

    traverse(files);
    return context.join('\n');
  };

  const checkConnection = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${ollamaConfig.baseUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
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
    getFileContext,
  };
}
