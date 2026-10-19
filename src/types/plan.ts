import { FileNode } from '../types';

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'verified';
  developerResponse?: string;
  toolsUsed?: ToolCall[];
  verificationResult?: {
    passed: boolean;
    feedback: string;
  };
}

export interface ToolCall {
  tool: string;
  parameters: any;
  result: string;
  success: boolean;
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  steps: PlanStep[];
  status: 'planning' | 'executing' | 'verifying' | 'completed' | 'failed';
  createdAt: Date;
}

export interface WorkspaceConfig {
  name: string;
  files: FileNode[];
}
