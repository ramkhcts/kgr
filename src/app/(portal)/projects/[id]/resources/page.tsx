import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ResourceAssignment } from "./ResourceAssignment";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ResourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(["PMO_LEAD", "PMO_TEAM"]);
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { assignedResource: { select: { id: true, name: true } } },
  });
  if (!project) notFound();

  const kgrTeam = await prisma.user.findMany({
    where: { role: { in: ["PMO_TEAM", "PMO_LEAD"] } },
    select: { id: true, name: true, email: true, role: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`} className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-800 text-[#1a1f5e]">Assign Resource</h1>
          <p className="text-sm text-gray-500">{project.projectName}</p>
        </div>
      </div>

      <Card>
        <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide mb-4">KGR Team Members</p>
        <ResourceAssignment
          projectId={id}
          currentResourceId={project.assignedResourceId}
          team={kgrTeam}
          projectStatus={project.status}
        />
      </Card>
    </div>
  );
}
