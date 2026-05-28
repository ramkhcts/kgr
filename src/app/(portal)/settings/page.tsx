import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./ProfileForm";
import { AppearanceCard } from "./AppearanceCard";
import { FormBuilder } from "./FormBuilder";
import { SkillsCard } from "./SkillsCard";

export default async function SettingsPage() {
  const sessionUser = await requireAuth();

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!dbUser) return null;

  let formFields = null;
  if (dbUser.role === "SUPER_ADMIN") {
    formFields = await prisma.formField.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-700 text-[#1a1f5e]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Section A: Profile */}
      <section className="bg-white rounded-2xl border border-[#e2e4f0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e4f0]">
          <h2 className="text-base font-700 text-[#1a1f5e]">Profile</h2>
          <p className="text-xs text-gray-500 mt-0.5">Update your name, email, and password</p>
        </div>
        <div className="p-6">
          <ProfileForm user={dbUser} />
        </div>
      </section>

      {/* Section B: Appearance */}
      <section className="bg-white rounded-2xl border border-[#e2e4f0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e4f0]">
          <h2 className="text-base font-700 text-[#1a1f5e]">Appearance</h2>
          <p className="text-xs text-gray-500 mt-0.5">Choose your preferred theme</p>
        </div>
        <div className="p-6">
          <AppearanceCard />
        </div>
      </section>

      {/* Section C: Skills & Certifications (PMO roles only) */}
      {["PMO_TEAM", "PMO_LEAD", "SUPER_ADMIN"].includes(dbUser.role) && (
        <SkillsCard />
      )}

      {/* Section D: Form Builder (SUPER_ADMIN only) */}
      {dbUser.role === "SUPER_ADMIN" && formFields && (
        <section className="bg-white rounded-2xl border border-[#e2e4f0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2e4f0]">
            <h2 className="text-base font-700 text-[#1a1f5e]">Form Builder</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage intake form fields — add, edit, reorder, or disable fields
            </p>
          </div>
          <div className="p-6">
            <FormBuilder initialFields={formFields} />
          </div>
        </section>
      )}
    </div>
  );
}
