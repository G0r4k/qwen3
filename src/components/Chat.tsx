import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useOllama } from '../hooks/useOllama';
import { v4 as uuidv4 } from 'uuid';
import { Send, Bot, User, Loader2, Sparkles, Cpu, Trash2, Zap } from 'lucide-react';

function PhaseIndicator({ phase }: { phase: 'planning' | 'executing' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
      phase === 'planning' 
        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    }`}>
      {phase === 'planning' ? <Cpu size={10} /> : <Zap size={10} />}
      {phase === 'planning' ? 'Director' : 'Executor'}
    </span>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'bg-[#1e1e1e]' : 'bg-[#252526]'}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-600 to-blue-600'
      }`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[#cccccc]">
            {isUser ? 'You' : (message.model || 'Assistant')}
          </span>
          {message.phase && <PhaseIndicator phase={message.phase} />}
          <span className="text-[10px] text-[#666]">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-[13px] text-[#d4d4d4] whitespace-pre-wrap break-words leading-relaxed">
          {message.content || (
            <span className="flex items-center gap-2 text-[#888]">
              <Loader2 size={12} className="animate-spin" />
              Generating...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isGenerating, currentPhase, addMessage, clearMessages } = useStore();
  const { runDualModelPipeline } = useOllama();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMsg = {
      id: uuidv4(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInput('');

    await runDualModelPipeline(userMsg.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#252526]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          <span className="text-[13px] font-medium text-[#cccccc]">AI Assistant</span>
          {isGenerating && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              currentPhase === 'planning' 
                ? 'bg-purple-500/20 text-purple-300' 
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {currentPhase === 'planning' ? '🧠 Planning...' : '⚡ Executing...'}
            </span>
          )}
        </div>
        <button 
          onClick={clearMessages}
          className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
          title="Clear chat"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4">
              <Bot size={28} className="text-white" />
            </div>
            <h3 className="text-[15px] font-medium text-[#ccc] mb-2">Dual-Model AI</h3>
            <p className="text-[12px] text-[#888] mb-4 max-w-[250px] leading-relaxed">
              Director model plans the implementation, Executor model writes the code.
            </p>
            <div className="space-y-2 text-left w-full max-w-[260px]">
              <div className="flex items-center gap-2 text-[11px] text-[#999] bg-[#252526] rounded-lg px-3 py-2">
                <Cpu size={12} className="text-purple-400 shrink-0" />
                <span><strong className="text-purple-300">Director</strong> analyzes & plans</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#999] bg-[#252526] rounded-lg px-3 py-2">
                <Zap size={12} className="text-emerald-400 shrink-0" />
                <span><strong className="text-emerald-300">Executor</strong> writes code</span>
              </div>
            </div>
            <div className="mt-6 text-[11px] text-[#666]">
              <p>Requires Ollama running at localhost:11434</p>
              <p className="mt-1">Model: qwen2.5-coder:3b</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#333] p-3 bg-[#252526]">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? 'AI is working...' : 'Ask AI to write code...'}
            disabled={isGenerating}
            rows={3}
            className="w-full bg-[#1e1e1e] border border-[#444] rounded-lg px-3 py-2 text-[13px] text-[#d4d4d4] placeholder-[#666] resize-none focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="absolute bottom-2 right-2 p-1.5 rounded-md bg-[#007acc] hover:bg-[#0098ff] disabled:bg-[#333] disabled:text-[#666] text-white transition-colors"
          >
            {isGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 text-[10px] text-[#666]">
          <span>Enter to send, Shift+Enter for newline</span>
          <span>Dual-model pipeline</span>
        </div>
      </div>
    </div>
  );
}
