import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "./AppContext";
import { 
  MessageCircle, X, Send, ChevronLeft, User as UserIcon, Loader2, Image as ImageIcon, CheckCircle, Check
} from "lucide-react";
import { 
  apiGetTickets, apiCreateTicket, apiAssignTicket, apiSolveTicket, apiGetTicketMessages, apiSendTicketMessage,
  Ticket, TicketMessage
} from "../api";
import { toast } from "sonner";
import { exportToCsv } from "../utils/exportCsv";

export function ChatWidget() {
  const { theme, currentUser } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<{open: Ticket[], my_tickets: Ticket[]}>({ open: [], my_tickets: [] });
  const [adminTickets, setAdminTickets] = useState<Ticket[]>([]);
  
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // For Admin ticket creation
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  
  const [activeTab, setActiveTab] = useState<'open' | 'my'>('open'); // For Super Admin

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Notification Sound Base64
  const notificationSound = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAeAAASQACFhYWFhYWFhYWFhYWFhYWFhYWZmZmZmZmZmZmZmZmZmZmZmZmZ2dnd3d3d3d3d3d3d3d3d3d3d3f////////////////////8AAAAATGF2YzYwLjMxLjEwMgAAAAAAAAAAAAAAACw4AAAAAEAAAEkAjmNvwQAAAAAAAAAAAAAAAAAA//uQZAAAAiBEV0sEIAAAAAAIAAAACWkNXSxgigAAAAAgAAAAMFGAcAEAAAAGAAAEAAAABAAAGBgAAAABAAEAAQABAAEABACAAAAGAEAAAABAAAGAAAAAEAAQAA8DAwMAwMDAMDAwDAwMAwMDAMDAwEAy+A4GAwGAwGAwGAwGAwGAwGA4CgQBAICgQBAICgQBAICgQBAICgQBAICgQBAICAACAQCAQCAQCAQCAQCAQCAQEAgEBAICB5///wAECAQCAQCAQCAQCAQCAQCAQEAgEBAICB////f//wYEAwGAwGAwGAwGAwGAwGAwEAwEBAMCBP///7//+f////+P///38gL0JBU0UgUkVDRUlWRUQAx+J0/j2A4HA4HA4HA4HA4HA4HA4DgcBAEAACAQEAQEAQEAQEAQEAQEAQEAQEAQAACAQCAQCAQCAQCAQCAQCAQEAQEAQEAgP//wAABAgEAgEAgEAgEAgEAgEAgEBAEBQEBAQD//f//8GAQHA4HA4HA4HA4HA4HA4DAQBAUBAQEA//3///7////f///z////P//+W3Q3XyAAH//tQZAAM9AAANAAAEAAAABAAABAAAFyCgAAAAADQAAAAABAAAECiL0AAAAAAIAAAACAAAAAAgAAAAIAAAACAAAABIAAAAAgAAAAQAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAgAAAAAEAAAACAAAAABAAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAwAAAAQAAAAEAAAAAwAAAAIAAAAAgAAAAQAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAgAAAAAEAAAACAAAAABAAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAwAAAAQAAAAEAAAAAwAAAAIAAAQDAAAECgUFAoAAAECgUDAMAAAAgUDAMAAAAwTCAACBAoFAwKAAAAFAgGAwAAAAoFAgGAAAAMDAwA/8OAAIAAIEAgKBQAAAQCAQKBQAAAQFAoGAAAADAoEAwAAABAoGAwAAADAMDAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA///+FAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA//+QQA4D/8OAAIAAIEAgKBQAAAQCAQKBQAAAQFAoGAAAADAoEAwAAABAoGAwAAADAMDAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA///+FAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA//+QQQ4D/8OAAIAAIEAgKBQAAAQCAQKBQAAAQFAoGAAAADAoEAwAAABAoGAwAAADAMDAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA///+FAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA//+QRAoD/8OAAIAAIEAgKBQAAAQCAQKBQAAAQFAoGAAAADAoEAwAAABAoGAwAAADAMDAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA///+FAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA//+QRQwD/8OAAIAAIEAgKBQAAAQCAQKBQAAAQFAoGAAAADAoEAwAAABAoGAwAAADAMDAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA///+FAAECAQFAoFAAABAICgUCgAAAgUDAYAAAAMDAwA//+QQw4D//7kGQNjvQAAAA0AAABAAAAAIAAAAEAAAXIRcAAAAAAgAAAAIAAAAAgAAAAQAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAgAAAAAEAAAACAAAAABAAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAwAAAAQAAAAEAAAAAwAAAAIAAAAAgAAAAQAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAgAAAAAEAAAACAAAAABAAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAwAAAAQAAAAEAAAAAwAAAAIAAAACAAAABAAAAAgAAAADAAAAAgAAAAQAAAADAAAAAgAAAAIAAAAAAQAAAAIAAAAAEAAAAAgAAAADAAAAAgAAAAQAAAADAAAAAgAAAAMAAAAEAAAABAAAAAMAAAACAAAAAgAAAAQAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAgAAAAAEAAAACAAAAABAAAAAIAAAAAwAAAAIAAAAEAAAAAwAAAAIAAAAAwAAAAQAAAAEAAAAAwAAAAIA";

  // Poll for tickets
  useEffect(() => {
    if (!currentUser) return;
    
    let previousUnread = unreadCount;

    const fetchTickets = async () => {
      try {
        const res = await apiGetTickets();
        if (isSuperAdmin) {
          setTickets({ open: res.open || [], my_tickets: res.my_tickets || [] });
        } else {
          setAdminTickets(res.tickets || []);
        }
        
        const newUnread = res.unread_count || 0;
        if (newUnread > previousUnread && newUnread > 0) {
          // Play sound
          const audio = new Audio(notificationSound);
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play blocked by browser", e));
        }
        previousUnread = newUnread;
        setUnreadCount(newUnread);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      }
    };

    fetchTickets();
    const interval = setInterval(fetchTickets, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [currentUser, isSuperAdmin, unreadCount]);

  // Poll for messages when a ticket is active
  useEffect(() => {
    if (!activeTicket) return;
    
    const fetchMessages = async () => {
      try {
        const res = await apiGetTicketMessages(activeTicket.id);
        setActiveTicket(res.ticket); // Update ticket status in case it changed
        setMessages(res.messages);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));
    
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    setAttachment(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAttachmentPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;
    
    setIsSending(true);
    try {
      const newTicket = await apiCreateTicket(newTicketSubject, inputText, attachment || undefined);
      setAdminTickets(prev => [newTicket, ...prev]);
      setActiveTicket(newTicket);
      setIsCreatingTicket(false);
      setNewTicketSubject("");
      setInputText("");
      removeAttachment();
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket");
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    if (!inputText.trim() && !attachment) return;
    
    const tempText = inputText;
    const tempAtt = attachment;
    setInputText("");
    removeAttachment();
    setIsSending(true);
    
    try {
      const newMsg = await apiSendTicketMessage(activeTicket.id, tempText, tempAtt || undefined);
      setMessages(prev => [...prev, newMsg]);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
      setInputText(tempText);
      setAttachment(tempAtt);
    } finally {
      setIsSending(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!activeTicket) return;
    try {
      const updated = await apiAssignTicket(activeTicket.id);
      setActiveTicket(updated);
      toast.success("Ticket assigned to you");
    } catch(err: any) {
      toast.error(err.message || "Failed to assign ticket");
    }
  };

  const handleSolveTicket = async () => {
    if (!activeTicket) return;
    try {
      const updated = await apiSolveTicket(activeTicket.id);
      setActiveTicket(updated);
      toast.success("Ticket marked as solved");
    } catch(err: any) {
      toast.error(err.message || "Failed to solve ticket");
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: theme.primaryColor, color: "#fff",
          border: "none", cursor: "pointer", display: isOpen ? "none" : "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          transition: "transform 0.2s"
        }}
        className="hover:scale-105 active:scale-95"
      >
        <MessageCircle size={28} />
        {unreadCount > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4,
            background: "#ef4444", color: "#fff",
            fontSize: 12, fontWeight: "bold",
            width: 24, height: 24, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            border: "2px solid " + theme.cardColor
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", bottom: 24, right: 24, zIndex: 10000,
              width: 360, height: 500, borderRadius: 16,
              background: theme.cardColor, border: `1px solid ${theme.borderColor}`,
              boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
              display: "flex", flexDirection: "column", overflow: "hidden"
            }}
          >
            {/* Header */}
            <div style={{
              background: theme.primaryColor, color: "#fff",
              padding: "16px", display: "flex", alignItems: "center", gap: 12,
              flexShrink: 0
            }}>
              {(activeTicket || isCreatingTicket) && (
                <button 
                  onClick={() => { setActiveTicket(null); setIsCreatingTicket(false); }}
                  style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isCreatingTicket ? "New Ticket" : activeTicket ? activeTicket.subject : "Support Tickets"}
                </h3>
                {activeTicket && (
                  <p style={{ fontSize: 12, margin: 0, opacity: 0.8, textTransform: "capitalize" }}>
                    Status: {activeTicket.status.replace('_', ' ')}
                  </p>
                )}
              </div>
              
              <button 
                onClick={() => { setIsOpen(false); setActiveTicket(null); setIsCreatingTicket(false); }}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content area */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {!activeTicket && !isCreatingTicket ? (
                /* Ticket List */
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  {isSuperAdmin ? (
                    <>
                      {/* Tab Navigation */}
                      <div style={{ display: "flex", borderBottom: `1px solid ${theme.borderColor}`, justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", flex: 1 }}>
                          <button 
                            onClick={() => setActiveTab('open')}
                            style={{ flex: 1, padding: 12, background: "none", border: "none", borderBottom: activeTab === 'open' ? `2px solid ${theme.primaryColor}` : "2px solid transparent", color: activeTab === 'open' ? theme.primaryColor : theme.textMutedColor, fontWeight: 600, cursor: "pointer" }}
                          >
                            Open Tickets
                          </button>
                          <button 
                            onClick={() => setActiveTab('my')}
                            style={{ flex: 1, padding: 12, background: "none", border: "none", borderBottom: activeTab === 'my' ? `2px solid ${theme.primaryColor}` : "2px solid transparent", color: activeTab === 'my' ? theme.primaryColor : theme.textMutedColor, fontWeight: 600, cursor: "pointer" }}
                          >
                            My Tickets
                          </button>
                        </div>
                        <button 
                          onClick={() => {
                            const exportData = (activeTab === 'open' ? tickets.open : tickets.my_tickets).map(t => ({
                              ID: t.id,
                              Subject: t.subject,
                              Status: t.status,
                              Creator: t.creator?.name || '',
                              Assignee: t.assignee?.name || '',
                              CreatedAt: t.created_at,
                            }));
                            exportToCsv(`tickets_${activeTab}.csv`, exportData);
                          }}
                          style={{ padding: "4px 12px", marginRight: 8, fontSize: 11, background: `${theme.primaryColor}22`, color: theme.primaryColor, border: `1px solid ${theme.primaryColor}55`, borderRadius: 12, cursor: "pointer" }}
                        >
                          Export CSV
                        </button>
                      </div>
                      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                        {(activeTab === 'open' ? tickets.open : tickets.my_tickets)?.length === 0 ? (
                          <div style={{ padding: 32, textAlign: "center", color: theme.textMutedColor, fontSize: 14 }}>
                            No tickets found
                          </div>
                        ) : (
                          (activeTab === 'open' ? tickets.open : tickets.my_tickets)?.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setActiveTicket(t)}
                              style={{
                                width: "100%", padding: 12, display: "flex", flexDirection: "column", gap: 4,
                                background: theme.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                                border: `1px solid ${theme.borderColor}`, borderRadius: 10,
                                cursor: "pointer", textAlign: "left"
                              }}
                              className="hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.textColor, margin: 0 }}>{t.subject}</h4>
                                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: t.status === 'open' ? '#f59e0b' : t.status === 'in_progress' ? theme.primaryColor : '#10b981', color: '#fff' }}>
                                  {t.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: theme.textMutedColor, margin: 0 }}>By: {t.creator?.name}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: 12 }}>
                        <button 
                          onClick={() => setIsCreatingTicket(true)}
                          style={{ width: "100%", padding: 10, background: theme.primaryColor, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                        >
                          + New Ticket
                        </button>
                      </div>
                      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                        {adminTickets?.length === 0 ? (
                          <div style={{ padding: 32, textAlign: "center", color: theme.textMutedColor, fontSize: 14 }}>
                            You have no tickets
                          </div>
                        ) : (
                          adminTickets?.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setActiveTicket(t)}
                              style={{
                                width: "100%", padding: 12, display: "flex", flexDirection: "column", gap: 4,
                                background: theme.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                                border: `1px solid ${theme.borderColor}`, borderRadius: 10,
                                cursor: "pointer", textAlign: "left"
                              }}
                              className="hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.textColor, margin: 0 }}>{t.subject}</h4>
                                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: t.status === 'open' ? '#f59e0b' : t.status === 'in_progress' ? theme.primaryColor : '#10b981', color: '#fff' }}>
                                  {t.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: theme.textMutedColor, margin: 0 }}>{t.assignee ? `Assigned to: ${t.assignee.name}` : 'Unassigned'}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : isCreatingTicket ? (
                /* Create Ticket Form */
                <form onSubmit={handleCreateTicket} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: theme.textMutedColor, marginBottom: 4, display: "block" }}>Subject</label>
                    <input 
                      required
                      type="text" 
                      value={newTicketSubject}
                      onChange={e => setNewTicketSubject(e.target.value)}
                      placeholder="Issue summary..."
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${theme.borderColor}`, background: theme.cardColor, color: theme.textColor }}
                    />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: theme.textMutedColor, marginBottom: 4, display: "block" }}>Message</label>
                    <textarea 
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Describe your issue..."
                      style={{ flex: 1, width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${theme.borderColor}`, background: theme.cardColor, color: theme.textColor, resize: "none" }}
                    />
                  </div>
                  {attachmentPreview && (
                    <div style={{ position: "relative", width: 80, height: 80 }}>
                      <img src={attachmentPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                      <button type="button" onClick={removeAttachment} style={{ position: "absolute", top: -8, right: -8, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <label style={{
                      padding: "10px", borderRadius: 8, border: `1px solid ${theme.borderColor}`, background: theme.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                      color: theme.textColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <ImageIcon size={20} />
                      <input type="file" accept="image/*" onChange={handleAttachmentChange} style={{ display: "none" }} />
                    </label>
                    <button type="submit" disabled={isSending || !newTicketSubject.trim()} style={{ flex: 1, padding: "10px", background: theme.primaryColor, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      {isSending ? <Loader2 size={20} className="animate-spin" /> : "Submit Ticket"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Chat Messages */
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: "100%" }}>
                  {isSuperAdmin && activeTicket.status === 'open' && (
                    <div style={{ padding: 16, background: theme.primaryColor + "15", borderRadius: 8, border: `1px solid ${theme.primaryColor}30`, textAlign: "center" }}>
                      <p style={{ margin: "0 0 12px", fontSize: 13, color: theme.textColor }}>This ticket is unassigned.</p>
                      <button onClick={handleAssignTicket} style={{ padding: "8px 16px", background: theme.primaryColor, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                        Pick Up Ticket
                      </button>
                    </div>
                  )}

                  {isLoading && messages?.length === 0 ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                      <Loader2 size={24} className="animate-spin" color={theme.primaryColor} />
                    </div>
                  ) : messages?.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center", color: theme.textMutedColor, fontSize: 13, margin: "auto" }}>
                      No messages yet.
                    </div>
                  ) : (
                    messages?.map((m, idx) => {
                      const isMe = m.sender_id === currentUser.id;
                      return (
                        <div key={m.id || idx} style={{
                          display: "flex", flexDirection: "column",
                          alignItems: isMe ? "flex-end" : "flex-start",
                          maxWidth: "100%"
                        }}>
                          <div style={{
                            background: isMe ? theme.primaryColor : (theme.isDark ? "#2a2a3a" : "#f1f5f9"),
                            color: isMe ? "#fff" : theme.textColor,
                            padding: "10px 14px", borderRadius: 16,
                            borderBottomRightRadius: isMe ? 4 : 16,
                            borderBottomLeftRadius: !isMe ? 4 : 16,
                            maxWidth: "85%", fontSize: 14, lineHeight: 1.4,
                            wordBreak: "break-word"
                          }}>
                            {m.attachment_url && (
                              <img src={m.attachment_url} alt="Attachment" style={{ width: "100%", borderRadius: 8, marginBottom: m.message ? 8 : 0 }} />
                            )}
                            {m.message}
                          </div>
                          <span style={{ fontSize: 10, color: theme.textMutedColor, marginTop: 4, padding: "0 4px" }}>
                            {m.sender?.name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  {activeTicket.status === 'solved' && (
                    <div style={{ textAlign: "center", margin: "16px 0", padding: 12, background: "#10b98115", borderRadius: 8, color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <CheckCircle size={16} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>This ticket has been marked as solved.</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            {activeTicket && activeTicket.status !== 'solved' && (activeTicket.status !== 'open' || isSuperAdmin) && (
              <div style={{ padding: 12, borderTop: `1px solid ${theme.borderColor}`, background: theme.cardColor, flexShrink: 0 }}>
                {attachmentPreview && (
                  <div style={{ position: "relative", width: 60, height: 60, marginBottom: 8 }}>
                    <img src={attachmentPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    <button type="button" onClick={removeAttachment} style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={10} />
                    </button>
                  </div>
                )}
                <form 
                  onSubmit={handleSend}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <label style={{ cursor: "pointer", color: theme.textMutedColor, padding: 4 }}>
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" onChange={handleAttachmentChange} style={{ display: "none" }} />
                  </label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                      flex: 1, padding: "10px 14px", borderRadius: 20,
                      border: `1px solid ${theme.borderColor}`,
                      background: theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                      color: theme.textColor, fontSize: 14, outline: "none"
                    }}
                    disabled={isSending || activeTicket.status === 'open'} // Disable typing if open, must pick up first
                  />
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !attachment) || isSending || activeTicket.status === 'open'}
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: (inputText.trim() || attachment) ? theme.primaryColor : theme.borderColor,
                      color: "#fff", border: "none", cursor: (inputText.trim() || attachment) ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      transition: "background 0.2s"
                    }}
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} style={{ marginLeft: -2 }} />}
                  </button>
                </form>
                {activeTicket.status === 'in_progress' && (
                  <button onClick={handleSolveTicket} style={{ width: "100%", marginTop: 8, padding: 8, background: "none", border: `1px solid #10b981`, color: "#10b981", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Check size={14} /> Mark as Solved
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
