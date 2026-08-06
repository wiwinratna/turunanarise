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
    width: "100%", background: "#1c1c2e", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: R, padding: "10px 14px", color: "#f0f0fa", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", background: "#0b0b12" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e0e1a 0%, #13131e 60%, #1a1030 100%)" }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(124,92,252,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute" style={{ top: "30%", left: "30%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative z-10 flex flex-col h-full" style={{ padding: "40px 52px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "auto" }}>
            <div style={{ width: 34, height: 34, borderRadius: R, background: "#7c5cfc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={17} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: "#f0f0fa" }}>Arise 2</span>
          </div>

          <div style={{ marginBottom: "auto" }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 36, fontWeight: 700, color: "#f0f0fa", lineHeight: 1.25, marginBottom: 16, margin: "0 0 16px" }}>
              Create stunning<br />
              <span style={{ color: "#7c5cfc" }}>digital cards</span><br />
              in minutes.
            </h2>
            <p style={{ color: "#7070a0", fontSize: 14, lineHeight: 1.7, maxWidth: 360, margin: "16px 0 28px" }}>
              Design professional employee badges, ID cards, and business cards with a drag-and-drop editor. Full theme customisation, master data management, and PDF export.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div style={{ flex: "0 0 auto", width: "100%", maxWidth: 440, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 40px" }}>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} style={{ width: "100%", maxWidth: 360 }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div style={{ width: 30, height: 30, borderRadius: R, background: "#7c5cfc", display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={14} color="#fff" /></div>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: "#f0f0fa" }}>Arise 2</span>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: "#f0f0fa", margin: "0 0 6px" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13, color: "#7070a0", margin: 0 }}>
              Sign in to your Arise 2 workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#7070a0", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>EMAIL</label>
              <div style={{ position: "relative" }}>
                <Mail size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7070a0" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#7070a0", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <Lock size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7070a0" }} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36, paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7070a0", display: "flex" }}>
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <button type="button" style={{ fontSize: 12, color: "#7c5cfc", background: "none", border: "none", cursor: "pointer" }}>Forgot password?</button>
            </div>

            <motion.button type="submit" whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: R, background: loading ? "#5a3dcc" : "#7c5cfc", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              {loading
                ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" />
                : <>Sign In<ArrowRight size={15} /></>
              }
            </motion.button>
          </form>



        </motion.div>
      </div>
    </div>
  );
}
