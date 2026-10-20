import { useStore } from '../store';

export interface ConnectionTest {
  method: string;
  success: boolean;
  message: string;
  details?: string;
  duration?: number;
}

export async function testOllamaConnection(): Promise<ConnectionTest[]> {
  const { ollamaConfig } = useStore.getState();
  const results: ConnectionTest[] = [];
  const baseUrl = ollamaConfig.baseUrl;

  // Test 1: Basic fetch to root
  const test1Start = Date.now();
  try {
    const response = await fetch(baseUrl, { 
      method: 'GET',
      mode: 'cors'
    });
    const duration = Date.now() - test1Start;
    results.push({
      method: 'GET /',
      success: response.ok,
      message: response.ok ? 'Root endpoint accessible' : `HTTP ${response.status}`,
      details: await response.text(),
      duration
    });
  } catch (error: any) {
    results.push({
      method: 'GET /',
      success: false,
      message: 'Failed',
      details: error.message,
      duration: Date.now() - test1Start
    });
  }

  // Test 2: API tags endpoint
  const test2Start = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      mode: 'cors'
    });
    const duration = Date.now() - test2Start;
    if (response.ok) {
      const data = await response.json();
      results.push({
        method: 'GET /api/tags',
        success: true,
        message: `Found ${data.models?.length || 0} models`,
        details: JSON.stringify(data, null, 2),
        duration
      });
    } else {
      results.push({
        method: 'GET /api/tags',
        success: false,
        message: `HTTP ${response.status}`,
        details: await response.text(),
        duration
      });
    }
  } catch (error: any) {
    results.push({
      method: 'GET /api/tags',
      success: false,
      message: 'Failed',
      details: error.message,
      duration: Date.now() - test2Start
    });
  }

  // Test 3: Simple chat request (no streaming)
  const test3Start = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({
        model: ollamaConfig.directorModel,
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
        options: { num_predict: 5 }
      })
    });
    const duration = Date.now() - test3Start;
    if (response.ok) {
      const data = await response.json();
      results.push({
        method: 'POST /api/chat (no stream)',
        success: true,
        message: 'Chat API working',
        details: JSON.stringify(data, null, 2).substring(0, 500),
        duration
      });
    } else {
      results.push({
        method: 'POST /api/chat (no stream)',
        success: false,
        message: `HTTP ${response.status}`,
        details: await response.text(),
        duration
      });
    }
  } catch (error: any) {
    results.push({
      method: 'POST /api/chat (no stream)',
      success: false,
      message: 'Failed',
      details: error.message,
      duration: Date.now() - test3Start
    });
  }

  // Test 4: Check if model exists
  const test4Start = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/tags`, { mode: 'cors' });
    const duration = Date.now() - test4Start;
    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];
      const modelExists = models.some((m: string) => m.includes(ollamaConfig.directorModel.split(':')[0]));
      results.push({
        method: 'Model check',
        success: modelExists,
        message: modelExists ? `Model ${ollamaConfig.directorModel} found` : `Model ${ollamaConfig.directorModel} not found`,
        details: `Available models: ${models.join(', ')}`,
        duration
      });
    } else {
      results.push({
        method: 'Model check',
        success: false,
        message: 'Cannot check models',
        duration: Date.now() - test4Start
      });
    }
  } catch (error: any) {
    results.push({
      method: 'Model check',
      success: false,
      message: 'Failed',
      details: error.message,
      duration: Date.now() - test4Start
    });
  }

  return results;
}

export function analyzeConnectionResults(results: ConnectionTest[]): {
  status: 'working' | 'cors-error' | 'not-running' | 'partial' | 'model-missing';
  message: string;
  solution: string;
} {
  const rootTest = results.find(r => r.method === 'GET /');
  const tagsTest = results.find(r => r.method === 'GET /api/tags');
  const chatTest = results.find(r => r.method === 'POST /api/chat (no stream)');
  const modelTest = results.find(r => r.method === 'Model check');

  // All tests failed - likely CORS or not running
  if (!rootTest?.success && !tagsTest?.success && !chatTest?.success) {
    const errorMessage = rootTest?.details || tagsTest?.details || chatTest?.details || '';
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
      return {
        status: 'cors-error',
        message: 'CORS Error: Browser is blocking requests to Ollama',
        solution: 'Set OLLAMA_ORIGINS="*" environment variable and restart Ollama'
      };
    }
    
    return {
      status: 'not-running',
      message: 'Cannot connect to Ollama',
      solution: 'Make sure Ollama is running with: ollama serve'
    };
  }

  // Some tests passed, some failed
  if (rootTest?.success || tagsTest?.success) {
    if (!chatTest?.success) {
      return {
        status: 'partial',
        message: 'Ollama is running but chat API failed',
        solution: 'Check if the model is properly loaded'
      };
    }
    
    if (modelTest && !modelTest.success) {
      return {
        status: 'model-missing',
        message: 'Model not found',
        solution: `Install the model with: ollama pull ${useStore.getState().ollamaConfig.directorModel}`
      };
    }
    
    return {
      status: 'working',
      message: 'Connection working perfectly',
      solution: ''
    };
  }

  return {
    status: 'partial',
    message: 'Partial connection',
    solution: 'Some endpoints are working, others are not'
  };
}
