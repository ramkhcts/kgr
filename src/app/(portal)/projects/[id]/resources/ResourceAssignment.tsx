"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, User } from "lucide-react";

type TeamMember = { id: string; name: string; email: string; role: string };

export function ResourceAssignment({ projectId, currentResourceId, team, projectStatus }: {
  projectId: string;
  currentResourceId: string | null;
  team: TeamMember[];
  projectStatus: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentResourceId ?? "");
  const [loading, setLoading] = useState(false);

  const roleLabel: Record<string, string> = {
    PMO_TEAM: "PMO Team",
    PMO_LEAD: "PMO Lead",
  };

  async function assign() {
    if (!selected) return;
    setLoading(true);
    try {
      // Assign resource
      await fetch(`/api/projects/${projectId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceUserId: selected }),
      });
      // Advance status
      if (projectStatus === "PO_RECEIVED") {
        await fetch(`/api/projects/${projectId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toStatus: "RESOURCE_ASSIGNED", assignedResourceId: selected }),
        });
      }
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {team.map((member) => (
          <label key={member.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected === member.id ? "border-[#1a1f5e] bg-[#1a1f5e08]" : "border-[#e2e4f0] hover:border-[#1a1f5e]/40"}`}>
            <input
              type="radio"
              name="resource"
              value={member.id}
              checked={selected === member.id}
              onChange={() => setSelected(member.id)}
              className="sr-only"
            />
            <div className="w-9 h-9 rounded-full bg-[#1a1f5e]/10 flex items-center justify-center text-[#1a1f5e] font-700 text-sm flex-shrink-0">
              {member.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 text-[#1a1f5e]">{member.name}</p>
              <p className="text-xs text-gray-500">{member.email} · {roleLabel[member.role] ?? member.role}</p>
            </div>
            {selected === member.id && <CheckCircle2 size={18} className="text-[#1a1f5e] flex-shrink-0" />}
          </label>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button loading={loading} disabled={!selected} onClick={assign}>
          <User size={14} />
          Assign & Advance
        </Button>
      </div>
    </div>
  );
}
