import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { AuthUser, EventData, MasterCategory, MasterFunction, MasterCountry, CardData, ParticipantData } from "../api";
import {
  getToken, clearToken, apiGetMe, apiGetEvents, apiGetCategories,
  apiGetFunctions, apiGetCountries, apiGetCards, apiGetUsers, apiCreateCard,
  apiGetParticipants, BrandingSettings, apiGetBrandingSettings
} from "../api";
import { toast } from "sonner";

export type UserRole = "superadmin" | "admin";

export type Page = "login" | "register" | "dashboard" | "forms" | "card-editor" | "theme-settings" | "profile" | "master-data" | "users" | "events" | "superadmin-events" | "superadmin-countries" | "login-branding";

export interface ThemeConfig {
  isDark: boolean;
  sidebarColor: string;
  headerColor: string;
  primaryColor: string;
  backgroundColor: string;
  cardColor: string;
  accentColor: string;
  textColor: string;
  textMutedColor: string;
  borderColor: string;
  inputColor: string;
}

export const PRESET_THEMES: Record<string, ThemeConfig & { name: string; icon: string }> = {
  midnight: {
    name: "Midnight",
    icon: "🌙",
    isDark: true,
    sidebarColor: "#0e0e1a",
    headerColor: "#13131e",
    primaryColor: "#7c5cfc",
    backgroundColor: "#0b0b12",
    cardColor: "#13131e",
    accentColor: "#7c5cfc",
    textColor: "#f0f0fa",
    textMutedColor: "#7070a0",
    borderColor: "rgba(255, 255, 255, 0.08)",
    inputColor: "#1c1c2e",
  },
  light_clean: {
    name: "Light Clean",
    icon: "☀️",
    isDark: false,
    sidebarColor: "#ffffff",
    headerColor: "#f8fafc",
    primaryColor: "#7c5cfc",
    backgroundColor: "#f1f5f9",
    cardColor: "#ffffff",
    accentColor: "#7c5cfc",
    textColor: "#0f172a",
    textMutedColor: "#64748b",
    borderColor: "rgba(15, 23, 42, 0.08)",
    inputColor: "#ffffff",
  },
  ocean: {
    name: "Ocean",
    icon: "🌊",
    isDark: true,
    sidebarColor: "#0a1628",
    headerColor: "#0d1f3c",
    primaryColor: "#0ea5e9",
    backgroundColor: "#080f1d",
    cardColor: "#0d1f3c",
    accentColor: "#0ea5e9",
    textColor: "#f0f0fa",
    textMutedColor: "#7070a0",
    borderColor: "rgba(255, 255, 255, 0.08)",
    inputColor: "#1c1c2e",
  },
  light_ocean: {
    name: "Light Ocean",
    icon: "🌊",
    isDark: false,
    sidebarColor: "#ffffff",
    headerColor: "#e0f2fe",
    primaryColor: "#0ea5e9",
    backgroundColor: "#f0f9ff",
    cardColor: "#ffffff",
    accentColor: "#0ea5e9",
    textColor: "#0f172a",
    textMutedColor: "#0284c7",
    borderColor: "rgba(14, 165, 233, 0.12)",
    inputColor: "#ffffff",
  },
  emerald: {
    name: "Emerald",
    icon: "🌿",
    isDark: true,
    sidebarColor: "#061a12",
    headerColor: "#0a2318",
    primaryColor: "#10b981",
    backgroundColor: "#040e0a",
    cardColor: "#0a2318",
    accentColor: "#10b981",
    textColor: "#f0f0fa",
    textMutedColor: "#7070a0",
    borderColor: "rgba(255, 255, 255, 0.08)",
    inputColor: "#1c1c2e",
  },
  light_emerald: {
    name: "Light Emerald",
    icon: "🌿",
    isDark: false,
    sidebarColor: "#ffffff",
    headerColor: "#dcfce7",
    primaryColor: "#10b981",
    backgroundColor: "#f0fdf4",
    cardColor: "#ffffff",
    accentColor: "#10b981",
    textColor: "#0f172a",
    textMutedColor: "#059669",
    borderColor: "rgba(16, 185, 129, 0.12)",
    inputColor: "#ffffff",
  },
  crimson: {
    name: "Crimson",
    icon: "🔴",
    isDark: true,
    sidebarColor: "#1a0808",
    headerColor: "#220d0d",
    primaryColor: "#e53e5e",
    backgroundColor: "#120505",
    cardColor: "#220d0d",
    accentColor: "#e53e5e",
    textColor: "#f0f0fa",
    textMutedColor: "#7070a0",
    borderColor: "rgba(255, 255, 255, 0.08)",
    inputColor: "#1c1c2e",
  },
  light_crimson: {
    name: "Light Crimson",
    icon: "🔴",
    isDark: false,
    sidebarColor: "#ffffff",
    headerColor: "#ffe3e3",
    primaryColor: "#e53e5e",
    backgroundColor: "#fff5f5",
    cardColor: "#ffffff",
    accentColor: "#e53e5e",
    textColor: "#2b0a0a",
    textMutedColor: "#c92a2a",
    borderColor: "rgba(229, 62, 94, 0.12)",
    inputColor: "#ffffff",
  },
  amber: {
    name: "Amber",
    icon: "⚡",
    isDark: true,
    sidebarColor: "#1a1200",
    headerColor: "#221800",
    primaryColor: "#f59e0b",
    backgroundColor: "#110d00",
    cardColor: "#221800",
    accentColor: "#f59e0b",
    textColor: "#f0f0fa",
    textMutedColor: "#7070a0",
    borderColor: "rgba(255, 255, 255, 0.08)",
    inputColor: "#1c1c2e",
  },
  light_amber: {
    name: "Light Amber",
    icon: "⚡",
    isDark: false,
    sidebarColor: "#ffffff",
    headerColor: "#fef3c7",
    primaryColor: "#f59e0b",
    backgroundColor: "#fffbeb",
    cardColor: "#ffffff",
    accentColor: "#f59e0b",
    textColor: "#451a03",
    textMutedColor: "#d97706",
    borderColor: "rgba(245, 158, 11, 0.12)",
    inputColor: "#ffffff",
  },
  slate: {
    name: "Slate",
    icon: "🪨",
    isDark: true,
    sidebarColor: "#0f1117",
    headerColor: "#171923",
    primaryColor: "#94a3b8",
    backgroundColor: "#0a0c10",
    cardColor: "#171923",
    accentColor: "#94a3b8",
    textColor: "#f0f0fa",
    textMutedColor: "#7070a0",
    borderColor: "rgba(255, 255, 255, 0.08)",
    inputColor: "#1c1c2e",
  },
  light_slate: {
    name: "Light Slate",
    icon: "🪨",
    isDark: false,
    sidebarColor: "#ffffff",
    headerColor: "#f1f5f9",
    primaryColor: "#64748b",
    backgroundColor: "#f8fafc",
    cardColor: "#ffffff",
    accentColor: "#64748b",
    textColor: "#0f172a",
    textMutedColor: "#475569",
    borderColor: "rgba(100, 116, 139, 0.12)",
    inputColor: "#ffffff",
  },
};


export interface CardElement {
  id: string;
  type: "text" | "photo" | "logo" | "badge" | "divider" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  bgColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  rotation?: number;
  layer: number;
  imageUrl?: string;
  hidden?: boolean;
  dataField?: string;
}

export interface FormData {
  title: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  picture?: string;
  email: string;
  mobileNumber: string;
  officeNumber: string;
  organization: string;
  category: string;
  function: string;
  jobTitle: string;
  nationality: string;
  documentType: string;
  idNumber: string;
  issueDate: string;
  expirationDate: string;
  uploadId?: string;
  country: string;
  province: string;
  city: string;
  postalCode: string;
}

// Master Data Types
export interface MasterCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface MasterFunction {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  description: string;
  active: boolean;
}

export interface MasterCountry {
  id: string;
  flag: string;
  code: string;
  gymCode: string;
  name: string;
  active: boolean;
}

interface AppContextType {
  page: Page;
  setPage: (p: Page) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  isInitializingAuth: boolean;
  // Auth & Role
  currentUser: AuthUser | null;
  setCurrentUser: (u: AuthUser | null) => void;
  users: AuthUser[];
  setUsers: (u: AuthUser[]) => void;
  events: EventData[];
  setEvents: (e: EventData[]) => void;
  // Branding
  brandingSettings: BrandingSettings | null;
  setBrandingSettings: (s: BrandingSettings | null) => void;
  // Theme
  theme: ThemeConfig;
  setTheme: (t: ThemeConfig) => void;
  sidebarLogo: string | null;
  setSidebarLogo: (url: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  // Card editor
  cardElements: CardElement[];
  setCardElements: (els: CardElement[]) => void;
  formData: FormData;
  setFormData: (d: FormData) => void;
  cardOrientation: "portrait" | "landscape" | "square" | string;
  setCardOrientation: (o: "portrait" | "landscape" | "square" | string) => void;
  cardBgImage: string | null;
  setCardBgImage: (url: string | null) => void;
  savedCards: { id: string; name: string; date: string; thumbnail: string; elements: CardElement[]; eventId?: string }[];
  saveCard: (name: string) => void;
  // Raw card data from backend
  cards: CardData[];
  setCards: (c: CardData[] | ((prev: CardData[]) => CardData[])) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;
  // Master Data
  categories: MasterCategory[];
  setCategories: (d: React.Dispatch<React.SetStateAction<MasterCategory[]>>) => void;
  functions: MasterFunction[];
  setFunctions: (d: React.Dispatch<React.SetStateAction<MasterFunction[]>>) => void;
  countries: MasterCountry[];
  setCountries: (d: React.Dispatch<React.SetStateAction<MasterCountry[]>>) => void;
}

const getInitialTheme = (): ThemeConfig => {
  try {
    const saved = localStorage.getItem("cardforge_last_theme") || localStorage.getItem("cardforge_theme");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && "sidebarColor" in parsed) {
        return parsed;
      }
    }
  } catch (e) {}
  return PRESET_THEMES.midnight;
};

const getInitialLogo = (): string | null => {
  try {
    return localStorage.getItem("cardforge_last_logo") || localStorage.getItem("cardforge_logo");
  } catch (e) {}
  return null;
};

const defaultTheme = PRESET_THEMES.midnight;

const defaultFormData: FormData = {
  firstName: "Alexandra",
  lastName: "Chen",
  dateOfBirth: "1990-04-15",
  gender: "Female",
  nationality: "US",
  email: "alex.chen@company.com",
  phone: "+1 (555) 234-5678",
  address: "742 Innovation Drive",
  city: "San Francisco",
  country: "United States",
  jobTitle: "Senior Product Designer",
  company: "NovaTech Solutions",
  department: "Design & UX",
  employeeId: "EMP-2024-0847",
  idNumber: "SF-847-2024",
  idType: "Employee ID",
  validUntil: "2026-12-31",
  category: "CAT-001",
  function: "FN-003",
};

const defaultElements: CardElement[] = [
  { id: "photo", type: "photo", x: 20, y: 20, width: 80, height: 80, content: "Profile Photo", layer: 1, borderRadius: 50, imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format" },
  { id: "name", type: "text", x: 116, y: 28, width: 180, height: 32, content: "Alexandra Chen", fontSize: 18, fontWeight: "700", color: "#f0f0fa", layer: 2 },
  { id: "title", type: "text", x: 116, y: 64, width: 180, height: 22, content: "Senior Product Designer", fontSize: 11, fontWeight: "400", color: "#9090c0", layer: 3 },
  { id: "company", type: "text", x: 116, y: 88, width: 180, height: 20, content: "NovaTech Solutions", fontSize: 11, fontWeight: "500", color: "#7c5cfc", layer: 4 },
  { id: "divider", type: "divider", x: 20, y: 115, width: 320, height: 1, content: "", bgColor: "rgba(255,255,255,0.1)", layer: 5 },
  { id: "email-label", type: "text", x: 20, y: 128, width: 80, height: 16, content: "EMAIL", fontSize: 8, fontWeight: "600", color: "#7070a0", layer: 6 },
  { id: "email-val", type: "text", x: 20, y: 146, width: 180, height: 16, content: "alex.chen@company.com", fontSize: 10, fontWeight: "400", color: "#c8c8e8", layer: 7 },
  { id: "phone-label", type: "text", x: 220, y: 128, width: 80, height: 16, content: "PHONE", fontSize: 8, fontWeight: "600", color: "#7070a0", layer: 8 },
  { id: "phone-val", type: "text", x: 220, y: 146, width: 120, height: 16, content: "+1 (555) 234-5678", fontSize: 10, fontWeight: "400", color: "#c8c8e8", layer: 9 },
  { id: "badge", type: "badge", x: 20, y: 175, width: 90, height: 22, content: "Employee ID", fontSize: 9, color: "#ffffff", bgColor: "#7c5cfc", borderRadius: 3, layer: 10 },
  { id: "id-val", type: "text", x: 118, y: 178, width: 100, height: 18, content: "EMP-2024-0847", fontSize: 10, fontWeight: "500", color: "#f0f0fa", layer: 11 },
];

const defaultCategories: MasterCategory[] = [
  { id: "CAT-001", code: "CAT-001", name: "Corporate", description: "Corporate employee cards", active: true },
  { id: "CAT-002", code: "CAT-002", name: "Visitor", description: "Temporary visitor passes", active: true },
  { id: "CAT-003", code: "CAT-003", name: "Contractor", description: "External contractor badges", active: true },
  { id: "CAT-004", code: "CAT-004", name: "Executive", description: "Senior executive credentials", active: true },
  { id: "CAT-005", code: "CAT-005", name: "Event", description: "Conference and event passes", active: false },
];

const defaultFunctions: MasterFunction[] = [
  { id: "FN-001", code: "FN-001", name: "Engineering", categoryId: "CAT-001", description: "Software & hardware engineering", active: true },
  { id: "FN-002", code: "FN-002", name: "Human Resources", categoryId: "CAT-001", description: "HR and people operations", active: true },
  { id: "FN-003", code: "FN-003", name: "Design & UX", categoryId: "CAT-001", description: "Product design and user experience", active: true },
  { id: "FN-004", code: "FN-004", name: "Finance", categoryId: "CAT-001", description: "Finance and accounting", active: true },
  { id: "FN-005", code: "FN-005", name: "Marketing", categoryId: "CAT-001", description: "Marketing and brand", active: true },
  { id: "FN-006", code: "FN-006", name: "General Visit", categoryId: "CAT-002", description: "Standard visitor access", active: true },
  { id: "FN-007", code: "FN-007", name: "VIP Access", categoryId: "CAT-004", description: "Executive VIP credentials", active: true },
];

const defaultCountries: MasterCountry[] = [
  { id: "US", flag: "🇺🇸", code: "US", gymCode: "GYM-US", name: "United States", active: true },
  { id: "GB", flag: "🇬🇧", code: "GB", gymCode: "GYM-GB", name: "United Kingdom", active: true },
  { id: "CA", flag: "🇨🇦", code: "CA", gymCode: "GYM-CA", name: "Canada", active: true },
  { id: "AU", flag: "🇦🇺", code: "AU", gymCode: "GYM-AU", name: "Australia", active: true },
  { id: "DE", flag: "🇩🇪", code: "DE", gymCode: "GYM-DE", name: "Germany", active: true },
  { id: "FR", flag: "🇫🇷", code: "FR", gymCode: "GYM-FR", name: "France", active: true },
  { id: "SG", flag: "🇸🇬", code: "SG", gymCode: "GYM-SG", name: "Singapore", active: true },
  { id: "JP", flag: "🇯🇵", code: "JP", gymCode: "GYM-JP", name: "Japan", active: true },
  { id: "IN", flag: "🇮🇳", code: "IN", gymCode: "GYM-IN", name: "India", active: true },
  { id: "BR", flag: "🇧🇷", code: "BR", gymCode: "GYM-BR", name: "Brazil", active: false },
  { id: "AE", flag: "🇦🇪", code: "AE", gymCode: "GYM-AE", name: "UAE", active: true },
  { id: "NL", flag: "🇳🇱", code: "NL", gymCode: "GYM-NL", name: "Netherlands", active: true },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>("login");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings | null>(null);
  const [theme, setThemeState] = useState<ThemeConfig>(getInitialTheme);

  const getThemeKey = useCallback((user: AuthUser | null) => {
    if (!user) return "cardforge_theme";
    if (user.role === "superadmin") return "cardforge_theme_superadmin";
    const eventId = Array.isArray(user.eventId) ? user.eventId[0] : user.eventId;
    return eventId ? `cardforge_theme_${eventId}` : "cardforge_theme";
  }, []);

  const setTheme = useCallback((t: ThemeConfig) => {
    setThemeState(t);
    try {
      const key = getThemeKey(currentUser);
      localStorage.setItem(key, JSON.stringify(t));
      localStorage.setItem("cardforge_last_theme", JSON.stringify(t));
    } catch (e) {}
  }, [currentUser, getThemeKey]);
  const getLogoKey = useCallback((user: AuthUser | null) => {
    if (!user) return "cardforge_logo";
    if (user.role === "superadmin") return "cardforge_logo_superadmin";
    const eventId = Array.isArray(user.eventId) ? user.eventId[0] : user.eventId;
    return eventId ? `cardforge_logo_${eventId}` : "cardforge_logo";
  }, []);

  const [sidebarLogo, setSidebarLogoState] = useState<string | null>(getInitialLogo);

  useEffect(() => {
    try {
      if (currentUser?.logo) {
        setSidebarLogoState(currentUser.logo);
        localStorage.setItem("cardforge_last_logo", currentUser.logo);
      } else {
        const logoKey = getLogoKey(currentUser);
        const l = localStorage.getItem(logoKey);
        if (l) {
          setSidebarLogoState(l);
          localStorage.setItem("cardforge_last_logo", l);
        } else {
          setSidebarLogoState(getInitialLogo());
        }
      }
      
      if (currentUser?.theme) {
        setThemeState(currentUser.theme);
        localStorage.setItem("cardforge_last_theme", JSON.stringify(currentUser.theme));
      } else {
        const themeKey = getThemeKey(currentUser);
        const savedTheme = localStorage.getItem(themeKey);
        if (savedTheme) {
          const parsed = JSON.parse(savedTheme);
          if (parsed && typeof parsed === "object" && "sidebarColor" in parsed) {
            setThemeState(parsed);
            localStorage.setItem("cardforge_last_theme", savedTheme);
          } else {
            setThemeState(getInitialTheme());
          }
        } else {
          setThemeState(getInitialTheme());
        }
      }
    } catch(e) {}
  }, [currentUser, getLogoKey, getThemeKey]);

  const previousThemeRef = useRef(theme);
  const previousLogoRef = useRef(sidebarLogo);

  useEffect(() => {
    if (!currentUser || !isLoggedIn) return;
    
    if (JSON.stringify(theme) === JSON.stringify(previousThemeRef.current) && sidebarLogo === previousLogoRef.current) {
        return;
    }

    const tId = setTimeout(() => {
      import("../api").then(({ apiUpdateProfile }) => {
        apiUpdateProfile({
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          theme: theme,
          logo: sidebarLogo || ""
        }).then(() => {
           previousThemeRef.current = theme;
           previousLogoRef.current = sidebarLogo;
        }).catch(console.error);
      });
    }, 1500);
    
    return () => clearTimeout(tId);
  }, [theme, sidebarLogo, currentUser, isLoggedIn]);

  const setSidebarLogo = useCallback((logo: string | null) => {
    setSidebarLogoState(logo);
    try {
      const key = getLogoKey(currentUser);
      if (logo) {
        localStorage.setItem(key, logo);
        localStorage.setItem("cardforge_last_logo", logo);
      } else {
        localStorage.removeItem(key);
        localStorage.removeItem("cardforge_last_logo");
      }
    } catch(e) {}
  }, [currentUser, getLogoKey]);

  const [cardElements, setCardElements] = useState<CardElement[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "", firstName: "", lastName: "", gender: "", dateOfBirth: "", picture: "",
    email: "", mobileNumber: "", officeNumber: "",
    organization: "", category: "", function: "", jobTitle: "",
    nationality: "", documentType: "", idNumber: "", issueDate: "", expirationDate: "", uploadId: "",
    country: "", province: "", city: "", postalCode: ""
  });
  const [cardOrientation, setCardOrientation] = useState<"portrait" | "landscape" | "square" | string>("landscape");
  const [cardBgImage, setCardBgImage] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<{ id: string; name: string; date: string; thumbnail: string; elements: CardElement[]; eventId?: string }[]>([]);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [functions, setFunctions] = useState<MasterFunction[]>([]);
  const [countries, setCountries] = useState<MasterCountry[]>([]);
  const [cards, setCards] = useState<CardData[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const loadAllData = useCallback(async (user: AuthUser) => {
    try {
      const fetchedEvents = await apiGetEvents();
      setEvents(fetchedEvents);

      if (user.role === 'superadmin') {
        const fetchedUsers = await apiGetUsers();
        setUsers(fetchedUsers);
      }
    } catch (err) {
      console.error("Failed to load backend data", err);
    }
  }, []);

  const saveCard = useCallback(async (name: string) => {
    try {
      const newCard = await apiCreateCard({
        name,
        layout_json: cardElements,
        card_orientation: cardOrientation,
        background_color: "#13131e",
        event_id: currentUser?.eventId || null,
      });
      setSavedCards(prev => [{
        id: newCard.id,
        name: newCard.name,
        date: new Date().toISOString().split("T")[0],
        thumbnail: "",
        elements: cardElements,
        eventId: newCard.event_id || undefined,
      }, ...prev]);
      setActiveCardId(newCard.id);
      toast.success(`Card "${name}" saved successfully!`);
    } catch (err) {
      console.error("Failed to save card to database", err);
      toast.error("Failed to save card");
    }
  }, [cardElements, cardOrientation, currentUser]);

  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const branding = await apiGetBrandingSettings();
        setBrandingSettings(branding);
      } catch (e) {
        console.error("Failed to load branding settings", e);
      }

      const token = getToken();
      if (token) {
        try {
          const user = await apiGetMe();
          setCurrentUser(user);
          if (user.role === "admin" && user.eventId) {
            const firstEventId = Array.isArray(user.eventId) ? user.eventId[0] : user.eventId;
            if (firstEventId) setActiveEventId(firstEventId);
          }
          setIsLoggedIn(true);
          setPage("dashboard");
        } catch {
          clearToken();
          setIsLoggedIn(false);
          setCurrentUser(null);
          setPage("login");
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsInitializingAuth(false);
    };
    initAuth();
  }, []);

  React.useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadAllData(currentUser);
    }
  }, [isLoggedIn, currentUser, loadAllData]);

  React.useEffect(() => {
    if (isLoggedIn && currentUser) {
      const fetchScopedMasterData = async () => {
        try {
          const fetchEventId = activeEventId || undefined;
          apiGetCategories(fetchEventId).then(setCategories).catch(e => console.error(e));
          apiGetFunctions(activeEventId).then(setFunctions).catch(e => console.error(e));
          apiGetCountries(fetchEventId).then(setCountries).catch(e => console.error(e));
        } catch (err) {
          console.error("Failed to load scoped master data", err);
        }
      };
      fetchScopedMasterData();
    }
  }, [isLoggedIn, currentUser, activeEventId]);

  // Inactivity Auto-Logout (1 hour = 3600000 ms)
  useEffect(() => {
    if (!isLoggedIn) return;

    let inactivityTimer: number;

    const resetTimer = () => {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(() => {
        // Auto logout
        clearToken();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setPage("login");
        toast.error("You have been logged out due to inactivity.");
      }, 3600000); // 1 hour
    };

    // Events to track user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      window.clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoggedIn]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--background", theme.backgroundColor);
    root.style.setProperty("--foreground", theme.textColor);
    root.style.setProperty("--card", theme.cardColor);
    root.style.setProperty("--card-foreground", theme.textColor);
    root.style.setProperty("--popover", theme.cardColor);
    root.style.setProperty("--popover-foreground", theme.textColor);
    root.style.setProperty("--sidebar", theme.sidebarColor);
    root.style.setProperty("--sidebar-foreground", theme.textColor);
    root.style.setProperty("--primary", theme.primaryColor);
    root.style.setProperty("--accent", theme.accentColor || theme.primaryColor);
    root.style.setProperty("--muted-foreground", theme.textMutedColor);
    root.style.setProperty("--border", theme.borderColor);
    root.style.setProperty("--input", theme.inputColor);
    root.style.setProperty("--input-background", theme.inputColor);

    if (theme.isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);


  return (
    <AppContext.Provider value={{
      page, setPage,
      isLoggedIn, setIsLoggedIn,
      isInitializingAuth,
      currentUser, setCurrentUser,
      users, setUsers,
      events, setEvents,
      brandingSettings, setBrandingSettings,
      theme, setTheme,
      sidebarLogo, setSidebarLogo,
      sidebarCollapsed, setSidebarCollapsed,
      cardElements, setCardElements,
      formData, setFormData,
      cardOrientation, setCardOrientation,
      cardBgImage, setCardBgImage,
      savedCards, saveCard,
      cards, setCards,
      activeCardId, setActiveCardId,
      activeEventId, setActiveEventId,
      categories, setCategories,
      functions, setFunctions,
      countries, setCountries,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
