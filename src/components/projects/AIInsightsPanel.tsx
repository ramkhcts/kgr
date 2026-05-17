"use client";
import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, ArrowRight, Lightbulb } from "lucide-react";

interface AIInsights {
  enabled: boolean;
  summary?: string;
  recommendations?: string[];
  risks?: string[];
  nextSteps?: string[];
  error?: string;
}

export function AIInsightsPanel({
  projectId,
  userRole,
  projectStatus,
}: {
  projectId: string;
  userRole: string;
  projectStatus: string;
}) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/insights?projectId=${projectId}`);
      const data = await res.json();
      setInsights(data);
      setLoaded(true);
    } catch {
      setInsights({ enabled: false, error: "Failed to fetch insights" });
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ background: "linear-gradient(135deg, #1a1f5e0a, #3d2d8e0a)" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1a1f5e]/10 flex items-center justify-center">
            <Sparkles size={14} className="text-[#3d2d8e]" />
          </div>
          <div>
            <p className="text-xs font-700 text-[#1a1f5e]">AI Insights</p>
            <p className="text-[10px] text-gray-400">Stage-aware recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {loaded && !loading && insights?.enabled && (
            <button
              onClick={(e) => { e.stopPropagation(); fetchInsights(); }}
              className="p-1.5 rounded-lg hover:bg-[#1a1f5e]/10 text-gray-400 hover:text-[#1a1f5e] transition-colors"
              title="Refresh insights"
            >
              <RefreshCw size={12} />
            </button>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          {/* Loading state */}
          {loading && (
            <div className="space-y-2.5 animate-pulse">
              {[80, 100, 70, 90].map((w, i) => (
                <div key={i} className={`h-3 bg-gray-100 rounded-full`} style={{ width: `${w}%` }} />
              ))}
            </div>
          )}

          {/* Not enabled */}
          {!loading && insights && !insights.enabled && (
            <div className="text-center py-4 space-y-2">
              <Sparkles size={24} className="text-gray-300 mx-auto" />
              <p className="text-xs text-gray-400 font-500">AI Insights not configured</p>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Add your <span className="font-600 text-gray-400">ANTHROPIC_API_KEY</span> to enable stage-aware project recommendations.
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && insights?.error && insights.enabled && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
              <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{insights.error}</p>
            </div>
          )}

          {/* Insights */}
          {!loading && insights?.enabled && insights.summary && (
            <>
              {/* Summary */}
              <div className="rounded-xl bg-[#f4f5fb] p-3">
                <p className="text-[11px] text-gray-600 leading-relaxed">{insights.summary}</p>
              </div>

              {/* Next Steps */}
              {insights.nextSteps && insights.nextSteps.length > 0 && (
                <div>
                  <p className="text-[10px] font-700 text-[#1a1f5e] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Next Steps
                  </p>
                  <div className="space-y-1.5">
                    {insights.nextSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ArrowRight size={11} className="text-[#1a1f5e] flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-700 leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {insights.recommendations && insights.recommendations.length > 0 && (
                <div>
                  <p className="text-[10px] font-700 text-[#3d2d8e] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Lightbulb size={10} />
                    Recommendations
                  </p>
                  <div className="space-y-1.5">
                    {insights.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3d2d8e] flex-shrink-0 mt-1.5" />
                        <p className="text-[11px] text-gray-700 leading-snug">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {insights.risks && insights.risks.length > 0 && (
                <div>
                  <p className="text-[10px] font-700 text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Risks to Watch
                  </p>
                  <div className="space-y-1.5">
                    {insights.risks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                        <p className="text-[11px] text-gray-700 leading-snug">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-300 text-right">
                Generated by Claude · {projectStatus.replace(/_/g, " ")} stage
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
