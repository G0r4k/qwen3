import React from 'react';
import { useStore } from '../store';
import { CheckCircle, XCircle, Loader2, Clock, Check, AlertCircle, Wrench } from 'lucide-react';

export default function ExecutionPlanView() {
  const { currentPlan } = useStore();

  if (!currentPlan) {
    return (
      <div className="h-full flex items-center justify-center text-[#666] text-[12px]">
        No active plan
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="text-[#888]" />;
      case 'in_progress':
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'verified':
        return <Check size={14} className="text-green-400" />;
      case 'failed':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <Clock size={14} className="text-[#888]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-[#333] bg-[#252526]';
      case 'in_progress':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'verified':
        return 'border-green-500/50 bg-green-500/10';
      case 'failed':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-[#333] bg-[#252526]';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#333] bg-[#252526]">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle size={14} className="text-purple-400" />
          <span className="text-[13px] font-medium text-[#cccccc]">Execution Plan</span>
        </div>
        <div className="text-[11px] text-[#888]">
          {currentPlan.goal}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] px-2 py-0.5 rounded ${
            currentPlan.status === 'planning' ? 'bg-purple-500/20 text-purple-300' :
            currentPlan.status === 'executing' ? 'bg-blue-500/20 text-blue-300' :
            currentPlan.status === 'verifying' ? 'bg-yellow-500/20 text-yellow-300' :
            currentPlan.status === 'completed' ? 'bg-green-500/20 text-green-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {currentPlan.status.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#666]">
            {currentPlan.steps.filter(s => s.status === 'verified').length}/{currentPlan.steps.length} verified
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {currentPlan.steps.map((step, idx) => (
          <div key={step.id} className={`rounded-lg border p-3 ${getStatusColor(step.status)}`}>
            <div className="flex items-start gap-2">
              {getStatusIcon(step.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-[#ccc]">
                    Step {idx + 1}: {step.title}
                  </span>
                </div>
                <div className="text-[10px] text-[#888] mb-2">
                  {step.description}
                </div>

                {/* Tools used */}
                {step.toolsUsed && step.toolsUsed.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-[9px] text-[#007acc] cursor-pointer hover:text-[#0098ff] flex items-center gap-1">
                      <Wrench size={9} />
                      {step.toolsUsed.length} tool{step.toolsUsed.length > 1 ? 's' : ''} used
                    </summary>
                    <div className="mt-1 space-y-1">
                      {step.toolsUsed.map((tool, tIdx) => (
                        <div key={tIdx} className="text-[9px] text-[#666] bg-[#1e1e1e] rounded p-1.5">
                          <span className={tool.success ? 'text-green-400' : 'text-red-400'}>
                            {tool.success ? '✓' : '✗'}
                          </span>
                          {' '}{tool.tool}({JSON.stringify(tool.parameters)})
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Verification result */}
                {step.verificationResult && (
                  <div className={`mt-2 text-[9px] p-1.5 rounded ${
                    step.verificationResult.passed 
                      ? 'bg-green-500/10 text-green-300' 
                      : 'bg-red-500/10 text-red-300'
                  }`}>
                    <span className="font-medium">
                      {step.verificationResult.passed ? '✓ Verified' : '✗ Failed'}:
                    </span>
                    {' '}{step.verificationResult.feedback}
                  </div>
                )}

                {/* Developer response */}
                {step.developerResponse && (
                  <details className="mt-2">
                    <summary className="text-[9px] text-[#888] cursor-pointer hover:text-[#ccc]">
                      Developer summary
                    </summary>
                    <div className="mt-1 text-[9px] text-[#666] bg-[#1e1e1e] rounded p-1.5">
                      {step.developerResponse}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
