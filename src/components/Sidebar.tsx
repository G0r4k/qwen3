import React, { useState } from 'react';
import { useStore } from '../store';
import { FileNode } from '../types';
import { 
  ChevronRight, ChevronDown, Folder, FolderOpen, File, 
  FileCode, FileJson, FileText, Plus, RefreshCw, Trash2, Edit3,
  FilePlus, FolderPlus
} from 'lucide-react';

function getFileIcon(name: string) {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode size={14} className="text-blue-400" />;
  if (name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode size={14} className="text-yellow-400" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-green-400" />;
  if (name.endsWith('.md')) return <FileText size={14} className="text-gray-400" />;
  if (name.endsWith('.css')) return <FileCode size={14} className="text-purple-400" />;
  if (name.endsWith('.html')) return <FileCode size={14} className="text-orange-400" />;
  return <File size={14} className="text-gray-400" />;
}

interface TreeNodeProps {
  node: FileNode;
  depth?: number;
  parentPath?: string;
}

function TreeNode({ node, depth = 0, parentPath = '' }: TreeNodeProps) {
  const { toggleFolder, openFile, activeFileId, deleteFile, renameFile } = useStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.id);
    } else {
      openFile(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      deleteFile(node.id);
    }
    setShowContextMenu(false);
  };

  const handleRename = () => {
    setIsRenaming(true);
    setNewName(node.name);
    setShowContextMenu(false);
  };

  const handleRenameSubmit = () => {
    if (newName && newName !== node.name) {
      renameFile(node.id, newName);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(node.name);
    }
  };

  const handleCreateFile = () => {
    setShowNewFileInput(true);
    setShowNewFolderInput(false);
    setShowContextMenu(false);
  };

  const handleCreateFolder = () => {
    setShowNewFolderInput(true);
    setShowNewFileInput(false);
    setShowContextMenu(false);
  };

  const handleNewFileSubmit = () => {
    if (newFileName) {
      const { createFile } = useStore.getState();
      if (node.type === 'folder') {
        createFile(currentPath, newFileName);
      } else {
        createFile(parentPath, newFileName);
      }
      setNewFileName('');
      setShowNewFileInput(false);
    }
  };

  const handleNewFolderSubmit = () => {
    if (newFolderName) {
      const { createFolder } = useStore.getState();
      if (node.type === 'folder') {
        createFolder(currentPath, newFolderName);
      } else {
        createFolder(parentPath, newFolderName);
      }
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const isActive = node.id === activeFileId;

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-1 px-2 py-[3px] cursor-pointer text-[13px] hover:bg-[#2a2d2e] transition-colors relative ${
          isActive ? 'bg-[#37373d] text-white' : 'text-[#cccccc]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === 'folder' ? (
          <>
            {node.isOpen ? (
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
            )}
            {node.isOpen ? (
              <FolderOpen size={14} className="text-[#dcb67a] shrink-0" />
            ) : (
              <Folder size={14} className="text-[#dcb67a] shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-[14px] shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="flex-1 bg-[#1e1e1e] border border-[#007acc] rounded px-1 text-[12px] text-white outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate ml-1">{node.name}</span>
        )}

        {/* Context Menu */}
        {showContextMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowContextMenu(false)}
            />
            <div className="absolute right-2 top-full mt-1 bg-[#252526] border border-[#444] rounded shadow-lg z-50 min-w-[160px]">
              {node.type === 'folder' && (
                <>
                  <button
                    onClick={handleCreateFile}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#ccc] hover:bg-[#3c3c3c] transition-colors"
                  >
                    <FilePlus size={12} />
                    New File
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#ccc] hover:bg-[#3c3c3c] transition-colors"
                  >
                    <FolderPlus size={12} />
                    New Folder
                  </button>
                  <div className="border-t border-[#333] my-1" />
                </>
              )}
              <button
                onClick={handleRename}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#ccc] hover:bg-[#3c3c3c] transition-colors"
              >
                <Edit3 size={12} />
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-red-400 hover:bg-[#3c3c3c] transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* New File Input */}
      {showNewFileInput && node.type === 'folder' && (
        <div 
          className="flex items-center gap-1 px-2 py-1"
          style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
        >
          <FilePlus size={14} className="text-blue-400 shrink-0" />
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNewFileSubmit();
              if (e.key === 'Escape') {
                setShowNewFileInput(false);
                setNewFileName('');
              }
            }}
            onBlur={handleNewFileSubmit}
            placeholder="filename.ts"
            className="flex-1 bg-[#1e1e1e] border border-[#007acc] rounded px-1 text-[12px] text-white outline-none"
            autoFocus
          />
        </div>
      )}

      {/* New Folder Input */}
      {showNewFolderInput && node.type === 'folder' && (
        <div 
          className="flex items-center gap-1 px-2 py-1"
          style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
        >
          <FolderPlus size={14} className="text-[#dcb67a] shrink-0" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNewFolderSubmit();
              if (e.key === 'Escape') {
                setShowNewFolderInput(false);
                setNewFolderName('');
              }
            }}
            onBlur={handleNewFolderSubmit}
            placeholder="folder-name"
            className="flex-1 bg-[#1e1e1e] border border-[#007acc] rounded px-1 text-[12px] text-white outline-none"
            autoFocus
          />
        </div>
      )}

      {/* Children */}
      {node.type === 'folder' && node.isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              depth={depth + 1}
              parentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { files, workspaceName, createFile, createFolder } = useStore();
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFile = () => {
    if (newFileName) {
      createFile('', newFileName);
      setNewFileName('');
      setShowNewFileInput(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName) {
      createFolder('', newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] border-r border-[#1e1e1e]">
      <div className="px-4 py-2 border-b border-[#1e1e1e]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#bbbbbb]">
            Explorer
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => {
                setShowNewFileInput(!showNewFileInput);
                setShowNewFolderInput(false);
              }}
              className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc]" 
              title="New File"
            >
              <FilePlus size={14} />
            </button>
            <button 
              onClick={() => {
                setShowNewFolderInput(!showNewFolderInput);
                setShowNewFileInput(false);
              }}
              className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc]" 
              title="New Folder"
            >
              <FolderPlus size={14} />
            </button>
            <button className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc]" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="text-[10px] text-[#888] truncate" title={workspaceName}>
          📁 {workspaceName}
        </div>
      </div>

      {/* New File Input at Root */}
      {showNewFileInput && (
        <div className="flex items-center gap-1 px-2 py-1 border-b border-[#333]">
          <FilePlus size={14} className="text-blue-400 shrink-0" />
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFile();
              if (e.key === 'Escape') {
                setShowNewFileInput(false);
                setNewFileName('');
              }
            }}
            onBlur={handleCreateFile}
            placeholder="filename.ts"
            className="flex-1 bg-[#1e1e1e] border border-[#007acc] rounded px-1 text-[12px] text-white outline-none"
            autoFocus
          />
        </div>
      )}

      {/* New Folder Input at Root */}
      {showNewFolderInput && (
        <div className="flex items-center gap-1 px-2 py-1 border-b border-[#333]">
          <FolderPlus size={14} className="text-[#dcb67a] shrink-0" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setShowNewFolderInput(false);
                setNewFolderName('');
              }
            }}
            onBlur={handleCreateFolder}
            placeholder="folder-name"
            className="flex-1 bg-[#1e1e1e] border border-[#007acc] rounded px-1 text-[12px] text-white outline-none"
            autoFocus
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-[#888]">
            <div className="text-3xl mb-3 opacity-50">📂</div>
            <p className="mb-2 font-medium text-[#aaa]">No Workspace Open</p>
            <p className="text-[10px] text-[#666] mb-3">
              Load a project folder to start working
            </p>
            <button
              onClick={() => useStore.getState().setShowSettings(true)}
              className="px-3 py-1.5 bg-[#007acc] hover:bg-[#0098ff] text-white text-[10px] rounded transition-colors"
            >
              Open Settings
            </button>
          </div>
        ) : (
          files.map(node => (
            <TreeNode key={node.id} node={node} />
          ))
        )}
      </div>
    </div>
  );
}
