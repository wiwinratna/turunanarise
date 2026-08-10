/**
 * api.ts — Centralized API client
 * Connects to Laravel backend API.
 */

const BASE_URL = import.meta.env.PROD ? "https://arise2.poyekterapan1.com/api/api" : "/api";
const TOKEN_KEY = "cardforge_token";

// ─── Token helpers ──────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Generic fetch wrapper ──────────────────────────────────────────────────
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(options.headers as Record<string, string>),
  };
  
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      clearToken();
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  
  if (res.status === 429) {
    throw new Error("Too many requests. Please try again later.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  
  return res.json();
}

// ─── Auth API ───────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  eventId: string | string[] | null;
  avatar?: string;
  theme?: any;
  logo?: string;
  active: boolean;
}

export async function apiLogin(payload: LoginPayload): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload),
  });
  
  if (res.status === 429) {
    throw new Error("Too many login attempts. Please try again later.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Invalid credentials");
  }
  
  const data = await res.json();
  setToken(data.token);
  
  const rawEventId = data.user.event_id;
  const user: AuthUser = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
    eventId: Array.isArray(rawEventId) ? rawEventId : rawEventId ? [rawEventId] : null,
    avatar: data.user.avatar,
    theme: data.user.theme,
    logo: data.user.logo,
    active: !!data.user.active,
  };
  
  return { user, token: data.token };
}

export async function apiUpdateProfile(payload: { name: string; email: string; avatar?: string; theme?: any; logo?: string }): Promise<AuthUser> {
  const res = await fetchWithAuth("/auth/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const rawEventId = res.event_id;
  return {
    id: res.id,
    name: res.name,
    email: res.email,
    role: res.role,
    eventId: Array.isArray(rawEventId) ? rawEventId : rawEventId ? [rawEventId] : null,
    avatar: res.avatar,
    theme: res.theme,
    logo: res.logo,
    active: !!res.active,
  };
}

export async function apiUpdatePassword(payload: { current_password: string; new_password: string; new_password_confirmation: string }): Promise<{ message: string }> {
  const res = await fetchWithAuth("/auth/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function apiLogout() {
  try {
    await fetchWithAuth("/auth/logout", { method: "POST" });
  } catch {
    // Ignore error on logout
  } finally {
    clearToken();
  }
}

export async function apiGetMe(): Promise<AuthUser> {
  const u = await fetchWithAuth("/auth/me");
  const rawEventId = u.event_id;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    eventId: Array.isArray(rawEventId) ? rawEventId : rawEventId ? [rawEventId] : null,
    avatar: u.avatar,
    theme: u.theme,
    logo: u.logo,
    active: !!u.active,
  };
}

// ─── Settings API ───────────────────────────────────────────────────────────
export interface BrandingSettings {
  layout?: "split-right" | "split-left" | "centered";
  title?: string;
  subtitle?: string;
  textColor?: string;
  primaryColor?: string;
  backgroundColor?: string;
  panelColor?: string;
  backgroundImage?: string;
  logoUrl?: string;
  logoText?: string;
}

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  layout: "split-right",
  title: "Design without limits.",
  subtitle: "The modern workspace for premium digital card creation.",
  textColor: "#ffffff",
  primaryColor: "#7c5cfc",
  backgroundColor: "#050509",
  panelColor: "#0a0a10",
  backgroundImage: "",
  logoUrl: "",
  logoText: "Arise 2"
};

export async function apiGetBrandingSettings(): Promise<BrandingSettings> {
  try {
    const res = await fetch(`${BASE_URL}/settings/branding`, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.branding || {};
  } catch (e) {
    return {};
  }
}

export async function apiUpdateBrandingSettings(settings: BrandingSettings) {
  return fetchWithAuth("/settings/branding", {
    method: "POST",
    body: JSON.stringify(settings)
  });
}

export async function apiUploadBrandingImage(file: File): Promise<{url: string}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWithAuth("/settings/upload", {
    method: "POST",
    headers: {
      "Accept": "application/json"
    },
    body: formData
  });
  
  return res;
}

// ─── Ticketing API ────────────────────────────────────────────────────────────
export interface Ticket {
  id: string;
  creator_id: string;
  assignee_id: string | null;
  subject: string;
  status: 'open' | 'in_progress' | 'solved';
  created_at: string;
  creator?: { id: string; name: string; avatar: string | null };
  assignee?: { id: string; name: string; avatar: string | null };
}

export interface TicketMessage {
  id: number;
  ticket_id: string;
  sender_id: string;
  message: string | null;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: { id: string; name: string; avatar: string | null };
}

export async function apiGetTickets(): Promise<any> {
  return fetchWithAuth("/tickets");
}

export async function apiCreateTicket(subject: string, message?: string, attachment?: File): Promise<Ticket> {
  const token = getToken();
  const formData = new FormData();
  formData.append("subject", subject);
  if (message) formData.append("message", message);
  if (attachment) formData.append("attachment", attachment);

  const res = await fetch(`${BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Error: ${res.status}`);
  }
  return res.json();
}

export async function apiAssignTicket(ticketId: string): Promise<Ticket> {
  return fetchWithAuth(`/tickets/${ticketId}/assign`, { method: "PUT" });
}

export async function apiSolveTicket(ticketId: string): Promise<Ticket> {
  return fetchWithAuth(`/tickets/${ticketId}/solve`, { method: "PUT" });
}

export async function apiGetTicketMessages(ticketId: string): Promise<{ticket: Ticket, messages: TicketMessage[]}> {
  const res = await fetchWithAuth(`/tickets/${ticketId}/messages`);
  if (res.messages) {
    res.messages = res.messages.map((m: any) => ({
      ...m,
      attachment_url: m.attachment_url ? (m.attachment_url.startsWith('http') ? m.attachment_url : `${BASE_URL}${m.attachment_url}`) : null
    }));
  }
  return res;
}

export async function apiSendTicketMessage(ticketId: string, message?: string, attachment?: File): Promise<TicketMessage> {
  const token = getToken();
  const formData = new FormData();
  if (message) formData.append("message", message);
  if (attachment) formData.append("attachment", attachment);

  const res = await fetch(`${BASE_URL}/tickets/${ticketId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Error: ${res.status}`);
  }
  const data = await res.json();
  if (data.attachment_url) {
    data.attachment_url = data.attachment_url.startsWith('http') ? data.attachment_url : `${BASE_URL}${data.attachment_url}`;
  }
  return data;
}

// ─── Users API (Superadmin) ─────────────────────────────────────────────────
export async function apiGetUsers(): Promise<AuthUser[]> {
  const users = await fetchWithAuth("/users");
  return users.map((u: any) => {
    const rawEventId = u.event_id;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      eventId: Array.isArray(rawEventId) ? rawEventId : rawEventId ? [rawEventId] : null,
      avatar: u.avatar,
      active: u.active
    };
  });
}

export async function apiCreateUser(data: Partial<AuthUser> & { password?: string }): Promise<AuthUser> {
  const payload: Record<string, any> = {
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || "admin",
    event_id: data.eventId ?? null,
    avatar: data.avatar,
    active: data.active ?? true,
  };
  const u = await fetchWithAuth("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const rawEventId = u.event_id;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    eventId: Array.isArray(rawEventId) ? rawEventId : rawEventId ? [rawEventId] : null,
    avatar: u.avatar,
    active: u.active
  };
}

export async function apiUpdateUser(id: string, data: Partial<AuthUser> & { password?: string }): Promise<AuthUser> {
  const payload: Record<string, any> = {
    name: data.name,
    email: data.email,
    role: data.role,
    event_id: data.eventId ?? undefined,
    avatar: data.avatar,
    active: data.active,
  };
  if (data.password) {
    payload.password = data.password;
  }
  const u = await fetchWithAuth(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const rawEventId = u.event_id;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    eventId: Array.isArray(rawEventId) ? rawEventId : rawEventId ? [rawEventId] : null,
    avatar: u.avatar,
    active: u.active
  };
}

export async function apiDeleteUser(id: string): Promise<void> {
  await fetchWithAuth(`/users/${id}`, { method: "DELETE" });
}

// ─── Events API ─────────────────────────────────────────────────────────────
export interface EventData {
  id: string;
  eventCode: string;
  name: string;
  date: string;
  location: string;
  countryId?: string;
  description: string;
  active: boolean;
  cardCount: number;
}

export async function apiGetEvents(): Promise<EventData[]> {
  const events = await fetchWithAuth("/events");
  return events.map((e: any) => ({
    id: e.id,
    eventCode: e.event_code,
    name: e.name,
    date: e.date,
    location: e.location,
    countryId: e.country_id,
    description: e.description,
    active: e.active,
    cardCount: e.cards_count ?? 0,
  }));
}

export async function apiGetEvent(id: string): Promise<EventData> {
  const e = await fetchWithAuth(`/events/${id}`);
  return {
    id: e.id,
    eventCode: e.event_code,
    name: e.name,
    date: e.date,
    location: e.location,
    countryId: e.country_id,
    description: e.description,
    active: e.active,
    cardCount: e.cards_count ?? 0,
  };
}

export async function apiCreateEvent(data: Partial<EventData>): Promise<EventData> {
  const payload = {
    event_code: data.eventCode,
    name: data.name,
    date: data.date,
    location: data.location,
    country_id: data.countryId,
    description: data.description,
    active: data.active,
  };
  const e = await fetchWithAuth("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    id: e.id,
    eventCode: e.event_code,
    name: e.name,
    date: e.date,
    location: e.location,
    countryId: e.country_id,
    description: e.description,
    active: e.active,
    cardCount: 0,
  };
}

export async function apiUpdateEvent(id: string, data: Partial<EventData>): Promise<EventData> {
  const payload: Record<string, any> = {
    name: data.name,
    date: data.date,
    location: data.location,
    country_id: data.countryId,
    description: data.description,
    active: data.active,
  };
  const e = await fetchWithAuth(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return {
    id: e.id,
    eventCode: e.event_code,
    name: e.name,
    date: e.date,
    location: e.location,
    description: e.description,
    active: e.active,
    cardCount: e.cards_count ?? 0,
  };
}

export async function apiCheckEventCode(code: string): Promise<boolean> {
  const res = await fetchWithAuth(`/events/check-code?code=${encodeURIComponent(code)}`);
  return res.exists === true;
}

export async function apiDeleteEvent(id: string): Promise<void> {
  await fetchWithAuth(`/events/${id}`, { method: "DELETE" });
}

// ─── Participants API ───────────────────────────────────────────────────────
export interface ParticipantData {
  id: string;
  event_id: string;
  name: string;
  job_title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  id_type: string | null;
  employee_id: string | null;
  category_id: string | null;
  function_id: string | null;
  nationality: string | null;
  custom_fields: Record<string, string> | null;
  created_at?: string;
  updated_at?: string;
  card?: CardData | null;
  event?: Event | null;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export async function apiGetParticipants(
  eventId?: string | null,
  page: number = 1,
  perPage: number = 20,
  search: string = "",
  sort: string = "created_at",
  direction: string = "desc"
): Promise<PaginatedResponse<ParticipantData>> {
  let url = `/participants?page=${page}&per_page=${perPage}&sort=${sort}&direction=${direction}`;
  if (eventId) url += `&event_id=${eventId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return fetchWithAuth(url);
}

export async function apiCreateParticipant(data: Record<string, any>): Promise<{ participant: ParticipantData; card: CardData }> {
  return fetchWithAuth("/participants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateParticipant(id: string, data: Record<string, any>): Promise<ParticipantData> {
  return fetchWithAuth(`/participants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteParticipant(id: string): Promise<void> {
  await fetchWithAuth(`/participants/${id}`, { method: "DELETE" });
}

// ─── Cards API ──────────────────────────────────────────────────────────────
export interface CardData {
  id: string;
  name: string;
  layout_json: any[];
  card_orientation: "portrait" | "landscape" | "square";
  background_color: string;
  status: "draft" | "completed" | "updated" | "error";
  user_id: string;
  event_id: string | null;
  thumbnail_path: string | null;
  participant_data: Record<string, string> | null;
  layout_done: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function apiGetCards(
  eventId?: string | null,
  page: number = 1,
  perPage: number = 20,
  search: string = "",
  sort: string = "created_at",
  direction: string = "desc"
): Promise<PaginatedResponse<CardData>> {
  let url = `/cards?page=${page}&per_page=${perPage}&sort=${sort}&direction=${direction}`;
  if (eventId) url += `&event_id=${eventId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return fetchWithAuth(url);
}

export async function apiGetCard(id: string): Promise<CardData> {
  return fetchWithAuth(`/cards/${id}`);
}

export async function apiCreateCard(data: Partial<CardData> & { participant_data?: Record<string, string> }): Promise<CardData> {
  const payload = {
    name: data.name,
    layout_json: data.layout_json ?? [],
    card_orientation: data.card_orientation ?? 'landscape',
    background_color: data.background_color ?? '#13131e',
    event_id: data.event_id,
    participant_data: data.participant_data ?? null,
  };
  return fetchWithAuth("/cards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateCard(id: string, data: Partial<CardData>): Promise<CardData> {
  const payload: Record<string, any> = {};
  if (data.card_orientation !== undefined) payload.card_orientation = data.card_orientation;
  if (data.background_color !== undefined) payload.background_color = data.background_color;
  if (data.status !== undefined) payload.status = data.status;
  if (data.thumbnail_path !== undefined) payload.thumbnail_path = data.thumbnail_path;
  return fetchWithAuth(`/cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateCardLayout(id: string, layout: { elements: any[]; card_orientation?: string; background_color?: string }): Promise<CardData> {
  return fetchWithAuth(`/cards/${id}/layout`, {
    method: "PUT",
    body: JSON.stringify(layout),
  });
}

export async function apiUpdateCardStatus(id: string, status: "draft" | "completed" | "updated" | "error"): Promise<CardData> {
  return fetchWithAuth(`/cards/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function apiDeleteCard(id: string): Promise<void> {
  await fetchWithAuth(`/cards/${id}`, { method: "DELETE" });
}

export async function apiExportCard(id: string): Promise<void> {
  await fetchWithAuth(`/cards/${id}/export`, { method: "POST" });
}

// ─── Event Layout API ────────────────────────────────────────────────────────
export interface EventLayoutData {
  event_id: string;
  has_layout: boolean;
  elements: any[];
  card_orientation: "portrait" | "landscape" | "square";
  background_color: string;
}

export async function apiGetEventLayout(eventId: string): Promise<EventLayoutData> {
  return fetchWithAuth(`/events/${eventId}/layout`);
}

export async function apiSaveEventLayout(eventId: string, layout: {
  elements: any[];
  card_orientation?: string;
  background_color?: string;
}): Promise<EventLayoutData> {
  return fetchWithAuth(`/events/${eventId}/layout`, {
    method: "PUT",
    body: JSON.stringify(layout),
  });
}

// ─── WhatsApp API ───────────────────────────────────────────────────────────
export async function apiSendWhatsApp(phone: string, cardId: string): Promise<{ success: boolean; waUrl: string }> {
  return fetchWithAuth(`/cards/${cardId}/share`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────
export interface DashboardStats {
  totalCards: number;
  formsSubmitted: number;
  exports: number;
  activeUsers: number;
  totalEvents: number;
}

export async function apiGetDashboardStats(): Promise<DashboardStats> {
  return fetchWithAuth("/dashboard/stats");
}

// ─── Master Data: Categories ───────────────────────────────────────────────
export interface MasterCategory {
  id: string;
  eventId?: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export async function apiGetCategories(eventId?: string): Promise<MasterCategory[]> {
  const url = eventId ? `/categories?event_id=${eventId}` : "/categories";
  return fetchWithAuth(url);
}


export async function apiCreateCategory(data: Partial<MasterCategory>): Promise<MasterCategory> {
  const payload = {
    id: data.id,
    event_id: data.eventId,
    code: data.code,
    name: data.name,
    description: data.description,
    active: data.active,
  };
  const res = await fetchWithAuth("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { id: res.id, eventId: res.event_id, code: res.code, name: res.name, description: res.description, active: res.active };
}

export async function apiUpdateCategory(id: string, data: Partial<MasterCategory>): Promise<MasterCategory> {
  const res = await fetchWithAuth(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return { id: res.id, eventId: res.event_id, code: res.code, name: res.name, description: res.description, active: res.active };
}

export async function apiDeleteCategory(id: string): Promise<void> {
  await fetchWithAuth(`/categories/${id}`, { method: "DELETE" });
}

// ─── Master Data: Functions ────────────────────────────────────────────────
export interface MasterFunction {
  id: string;
  eventId?: string;
  code: string;
  name: string;
  categoryId: string;
  description: string;
  active: boolean;
}

export async function apiGetFunctions(eventId?: string): Promise<MasterFunction[]> {
  const url = eventId ? `/functions?event_id=${eventId}` : "/functions";
  const functions = await fetchWithAuth(url);
  return functions.map((f: any) => ({
    id: f.id,
    eventId: f.event_id,
    code: f.code,
    name: f.name,
    categoryId: f.category_id,
    description: f.description,
    active: f.active,
  }));
}

export async function apiCreateFunction(data: Partial<MasterFunction>): Promise<MasterFunction> {
  const payload = {
    id: data.id,
    event_id: data.eventId,
    code: data.code,
    name: data.name,
    category_id: data.categoryId,
    description: data.description,
    active: data.active,
  };
  const f = await fetchWithAuth("/functions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    id: f.id,
    code: f.code,
    name: f.name,
    categoryId: f.category_id,
    description: f.description,
    active: f.active,
  };
}

export async function apiUpdateFunction(id: string, data: Partial<MasterFunction>): Promise<MasterFunction> {
  const payload = {
    code: data.code,
    name: data.name,
    category_id: data.categoryId,
    description: data.description,
    active: data.active,
  };
  const f = await fetchWithAuth(`/functions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return {
    id: f.id,
    code: f.code,
    name: f.name,
    categoryId: f.category_id,
    description: f.description,
    active: f.active,
  };
}

export async function apiDeleteFunction(id: string): Promise<void> {
  await fetchWithAuth(`/functions/${id}`, { method: "DELETE" });
}

// ─── Master Data: Countries ────────────────────────────────────────────────
export interface MasterCountry {
  id: string;
  eventId: string;
  flag: string;
  code: string;
  gymCode: string;
  name: string;
  active: boolean;
}

export async function apiGetCountries(eventId?: string): Promise<MasterCountry[]> {
  const url = eventId ? `/countries?event_id=${eventId}` : "/countries";
  const countries = await fetchWithAuth(url);
  return countries.map((c: any) => ({
    id: c.id,
    eventId: c.event_id,
    flag: c.flag,
    code: c.code,
    gymCode: c.gym_code,
    name: c.name,
    active: c.active,
  }));
}

export async function apiCreateCountry(data: Partial<MasterCountry>): Promise<MasterCountry> {
  const payload = {
    id: data.id,
    event_id: data.eventId,
    flag: data.flag,
    code: data.code,
    gym_code: data.gymCode,
    name: data.name,
    active: data.active,
  };
  const c = await fetchWithAuth("/countries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    id: c.id,
    flag: c.flag,
    code: c.code,
    gymCode: c.gym_code,
    name: c.name,
    active: c.active,
  };
}

export async function apiUpdateCountry(id: string, data: Partial<MasterCountry>): Promise<MasterCountry> {
  const payload = {
    flag: data.flag,
    code: data.code,
    gym_code: data.gymCode,
    name: data.name,
    active: data.active,
  };
  const c = await fetchWithAuth(`/countries/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return {
    id: c.id,
    eventId: c.event_id,
    flag: c.flag,
    code: c.code,
    gymCode: c.gym_code,
    name: c.name,
    active: c.active,
  };
}

export async function apiDeleteCountry(id: string): Promise<void> {
  await fetchWithAuth(`/countries/${id}`, { method: "DELETE" });
}
