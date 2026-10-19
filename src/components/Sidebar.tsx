import React from 'react';
import { useStore } from '../store';
import { FileNode } from '../types';
import { exportProjectAsZip } from '../utils/exportZip';
import { 
  ChevronRight, ChevronDown, Folder, FolderOpen, File, 
  FileCode, FileJson, FileText, Plus, RefreshCw, Download
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

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const { toggleFolder, openFile, activeFileId } = useStore();

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.id);
    } else {
      openFile(node.id);
    }
  };

  const isActive = node.id === activeFileId;

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1 px-2 py-[3px] cursor-pointer text-[13px] hover:bg-[#2a2d2e] transition-colors ${
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
        <span className="truncate ml-1">{node.name}</span>
      </div>
      {node.type === 'folder' && node.isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { files } = useStore();

  return (
    <div className="h-full flex flex-col bg-[#252526] border-r border-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e1e]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#bbbbbb]">
          Explorer
        </span>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc]" title="New File">
            <Plus size={14} />
          </button>
          <button className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc]" title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={() => {
              const { files } = useStore.getState();
              exportProjectAsZip(files, 'my-project');
            }}
            className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc]" 
            title="Download as ZIP"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files.map(node => (
          <TreeNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
