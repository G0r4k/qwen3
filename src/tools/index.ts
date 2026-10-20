import { FileNode } from '../types';

// Tool definitions for the Developer AI
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  files: FileNode[];
  workspaceName: string;
  updateFiles: (files: FileNode[]) => void;
  openFile: (fileId: string) => void;
  addTerminalLine: (line: { content: string; type: 'info' | 'error' | 'output' }) => void;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

// Helper functions
function findFileById(files: FileNode[], id: string): FileNode | null {
  for (const node of files) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findFileByPath(files: FileNode[], path: string): FileNode | null {
  const parts = path.split('/').filter(p => p);
  let current: FileNode[] = files;
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

function updateFileInTree(files: FileNode[], path: string, content: string): FileNode[] {
  const parts = path.split('/').filter(p => p);
  
  const updateNode = (nodes: FileNode[], depth: number): FileNode[] => {
    if (depth >= parts.length) return nodes;
    
    const name = parts[depth];
    const isLast = depth === parts.length - 1;
    
    return nodes.map(node => {
      if (node.name === name) {
        if (isLast) {
          return { ...node, content };
        } else if (node.children) {
          return { ...node, children: updateNode(node.children, depth + 1) };
        }
      }
      return node;
    });
  };
  
  return updateNode(files, 0);
}

function createFileInTree(files: FileNode[], path: string, content: string): FileNode[] {
  const parts = path.split('/').filter(p => p);
  const fileName = parts[parts.length - 1];
  const dirPath = parts.slice(0, -1);
  
  if (dirPath.length === 0) {
    // Create in root
    return [...files, {
      id: fileName,
      name: fileName,
      type: 'file',
      content,
      language: getLanguageFromFileName(fileName)
    }];
  }
  
  // Create in subdirectory
  const addToDir = (nodes: FileNode[], depth: number): FileNode[] => {
    if (depth >= dirPath.length) {
      // Add file here
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
      // Create directory
      return [...nodes, {
        id: dirPath.slice(0, depth + 1).join('/'),
        name: dirName,
        type: 'folder',
        isOpen: true,
        children: addToDir([], depth + 1)
      }];
    }
  };
  
  return addToDir(files, 0);
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css',
    md: 'markdown', py: 'python', rs: 'rust',
    go: 'go', java: 'java'
  };
  return map[ext] || 'plaintext';
}

// Available tools
export const tools: Tool[] = [
  {
    name: 'read_file',
    description: 'Read the content of a file from the workspace',
    parameters: {
      path: {
        type: 'string',
        description: 'Path to the file (e.g., "src/main.ts")',
        required: true
      }
    },
    execute: async (params, context) => {
      const file = findFileByPath(context.files, params.path);
      
      if (!file || file.type !== 'file') {
        return {
          success: false,
          output: '',
          error: `File not found: ${params.path}`
        };
      }
      
      return {
        success: true,
        output: file.content || ''
      };
    }
  },
  
  {
    name: 'write_file',
    description: 'Create or update a file in the workspace',
    parameters: {
      path: {
        type: 'string',
        description: 'Path to the file (e.g., "src/main.ts")',
        required: true
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
        required: true
      }
    },
    execute: async (params, context) => {
      const existingFile = findFileByPath(context.files, params.path);
      
      let newFiles: FileNode[];
      if (existingFile) {
        newFiles = updateFileInTree(context.files, params.path, params.content);
      } else {
        newFiles = createFileInTree(context.files, params.path, params.content);
      }
      
      context.updateFiles(newFiles);
      
      // Open the file in the editor
      const createdFile = findFileByPath(newFiles, params.path);
      if (createdFile) {
        context.openFile(createdFile.id);
      }
      
      return {
        success: true,
        output: existingFile 
          ? `Updated file: ${params.path}`
          : `Created file: ${params.path}`
      };
    }
  },
  
  {
    name: 'list_files',
    description: 'List all files and directories in the workspace',
    parameters: {
      path: {
        type: 'string',
        description: 'Optional path to list (defaults to root)',
        required: false
      }
    },
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
      
      let targetNodes = context.files;
      if (params.path) {
        const dir = findFileByPath(context.files, params.path);
        if (dir && dir.type === 'folder' && dir.children) {
          targetNodes = dir.children;
        } else {
          return {
            success: false,
            output: '',
            error: `Directory not found: ${params.path}`
          };
        }
      }
      
      const fileList = listDir(targetNodes);
      
      return {
        success: true,
        output: fileList.join('\n') || '(empty directory)'
      };
    }
  },
  
  {
    name: 'search_code',
    description: 'Search for a pattern in all files',
    parameters: {
      pattern: {
        type: 'string',
        description: 'Text or regex pattern to search for',
        required: true
      }
    },
    execute: async (params, context) => {
      const results: string[] = [];
      const regex = new RegExp(params.pattern, 'gi');
      
      const searchInFiles = (nodes: FileNode[], path: string = '') => {
        for (const node of nodes) {
          const fullPath = path ? `${path}/${node.name}` : node.name;
          if (node.type === 'file' && node.content) {
            const lines = node.content.split('\n');
            lines.forEach((line, idx) => {
              if (regex.test(line)) {
                results.push(`${fullPath}:${idx + 1}: ${line.trim()}`);
              }
            });
          } else if (node.type === 'folder' && node.children) {
            searchInFiles(node.children, fullPath);
          }
        }
      };
      
      searchInFiles(context.files);
      
      if (results.length === 0) {
        return {
          success: true,
          output: `No matches found for: ${params.pattern}`
        };
      }
      
      return {
        success: true,
        output: `Found ${results.length} matches:\n${results.join('\n')}`
      };
    }
  },
  
  {
    name: 'delete_file',
    description: 'Delete a file from the workspace',
    parameters: {
      path: {
        type: 'string',
        description: 'Path to the file to delete',
        required: true
      }
    },
    execute: async (params, context) => {
      const deleteFromTree = (nodes: FileNode[], path: string): FileNode[] => {
        const parts = path.split('/').filter(p => p);
        const fileName = parts[parts.length - 1];
        const dirPath = parts.slice(0, -1);
        
        if (dirPath.length === 0) {
          return nodes.filter(n => n.name !== fileName);
        }
        
        const deleteInDir = (nodes: FileNode[], depth: number): FileNode[] => {
          if (depth >= dirPath.length) {
            return nodes.filter(n => n.name !== fileName);
          }
          
          const dirName = dirPath[depth];
          return nodes.map(n => 
            n.name === dirName && n.type === 'folder' && n.children
              ? { ...n, children: deleteInDir(n.children, depth + 1) }
              : n
          );
        };
        
        return deleteInDir(nodes, 0);
      };
      
      const newFiles = deleteFromTree(context.files, params.path);
      context.updateFiles(newFiles);
      
      return {
        success: true,
        output: `Deleted: ${params.path}`
      };
    }
  }
];

export function getToolDefinitions() {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

export async function executeTool(
  toolName: string, 
  params: any, 
  context: ToolContext
): Promise<ToolResult> {
  const tool = tools.find(t => t.name === toolName);
  
  if (!tool) {
    return {
      success: false,
      output: '',
      error: `Unknown tool: ${toolName}`
    };
  }
  
  try {
    return await tool.execute(params, context);
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message || 'Tool execution failed'
    };
  }
}
