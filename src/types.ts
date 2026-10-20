export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  phase?: 'planning' | 'executing';
}

export interface OllamaConfig {
  baseUrl: string;
  directorModel: string;
  executorModel: string;
  temperature: number;
  maxTokens: number;
}

export interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error' | 'info';
  timestamp: Date;
}

export type PanelView = 'chat' | 'files' | 'terminal' | 'settings';
