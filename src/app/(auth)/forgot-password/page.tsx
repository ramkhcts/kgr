"use client";
import { useState } from "react";
import Link from "next/link";
import { KGRLogo } from "@/components/layout/KGRLogo";
import { KarthikLLCLogo } from "@/components/layout/KarthikLLCLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-white font-bold text-2xl">Forgot Password</h1>
          <p className="text-white/60 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={40} className="text-green-500" />
              <p className="text-center text-sm text-gray-700 font-semibold">
                If that email exists, you&apos;ll receive a reset link shortly.
              </p>
              <p className="text-center text-xs text-gray-500">
                Check your inbox (and spam folder).
              </p>
              <Link href="/login" className="text-sm font-semibold text-[#1a1f5e] hover:underline mt-2">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-semibold text-[#1a1f5e] mb-2">Reset your password</p>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@karthikllc.com"
                required
                autoComplete="email"
              />

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send Reset Link
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-[#1a1f5e] hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
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
