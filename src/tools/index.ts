import { FileNode } from '../types';
import { useStore } from '../store';

export interface Tool {
  name: string;
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  files: FileNode[];
  workspaceName: string;
  updateFiles: (files: FileNode[]) => void;
  openFile: (fileId: string) => void;
}

export interface ToolResult {
  success: boolean;
  output: string;
}

// Helper functions
function findFileByPath(files: FileNode[], path: string): FileNode | null {
  const parts = path.split('/').filter(p => p);
  let searchIn: FileNode[] = files;
  if (files.length === 1 && files[0].type === 'folder' && files[0].children) {
    searchIn = files[0].children;
  }
  
  let current: FileNode[] = searchIn;
  let node: FileNode | null = null;

  for (const part of parts) {
    node = current.find(n => n.name === part) || null;
    if (!node) return null;
    if (node.children) current = node.children;
  }

  return node;
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css',
    md: 'markdown', py: 'python'
  };
  return map[ext] || 'plaintext';
}

function createFileInTree(files: FileNode[], path: string, content: string): FileNode[] {
  const parts = path.split('/').filter(p => p);
  const fileName = parts[parts.length - 1];
  
  let currentFiles = files;
  if (files.length === 0) {
    const { workspaceName } = useStore.getState();
    currentFiles = [{
      id: workspaceName,
      name: workspaceName,
      type: 'folder',
      isOpen: true,
      children: []
    }];
  }
  
  if (parts.length === 1) {
    if (currentFiles.length === 1 && currentFiles[0].type === 'folder') {
      return [{
        ...currentFiles[0],
        children: [
          ...(currentFiles[0].children || []),
          { id: fileName, name: fileName, type: 'file', content, language: getLanguageFromFileName(fileName) }
        ]
      }];
    }
    return [...currentFiles, { id: fileName, name: fileName, type: 'file', content, language: getLanguageFromFileName(fileName) }];
  }
  
  const dirPath = parts.slice(0, -1);
  
  const addToDir = (nodes: FileNode[], depth: number): FileNode[] => {
    if (depth >= dirPath.length) {
      return [...nodes, { id: path, name: fileName, type: 'file', content, language: getLanguageFromFileName(fileName) }];
    }
    
    const dirName = dirPath[depth];
    const existingDir = nodes.find(n => n.name === dirName && n.type === 'folder');
    
    if (existingDir) {
      return nodes.map(n => 
        n.name === dirName && n.type === 'folder'
          ? { ...n, children: addToDir(n.children || [], depth + 1) }
          : n
      );
    } else {
      return [...nodes, {
        id: dirPath.slice(0, depth + 1).join('/'),
        name: dirName,
        type: 'folder',
        isOpen: true,
        children: addToDir([], depth + 1)
      }];
    }
  };
  
  if (currentFiles.length === 1 && currentFiles[0].type === 'folder') {
    return [{ ...currentFiles[0], children: addToDir(currentFiles[0].children || [], 0) }];
  }
  
  return addToDir(currentFiles, 0);
}

// Only 2 tools - ultra simple
export const tools: Tool[] = [
  {
    name: 'write_file',
    execute: async (params, context) => {
      const { path, content } = params;
      if (!path || content === undefined) {
        return { success: false, output: 'ERROR: Missing path or content' };
      }
      
      const newFiles = createFileInTree(context.files, path, content);
      context.updateFiles(newFiles);
      
      const createdFile = findFileByPath(newFiles, path);
      if (createdFile) context.openFile(createdFile.id);
      
      return { success: true, output: `✓ Created: ${path}` };
    }
  },
  {
    name: 'list_files',
    execute: async (params, context) => {
      const list: string[] = [];
      const traverse = (nodes: FileNode[], prefix: string = '') => {
        for (const node of nodes) {
          const fullPath = prefix ? `${prefix}/${node.name}` : node.name;
          if (node.type === 'folder') {
            list.push(`📁 ${fullPath}/`);
            if (node.children) traverse(node.children, fullPath);
          } else {
            list.push(`📄 ${fullPath}`);
          }
        }
      };
      traverse(context.files);
      return { success: true, output: list.join('\n') || '(empty)' };
    }
  }
];

// CRITICAL: Detect if response is a tool call or just text
export function parseToolCall(response: string): { tool: string; params: any } | null {
  // Look for EXPLICIT tool call markers
  const patterns = [
    // Pattern 1: ACTION: write_file
    /ACTION:\s*write_file\s+PATH:\s*([^\n]+)\s+CONTENT:\s*([\s\S]*?)(?=\nACTION:|$)/i,
    // Pattern 2: [TOOL] write_file
    /\[TOOL\]\s*write_file\s*\n\s*PATH:\s*([^\n]+)\s*\n\s*CONTENT:\s*([\s\S]*?)(?=\n\[TOOL\]|$)/i,
    // Pattern 3: >>> write_file
    />>>\s*write_file\s*\n\s*path:\s*([^\n]+)\s*\n\s*content:\s*([\s\S]*?)(?=\n>>>|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      return {
        tool: 'write_file',
        params: { path: match[1].trim(), content: match[2].trim() }
      };
    }
  }
  
  // Pattern 4: JSON with explicit action field
  try {
    const jsonMatch = response.match(/\{[\s\S]*?"action"\s*:\s*"write_file"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action === 'write_file' && parsed.path && parsed.content !== undefined) {
        return { tool: 'write_file', params: { path: parsed.path, content: parsed.content } };
      }
    }
  } catch {}
  
  // Pattern 5: Simple JSON with tool field (but must have path AND content)
  try {
    const jsonMatch = response.match(/\{[\s\S]*?"tool"\s*:\s*"write_file"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool === 'write_file' && parsed.parameters?.path && parsed.parameters?.content !== undefined) {
        return { tool: 'write_file', params: parsed.parameters };
      }
    }
  } catch {}
  
  // Pattern 6: list_files
  if (/ACTION:\s*list_files/i.test(response) || 
      /\[TOOL\]\s*list_files/i.test(response) ||
      />>>\s*list_files/i.test(response)) {
    return { tool: 'list_files', params: {} };
  }
  
  return null;
}

export async function executeTool(toolName: string, params: any, context: ToolContext): Promise<ToolResult> {
  const tool = tools.find(t => t.name === toolName);
  if (!tool) return { success: false, output: `Unknown tool: ${toolName}` };
  
  try {
    return await tool.execute(params, context);
  } catch (error: any) {
    return { success: false, output: error.message || 'Tool failed' };
  }
}

// ULTRA-SIMPLE prompt for small models
export function getDeveloperPrompt(): string {
  return `You are a DEVELOPER. You MUST use tools to create files.

RULES:
1. To create a file, respond EXACTLY like this:
   ACTION: write_file
   PATH: src/main.ts
   CONTENT: console.log('hello')

2. To list files, respond:
   ACTION: list_files

3. When completely done, respond:
   DONE: Yes, I finished.

DO NOT just describe what to do. USE THE TOOLS to create actual files.

Example:
User: Create a hello world file
You: 
ACTION: write_file
PATH: hello.txt
CONTENT: Hello World!

Now execute the step using tools.`;
}

export function getDirectorPrompt(): string {
  return `You are the DIRECTOR. Create a simple plan.

Respond ONLY with this format:
GOAL: brief description
STEP 1: title - description
STEP 2: title - description

Keep it simple. Max 3 steps.`;
}

export function getVerifierPrompt(): string {
  return `You are the VERIFIER. Check if the step was completed.

Respond ONLY with:
PASSED: yes/no
FEEDBACK: brief comment`;
}
