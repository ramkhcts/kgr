"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isPast } from "date-fns";
import { Plus, Trash2, X } from "lucide-react";

interface UserSkill {
  id: string;
  skillName: string;
  certificationBody: string | null;
  proficiencyLevel: string | null;
  expiryDate: string | null;
  createdAt: string;
}

interface Props {
  userId: string;
  userName: string;
  canEdit: boolean;
}

const PROFICIENCY_COLORS: Record<string, string> = {
  BEGINNER: "bg-gray-100 text-gray-600",
  INTERMEDIATE: "bg-blue-100 text-blue-700",
  ADVANCED: "bg-purple-100 text-purple-700",
  EXPERT: "bg-amber-100 text-amber-700",
};

const PROFICIENCY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
];

export function SkillsPanel({ userId, userName, canEdit }: Props) {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [skillName, setSkillName] = useState("");
  const [certificationBody, setCertificationBody] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/skills`);
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${userId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
          certificationBody: certificationBody || null,
          proficiencyLevel: proficiencyLevel || null,
          expiryDate: expiryDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add skill");
        return;
      }
      setShowForm(false);
      setSkillName(""); setCertificationBody(""); setProficiencyLevel(""); setExpiryDate("");
      fetchSkills();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(skillId: string) {
    const res = await fetch(`/api/users/${userId}/skills/${skillId}`, { method: "DELETE" });
    if (res.ok) {
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-700 text-[#1a1f5e]">Skills &amp; Certifications — {userName}</p>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-600 bg-[#1a1f5e] text-white hover:bg-[#3d2d8e] transition-colors"
          >
            <Plus size={11} />
            Add Skill
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : skills.length === 0 ? (
        <p className="text-xs text-gray-400">No skills recorded.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e2e4f0]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f4f5fb] border-b border-[#e2e4f0]">
                <th className="text-left px-3 py-2 font-600 text-gray-600">Skill</th>
                <th className="text-left px-3 py-2 font-600 text-gray-600 hidden sm:table-cell">Certification Body</th>
                <th className="text-left px-3 py-2 font-600 text-gray-600">Level</th>
                <th className="text-left px-3 py-2 font-600 text-gray-600">Expiry</th>
                {canEdit && <th className="px-2 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => {
                const expired = s.expiryDate ? isPast(new Date(s.expiryDate)) : false;
                return (
                  <tr key={s.id} className="border-b border-[#e2e4f0] last:border-0">
                    <td className="px-3 py-2 font-500 text-gray-800">{s.skillName}</td>
                    <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{s.certificationBody ?? "—"}</td>
                    <td className="px-3 py-2">
                      {s.proficiencyLevel ? (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-600 ${PROFICIENCY_COLORS[s.proficiencyLevel] ?? "bg-gray-100 text-gray-500"}`}>
                          {s.proficiencyLevel.charAt(0) + s.proficiencyLevel.slice(1).toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 ${expired ? "text-red-600 font-600" : "text-gray-500"}`}>
                      {s.expiryDate
                        ? `${format(new Date(s.expiryDate), "MMM d, yyyy")}${expired ? " (Expired)" : ""}`
                        : "—"}
                    </td>
                    {canEdit && (
                      <td className="px-2 py-2">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && canEdit && (
        <div className="rounded-lg border border-[#e2e4f0] bg-[#f4f5fb] p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-700 text-[#1a1f5e]">Add Skill</p>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-600 text-gray-600 mb-0.5">Skill Name *</label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. ITIL, Azure, ServiceNow"
                  className="w-full border border-[#e2e4f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e] bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-600 text-gray-600 mb-0.5">Certification Body</label>
                <input
                  type="text"
                  value={certificationBody}
                  onChange={(e) => setCertificationBody(e.target.value)}
                  placeholder="e.g. AXELOS, Microsoft"
                  className="w-full border border-[#e2e4f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e] bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-600 text-gray-600 mb-0.5">Proficiency Level</label>
                <select
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  className="w-full border border-[#e2e4f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e] bg-white"
                >
                  {PROFICIENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-600 text-gray-600 mb-0.5">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border border-[#e2e4f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e] bg-white"
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs border border-[#e2e4f0] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1.5 rounded-lg text-xs font-600 bg-[#1a1f5e] text-white hover:bg-[#3d2d8e] disabled:opacity-50 transition-colors"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
