import React, { useRef } from 'react';
import { useStore } from '../store';
import { FolderOpen, Upload, X } from 'lucide-react';
import { FileNode } from '../types';

export default function WorkspaceSelector() {
  const { workspaceName, setWorkspaceName, setWorkspaceFiles } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files: FileNode[] = [];
    const fileTree: Record<string, FileNode> = {};

    // Process all files
    for (let i = 0; i < fileList.length; i++) {
      const file: File = fileList[i];
      const path: string = (file as any).webkitRelativePath || file.name;
      const parts: string[] = path.split('/');
      
      // Read file content
      const content = await file.text();
      
      // Create file node
      const fileNode: FileNode = {
        id: path,
        name: parts[parts.length - 1],
        type: 'file',
        content,
        language: getLanguageFromFileName(parts[parts.length - 1])
      };

      // Build directory structure
      let currentPath = '';
      for (let j = 0; j < parts.length - 1; j++) {
        const prevPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${parts[j]}` : parts[j];
        
        if (!fileTree[currentPath]) {
          fileTree[currentPath] = {
            id: currentPath,
            name: parts[j],
            type: 'folder',
            isOpen: true,
            children: []
          };
          
          if (prevPath && fileTree[prevPath]?.children) {
            fileTree[prevPath].children!.push(fileTree[currentPath]);
          }
        }
      }

      // Add file to parent directory or root
      const parentPath = parts.slice(0, -1).join('/');
      if (parentPath && fileTree[parentPath]?.children) {
        fileTree[parentPath].children!.push(fileNode);
      } else {
        files.push(fileNode);
      }
    }

    // Add root directories to files array
    const rootDirs = Object.values(fileTree).filter(
      dir => !dir.id.includes('/')
    );
    files.push(...rootDirs);

    // Determine root folder name from the uploaded path
    const firstFile = fileList[0];
    const firstPath: string = (firstFile as any).webkitRelativePath || firstFile.name;
    const rootFolderName = firstPath.split('/')[0];
    
    // Update workspace name if it's still the default
    if (workspaceName === 'untitled-workspace' && rootFolderName) {
      setWorkspaceName(rootFolderName);
    }
    
    // Create root node if we have multiple top-level items
    if (files.length > 1) {
      const rootName = rootFolderName || workspaceName || 'workspace';
      setWorkspaceFiles([{
        id: rootName,
        name: rootName,
        type: 'folder',
        isOpen: true,
        children: files
      }]);
    } else if (files.length === 1) {
      // Single top-level item - wrap it in a root if it's a folder
      const single = files[0];
      if (single.type === 'folder') {
        setWorkspaceFiles([single]);
        if (workspaceName === 'untitled-workspace') {
          setWorkspaceName(single.name);
        }
      } else {
        const rootName = workspaceName || 'workspace';
        setWorkspaceFiles([{
          id: rootName,
          name: rootName,
          type: 'folder',
          isOpen: true,
          children: files
        }]);
      }
    }

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
      setWorkspaceFiles([{
        id: 'root',
        name: workspaceName || 'workspace',
        type: 'folder',
        isOpen: true,
        children: []
      }]);
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
