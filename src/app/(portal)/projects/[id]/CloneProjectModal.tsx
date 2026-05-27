"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Copy } from "lucide-react";

interface Props {
  projectId: string;
  projectName: string;
  defaultName: string;
}

export function CloneProjectModal({ projectId, projectName, defaultName }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState(defaultName);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copyResources, setCopyResources] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setNewName(defaultName);
    setStartDate("");
    setEndDate("");
    setCopyResources(true);
    setError("");
    setShowModal(true);
  }

  async function handleClone() {
    if (!startDate || !endDate) {
      setError("Start date and end date are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: newName.trim(),
          anticipatedStartDate: startDate,
          anticipatedEndDate: endDate,
          copyResources,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowModal(false);
        router.push(`/projects/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error ?? "Clone failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={openModal}>
        <Copy size={13} />
        Clone
      </Button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Clone "${projectName}"`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Creates a new project with the same scope and details, reset to SUBMITTED status.
          </p>

          <Input
            label="Project Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New project name"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#1a1f5e] mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={copyResources}
              onChange={(e) => setCopyResources(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Copy resource roles &amp; rates</span>
          </label>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={loading} disabled={!startDate || !endDate} onClick={handleClone}>
              <Copy size={13} />
              Clone Project
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
