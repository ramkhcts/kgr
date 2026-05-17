"use client";
import { useState } from "react";
import { Sparkles, Power, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";

interface AISettingsCardProps {
  apiKeyConfigured: boolean;
  aiEnabled: boolean;
}

export function AISettingsCard({ apiKeyConfigured, aiEnabled: initialEnabled }: AISettingsCardProps) {
  const [aiEnabled, setAiEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isActive = apiKeyConfigured && aiEnabled;

  async function toggle() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled: !aiEnabled }),
      });
      if (res.ok) {
        setAiEnabled((prev) => !prev);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #1a1f5e08, #3d2d8e0a)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1a1f5e]/10 flex items-center justify-center">
            <Sparkles size={18} className="text-[#3d2d8e]" />
          </div>
          <div>
            <p className="text-sm font-700 text-[#1a1f5e]">Agentic AI</p>
            <p className="text-xs text-gray-500">Claude-powered insights, SOW drafting &amp; description enhancement</p>
          </div>
        </div>

        {/* Status pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600 ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">

        {/* API Key status */}
        <div className="flex items-center justify-between py-3 border-b border-[#e2e4f0]">
          <div className="flex items-center gap-2.5">
            <KeyRound size={15} className={apiKeyConfigured ? "text-green-600" : "text-gray-400"} />
            <div>
              <p className="text-sm font-600 text-gray-800">Anthropic API Key</p>
              <p className="text-xs text-gray-500">
                {apiKeyConfigured
                  ? "ANTHROPIC_API_KEY is configured in environment"
                  : "Not set — add ANTHROPIC_API_KEY to .env.local on the server"}
              </p>
            </div>
          </div>
          {apiKeyConfigured ? (
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          )}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-600 text-gray-800">AI Features</p>
            <p className="text-xs text-gray-500">
              {aiEnabled
                ? "AI insights, SOW drafter and description enhancer are enabled"
                : "All AI features are disabled for all users"}
            </p>
          </div>

          <button
            onClick={toggle}
            disabled={saving || !apiKeyConfigured}
            title={!apiKeyConfigured ? "API key must be configured first" : undefined}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              aiEnabled && apiKeyConfigured ? "bg-[#1a1f5e]" : "bg-gray-300"
            } ${saving ? "opacity-60 cursor-wait" : !apiKeyConfigured ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                aiEnabled && apiKeyConfigured ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* What AI does */}
        <div className="rounded-xl bg-[#f4f5fb] p-3 space-y-2">
          <p className="text-[10px] font-700 text-[#1a1f5e] uppercase tracking-wide">AI-Powered Features</p>
          {[
            { icon: "🔍", label: "AI Insights Panel", desc: "Stage + role-aware recommendations on every project" },
            { icon: "📄", label: "SOW Drafter", desc: "Generates structured SOW drafts from project requirements" },
            { icon: "✨", label: "Description Enhancer", desc: "Professionalises project descriptions on intake" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <div>
                <p className="text-xs font-600 text-gray-700">{label}</p>
                <p className="text-[10px] text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Saved confirmation */}
        {saved && (
          <div className="flex items-center gap-2 text-green-700 text-xs font-600">
            <Power size={13} />
            AI features {aiEnabled ? "enabled" : "disabled"} successfully
          </div>
        )}

        {!apiKeyConfigured && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              To activate AI, add your key from{" "}
              <span className="font-600">console.anthropic.com</span>
              {" "}to <span className="font-mono font-600">.env.local</span> as{" "}
              <span className="font-mono font-600">ANTHROPIC_API_KEY=sk-ant-...</span>
              , then restart the server.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
