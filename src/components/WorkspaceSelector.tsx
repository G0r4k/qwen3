import React, { useRef } from 'react';
import { useStore } from '../store';
import { FolderOpen, Upload, X } from 'lucide-react';
import { FileNode } from '../types';

export default function WorkspaceSelector() {
  const { workspaceName, setWorkspaceName, setWorkspaceFiles } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Get root folder name from first file
    const firstFile = fileList[0];
    const firstPath: string = (firstFile as any).webkitRelativePath || firstFile.name;
    const rootFolderName = firstPath.split('/')[0];
    
    // Update workspace name
    if (workspaceName === 'untitled-workspace' && rootFolderName) {
      setWorkspaceName(rootFolderName);
    }

    // Build file tree structure
    const tree: Record<string, any> = {};
    
    // Process all files
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fullPath: string = (file as any).webkitRelativePath || file.name;
      const parts = fullPath.split('/');
      const fileName = parts[parts.length - 1];
      
      // Read file content
      const content = await file.text();
      
      // Create file node
      const fileNode: FileNode = {
        id: fullPath,
        name: fileName,
        type: 'file',
        content,
        language: getLanguageFromFileName(fileName)
      };
      
      // Store file with its full path as key
      tree[fullPath] = fileNode;
      
      // Create parent directories
      for (let j = parts.length - 2; j >= 0; j--) {
        const dirPath = parts.slice(0, j + 1).join('/');
        const dirName = parts[j];
        
        if (!tree[dirPath]) {
          tree[dirPath] = {
            id: dirPath,
            name: dirName,
            type: 'folder',
            isOpen: true,
            children: []
          };
        }
      }
    }
    
    // Build hierarchy by adding children to parents
    const allPaths = Object.keys(tree).sort();
    for (const path of allPaths) {
      const node = tree[path];
      if (node.type === 'file') {
        // Find parent directory
        const parts = path.split('/');
        const parentPath = parts.slice(0, -1).join('/');
        if (tree[parentPath] && tree[parentPath].children) {
          tree[parentPath].children.push(node);
        }
      } else if (node.type === 'folder') {
        // Find parent directory
        const parts = path.split('/');
        if (parts.length > 1) {
          const parentPath = parts.slice(0, -1).join('/');
          if (tree[parentPath] && tree[parentPath].children) {
            tree[parentPath].children.push(node);
          }
        }
      }
    }
    
    // Get root nodes (folders/files at the top level)
    const rootNodes = Object.values(tree).filter((node: any) => {
      const path = node.id;
      const parts = path.split('/');
      // Root nodes have only one part (the root folder name)
      return parts.length === 1;
    });
    
    // Set the workspace files
    setWorkspaceFiles(rootNodes);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript',
      js: 'javascript', jsx: 'javascript',
      json: 'json', html: 'html', css: 'css',
      md: 'markdown', py: 'python', rs: 'rust',
      go: 'go', java: 'java', cpp: 'cpp', c: 'c'
    };
    return map[ext] || 'plaintext';
  };

  const handleResetWorkspace = () => {
    if (confirm('Are you sure you want to reset the workspace? This will clear all files.')) {
      setWorkspaceFiles([]);
      setWorkspaceName('untitled-workspace');
    }
  };

  return (
    <div className="bg-[#252526] rounded-lg p-3 border border-[#333]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-[#dcb67a]" />
          <span className="text-[12px] font-medium text-[#cccccc]">Workspace</span>
        </div>
        <button
          onClick={handleResetWorkspace}
          className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
          title="Reset workspace"
        >
          <X size={12} />
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-[#888] block mb-1">Project Name</label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-[11px] text-[#ccc] focus:outline-none focus:border-[#007acc]"
            placeholder="my-project"
          />
        </div>

        <div>
          <label className="text-[10px] text-[#888] block mb-1">Load Files</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            {...({ webkitdirectory: '', directory: '' } as any)}
            onChange={handleFileUpload}
            className="hidden"
            id="workspace-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#333] hover:bg-[#444] rounded text-[11px] text-[#ccc] transition-colors"
          >
            <Upload size={12} />
            Upload Project Folder
          </button>
          <p className="text-[9px] text-[#666] mt-1">
            Select a folder to load all files into the workspace
          </p>
        </div>
      </div>
    </div>
  );
}
