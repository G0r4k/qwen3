import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { testOllamaConnection, analyzeConnectionResults, ConnectionTest } from '../utils/connectionTest';
import { 
  CheckCircle, XCircle, AlertCircle, Loader2, Copy, 
  ExternalLink, RefreshCw, Wifi, WifiOff 
} from 'lucide-react';

export default function ConnectionDiagnostic() {
  const { ollamaConfig } = useStore();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ConnectionTest[] | null>(null);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeConnectionResults> | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    setAnalysis(null);
    
    const testResults = await testOllamaConnection();
    setResults(testResults);
    setAnalysis(analyzeConnectionResults(testResults));
    setTesting(false);
  };

  useEffect(() => {
    runTest();
  }, [ollamaConfig.baseUrl]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle size={14} className="text-green-400 shrink-0" />
    ) : (
      <XCircle size={14} className="text-red-400 shrink-0" />
    );
  };

  const getOverallStatusIcon = () => {
    if (!analysis) return null;
    switch (analysis.status) {
      case 'working':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'cors-error':
        return <AlertCircle size={20} className="text-orange-400" />;
      case 'not-running':
        return <WifiOff size={20} className="text-red-400" />;
      case 'model-missing':
        return <AlertCircle size={20} className="text-yellow-400" />;
      default:
        return <AlertCircle size={20} className="text-yellow-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#252526] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Wifi size={14} className="text-[#cccccc]" />
          <span className="text-[13px] font-medium text-[#cccccc]">Connection Diagnostic</span>
        </div>
        <button
          onClick={runTest}
          disabled={testing}
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#333] hover:bg-[#444] text-[#ccc] disabled:opacity-50"
        >
          <RefreshCw size={11} className={testing ? 'animate-spin' : ''} />
          Test
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Connection Info */}
        <div className="bg-[#252526] rounded-lg p-3 border border-[#333]">
          <div className="text-[11px] text-[#888] mb-1">Ollama URL</div>
          <div className="flex items-center gap-2">
            <code className="text-[12px] text-[#ccc] flex-1">{ollamaConfig.baseUrl}</code>
            <a
              href={ollamaConfig.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
              title="Open in browser"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Overall Status */}
        {analysis && (
          <div className={`rounded-lg p-4 border ${
            analysis.status === 'working' ? 'bg-green-500/10 border-green-500/30' :
            analysis.status === 'cors-error' ? 'bg-orange-500/10 border-orange-500/30' :
            analysis.status === 'not-running' ? 'bg-red-500/10 border-red-500/30' :
            'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {getOverallStatusIcon()}
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#ccc] mb-1">{analysis.message}</div>
                {analysis.solution && (
                  <div className="text-[11px] text-[#999]">{analysis.solution}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {testing && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[#007acc]" />
            <span className="ml-2 text-[13px] text-[#888]">Testing connection...</span>
          </div>
        )}

        {/* Test Results */}
        {results && !testing && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider mb-2">
              Test Results
            </div>
            {results.map((result, idx) => (
              <div key={idx} className="bg-[#252526] rounded-lg p-3 border border-[#333]">
                <div className="flex items-start gap-2">
                  {getStatusIcon(result.success)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-medium text-[#ccc]">{result.method}</span>
                      {result.duration && (
                        <span className="text-[10px] text-[#666]">{result.duration}ms</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#999]">{result.message}</div>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-[10px] text-[#007acc] cursor-pointer hover:text-[#0098ff]">
                          Show details
                        </summary>
                        <pre className="mt-1 p-2 bg-[#1e1e1e] rounded text-[10px] text-[#888] overflow-x-auto whitespace-pre-wrap break-all">
                          {result.details}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Solutions */}
        {analysis && analysis.status !== 'working' && (
          <div className="space-y-3">
            <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider">
              Solutions
            </div>

            {analysis.status === 'cors-error' && (
              <div className="bg-[#252526] rounded-lg p-4 border border-orange-500/30 space-y-3">
                <div className="text-[12px] font-medium text-orange-300">
                  Fix CORS Error
                </div>
                
                <div className="space-y-2">
                  <div className="text-[11px] text-[#999]">
                    <strong>Option 1:</strong> Quick fix (temporary)
                  </div>
                  <div className="flex items-center gap-2 bg-[#1e1e1e] rounded p-2">
                    <code className="text-[11px] text-green-300 flex-1">
                      OLLAMA_ORIGINS="*" ollama serve
                    </code>
                    <button
                      onClick={() => copyToClipboard('OLLAMA_ORIGINS="*" ollama serve', 'cmd1')}
                      className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
                    >
                      {copied === 'cmd1' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] text-[#999]">
                    <strong>Option 2:</strong> Permanent fix (macOS/Linux)
                  </div>
                  <div className="flex items-center gap-2 bg-[#1e1e1e] rounded p-2">
                    <code className="text-[11px] text-green-300 flex-1">
                      echo 'export OLLAMA_ORIGINS="*"' {'>>'} ~/.zshrc
                    </code>
                    <button
                      onClick={() => copyToClipboard('echo \'export OLLAMA_ORIGINS="*"\' >> ~/.zshrc', 'cmd2')}
                      className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
                    >
                      {copied === 'cmd2' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] text-[#999]">
                    <strong>Option 3:</strong> Windows (PowerShell)
                  </div>
                  <div className="flex items-center gap-2 bg-[#1e1e1e] rounded p-2">
                    <code className="text-[11px] text-green-300 flex-1">
                      $env:OLLAMA_ORIGINS="*"; ollama serve
                    </code>
                    <button
                      onClick={() => copyToClipboard('$env:OLLAMA_ORIGINS="*"; ollama serve', 'cmd3')}
                      className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
                    >
                      {copied === 'cmd3' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-[#888] mt-3 p-2 bg-[#1e1e1e] rounded">
                  <strong>Steps:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-0.5">
                    <li>Stop Ollama (Ctrl+C)</li>
                    <li>Run one of the commands above</li>
                    <li>Click "Test" to verify connection</li>
                  </ol>
                </div>
              </div>
            )}

            {analysis.status === 'not-running' && (
              <div className="bg-[#252526] rounded-lg p-4 border border-red-500/30 space-y-3">
                <div className="text-[12px] font-medium text-red-300">
                  Start Ollama
                </div>
                <div className="flex items-center gap-2 bg-[#1e1e1e] rounded p-2">
                  <code className="text-[11px] text-green-300 flex-1">ollama serve</code>
                  <button
                    onClick={() => copyToClipboard('ollama serve', 'cmd4')}
                    className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
                  >
                    {copied === 'cmd4' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="text-[10px] text-[#888]">
                  Run this command in a terminal and keep it running
                </div>
              </div>
            )}

            {analysis.status === 'model-missing' && (
              <div className="bg-[#252526] rounded-lg p-4 border border-yellow-500/30 space-y-3">
                <div className="text-[12px] font-medium text-yellow-300">
                  Install Model
                </div>
                <div className="flex items-center gap-2 bg-[#1e1e1e] rounded p-2">
                  <code className="text-[11px] text-green-300 flex-1">
                    ollama pull {ollamaConfig.directorModel}
                  </code>
                  <button
                    onClick={() => copyToClipboard(`ollama pull ${ollamaConfig.directorModel}`, 'cmd5')}
                    className="p-1 hover:bg-[#3c3c3c] rounded text-[#888] hover:text-white"
                  >
                    {copied === 'cmd5' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-[#252526] rounded-lg p-3 border border-[#333] text-[11px] text-[#888]">
          <div className="font-medium text-[#aaa] mb-2">Quick Checklist:</div>
          <ul className="space-y-1">
            <li>✓ Ollama is installed and running</li>
            <li>✓ Model is downloaded: <code className="text-[#ccc]">ollama list</code></li>
            <li>✓ CORS is configured: <code className="text-[#ccc]">OLLAMA_ORIGINS="*"</code></li>
            <li>✓ URL is correct: <code className="text-[#ccc]">{ollamaConfig.baseUrl}</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
