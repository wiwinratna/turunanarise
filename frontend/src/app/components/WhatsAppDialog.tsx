import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Phone, CheckCircle, ExternalLink, MessageCircle } from "lucide-react";
import { apiSendWhatsApp } from "../api";

const R = 6;

interface WhatsAppDialogProps {
  open: boolean;
  onClose: () => void;
  cardName: string;
  cardId: string | null;
  theme: { primaryColor: string };
}

export function WhatsAppDialog({ open, onClose, cardName, cardId, theme }: WhatsAppDialogProps) {
  const [phone, setPhone] = useState("+62");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [waUrl, setWaUrl] = useState<string | null>(null);

  const handleSend = async () => {
    if (!phone || phone.length < 8 || !cardId) return;
    setSending(true);
    try {
      const result = await apiSendWhatsApp(phone, cardId);
      setWaUrl(result.waUrl);
      setSent(true);
    } catch {
      // error handling
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setWaUrl(null);
    setPhone("+62");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={handleClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            style={{ background: "#13131e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: R * 2, padding: 0, width: 380, overflow: "hidden" }}>

            {/* Header */}
            <div style={{
              padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MessageCircle size={20} color="#fff" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Send via WhatsApp</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Share card with recipient</div>
                </div>
              </div>
              <button onClick={handleClose}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color="#fff" />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {!sent ? (
                <>
                  {/* Card preview */}
                  <div style={{ padding: "12px 14px", borderRadius: R, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: R, background: `${theme.primaryColor}18`, color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MessageCircle size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0fa" }}>{cardName}</div>
                        <div style={{ fontSize: 11, color: "#7070a0" }}>Card will be shared as image</div>
                      </div>
                    </div>
                  </div>

                  {/* Phone input */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#7070a0", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                      RECIPIENT PHONE NUMBER
                    </label>
                    <div style={{ position: "relative" }}>
                      <Phone size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7070a0" }} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+62 812 3456 7890"
                        style={{
                          width: "100%", background: "#1c1c2e", border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: R, padding: "11px 14px 11px 36px", color: "#f0f0fa", fontSize: 14,
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: "#7070a0", marginTop: 6 }}>
                      Include country code (e.g. +62 for Indonesia)
                    </p>
                  </div>

                  {/* Message preview */}
                  <div style={{ padding: "10px 14px", borderRadius: R, background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.15)", marginBottom: 18 }}>
                    <p style={{ fontSize: 12, color: "#c8c8e8", margin: 0, lineHeight: 1.5 }}>
                      📎 <em style={{ color: "#7070a0" }}>[Card image attached]</em><br />
                      Here is your card from Arise 2! 🪪
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleClose}
                      style={{ flex: 1, padding: "10px", borderRadius: R, background: "rgba(255,255,255,0.06)", color: "#c8c8e8", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontSize: 13 }}>
                      Cancel
                    </button>
                    <button onClick={handleSend} disabled={sending || phone.length < 8}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px", borderRadius: R,
                        background: sending ? "#1a9e50" : "#25D366",
                        color: "#fff", border: "none", cursor: sending ? "not-allowed" : "pointer",
                        fontSize: 13, fontWeight: 600
                      }}>
                      {sending ? (
                        <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" />
                      ) : (
                        <><Send size={13} /> Send</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Success state */
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", background: "rgba(37,211,102,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
                  }}>
                    <CheckCircle size={28} style={{ color: "#25D366" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 700, color: "#f0f0fa", margin: "0 0 6px" }}>Ready to Send!</h3>
                  <p style={{ fontSize: 13, color: "#7070a0", margin: "0 0 20px" }}>
                    Click below to open WhatsApp and send the card to <strong style={{ color: "#c8c8e8" }}>{phone}</strong>
                  </p>

                  <a href={waUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "11px 24px", borderRadius: R,
                      background: "#25D366", color: "#fff",
                      fontSize: 14, fontWeight: 600, textDecoration: "none",
                    }}>
                    <ExternalLink size={15} /> Open WhatsApp
                  </a>

                  <button onClick={handleClose}
                    style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", cursor: "pointer", color: "#7070a0", fontSize: 12 }}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
