"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KGRLogo } from "@/components/layout/KGRLogo";
import { KarthikLLCLogo } from "@/components/layout/KarthikLLCLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No reset token found. Please use the link from your email.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-semibold text-[#1a1f5e] mb-2">Set your new password</p>

      {success ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 size={40} className="text-green-500" />
          <p className="text-center text-sm text-gray-700 font-semibold">
            Password updated. Redirecting to login…
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!token}>
            Update Password
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-[#1a1f5e] hover:underline">
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
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
          <h1 className="text-white font-bold text-2xl">Reset Password</h1>
          <p className="text-white/60 text-sm mt-1">Create a new password for your account</p>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#f4f5fb] border-t border-[#e2e4f0]">
          <p className="text-center text-xs text-gray-500">
            KGR End User Services · Powered by iDemand v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
