import { create } from 'zustand';
import { FileNode, ChatMessage, OllamaConfig, TerminalLine, PanelView } from './types';
import { ExecutionPlan, PlanStep } from './types/plan';

interface AppState {
  // Files
  files: FileNode[];
  activeFileId: string | null;
  openFileIds: string[];
  workspaceName: string;
  
  // Chat
  messages: ChatMessage[];
  isGenerating: boolean;
  currentPhase: 'idle' | 'planning' | 'executing' | 'verifying';
  
  // Execution Plan
  currentPlan: ExecutionPlan | null;
  
  // Terminal
  terminalLines: TerminalLine[];
  
  // Settings
  ollamaConfig: OllamaConfig;
  
  // UI
  activePanel: PanelView;
  sidebarWidth: number;
  chatWidth: number;
  showSettings: boolean;
  
  // Actions
  setActiveFile: (id: string | null) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  addFile: (parentId: string | null, node: FileNode) => void;
  toggleFolder: (id: string) => void;
  
  addMessage: (msg: ChatMessage) => void;
  setGenerating: (v: boolean) => void;
  setCurrentPhase: (p: 'idle' | 'planning' | 'executing' | 'verifying') => void;
  clearMessages: () => void;
  
  // Plan actions
  setCurrentPlan: (plan: ExecutionPlan | null) => void;
  updatePlanStep: (stepId: string, updates: Partial<PlanStep>) => void;
  updatePlanStatus: (status: ExecutionPlan['status']) => void;
  
  // Workspace actions
  setWorkspaceName: (name: string) => void;
  setWorkspaceFiles: (files: FileNode[]) => void;
  
  addTerminalLine: (line: TerminalLine) => void;
  clearTerminal: () => void;
  
  updateOllamaConfig: (config: Partial<OllamaConfig>) => void;
  setActivePanel: (panel: PanelView) => void;
  setShowSettings: (v: boolean) => void;
}

const defaultFiles: FileNode[] = [
  {
    id: 'root',
    name: 'my-project',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'main.ts',
            name: 'main.ts',
            type: 'file',
            language: 'typescript',
            content: `// Main application entry point
import { App } from './app';

const app = new App();
app.start();

console.log('Application started successfully!');
`
          },
          {
            id: 'app.ts',
            name: 'app.ts',
            type: 'file',
            language: 'typescript',
            content: `// Application class
export class App {
  private running = false;

  start() {
    this.running = true;
    console.log('App is running');
  }

  stop() {
    this.running = false;
    console.log('App stopped');
  }
}
`
          },
          {
            id: 'utils.ts',
            name: 'utils.ts',
            type: 'file',
            language: 'typescript',
            content: `// Utility functions
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
`
          }
        ]
      },
      {
        id: 'package.json',
        name: 'package.json',
        type: 'file',
        language: 'json',
        content: `{
  "name": "my-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  }
}
`
      },
      {
        id: 'readme.md',
        name: 'README.md',
        type: 'file',
        language: 'markdown',
        content: `# My Project

A sample project to demonstrate the AI-powered code editor.

## Features
- AI-assisted coding with local models
- Dual-model architecture (Director + Executor)
- Real-time code generation
`
      }
    ]
  }
];

export const useStore = create<AppState>((set, get) => ({
  files: defaultFiles,
  activeFileId: 'main.ts',
  openFileIds: ['main.ts'],
  workspaceName: 'my-project',
  
  messages: [],
  isGenerating: false,
  currentPhase: 'idle',
  currentPlan: null,
  
  terminalLines: [
    { id: '1', content: '$ Welcome to LocalCoder Terminal', type: 'info', timestamp: new Date() },
    { id: '2', content: '$ Connected to Ollama at http://localhost:11434', type: 'info', timestamp: new Date() },
  ],
  
  ollamaConfig: {
    baseUrl: 'http://localhost:11434',
    directorModel: 'qwen2.5-coder:3b',
    executorModel: 'qwen2.5-coder:3b',
    temperature: 0.7,
    maxTokens: 4096,
  },
  
  activePanel: 'chat',
  sidebarWidth: 260,
  chatWidth: 400,
  showSettings: false,
  
  setActiveFile: (id) => set({ activeFileId: id }),
  
  openFile: (id) => {
    const { openFileIds } = get();
    if (!openFileIds.includes(id)) {
      set({ openFileIds: [...openFileIds, id], activeFileId: id });
    } else {
      set({ activeFileId: id });
    }
  },
  
  closeFile: (id) => {
    const { openFileIds, activeFileId } = get();
    const newIds = openFileIds.filter(f => f !== id);
    set({ 
      openFileIds: newIds, 
      activeFileId: activeFileId === id ? (newIds[newIds.length - 1] || null) : activeFileId 
    });
  },
  
  updateFileContent: (id, content) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, content };
        if (node.children) return { ...node, children: updateNode(node.children) };
        return node;
      });
    };
    set({ files: updateNode(get().files) });
  },
  
  addFile: (_parentId, node) => {
    const addToNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n.id === _parentId && n.children) {
          return { ...n, children: [...n.children, node] };
        }
        if (n.children) return { ...n, children: addToNode(n.children) };
        return n;
      });
    };
    if (!_parentId) {
      set({ files: [...get().files, node] });
    } else {
      set({ files: addToNode(get().files) });
    }
  },
  
  toggleFolder: (id) => {
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, isOpen: !node.isOpen };
        if (node.children) return { ...node, children: toggleNode(node.children) };
        return node;
      });
    };
    set({ files: toggleNode(get().files) });
  },
  
  addMessage: (msg) => set({ messages: [...get().messages, msg] }),
  setGenerating: (v) => set({ isGenerating: v }),
  setCurrentPhase: (p) => set({ currentPhase: p }),
  clearMessages: () => set({ messages: [] }),
  
  // Plan actions
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  updatePlanStep: (stepId, updates) => {
    const plan = get().currentPlan;
    if (!plan) return;
    set({
      currentPlan: {
        ...plan,
        steps: plan.steps.map(step =>
          step.id === stepId ? { ...step, ...updates } : step
        )
      }
    });
  },
  updatePlanStatus: (status) => {
    const plan = get().currentPlan;
    if (!plan) return;
    set({ currentPlan: { ...plan, status } });
  },
  
  // Workspace actions
  setWorkspaceName: (name) => set({ workspaceName: name }),
  setWorkspaceFiles: (files) => set({ files }),
  
  addTerminalLine: (line) => set({ terminalLines: [...get().terminalLines, line] }),
  clearTerminal: () => set({ terminalLines: [] }),
  
  updateOllamaConfig: (config) => set({ ollamaConfig: { ...get().ollamaConfig, ...config } }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setShowSettings: (v) => set({ showSettings: v }),
}));
