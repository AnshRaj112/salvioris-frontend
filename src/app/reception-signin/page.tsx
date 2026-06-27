"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { receptionApi } from "../lib/api/reception";
import { storeReceptionistAuth } from "../lib/auth/receptionist";

export default function ReceptionSigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, go straight to dashboard
    const stored = localStorage.getItem("receptionist");
    const cookie = document.cookie.includes("receptionist_session=1");
    if (stored && cookie) {
      router.replace("/reception-dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await receptionApi.signin(email.trim().toLowerCase(), password);
      if (!data.success) {
        setError(data.message || data.error || "Login failed");
        return;
      }
      storeReceptionistAuth(data.receptionist, data.access_token, data.refresh_token);
      const redirect = searchParams.get("redirect") || "/reception-dashboard";
      router.replace(redirect);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          background: #0a0a0f;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        /* Ambient gradient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.18;
        }
        .orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, #6366f1 0%, transparent 70%);
          top: -120px; left: -120px;
        }
        .orb-2 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          bottom: -100px; right: -100px;
        }
        .orb-3 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, #c4b5fd 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
        }

        .card {
          position: relative;
          z-index: 10;
          background: rgba(15, 15, 25, 0.85);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 24px;
          padding: 48px 44px;
          width: 100%;
          max-width: 460px;
          backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(99, 102, 241, 0.08),
            0 32px 80px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
        }

        .brand-icon {
          width: 46px; height: 46px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 4px 24px rgba(99,102,241,0.4);
        }

        .brand-text { display: flex; flex-direction: column; gap: 2px; }
        .brand-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: -0.3px;
        }
        .brand-tag {
          font-size: 11px;
          font-weight: 500;
          color: #818cf8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.25);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
          width: fit-content;
        }

        .title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          line-height: 1.2;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 36px;
          line-height: 1.5;
        }

        .field { margin-bottom: 20px; }
        .label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 15px;
          color: #e2e8f0;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .input::placeholder { color: #475569; }

        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -0.2px;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
          margin-top: 8px;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.5);
        }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .footer-note {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
        }

        .dots {
          display: inline-flex;
          gap: 4px;
          align-items: center;
          vertical-align: middle;
        }
        .dot {
          width: 6px; height: 6px;
          background: #fff;
          border-radius: 50%;
          animation: bounce 0.9s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Floating entrance */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card { animation: fadeUp 0.5s ease-out both; }
      `}</style>

      <div className="page">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        <div className="card">
          <div className="brand">
            <div className="brand-icon">🏥</div>
            <div className="brand-text">
              <span className="brand-name">SERENIFY</span>
              <span className="brand-tag">Reception Desk</span>
            </div>
          </div>

          <h1 className="title">Welcome back</h1>
          <p className="subtitle">Sign in to your reception portal to manage walk-ins, billing &amp; appointments.</p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-box">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="rec-email">Email address</label>
              <input
                id="rec-email"
                className="input"
                type="email"
                placeholder="receptionist@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="rec-password">Password</label>
              <input
                id="rec-password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button id="rec-signin-btn" className="btn" type="submit" disabled={loading}>
              {loading ? (
                <><span className="dots"><span className="dot" /><span className="dot" /><span className="dot" /></span> Signing in…</>
              ) : "Sign in to Reception Portal"}
            </button>
          </form>

          <p className="footer-note">
            Your credentials were set by your therapist.<br />
            Contact them if you need access or have login issues.
          </p>
        </div>
      </div>
    </>
  );
}
