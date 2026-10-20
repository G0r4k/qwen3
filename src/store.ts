import { create } from 'zustand';
import { FileNode, ChatMessage, OllamaConfig, TerminalLine, PanelView } from './types';
import { ExecutionPlan, PlanStep } from './types/plan';

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css',
    md: 'markdown', py: 'python', rs: 'rust',
    go: 'go', java: 'java', cpp: 'cpp', c: 'c'
  };
  return map[ext] || 'plaintext';
}

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
  createFile: (parentPath: string, fileName: string, content?: string) => void;
  createFolder: (parentPath: string, folderName: string) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  
  addTerminalLine: (line: TerminalLine) => void;
  clearTerminal: () => void;
  
  updateOllamaConfig: (config: Partial<OllamaConfig>) => void;
  setActivePanel: (panel: PanelView) => void;
  setShowSettings: (v: boolean) => void;
}

// Workspace vacío por defecto - el usuario debe cargar su proyecto
const defaultFiles: FileNode[] = [];

export const useStore = create<AppState>((set, get) => ({
  files: defaultFiles,
  activeFileId: null,
  openFileIds: [],
  workspaceName: 'untitled-workspace',
  
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
  
  createFile: (parentPath, fileName, content = '') => {
    const { files, workspaceName } = get();
    const fileId = parentPath ? `${parentPath}/${fileName}` : fileName;
    
    const newFile: FileNode = {
      id: fileId,
      name: fileName,
      type: 'file',
      content,
      language: getLanguageFromFileName(fileName)
    };
    
    if (!parentPath) {
      // Add to root
      if (files.length === 0) {
        // Create root folder first
        set({
          files: [{
            id: workspaceName,
            name: workspaceName,
            type: 'folder',
            isOpen: true,
            children: [newFile]
          }]
        });
      } else if (files.length === 1 && files[0].type === 'folder') {
        set({
          files: [{
            ...files[0],
            children: [...(files[0].children || []), newFile]
          }]
        });
      } else {
        set({ files: [...files, newFile] });
      }
    } else {
      // Add to specific folder
      const addToFolder = (nodes: FileNode[], path: string): FileNode[] => {
        const parts = path.split('/');
        const folderName = parts[parts.length - 1];
        
        return nodes.map(node => {
          if (node.name === folderName && node.type === 'folder') {
            if (parts.length === 1) {
              return { ...node, children: [...(node.children || []), newFile] };
            } else {
              return { ...node, children: addToFolder(node.children || [], parts.slice(1).join('/')) };
            }
          }
          return node;
        });
      };
      
      // If we have a root folder, search inside it
      if (files.length === 1 && files[0].type === 'folder') {
        set({
          files: [{
            ...files[0],
            children: addToFolder(files[0].children || [], parentPath)
          }]
        });
      } else {
        set({ files: addToFolder(files, parentPath) });
      }
    }
  },
  
  createFolder: (parentPath, folderName) => {
    const { files, workspaceName } = get();
    const folderId = parentPath ? `${parentPath}/${folderName}` : folderName;
    
    const newFolder: FileNode = {
      id: folderId,
      name: folderName,
      type: 'folder',
      isOpen: true,
      children: []
    };
    
    if (!parentPath) {
      // Add to root
      if (files.length === 0) {
        set({
          files: [{
            id: workspaceName,
            name: workspaceName,
            type: 'folder',
            isOpen: true,
            children: [newFolder]
          }]
        });
      } else if (files.length === 1 && files[0].type === 'folder') {
        set({
          files: [{
            ...files[0],
            children: [...(files[0].children || []), newFolder]
          }]
        });
      } else {
        set({ files: [...files, newFolder] });
      }
    } else {
      // Add to specific folder
      const addToFolder = (nodes: FileNode[], path: string): FileNode[] => {
        const parts = path.split('/');
        const targetName = parts[parts.length - 1];
        
        return nodes.map(node => {
          if (node.name === targetName && node.type === 'folder') {
            if (parts.length === 1) {
              return { ...node, children: [...(node.children || []), newFolder] };
            } else {
              return { ...node, children: addToFolder(node.children || [], parts.slice(1).join('/')) };
            }
          }
          return node;
        });
      };
      
      if (files.length === 1 && files[0].type === 'folder') {
        set({
          files: [{
            ...files[0],
            children: addToFolder(files[0].children || [], parentPath)
          }]
        });
      } else {
        set({ files: addToFolder(files, parentPath) });
      }
    }
  },
  
  deleteFile: (fileId) => {
    const { files } = get();
    
    const removeFromTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => node.id !== fileId)
        .map(node => {
          if (node.children) {
            return { ...node, children: removeFromTree(node.children) };
          }
          return node;
        });
    };
    
    set({ files: removeFromTree(files) });
    
    // Close file if it was open
    const { activeFileId, openFileIds } = get();
    if (activeFileId === fileId) {
      set({ activeFileId: null });
    }
    if (openFileIds.includes(fileId)) {
      set({ openFileIds: openFileIds.filter(id => id !== fileId) });
    }
  },
  
  renameFile: (fileId, newName) => {
    const { files } = get();
    
    const renameInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === fileId) {
          const newId = node.id.replace(/[^/]+$/, newName);
          return { ...node, id: newId, name: newName };
        }
        if (node.children) {
          return { ...node, children: renameInTree(node.children) };
        }
        return node;
      });
    };
    
    set({ files: renameInTree(files) });
  },
  
  addTerminalLine: (line) => set({ terminalLines: [...get().terminalLines, line] }),
  clearTerminal: () => set({ terminalLines: [] }),
  
  updateOllamaConfig: (config) => set({ ollamaConfig: { ...get().ollamaConfig, ...config } }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setShowSettings: (v) => set({ showSettings: v }),
}));
