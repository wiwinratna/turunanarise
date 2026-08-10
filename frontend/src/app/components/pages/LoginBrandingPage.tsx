import React, { useState, useEffect } from "react";
import { useApp } from "../AppContext";
import { apiGetBrandingSettings, apiUpdateBrandingSettings, BrandingSettings, apiUploadBrandingImage, DEFAULT_BRANDING_SETTINGS } from "../../api";
import { toast } from "sonner";
import { Save, Layers, LayoutTemplate, Palette, Image as ImageIcon, Type, Monitor, Upload, RefreshCcw } from "lucide-react";

export function LoginBrandingPage() {
  const { theme, setBrandingSettings } = useApp();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_BRANDING_SETTINGS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiGetBrandingSettings();
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Failed to fetch branding settings", err);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: keyof BrandingSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiUpdateBrandingSettings(settings);
      setBrandingSettings(settings); // Update globally
      toast.success("Login branding updated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to update branding settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all branding settings to default?")) {
      setSettings(DEFAULT_BRANDING_SETTINGS);
      toast.success("Settings reset to default. Click Save Changes to apply.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'backgroundImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logoUrl') setUploadingLogo(true);
    else setUploadingBg(true);

    try {
      const data = await apiUploadBrandingImage(file);
      handleChange(type, data.url);
      toast.success("Image uploaded successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to upload image");
    } finally {
      if (type === 'logoUrl') setUploadingLogo(false);
      else setUploadingBg(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg border outline-none transition-all`;

  if (fetching) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center" style={{ background: theme.backgroundColor }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.primaryColor }}></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: theme.backgroundColor }}>
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: theme.textColor }}>Login Page Branding</h1>
            <p className="text-sm" style={{ color: theme.textMutedColor }}>Customize the appearance of the public login page.</p>
          </div>
          <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
            style={{ 
              borderColor: theme.borderColor, 
              color: theme.textColor,
              background: 'transparent'
            }}
          >
            <RefreshCcw size={16} />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ background: theme.primaryColor, color: "#fff", opacity: loading ? 0.7 : 1 }}
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            {/* Layout Section */}
            <div className="p-4 rounded-xl border" style={{ borderColor: theme.borderColor, background: theme.cardColor }}>
              <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: theme.textColor }}>
                <LayoutTemplate size={18} style={{ color: theme.primaryColor }} />
                Layout Style
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "split-right", label: "Form Right" },
                  { id: "split-left", label: "Form Left" },
                  { id: "centered", label: "Centered" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleChange("layout", opt.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border transition-all"
                    style={{ 
                      borderColor: settings.layout === opt.id ? theme.primaryColor : theme.borderColor,
                      background: settings.layout === opt.id ? `${theme.primaryColor}15` : "transparent"
                    }}
                  >
                    <div className="w-full h-10 bg-white/5 rounded mb-2 flex items-center p-1" style={{ border: `1px solid ${theme.borderColor}` }}>
                      {opt.id === "split-right" && (
                        <>
                          <div className="h-full w-2/3 bg-white/10 rounded-l"></div>
                          <div className="h-full w-1/3 bg-white/20 rounded-r"></div>
                        </>
                      )}
                      {opt.id === "split-left" && (
                        <>
                          <div className="h-full w-1/3 bg-white/20 rounded-l"></div>
                          <div className="h-full w-2/3 bg-white/10 rounded-r"></div>
                        </>
                      )}
                      {opt.id === "centered" && (
                        <div className="h-full w-full bg-white/5 flex items-center justify-center">
                          <div className="h-3/4 w-1/2 bg-white/20 rounded"></div>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium" style={{ color: settings.layout === opt.id ? theme.primaryColor : theme.textMutedColor }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Typography Section */}
              <div className="p-4 rounded-xl border flex flex-col h-full" style={{ borderColor: theme.borderColor, background: theme.cardColor }}>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: theme.textColor }}>
                  <Type size={18} style={{ color: theme.primaryColor }} />
                  Content
                </h2>
                <div className="space-y-3 flex-1">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Hero Title</label>
                    <input
                      type="text"
                      value={settings.title || ""}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className={inputClass}
                      style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                      placeholder="E.g. Design without limits."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Hero Subtitle</label>
                    <textarea
                      value={settings.subtitle || ""}
                      onChange={(e) => handleChange("subtitle", e.target.value)}
                      className={inputClass}
                      style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor, minHeight: "60px" }}
                      placeholder="E.g. The modern workspace..."
                    />
                  </div>
                </div>
              </div>

              {/* Logo Section */}
              <div className="p-4 rounded-xl border flex flex-col h-full" style={{ borderColor: theme.borderColor, background: theme.cardColor }}>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: theme.textColor }}>
                  <ImageIcon size={18} style={{ color: theme.primaryColor }} />
                  Logo Settings
                </h2>
                <div className="space-y-3 flex-1">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Logo Text</label>
                    <input
                      type="text"
                      value={settings.logoText ?? "Arise 2"}
                      onChange={(e) => handleChange("logoText", e.target.value)}
                      className={inputClass}
                      style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                      placeholder="Arise 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Custom Logo URL (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.logoUrl || ""}
                        onChange={(e) => handleChange("logoUrl", e.target.value)}
                        className={inputClass}
                        style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                        placeholder="https://example.com/logo.png"
                      />
                      <label 
                        className="flex items-center justify-center px-4 rounded-lg cursor-pointer transition-colors"
                        style={{ background: theme.primaryColor, color: "#fff", opacity: uploadingLogo ? 0.7 : 1 }}
                      >
                        <Upload size={18} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, 'logoUrl')} 
                          disabled={uploadingLogo} 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Colors Section */}
              <div className="p-4 rounded-xl border flex flex-col h-full" style={{ borderColor: theme.borderColor, background: theme.cardColor }}>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: theme.textColor }}>
                  <Palette size={18} style={{ color: theme.primaryColor }} />
                  Colors
                </h2>
                <div className="space-y-3 flex-1">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Primary Color (Buttons)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor || "#7c5cfc"}
                        onChange={(e) => handleChange("primaryColor", e.target.value)}
                        className="h-10 w-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor || ""}
                        onChange={(e) => handleChange("primaryColor", e.target.value)}
                        className={inputClass}
                        style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.backgroundColor || "#050509"}
                        onChange={(e) => handleChange("backgroundColor", e.target.value)}
                        className="h-10 w-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.backgroundColor || ""}
                        onChange={(e) => handleChange("backgroundColor", e.target.value)}
                        className={inputClass}
                        style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.textColor || "#ffffff"}
                        onChange={(e) => handleChange("textColor", e.target.value)}
                        className="h-10 w-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.textColor || ""}
                        onChange={(e) => handleChange("textColor", e.target.value)}
                        className={inputClass}
                        style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Panel/Form Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.panelColor || "#0a0a10"}
                        onChange={(e) => handleChange("panelColor", e.target.value)}
                        className="h-10 w-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.panelColor || ""}
                        onChange={(e) => handleChange("panelColor", e.target.value)}
                        className={inputClass}
                        style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Image */}
              <div className="p-4 rounded-xl border flex flex-col h-full" style={{ borderColor: theme.borderColor, background: theme.cardColor }}>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: theme.textColor }}>
                  <ImageIcon size={18} style={{ color: theme.primaryColor }} />
                  Background Image
                </h2>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.textMutedColor }}>Image URL (Optional)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={settings.backgroundImage || ""}
                      onChange={(e) => handleChange("backgroundImage", e.target.value)}
                      className={inputClass}
                      style={{ background: theme.inputColor, color: theme.textColor, borderColor: theme.borderColor }}
                      placeholder="https://example.com/image.jpg"
                    />
                    <label 
                      className="flex items-center justify-center px-4 rounded-lg cursor-pointer transition-colors"
                      style={{ background: theme.primaryColor, color: "#fff", opacity: uploadingBg ? 0.7 : 1 }}
                    >
                      <Upload size={18} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'backgroundImage')} 
                        disabled={uploadingBg} 
                      />
                    </label>
                  </div>
                  <p className="text-xs" style={{ color: theme.textMutedColor }}>
                    Leave empty to use the animated geometric rings (default). If provided, this image will cover the hero section.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Live Preview */}
          <div className="lg:col-span-5 sticky top-4">
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: theme.textColor }}>
              <Monitor size={18} style={{ color: theme.primaryColor }} />
              Live Preview
            </h2>
            <div className="border rounded-xl overflow-hidden shadow-2xl relative" style={{ borderColor: theme.borderColor, height: "400px" }}>
              <div style={{ transform: "scale(0.6)", transformOrigin: "top left", width: "166.66%", height: "166.66%", position: "absolute", top: 0, left: 0 }}>
                <div className="absolute inset-0 flex" style={{ background: settings.backgroundColor, flexDirection: settings.layout === 'split-left' ? 'row-reverse' : 'row' }}>
                
                {/* Hero Side */}
                {settings.layout !== 'centered' && (
                  <div className="flex-1 relative overflow-hidden flex flex-col p-10" style={{ background: settings.panelColor }}>
                    {settings.backgroundImage ? (
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${settings.backgroundImage})`, opacity: 0.6 }}></div>
                    ) : (
                      <>
                        <div className="absolute top-10 right-10 w-40 h-40 rounded-full border-2 opacity-30" style={{ borderColor: settings.primaryColor }}></div>
                        <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full border-2 opacity-20" style={{ borderColor: settings.primaryColor }}></div>
                      </>
                    )}
                    <div className="relative z-10 flex items-center gap-3 mb-auto">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="max-h-10 max-w-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: settings.primaryColor }}>
                          <Layers size={20} color="#fff" />
                        </div>
                      )}
                      {!settings.logoUrl && (
                        <span className="font-bold text-xl" style={{ color: settings.textColor || "#ffffff" }}>{settings.logoText || "Arise 2"}</span>
                      )}
                    </div>
                    <div className="relative z-10 mt-auto mb-20">
                      <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: settings.textColor || "#ffffff" }}>{settings.title}</h1>
                      <p className="text-lg" style={{ color: settings.textColor ? `${settings.textColor}cc` : "#8b8b9f" }}>{settings.subtitle}</p>
                    </div>
                  </div>
                )}

                {/* Form Side */}
                <div className={`flex flex-col justify-center p-10 relative z-10 ${settings.layout === 'centered' ? 'w-full max-w-md mx-auto items-center' : 'w-[400px]'}`} style={{ background: settings.layout === 'centered' ? 'transparent' : settings.backgroundColor }}>
                  
                  {settings.layout === 'centered' && (
                     <div className="flex items-center gap-3 mb-10">
                       {settings.logoUrl ? (
                         <img src={settings.logoUrl} alt="Logo" className="max-h-12 max-w-full" />
                       ) : (
                         <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: settings.primaryColor }}>
                           <Layers size={24} color="#fff" />
                         </div>
                       )}
                       {!settings.logoUrl && (
                         <span className="font-bold text-3xl" style={{ color: settings.textColor || "#ffffff" }}>{settings.logoText || "Arise 2"}</span>
                       )}
                     </div>
                  )}

                  <div className={`w-full ${settings.layout === 'centered' ? 'p-8 rounded-2xl border border-white/10' : ''}`} style={{ background: settings.layout === 'centered' ? (settings.panelColor || '#0a0a10') : 'transparent' }}>
                    {settings.layout !== 'centered' ? (
                      <div className="mb-10">
                        <h2 className="text-2xl font-bold mb-2" style={{ color: settings.textColor || "#ffffff" }}>Welcome back</h2>
                        <p className="text-sm" style={{ color: settings.textColor ? `${settings.textColor}cc` : "#8b8b9f" }}>Sign in to your workspace</p>
                      </div>
                    ) : (
                      <div className="mb-10 text-center">
                        <h2 className="text-2xl font-bold mb-2" style={{ color: settings.textColor || "#ffffff" }}>{settings.title || "Design without limits."}</h2>
                        <p className="text-sm" style={{ color: settings.textColor ? `${settings.textColor}cc` : "#8b8b9f" }}>{settings.subtitle || "The modern workspace for premium digital card creation."}</p>
                      </div>
                    )}
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email Address</label>
                        <div className="h-10 rounded-lg border border-white/10 bg-white/5 w-full"></div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Password</label>
                        <div className="h-10 rounded-lg border border-white/10 bg-white/5 w-full"></div>
                      </div>
                    </div>
                    
                    <button className="w-full h-10 rounded-lg font-medium text-white flex items-center justify-center" style={{ background: settings.primaryColor }}>
                      Sign In
                    </button>
                  </div>
                </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
