import React, { useState } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/Editor';
import Chat from './components/Chat';
import Terminal from './components/Terminal';
import Settings from './components/Settings';
import { exportProjectAsZip } from './utils/exportZip';
import { 
  MessageSquare, FolderOpen, TerminalSquare, Settings as SettingsIcon,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Bot, ChevronDown, Download
} from 'lucide-react';

type BottomPanel = 'terminal' | 'output' | 'problems';

export default function App() {
  const { showSettings, setShowSettings, activePanel, setActivePanel } = useStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [bottomPanel, setBottomPanel] = useState<BottomPanel | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      {/* Title Bar */}
      <div className="h-9 bg-[#323233] flex items-center justify-between px-4 border-b border-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Bot size={12} className="text-white" />
            </div>
            <span className="text-[12px] font-semibold text-[#cccccc]">LocalCoder</span>
          </div>
          <span className="text-[11px] text-[#666]">|</span>
          <span className="text-[11px] text-[#888]">AI-Powered IDE with Local Models</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 mr-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-[#888]">Ollama</span>
          </div>
          <button
            onClick={() => {
              const { files } = useStore.getState();
              exportProjectAsZip(files, 'localcoder-project');
            }}
            className="p-1.5 rounded text-[#888] hover:text-white hover:bg-[#3c3c3c] flex items-center gap-1"
            title="Download project as ZIP"
          >
            <Download size={14} />
            <span className="text-[10px]">ZIP</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded text-[#888] hover:text-white hover:bg-[#3c3c3c] ${showSettings ? 'bg-[#3c3c3c] text-white' : ''}`}
            title="Settings"
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-2 gap-1 border-r border-[#1e1e1e] shrink-0">
          <button
            onClick={() => { setShowSidebar(!showSidebar); setActivePanel('files'); }}
            className={`p-2 rounded-lg transition-colors ${showSidebar && activePanel === 'files' ? 'text-white bg-[#505050]' : 'text-[#888] hover:text-white hover:bg-[#3c3c3c]'}`}
            title="Explorer"
          >
            <FolderOpen size={20} />
          </button>
          <button
            onClick={() => { setShowChat(!showChat); setActivePanel('chat'); }}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'text-white bg-[#505050]' : 'text-[#888] hover:text-white hover:bg-[#3c3c3c]'}`}
            title="AI Chat"
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={() => { setShowBottomPanel(!showBottomPanel); setBottomPanel('terminal'); }}
            className={`p-2 rounded-lg transition-colors ${showBottomPanel ? 'text-white bg-[#505050]' : 'text-[#888] hover:text-white hover:bg-[#3c3c3c]'}`}
            title="Terminal"
          >
            <TerminalSquare size={20} />
          </button>
          
          <div className="flex-1" />
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'text-white bg-[#505050]' : 'text-[#888] hover:text-white hover:bg-[#3c3c3c]'}`}
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>
        </div>

        {/* Sidebar */}
        {showSidebar && !showSettings && (
          <div className="w-[260px] shrink-0 overflow-hidden">
            <Sidebar />
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-[320px] shrink-0 overflow-hidden border-r border-[#1e1e1e]">
            <Settings />
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor />
          </div>
          
          {/* Bottom Panel */}
          {showBottomPanel && (
            <div className="h-[200px] border-t border-[#333] shrink-0">
              <Terminal />
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && !showSettings && (
          <div className="w-[380px] shrink-0 border-l border-[#1e1e1e] overflow-hidden">
            <Chat />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-[11px] text-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-300" />
            Ready
          </span>
          <span>UTF-8</span>
          <span>TypeScript</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Qwen2.5-Coder:3b × 2</span>
          <span>Ollama Local</span>
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
}
