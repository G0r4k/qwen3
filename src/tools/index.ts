import { FileNode } from '../types';
import { useStore } from '../store';

// Simplified tool definitions for small models
export interface Tool {
  name: string;
  description: string;
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
    if (node.children) {
      current = node.children;
    }
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
  
  // If workspace is empty, create root folder
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
  
  // Simple case: file in root
  if (parts.length === 1) {
    if (currentFiles.length === 1 && currentFiles[0].type === 'folder') {
      return [{
        ...currentFiles[0],
        children: [
          ...(currentFiles[0].children || []),
          {
            id: fileName,
            name: fileName,
            type: 'file',
            content,
            language: getLanguageFromFileName(fileName)
          }
        ]
      }];
    }
    return [...currentFiles, {
      id: fileName,
      name: fileName,
      type: 'file',
      content,
      language: getLanguageFromFileName(fileName)
    }];
  }
  
  // Complex case: file in subdirectory
  const dirPath = parts.slice(0, -1);
  
  const addToDir = (nodes: FileNode[], depth: number): FileNode[] => {
    if (depth >= dirPath.length) {
      return [...nodes, {
        id: path,
        name: fileName,
        type: 'file',
        content,
        language: getLanguageFromFileName(fileName)
      }];
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
    return [{
      ...currentFiles[0],
      children: addToDir(currentFiles[0].children || [], 0)
    }];
  }
  
  return addToDir(currentFiles, 0);
}

// Simplified tools - only 3 essential tools
export const tools: Tool[] = [
  {
    name: 'write_file',
    description: 'Create or update a file',
    execute: async (params, context) => {
      const { path, content } = params;
      if (!path || content === undefined) {
        return { success: false, output: 'Missing path or content' };
      }
      
      const newFiles = createFileInTree(context.files, path, content);
      context.updateFiles(newFiles);
      
      // Open the file
      const createdFile = findFileByPath(newFiles, path);
      if (createdFile) {
        context.openFile(createdFile.id);
      }
      
      return { success: true, output: `Created/updated: ${path}` };
    }
  },
  
  {
    name: 'read_file',
    description: 'Read a file',
    execute: async (params, context) => {
      const { path } = params;
      if (!path) {
        return { success: false, output: 'Missing path' };
      }
      
      const file = findFileByPath(context.files, path);
      if (!file || file.type !== 'file') {
        return { success: false, output: `File not found: ${path}` };
      }
      
      return { success: true, output: file.content || '' };
    }
  },
  
  {
    name: 'list_files',
    description: 'List all files',
    execute: async (params, context) => {
      const listDir = (nodes: FileNode[], prefix: string = ''): string[] => {
        const result: string[] = [];
        for (const node of nodes) {
          const fullPath = prefix ? `${prefix}/${node.name}` : node.name;
          if (node.type === 'folder') {
            result.push(`📁 ${fullPath}/`);
            if (node.children) {
              result.push(...listDir(node.children, fullPath));
            }
          } else {
            result.push(`📄 ${fullPath}`);
          }
        }
        return result;
      };
      
      const fileList = listDir(context.files);
      return { success: true, output: fileList.join('\n') || '(empty)' };
    }
  }
];

// Parse tool call from model response - very flexible parser
export function parseToolCall(response: string): { tool: string; params: any } | null {
  // Try to find tool call in various formats
  
  // Format 1: JSON with tool field
  try {
    const jsonMatch = response.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool) {
        return { tool: parsed.tool, params: parsed.parameters || parsed.params || {} };
      }
    }
  } catch {}
  
  // Format 2: Simple text format "TOOL: write_file PATH: src/main.ts CONTENT: ..."
  const toolMatch = response.match(/TOOL:\s*(\w+)/i);
  if (toolMatch) {
    const tool = toolMatch[1].toLowerCase();
    const params: any = {};
    
    // Extract path
    const pathMatch = response.match(/PATH:\s*([^\n]+)/i);
    if (pathMatch) params.path = pathMatch[1].trim();
    
    // Extract content (everything after CONTENT: until end or next TOOL:)
    const contentMatch = response.match(/CONTENT:\s*([\s\S]*?)(?=\n[A-Z]+:|$)/i);
    if (contentMatch) params.content = contentMatch[1].trim();
    
    return { tool, params };
  }
  
  // Format 3: Markdown code block with tool name
  const codeBlockMatch = response.match(/```(\w+)\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    const tool = codeBlockMatch[1].toLowerCase();
    const content = codeBlockMatch[2];
    
    // Try to extract path from the content or preceding text
    const pathMatch = response.match(/(?:path|file):\s*([^\n]+)/i);
    const path = pathMatch ? pathMatch[1].trim() : `file.${tool === 'typescript' ? 'ts' : tool === 'javascript' ? 'js' : 'txt'}`;
    
    return { tool: 'write_file', params: { path, content } };
  }
  
  return null;
}

export async function executeTool(
  toolName: string,
  params: any,
  context: ToolContext
): Promise<ToolResult> {
  const tool = tools.find(t => t.name === toolName);
  
  if (!tool) {
    return { success: false, output: `Unknown tool: ${toolName}` };
  }
  
  try {
    return await tool.execute(params, context);
  } catch (error: any) {
    return { success: false, output: error.message || 'Tool execution failed' };
  }
}

// Get simplified tool descriptions for small models
export function getToolPrompt(): string {
  return `You have 3 tools available:

1. write_file - Create or update a file
   Parameters: path (string), content (string)
   Example: write_file({path: "src/main.ts", content: "console.log('hello')"})

2. read_file - Read a file
   Parameters: path (string)
   Example: read_file({path: "src/main.ts"})

3. list_files - List all files
   Parameters: none
   Example: list_files({})

To use a tool, respond with JSON:
{"tool": "tool_name", "parameters": {...}}

When done, respond with:
{"done": true, "summary": "What was accomplished"}

IMPORTANT: Use tools to make actual changes. Don't just describe what to do.`;
}
