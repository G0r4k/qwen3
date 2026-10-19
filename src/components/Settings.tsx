import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useOllama } from '../hooks/useOllama';
import ConnectionDiagnostic from './ConnectionDiagnostic';
import WorkspaceSelector from './WorkspaceSelector';
import { Settings as SettingsIcon, Check, X, RefreshCw, Server, Cpu, Zap, Thermometer, Stethoscope } from 'lucide-react';

export default function Settings() {
  const { ollamaConfig, updateOllamaConfig } = useStore();
  const { checkConnection, listModels } = useOllama();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    setConnectionError(null);
    const result = await checkConnection();
    setIsConnected(result.connected);
    if (result.error) {
      setConnectionError(result.error);
    }
    if (result.connected) {
      const models = await listModels();
      setAvailableModels(models);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333] bg-[#252526]">
        <SettingsIcon size={14} className="text-[#cccccc]" />
        <span className="text-[13px] font-medium text-[#cccccc]">Settings</span>
      </div>

      <div className="p-4 space-y-6">
        {/* Workspace Selector */}
        <WorkspaceSelector />

        {/* Connection Status */}
        <div className="bg-[#252526] rounded-lg p-4 border border-[#333]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-[#cccccc]" />
              <span className="text-[13px] font-medium text-[#cccccc]">Ollama Connection</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowDiagnostic(!showDiagnostic)}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#333] hover:bg-[#444] text-[#ccc]"
                title="Run detailed diagnostic"
              >
                <Stethoscope size={11} />
                Diagnostic
              </button>
              <button
                onClick={checkStatus}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#333] hover:bg-[#444] text-[#ccc]"
              >
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                Check
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isConnected === null ? (
                <span className="text-[11px] text-[#888]">Checking...</span>
              ) : isConnected ? (
                <span className="flex items-center gap-1 text-[11px] text-green-400">
                  <Check size={12} /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-red-400">
                  <X size={12} /> Not connected
                </span>
              )}
            </div>
            
            {connectionError && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-300">
                <p className="font-medium mb-1">⚠️ Error de conexión:</p>
                <p className="text-[10px]">{connectionError}</p>
                {connectionError.includes('CORS') && (
                  <div className="mt-2 p-2 bg-[#1e1e1e] rounded text-[10px] text-[#ccc]">
                    <p className="font-medium mb-1">Solución:</p>
                    <p>1. Detén Ollama (Ctrl+C)</p>
                    <p>2. Ejecuta con CORS habilitado:</p>
                    <code className="block mt-1 p-1 bg-[#333] rounded text-green-300">
                      OLLAMA_ORIGINS="*" ollama serve
                    </code>
                    <p className="mt-1 text-[9px] text-[#888]">O configura la variable de entorno permanentemente en tu sistema</p>
                  </div>
                )}
              </div>
            )}
            
            {availableModels.length > 0 && (
              <div className="text-[11px] text-[#888]">
                <p className="mb-1">Available models:</p>
                <div className="flex flex-wrap gap-1">
                  {availableModels.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-[#333] rounded text-[10px] text-[#ccc]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Diagnostic */}
        {showDiagnostic && (
          <div className="border border-[#333] rounded-lg overflow-hidden">
            <div className="h-[500px]">
              <ConnectionDiagnostic />
            </div>
          </div>
        )}

        {/* Ollama URL */}
        <div className="space-y-2">
          <label className="text-[12px] text-[#cccccc] font-medium">Ollama Base URL</label>
          <input
            type="text"
            value={ollamaConfig.baseUrl}
            onChange={(e) => updateOllamaConfig({ baseUrl: e.target.value })}
            className="w-full bg-[#252526] border border-[#444] rounded-md px-3 py-2 text-[12px] text-[#d4d4d4] focus:outline-none focus:border-[#007acc]"
          />
          <p className="text-[10px] text-[#666]">Default: http://localhost:11434</p>
        </div>

        {/* Director Model */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] text-[#cccccc] font-medium">
            <Cpu size={12} className="text-purple-400" />
            Director Model
          </label>
          <input
            type="text"
            value={ollamaConfig.directorModel}
            onChange={(e) => updateOllamaConfig({ directorModel: e.target.value })}
            className="w-full bg-[#252526] border border-[#444] rounded-md px-3 py-2 text-[12px] text-[#d4d4d4] focus:outline-none focus:border-[#007acc]"
          />
          <p className="text-[10px] text-[#666]">Analyzes requests and creates implementation plans</p>
        </div>

        {/* Executor Model */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] text-[#cccccc] font-medium">
            <Zap size={12} className="text-emerald-400" />
            Executor Model
          </label>
          <input
            type="text"
            value={ollamaConfig.executorModel}
            onChange={(e) => updateOllamaConfig({ executorModel: e.target.value })}
            className="w-full bg-[#252526] border border-[#444] rounded-md px-3 py-2 text-[12px] text-[#d4d4d4] focus:outline-none focus:border-[#007acc]"
          />
          <p className="text-[10px] text-[#666]">Receives plans and generates actual code</p>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] text-[#cccccc] font-medium">
            <Thermometer size={12} className="text-orange-400" />
            Temperature: {ollamaConfig.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={ollamaConfig.temperature}
            onChange={(e) => updateOllamaConfig({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-[#007acc]"
          />
          <div className="flex justify-between text-[10px] text-[#666]">
            <span>Precise (0)</span>
            <span>Creative (2)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <label className="text-[12px] text-[#cccccc] font-medium">Max Tokens</label>
          <input
            type="number"
            value={ollamaConfig.maxTokens}
            onChange={(e) => updateOllamaConfig({ maxTokens: parseInt(e.target.value) || 4096 })}
            className="w-full bg-[#252526] border border-[#444] rounded-md px-3 py-2 text-[12px] text-[#d4d4d4] focus:outline-none focus:border-[#007acc]"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full py-2 rounded-md text-[13px] font-medium transition-colors ${
            saved 
              ? 'bg-green-600 text-white' 
              : 'bg-[#007acc] hover:bg-[#0098ff] text-white'
          }`}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {/* Info */}
        <div className="bg-[#252526] rounded-lg p-4 border border-[#333] text-[11px] text-[#888] space-y-2">
          <p className="font-medium text-[#aaa]">How it works:</p>
          <p>1. You send a request describing what you want to build</p>
          <p>2. The <strong className="text-purple-300">Director</strong> model analyzes your request and creates a detailed implementation plan</p>
          <p>3. The <strong className="text-emerald-300">Executor</strong> model receives the plan and generates the actual code</p>
          <p className="mt-2 text-[#666]">Both models run locally via Ollama. No data leaves your machine.</p>
        </div>
      </div>
    </div>
  );
}
