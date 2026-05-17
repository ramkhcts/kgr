"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  CLIENT:      "#6366f1",
  PMO_LEAD:    "#1a1f5e",
  PMO_TEAM:    "#3d2d8e",
  SUPER_ADMIN: "#b91c1c",
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT:      "Client",
  PMO_LEAD:    "PMO Lead",
  PMO_TEAM:    "PMO Team",
  SUPER_ADMIN: "Super Admin",
};

const SPECIALIZATION_LABELS: Record<string, string> = {
  SOLUTIONING: "Solutioning",
  DELIVERY:    "Delivery",
  COMMERCIAL:  "Commercial",
  GENERAL:     "General",
};

const SPECIALIZATION_COLORS: Record<string, string> = {
  SOLUTIONING: "#7c3aed",
  DELIVERY:    "#0369a1",
  COMMERCIAL:  "#15803d",
  GENERAL:     "#6b7280",
};

const ROLE_OPTIONS = [
  { value: "CLIENT",      label: "Client" },
  { value: "PMO_TEAM",    label: "PMO Team" },
  { value: "PMO_LEAD",    label: "PMO Lead" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const SPEC_OPTIONS = [
  { value: "GENERAL",     label: "General" },
  { value: "SOLUTIONING", label: "Solutioning" },
  { value: "DELIVERY",    label: "Delivery" },
  { value: "COMMERCIAL",  label: "Commercial" },
];

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  specialization: string | null;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  specialization: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "CLIENT",
  specialization: "GENERAL",
};

export function UserManagementTable({
  users: initialUsers,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  const [showAdd, setShowAdd]         = useState(false);
  const [editUser, setEditUser]       = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser]   = useState<UserRow | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [showPw, setShowPw]           = useState(false);

  function openAdd() {
    setForm(EMPTY_FORM);
    setError("");
    setShowPw(false);
    setShowAdd(true);
  }

  function openEdit(u: UserRow) {
    setForm({
      name:           u.name,
      email:          u.email,
      password:       "",
      role:           u.role,
      specialization: u.specialization ?? "GENERAL",
    });
    setError("");
    setShowPw(false);
    setEditUser(u);
  }

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Name, email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create user"); return; }
      setUsers((prev) => [...prev, { ...data, createdAt: data.createdAt }]);
      setShowAdd(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editUser) return;
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body: Partial<FormState> = { ...form };
      if (!body.password) delete body.password; // don't send empty password
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update user"); return; }
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...data } : u));
      setEditUser(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
        setDeleteUser(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
            User Management · {users.length} users
          </p>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />
            Add User
          </Button>
        </div>

        <div className="rounded-2xl border border-[#e2e4f0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f4f5fb]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden md:table-cell">Specialization</th>
                <th className="text-left px-5 py-3 text-xs font-700 text-[#1a1f5e] uppercase tracking-wide hidden lg:table-cell">Member Since</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-t border-[#e2e4f0] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-700 flex-shrink-0"
                        style={{ backgroundColor: ROLE_COLORS[u.role] ?? "#6b7280" }}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-600 text-[#1a1f5e]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600"
                      style={{
                        backgroundColor: (ROLE_COLORS[u.role] ?? "#6b7280") + "18",
                        color: ROLE_COLORS[u.role] ?? "#6b7280",
                      }}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {u.role === "PMO_TEAM" && u.specialization ? (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600"
                        style={{
                          backgroundColor: (SPECIALIZATION_COLORS[u.specialization] ?? "#6b7280") + "18",
                          color: SPECIALIZATION_COLORS[u.specialization] ?? "#6b7280",
                        }}
                      >
                        {SPECIALIZATION_LABELS[u.specialization] ?? u.specialization}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-[#1a1f5e]/10 text-[#1a1f5e] transition-colors"
                        title="Edit user"
                      >
                        <Pencil size={13} />
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────── */}
      <Modal
        open={showAdd || !!editUser}
        onClose={() => { setShowAdd(false); setEditUser(null); setError(""); }}
        title={showAdd ? "Add New User" : `Edit — ${editUser?.name}`}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full Name *"
              placeholder="e.g. Jane Smith"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />
            <Input
              label="Email *"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Input
              label={showAdd ? "Password *" : "New Password (leave blank to keep current)"}
              type={showPw ? "text" : "password"}
              placeholder={showAdd ? "Min 8 characters" : "Leave blank to keep unchanged"}
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Role *"
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={(e) => updateForm("role", e.target.value)}
            />
            {form.role === "PMO_TEAM" && (
              <Select
                label="Specialization"
                options={SPEC_OPTIONS}
                value={form.specialization}
                onChange={(e) => updateForm("specialization", e.target.value)}
              />
            )}
          </div>

          {/* Role hint */}
          <div className="rounded-xl bg-[#f4f5fb] px-3 py-2.5 text-xs text-gray-500 leading-relaxed">
            {form.role === "CLIENT" && "Can submit requests and track their own projects. Linked to KarthikLLC."}
            {form.role === "PMO_TEAM" && "Can work on solutioning, draft SOWs, and manage project delivery tasks."}
            {form.role === "PMO_LEAD" && "Full project management access — review, approve, assign resources, close projects."}
            {form.role === "SUPER_ADMIN" && "Full system access including user management, AI settings, and all projects."}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditUser(null); }}>
              Cancel
            </Button>
            <Button loading={loading} onClick={showAdd ? handleAdd : handleEdit}>
              {showAdd ? "Create User" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ─────────────────────────── */}
      <Modal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-600 text-red-700">{deleteUser?.name}</p>
              <p className="text-xs text-red-600 mt-0.5">{deleteUser?.email} · {ROLE_LABELS[deleteUser?.role ?? ""] ?? deleteUser?.role}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            This user will be permanently removed. Their submitted projects and comments will remain but will show as unlinked.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="danger" loading={loading} onClick={handleDelete}>
              <Trash2 size={13} />
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
