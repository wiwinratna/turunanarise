import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useApp } from "../AppContext";
import { User, Mail, Shield, ShieldCheck, Key, Save, Loader2, Calendar, MapPin, Camera, UserPlus } from "lucide-react";
import { apiUpdateProfile, apiUpdatePassword, apiGetEvent, apiCreateUser } from "../../api";
import type { EventData } from "../../api";
import { toast } from "sonner";

export function ProfilePage() {
  const { theme, currentUser, setCurrentUser } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (currentUser) {
        setCurrentUser({ ...currentUser, avatar: base64 });
      }
    };
    reader.readAsDataURL(file);
  };
  
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "add_superadmin">("profile");
  const [eventData, setEventData] = useState<EventData | null>(null);

  useEffect(() => {
    if (currentUser?.role === 'admin' && currentUser?.eventId) {
      const eid = Array.isArray(currentUser.eventId) ? currentUser.eventId[0] : currentUser.eventId;
      if (eid) {
        apiGetEvent(eid).then(setEventData).catch(console.error);
      }
    }
  }, [currentUser]);
  
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return toast.error("Name and email are required");
    setIsSavingProfile(true);
    try {
      const updated = await apiUpdateProfile({ name, email, avatar: currentUser?.avatar });
      setCurrentUser(updated);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !newPasswordConfirm) return toast.error("All fields are required");
    if (newPassword !== newPasswordConfirm) return toast.error("New passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    
    setIsSavingPassword(true);
    try {
      await apiUpdatePassword({ 
        current_password: currentPassword, 
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirm 
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCreateSuperadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPassword) return toast.error("All fields are required");
    if (newAdminPassword.length < 6) return toast.error("Password must be at least 6 characters");
    
    setIsCreatingAdmin(true);
    try {
      await apiCreateUser({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: "superadmin"
      });
      toast.success("Super Admin created successfully");
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create Super Admin");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1px solid ${theme.borderColor}`,
    background: theme.isDark ? "rgba(255,255,255,0.03)" : "#fff",
    color: theme.textColor, fontSize: 14, outline: "none"
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.textColor, marginBottom: 8 }}>My Profile</h1>
        <p style={{ color: theme.textMutedColor, marginBottom: 32 }}>Manage your account settings and preferences.</p>
        
        {/* Profile Card Summary */}
        <div style={{ background: theme.cardColor, borderRadius: 10, padding: "16px 20px", border: `1px solid ${theme.borderColor}`, display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          {/* Avatar */}
          <div className="group relative" onClick={() => fileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: "50%", background: theme.primaryColor + "20", color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, flexShrink: 0, cursor: "pointer", overflow: "hidden" }}>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <User size={32} />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} color="#fff" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
          
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textColor, marginBottom: 4 }}>{currentUser?.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.textMutedColor, fontSize: 14 }}>
                <Mail size={14} />
                <span>{currentUser?.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.primaryColor, fontSize: 12, fontWeight: 600, background: theme.primaryColor + "15", padding: "2px 8px", borderRadius: 20 }}>
                {currentUser?.role === "superadmin" ? <ShieldCheck size={14} /> : <Shield size={14} />}
                <span style={{ textTransform: "capitalize" }}>{currentUser?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Event Card */}
        {eventData && (
          <div style={{ background: theme.cardColor, borderRadius: 10, padding: "16px 20px", border: `1px solid ${theme.borderColor}`, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.textColor, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} color={theme.primaryColor} /> Assigned Event
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.textMutedColor, marginBottom: 2 }}>Event Name</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.textColor }}>{eventData.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.textMutedColor, marginBottom: 2 }}>Event Code</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.primaryColor, background: theme.primaryColor + "15", display: "inline-block", padding: "2px 6px", borderRadius: 4 }}>{eventData.eventCode}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.textMutedColor, marginBottom: 2 }}>Date</div>
                <div style={{ fontSize: 13, color: theme.textColor, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} /> {eventData.date}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.textMutedColor, marginBottom: 2 }}>Location</div>
                <div style={{ fontSize: 13, color: theme.textColor, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={12} /> {eventData.location}</div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, borderBottom: `1px solid ${theme.borderColor}`, marginBottom: 24 }}>
          <button onClick={() => setActiveTab("profile")} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === "profile" ? theme.primaryColor : "transparent"}`, color: activeTab === "profile" ? theme.primaryColor : theme.textMutedColor, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <User size={16} /> Edit Profile
          </button>
          <button onClick={() => setActiveTab("password")} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === "password" ? theme.primaryColor : "transparent"}`, color: activeTab === "password" ? theme.primaryColor : theme.textMutedColor, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Key size={16} /> Change Password
          </button>
          {currentUser?.role === "superadmin" && (
            <button onClick={() => setActiveTab("add_superadmin")} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === "add_superadmin" ? theme.primaryColor : "transparent"}`, color: activeTab === "add_superadmin" ? theme.primaryColor : theme.textMutedColor, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <UserPlus size={16} /> Add Super Admin
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div style={{ background: theme.cardColor, borderRadius: 12, padding: "20px 24px", border: `1px solid ${theme.borderColor}` }}>
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Enter your full name" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="Enter your email address" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button type="submit" disabled={isSavingProfile} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: theme.primaryColor, color: "#fff", border: "none", cursor: isSavingProfile ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: isSavingProfile ? 0.7 : 1 }}>
                  {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          )}
          
          {activeTab === "password" && (
            <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="Enter current password" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="Enter new password (min 6 chars)" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>Confirm New Password</label>
                <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} style={inputStyle} placeholder="Re-enter new password" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button type="submit" disabled={isSavingPassword} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: theme.primaryColor, color: "#fff", border: "none", cursor: isSavingPassword ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: isSavingPassword ? 0.7 : 1 }}>
                  {isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Update Password
                </button>
              </div>
            </form>
          )}

          {activeTab === "add_superadmin" && (
            <form onSubmit={handleCreateSuperadmin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>Name</label>
                <input type="text" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} style={inputStyle} placeholder="Enter name" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>Email Address</label>
                <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} style={inputStyle} placeholder="Enter email address" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textMutedColor, marginBottom: 8 }}>Password</label>
                <input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} style={inputStyle} placeholder="Enter password (min 6 chars)" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button type="submit" disabled={isCreatingAdmin} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: theme.primaryColor, color: "#fff", border: "none", cursor: isCreatingAdmin ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: isCreatingAdmin ? 0.7 : 1 }}>
                  {isCreatingAdmin ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Create Super Admin
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
