import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { Terminal as TermIcon, Trash2 } from 'lucide-react';

export default function Terminal() {
  const { terminalLines, addTerminalLine, clearTerminal } = useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addTerminalLine({
      id: uuidv4(),
      content: `$ ${input}`,
      type: 'input',
      timestamp: new Date(),
    });

    // Simulate some commands
    const cmd = input.trim().toLowerCase();
    if (cmd === 'clear') {
      clearTerminal();
    } else if (cmd === 'help') {
      addTerminalLine({
        id: uuidv4(),
        content: 'Available commands: help, clear, status, models, ollama-status',
        type: 'output',
        timestamp: new Date(),
      });
    } else if (cmd === 'status') {
      addTerminalLine({
        id: uuidv4(),
        content: 'LocalCoder v1.0 | Ollama: http://localhost:11434 | Models: qwen2.5-coder:3b',
        type: 'output',
        timestamp: new Date(),
      });
    } else if (cmd === 'models') {
      addTerminalLine({
        id: uuidv4(),
        content: 'Installed models:\n  - qwen2.5-coder:3b (Director)\n  - qwen2.5-coder:3b (Executor)',
        type: 'output',
        timestamp: new Date(),
      });
    } else if (cmd === 'ollama-status') {
      fetch('http://localhost:11434/api/tags')
        .then(res => {
          if (res.ok) {
            addTerminalLine({
              id: uuidv4(),
              content: '✓ Ollama is running and accessible',
              type: 'output',
              timestamp: new Date(),
            });
          } else {
            throw new Error('Not OK');
          }
        })
        .catch(() => {
          addTerminalLine({
            id: uuidv4(),
            content: '✗ Cannot connect to Ollama. Make sure it\'s running at localhost:11434',
            type: 'error',
            timestamp: new Date(),
          });
        });
    } else {
      addTerminalLine({
        id: uuidv4(),
        content: `Command not found: ${input}. Type 'help' for available commands.`,
        type: 'error',
        timestamp: new Date(),
      });
    }

    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#333] bg-[#252526]">
        <div className="flex items-center gap-2">
          <TermIcon size={13} className="text-[#cccccc]" />
          <span className="text-[12px] text-[#cccccc]">Terminal</span>
        </div>
        <button
          onClick={clearTerminal}
          className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
          title="Clear terminal"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 text-[12px]">
        {terminalLines.map(line => (
          <div
            key={line.id}
            className={`leading-5 ${
              line.type === 'error' ? 'text-red-400' :
              line.type === 'info' ? 'text-blue-400' :
              line.type === 'input' ? 'text-green-400' :
              'text-[#cccccc]'
            }`}
          >
            {line.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-[#333] px-3 py-2 flex items-center gap-2">
        <span className="text-green-400 text-[12px]">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent text-[12px] text-[#cccccc] outline-none placeholder-[#555]"
          placeholder="Type a command..."
          spellCheck={false}
        />
      </form>
    </div>
  );
}
