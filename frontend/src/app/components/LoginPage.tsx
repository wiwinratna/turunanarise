import { useState } from "react";
import { motion } from "motion/react";
import { useApp } from "./AppContext";
import { Eye, EyeOff, Layers, ArrowRight, Mail, Lock } from "lucide-react";
import { apiLogin } from "../api";
import { toast } from "sonner";

const R = 6;

export function LoginPage() {
  const { setPage, setIsLoggedIn, setCurrentUser, setActiveEventId } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await apiLogin({ email, password });
      setCurrentUser(user);
      if (user.role === "admin" && user.eventId) {
        const firstEventId = Array.isArray(user.eventId) ? user.eventId[0] : user.eventId;
        if (firstEventId) setActiveEventId(firstEventId);
      }
      setIsLoggedIn(true);
      setPage("dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, padding: "12px 14px", color: "#f0f0fa", fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "all 0.2s ease",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", background: "#050509" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ background: "#0a0a10" }}>
        {/* Subtle mesh gradient background */}
        <div className="absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(circle at 15% 50%, rgba(124, 92, 252, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 25%)",
            filter: "blur(60px)"
          }} />

        <div className="relative z-10 flex flex-col h-full" style={{ padding: "48px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "auto" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #7c5cfc, #5a3dcc)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(124, 92, 252, 0.3)" }}>
              <Layers size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>Arise 2</span>
          </div>

          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
            {/* Blue Ring */}
            <motion.div
              style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", border: "2px solid #3b82f6", opacity: 0.35, boxShadow: "0 0 60px rgba(59, 130, 246, 0.2), inset 0 0 30px rgba(59, 130, 246, 0.2)" }}
              animate={{ y: [0, -60, 0], x: [0, 40, 0], rotate: [0, 90, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              initial={{ top: "5%", left: "5%" }}
            />
            {/* Yellow Ring */}
            <motion.div
              style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", border: "2px solid #facc15", opacity: 0.3, boxShadow: "0 0 60px rgba(250, 204, 21, 0.2), inset 0 0 30px rgba(250, 204, 21, 0.2)" }}
              animate={{ y: [0, 80, 0], x: [0, -60, 0], rotate: [0, -60, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
              initial={{ top: "60%", left: "75%" }}
            />
            {/* White/Silver Ring */}
            <motion.div
              style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", border: "2px solid #f3f4f6", opacity: 0.25, boxShadow: "0 0 40px rgba(243, 244, 246, 0.15), inset 0 0 20px rgba(243, 244, 246, 0.15)" }}
              animate={{ y: [0, -40, 0], x: [0, 50, 0], rotate: [0, 120, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 4 }}
              initial={{ top: "75%", left: "10%" }}
            />
            {/* Green Ring */}
            <motion.div
              style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", border: "2px solid #22c55e", opacity: 0.3, boxShadow: "0 0 60px rgba(34, 197, 94, 0.2), inset 0 0 30px rgba(34, 197, 94, 0.2)" }}
              animate={{ y: [0, 50, 0], x: [0, -80, 0], rotate: [0, -90, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
              initial={{ top: "10%", left: "65%" }}
            />
            {/* Red Ring */}
            <motion.div
              style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: "2px solid #ef4444", opacity: 0.35, boxShadow: "0 0 60px rgba(239, 68, 68, 0.2), inset 0 0 30px rgba(239, 68, 68, 0.2)" }}
              animate={{ y: [0, -70, 0], x: [0, -40, 0], rotate: [0, 180, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear", delay: 3 }}
              initial={{ top: "45%", left: "40%" }}
            />
          </div>

          <div style={{ marginBottom: "auto", paddingTop: "10vh", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 56, fontWeight: 300, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24 }}>
              Design<br />
              <span style={{ fontWeight: 600, background: "linear-gradient(90deg, #a78bfa, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>without limits.</span>
            </h2>
            <p style={{ color: "#8b8b9f", fontSize: 16, lineHeight: 1.6, maxWidth: 320, fontWeight: 400 }}>
              The modern workspace for premium digital card creation.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div style={{ flex: "0 0 auto", width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 48px", background: "#050509" }}>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} style={{ width: "100%", maxWidth: 360 }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div style={{ width: 30, height: 30, borderRadius: R, background: "#7c5cfc", display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={14} color="#fff" /></div>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: "#f0f0fa" }}>Arise 2</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: "#8b8b9f", margin: 0, fontWeight: 400 }}>
              Sign in to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#8b8b9f", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>EMAIL ADDRESS</label>
              <div style={{ position: "relative" }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  style={inputStyle} placeholder="name@company.com" />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#8b8b9f", letterSpacing: "0.05em", display: "block", margin: 0 }}>PASSWORD</label>
                <button type="button" style={{ fontSize: 11, color: "#a78bfa", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>Forgot?</button>
              </div>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 40 }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8b8b9f", display: "flex", padding: 4 }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <motion.button type="submit" whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 8, background: loading ? "rgba(255,255,255,0.05)" : "#ffffff", color: loading ? "#8b8b9f" : "#000000", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, marginTop: 12, transition: "background 0.2s" }}>
              {loading
                ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" />
                : "Sign In"
              }
            </motion.button>
          </form>
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7070a0", margin: 0, fontWeight: 400 }}>
              Need an admin account?{" "}
              <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#c4b5fd"} onMouseOut={e => e.currentTarget.style.color = "#a78bfa"}>
                Contact Sales
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
