import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useOllama } from '../hooks/useOllama';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export default function OllamaStatus() {
  const { ollamaConfig } = useStore();
  const { checkConnection } = useOllama();
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'cors-error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      setStatus('checking');
      const result = await checkConnection();
      
      if (result.connected) {
        setStatus('connected');
        setError(null);
      } else {
        if (result.error?.includes('CORS')) {
          setStatus('cors-error');
          setError('CORS Error');
        } else {
          setStatus('disconnected');
          setError(result.error || 'Unknown error');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [ollamaConfig.baseUrl]);

  const statusConfig = {
    checking: {
      icon: <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />,
      text: 'Checking...',
      color: 'text-yellow-400',
      title: 'Verifying Ollama connection...'
    },
    connected: {
      icon: <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />,
      text: 'Ollama Connected',
      color: 'text-green-400',
      title: 'Connected to Ollama'
    },
    disconnected: {
      icon: <WifiOff size={12} className="text-red-400" />,
      text: 'Ollama Offline',
      color: 'text-red-400',
      title: error || 'Cannot connect to Ollama'
    },
    'cors-error': {
      icon: <AlertTriangle size={12} className="text-orange-400" />,
      text: 'CORS Error',
      color: 'text-orange-400',
      title: 'CORS blocked. Set OLLAMA_ORIGINS="*" and restart Ollama'
    }
  };

  const current = statusConfig[status];

  return (
    <div className="flex items-center gap-1.5 mr-3" title={current.title}>
      {current.icon}
      <span className={`text-[10px] ${current.color}`}>{current.text}</span>
    </div>
  );
}
