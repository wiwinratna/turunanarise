import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../AppContext";
import { apiCreateParticipant } from "../../api";
import { toast } from "sonner";
import { User, Phone, Briefcase, CreditCard, ChevronRight, Check, Save, ArrowRight, Database, ExternalLink, Send, Upload, Image as ImageIcon } from "lucide-react";


const R = 6;

function Field({ label, value, onChange, type = "text", placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  const { theme } = useApp();
  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: theme.inputColor,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: R,
    padding: "7px 10px",
    color: theme.textColor,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
  const labelStyle: React.CSSProperties = {
    color: theme.textMutedColor,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: 4,
  };
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{color: "#e53e5e"}}> *</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={fieldStyle}
        onFocus={e => { e.target.style.borderColor = theme.primaryColor; }}
        onBlur={e => { e.target.style.borderColor = theme.borderColor; }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string; required?: boolean;
}) {
  const { theme } = useApp();
  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: theme.inputColor,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: R,
    padding: "7px 10px",
    color: theme.textColor,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
  const labelStyle: React.CSSProperties = {
    color: theme.textMutedColor,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: 4,
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{label}{required && <span style={{color: "#e53e5e"}}> *</span>}</label>
        {hint && <span style={{ fontSize: 10, color: theme.textMutedColor, display: "flex", alignItems: "center", gap: 3 }}>
          <Database size={9} />{hint}
        </span>}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...fieldStyle, cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function RadioGroupField({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: {value: string, label: string}[]; required?: boolean;
}) {
  const { theme } = useApp();
  return (
    <div>
      <label style={{ color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
        {label}{required && <span style={{color: "#e53e5e"}}> *</span>}
      </label>
      <div style={{ display: "flex", gap: 16, alignItems: "center", height: 40 }}>
        {options.map(o => (
          <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: theme.textColor }}>
            <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)}
              style={{ accentColor: theme.primaryColor, width: 16, height: 16 }} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function FileUploadField({ label, value, onChange, accept, icon, required = false }: {
  label: string; value: string | undefined; onChange: (v: string) => void; accept: string; icon: React.ReactNode; required?: boolean;
}) {
  const { theme } = useApp();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        onChange(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label style={{ color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
        {label}{required && <span style={{color: "#e53e5e"}}> *</span>}
      </label>
      <div style={{ position: "relative", width: "100%", height: 120, background: theme.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px dashed ${theme.borderColor}`, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}>
        <input type="file" accept={accept} onChange={handleFileChange} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 10 }} />
        {value ? (
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: theme.textMutedColor }}>
            {icon}
            <span style={{ fontSize: 11, fontWeight: 500 }}>Click to upload</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  const { theme } = useApp();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 34, height: 34, borderRadius: R, background: `${theme.primaryColor}18`, color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: theme.textColor, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 12, color: theme.textMutedColor, margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

export function FormsPage() {
  const { formData, setFormData, theme, setPage, categories, functions: fns, countries, currentUser, setCards, cards, events } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successParticipantName, setSuccessParticipantName] = useState("");
  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const prov = provinces.find(p => p.name === formData.province);
    if (prov) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(console.error);
    } else {
      setCities([]);
    }
  }, [formData.province, provinces]);

  // Determine event automatically from admin's assigned event
  const resolvedEventId = (() => {
    const adminEventIds = Array.isArray(currentUser?.eventId)
      ? currentUser!.eventId
      : (currentUser?.eventId ? [currentUser!.eventId] : []);
    const allowed = events.filter(e =>
      currentUser?.role === 'superadmin' ? true : adminEventIds.includes(e.id)
    );
    return allowed[0]?.id ?? "";
  })();

  const resolvedEventName = events.find(e => e.id === resolvedEventId)?.name ?? "No event assigned";

  const update = (key: keyof typeof formData) => (val: string) => setFormData({ ...formData, [key]: val });

  const handleSubmitParticipant = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please fill in at least First Name and Last Name.");
      return;
    }
    if (!resolvedEventId) {
      toast.error("No event assigned to your account. Please contact the superadmin.");
      return;
    }

    setSubmitting(true);
    try {
      const participantName = `${formData.firstName} ${formData.lastName}`.trim();
      const response = await apiCreateParticipant({
        event_id: resolvedEventId,
        name: participantName,
        jobTitle: formData.jobTitle,
        company: formData.organization,
        email: formData.email,
        phone: formData.mobileNumber,
        idType: formData.documentType,
        employeeId: formData.idNumber,
        category: formData.category,
        function: formData.function,
        nationality: formData.nationality,
        participant_data: formData,
      });

      setCards([response.card, ...cards]);
      setSuccessParticipantName(participantName);
      setShowSuccessModal(true);
      // Reset form fields
      setFormData({
        title: "", firstName: "", lastName: "", gender: "", dateOfBirth: "", picture: "",
        email: "", mobileNumber: "", officeNumber: "",
        organization: "", category: "", function: "", jobTitle: "",
        nationality: "", documentType: "", idNumber: "", issueDate: "", expirationDate: "", uploadId: "",
        country: "", province: "", city: "", postalCode: ""
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit participant.");
    } finally {
      setSubmitting(false);
    }
  };

  const countryOptions = countries.filter(c => c.active).map(c => ({ value: c.code, label: `${c.flag} ${c.name}` }));
  const categoryOptions = categories.filter(c => c.active).map(c => ({ value: c.id, label: c.name }));
  const functionOptions = fns.filter(f => f.active).map(f => ({ value: f.id, label: f.name }));
  const genderOptions = [{ value: "Female", label: "Female" }, { value: "Male", label: "Male" }, { value: "Non-binary", label: "Non-binary" }, { value: "Prefer not to say", label: "Prefer not to say" }];
  const idTypeOptions = [
    { value: "Employee ID", label: "Employee ID" },
    { value: "Visitor Badge", label: "Visitor Badge" },
    { value: "Contractor Pass", label: "Contractor Pass" },
    { value: "Access Card", label: "Access Card" },
    { value: "Conference Pass", label: "Conference Pass" },
  ];

  return (
    <div style={{ padding: "24px 28px", width: "100%", display: "flex", flexDirection: "column", gap: 20, boxSizing: "border-box" }}>
      {/* Form Card */}
      <div style={{ borderRadius: R * 2, overflow: "hidden", background: theme.cardColor, border: `1px solid ${theme.borderColor}` }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${theme.borderColor}`, display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: theme.textColor }}>Add Data</h2>
        </div>

        {/* Form content */}
        <div style={{ padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 40 }}>
          
          {/* Section: Personal Information */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.textColor, marginBottom: 10 }}>Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <RadioGroupField label="Title" value={formData.title} onChange={update("title")} required options={[
                { value: "Mr", label: "Mr" }, { value: "Mrs", label: "Mrs" }, { value: "Ms", label: "Ms" }
              ]} />
              <RadioGroupField label="Gender" value={formData.gender} onChange={update("gender")} required options={[
                { value: "Male", label: "Male" }, { value: "Female", label: "Female" }
              ]} />
              <Field label="First Name" value={formData.firstName} onChange={update("firstName")} required />
              <Field label="Last Name" value={formData.lastName} onChange={update("lastName")} required />
              <Field label="Date of Birth" value={formData.dateOfBirth} onChange={update("dateOfBirth")} type="date" required />
              <FileUploadField label="Picture" value={formData.picture} onChange={update("picture")} accept="image/*" icon={<User size={20} />} required />
            </div>
          </div>

          {/* Section: Contact Information */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.textColor, marginBottom: 10 }}>Contact Information</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Email Address" value={formData.email} onChange={update("email")} type="email" required />
              <Field label="Mobile Number" value={formData.mobileNumber} onChange={update("mobileNumber")} required />
              <Field label="Office Number" value={formData.officeNumber} onChange={update("officeNumber")} required />
            </div>
          </div>

          {/* Section: Address Information */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.textColor, marginBottom: 10 }}>Address Information</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <SelectField label="Country" value={formData.country} onChange={update("country")} required
                options={[
                  { value: "", label: "-- Select Country --" },
                  ...countries.filter(c => c.active).map(c => ({ value: c.name, label: c.name }))
                ]} />
              {formData.country.toUpperCase() === "INDONESIA" ? (
                <>
                  <SelectField label="Province" value={formData.province} onChange={update("province")} required
                    options={[
                      { value: "", label: "-- Select Province --" },
                      ...provinces.map(p => ({ value: p.name, label: p.name }))
                    ]} />
                  <SelectField label="City / Regency" value={formData.city} onChange={update("city")} required
                    options={[
                      { value: "", label: "-- Select City/Regency --" },
                      ...cities.map(c => ({ value: c.name, label: c.name }))
                    ]} />
                </>
              ) : (
                <>
                  <Field label="Province / State" value={formData.province} onChange={update("province")} required />
                  <Field label="City" value={formData.city} onChange={update("city")} required />
                </>
              )}
              <Field label="Postal Code" value={formData.postalCode} onChange={update("postalCode")} required />
            </div>
          </div>

          {/* Section: Professional Information */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.textColor, marginBottom: 10 }}>Professional Information</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Organization" value={formData.organization} onChange={update("organization")} required />
              <SelectField label="Category" value={formData.category} onChange={update("category")} options={categoryOptions} required />
              <SelectField label="Function" value={formData.function} onChange={update("function")} options={functionOptions} required />
              <Field label="Job Title" value={formData.jobTitle} onChange={update("jobTitle")} />
            </div>
          </div>

          {/* Section: Identification Information */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.textColor, marginBottom: 10 }}>Identification Information</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <SelectField label="Nationality" value={formData.nationality} onChange={update("nationality")} options={countryOptions} required />
              <Field label="Document Type" value={formData.documentType} onChange={update("documentType")} required />
              <Field label="Number of ID" value={formData.idNumber} onChange={update("idNumber")} required />
              <Field label="Issue Date" value={formData.issueDate} onChange={update("issueDate")} type="date" required />
              <Field label="Expiration Date" value={formData.expirationDate} onChange={update("expirationDate")} type="date" required />
              <FileUploadField label="Upload ID" value={formData.uploadId} onChange={update("uploadId")} accept="image/*" icon={<ImageIcon size={20} />} required />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: `1px solid ${theme.borderColor}`, background: theme.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
          <button
            onClick={handleSubmitParticipant}
            disabled={submitting}
            style={{
              padding: "10px 24px", borderRadius: R, background: submitting ? `${theme.primaryColor}80` : theme.primaryColor,
              color: "#fff", border: "none", cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8
            }}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              style={{ background: theme.cardColor, borderRadius: 24, padding: "40px", maxWidth: 420, width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", border: `1px solid ${theme.borderColor}`, textAlign: "center", position: "relative" }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, background: `${theme.primaryColor}15`, color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Check size={40} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.textColor, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>Submission Successful!</h2>
              <p style={{ fontSize: 15, color: theme.textMutedColor, marginBottom: 32, lineHeight: 1.5 }}>
                Participant <strong>{successParticipantName}</strong> has been successfully added to the master record.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => { setShowSuccessModal(false); setPage("participants"); }} style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", border: `1px solid ${theme.primaryColor}`, color: theme.primaryColor, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  View Participants
                </button>
                <button onClick={() => setShowSuccessModal(false)} style={{ padding: "12px 24px", borderRadius: 12, background: theme.primaryColor, border: "none", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: `0 4px 12px ${theme.primaryColor}40` }}>
                  Add Another
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
