"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

interface Skill {
  id: string;
  skillName: string;
  certificationBody: string | null;
  proficiencyLevel: string | null;
  expiryDate: string | null;
}

const PROFICIENCY_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

const PROFICIENCY_COLORS: Record<string, string> = {
  BEGINNER: "bg-gray-100 text-gray-600",
  INTERMEDIATE: "bg-blue-100 text-blue-700",
  ADVANCED: "bg-purple-100 text-purple-700",
  EXPERT: "bg-amber-100 text-amber-700",
};

export function SkillsCard() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add form state
  const [form, setForm] = useState({
    skillName: "",
    certificationBody: "",
    proficiencyLevel: "",
    expiryDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      } else {
        setError("Failed to load skills");
      }
    } catch {
      setError("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.skillName.trim()) {
      setFormError("Skill name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName: form.skillName,
          certificationBody: form.certificationBody || null,
          proficiencyLevel: form.proficiencyLevel || null,
          expiryDate: form.expiryDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to add skill");
        return;
      }
      setForm({ skillName: "", certificationBody: "", proficiencyLevel: "", expiryDate: "" });
      fetchSkills();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSkills((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-[#e2e4f0] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e2e4f0]">
        <h2 className="text-base font-700 text-[#1a1f5e]">Skills &amp; Certifications</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage your professional skills and certifications</p>
      </div>

      <div className="p-6 space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Skills table */}
        {loading ? (
          <p className="text-sm text-gray-400 py-2">Loading skills...</p>
        ) : skills.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No skills added yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e2e4f0]">
            <table className="w-full text-sm">
              <thead className="bg-[#f4f5fb]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Skill</th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden sm:table-cell">Certification Body</th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Proficiency</th>
                  <th className="text-left px-4 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden md:table-cell">Expiry</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {skills.map((skill, i) => (
                  <tr key={skill.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                    <td className="px-4 py-3 font-600 text-[#1a1f5e]">{skill.skillName}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{skill.certificationBody ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      {skill.proficiencyLevel ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 uppercase ${PROFICIENCY_COLORS[skill.proficiencyLevel] ?? "bg-gray-100 text-gray-500"}`}>
                          {skill.proficiencyLevel}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {skill.expiryDate ? format(new Date(skill.expiryDate), "MMM d, yyyy") : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove skill"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add skill form */}
        <div className="border-t border-[#e2e4f0] pt-4">
          <p className="text-xs font-700 text-gray-600 mb-3 flex items-center gap-1.5">
            <Plus size={13} />
            Add Skill
          </p>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Skill Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.skillName}
                onChange={(e) => setForm((f) => ({ ...f, skillName: e.target.value }))}
                className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]"
                placeholder="e.g. ITIL v4"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Certification Body</label>
              <input
                type="text"
                value={form.certificationBody}
                onChange={(e) => setForm((f) => ({ ...f, certificationBody: e.target.value }))}
                className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]"
                placeholder="e.g. AXELOS"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Proficiency</label>
              <select
                value={form.proficiencyLevel}
                onChange={(e) => setForm((f) => ({ ...f, proficiencyLevel: e.target.value }))}
                className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e] bg-white"
              >
                <option value="">Select level</option>
                {PROFICIENCY_LEVELS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]"
              />
            </div>
            {formError && (
              <p className="text-xs text-red-600 sm:col-span-2 lg:col-span-4">{formError}</p>
            )}
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-600 bg-[#1a1f5e] text-white hover:bg-[#3d2d8e] disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} />
                {submitting ? "Adding..." : "Add Skill"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
