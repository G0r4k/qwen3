import React, { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../store';
import { X } from 'lucide-react';

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
  };
  return map[ext] || 'plaintext';
}

function findFileContent(files: any[], id: string): { content: string; name: string } | null {
  for (const node of files) {
    if (node.id === id) return { content: node.content || '', name: node.name };
    if (node.children) {
      const found = findFileContent(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function CodeEditor() {
  const { files, activeFileId, openFileIds, closeFile, updateFileContent, setActiveFile } = useStore();

  const activeFile = useMemo(() => {
    if (!activeFileId) return null;
    return findFileContent(files, activeFileId);
  }, [files, activeFileId]);

  if (openFileIds.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center text-[#666]">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-xl font-light mb-2">LocalCoder</h2>
          <p className="text-sm mb-4">Open a file from the explorer or start chatting with AI</p>
          <div className="text-xs text-[#555] space-y-2 max-w-md mx-auto">
            <div className="bg-[#252526] rounded-lg p-3 border border-[#333] text-left">
              <p className="font-medium text-[#888] mb-2">🎯 Director-Developer Architecture</p>
              <div className="space-y-1 text-[11px]">
                <p>🧠 <strong className="text-purple-300">Director</strong> → Plans step-by-step</p>
                <p>👨‍💻 <strong className="text-blue-300">Developer</strong> → Executes with tools</p>
                <p>🔍 <strong className="text-green-300">Verification</strong> → Each step validated</p>
              </div>
            </div>
            <p className="text-[10px] text-[#444] mt-3">
              Powered by Qwen2.5-Coder via Ollama • 100% Local
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Tabs */}
      <div className="flex bg-[#252526] border-b border-[#1e1e1e] overflow-x-auto">
        {openFileIds.map(fileId => {
          const file = findFileContent(files, fileId);
          if (!file) return null;
          const isActive = fileId === activeFileId;
          return (
            <div
              key={fileId}
              onClick={() => setActiveFile(fileId)}
              className={`flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer border-r border-[#1e1e1e] min-w-0 ${
                isActive
                  ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]'
                  : 'bg-[#2d2d2d] text-[#969696] hover:text-white border-t-2 border-t-transparent'
              }`}
            >
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(fileId);
                }}
                className="p-0.5 rounded hover:bg-[#3c3c3c] opacity-60 hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Editor */}
      <div className="flex-1">
        {activeFile && (
          <Editor
            height="100%"
            language={getLanguage(activeFile.name)}
            value={activeFile.content}
            theme="vs-dark"
            onChange={(value) => {
              if (activeFileId) {
                updateFileContent(activeFileId, value || '');
              }
            }}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              padding: { top: 10 },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
          />
        )}
      </div>
    </div>
  );
}
