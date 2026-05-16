import { LoginForm } from "./LoginForm";
import { KGRLogo } from "@/components/layout/KGRLogo";
import { KarthikLLCLogo } from "@/components/layout/KarthikLLCLogo";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header band */}
        <div className="px-8 py-6" style={{ background: "linear-gradient(135deg, #1a1f5e 0%, #3d2d8e 100%)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <KGRLogo size={44} />
              <div>
                <p className="text-[#d4a017] font-bold text-xl leading-tight">KGR</p>
                <p className="text-white/60 text-xs leading-tight">End User Services</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <KarthikLLCLogo size={36} />
              <div>
                <p className="text-white font-semibold text-sm leading-tight">KarthikLLC</p>
                <p className="text-white/50 text-[10px] leading-tight">Customer Portal</p>
              </div>
            </div>
          </div>
          <h1 className="text-white font-bold text-2xl">iDemand Portal</h1>
          <p className="text-white/60 text-sm mt-1">Project Intake & Fulfillment — End User Services</p>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#f4f5fb] border-t border-[#e2e4f0]">
          <p className="text-center text-xs text-gray-500">
            KGR End User Services · Powered by iDemand v1.0
          </p>
          <p className="text-center text-[10px] text-gray-400 mt-1">
            Demo credentials: alice@kgr.com / kgr2024!
          </p>
        </div>
      </div>
    </div>
  );
}
