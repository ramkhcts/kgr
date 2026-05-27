import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ResourceAssignmentPanel } from "./ResourceAssignmentPanel";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ResourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(["PMO_LEAD", "PMO_TEAM"]);
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assignedResource: { select: { id: true, name: true } },
      resources: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) notFound();

  const team = await prisma.user.findMany({
    where: { role: { in: ["PMO_TEAM", "PMO_LEAD"] } },
    select: { id: true, name: true, email: true, role: true, specialization: true },
    orderBy: { name: "asc" },
  });

  // Fetch rate cards for the project's scope and region
  const rateCards = await prisma.rateCard.findMany({
    where: {
      serviceType: project.scopeOfWork,
      region: project.region,
      isActive: true,
    },
    select: { id: true, roleName: true, dailyRate: true, currency: true },
    orderBy: { roleName: "asc" },
  });

  // Serialize dates for client components
  const serializedResources = project.resources.map((r) => ({
    ...r,
    startDate: r.startDate ? r.startDate.toISOString() : null,
    endDate: r.endDate ? r.endDate.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`} className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-800 text-[#1a1f5e]">Resource Assignment</h1>
          <p className="text-sm text-gray-500">{project.projectName}</p>
        </div>
      </div>

      <Card>
        <ResourceAssignmentPanel
          projectId={id}
          projectStatus={project.status}
          userRole={user.role}
          team={team}
          initialResources={serializedResources}
          rateCards={rateCards}
        />
      </Card>
    </div>
  );
}
