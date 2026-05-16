import { requireAuth } from "@/lib/auth-utils";
import { IntakeForm } from "@/components/projects/IntakeForm";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function NewProjectPage() {
  await requireAuth(["BUSINESS_USER", "PROGRAM_MANAGER"]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/projects" className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-[#1a1f5e] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-800 text-[#1a1f5e]">New Project Request</h1>
          <p className="text-sm text-gray-500">Submit a new iDemand request for End User Services</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#e2e4f0]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1a1f5e15" }}>
            <FileText size={16} className="text-[#1a1f5e]" />
          </div>
          <div>
            <p className="text-sm font-700 text-[#1a1f5e]">iDemand Intake Form</p>
            <p className="text-xs text-gray-500">KarthikLLC · End User Services</p>
          </div>
        </div>
        <IntakeForm />
      </Card>
    </div>
  );
}
