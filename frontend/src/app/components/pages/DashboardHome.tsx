import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useApp } from "../AppContext";
import { CreditCard, FileText, Download, TrendingUp, Users, Clock, ArrowRight, Plus, Eye, Database, CalendarDays, ShieldCheck } from "lucide-react";
import { apiGetDashboardStats } from "../../api";
import { DashboardCharts } from "../DashboardCharts";

const R = 6;

const RECENT_CARDS = [
  { id: "1", name: "Corporate Badge", type: "Employee ID", date: "Dec 10, 2024", status: "exported", color: "#7c5cfc" },
  { id: "2", name: "Conference Pass", type: "Visitor Card", date: "Dec 8, 2024", status: "draft", color: "#0ea5e9" },
  { id: "3", name: "Department Card", type: "ID Card", date: "Dec 5, 2024", status: "exported", color: "#10b981" },
  { id: "4", name: "Contractor Badge", type: "Access Card", date: "Dec 2, 2024", status: "draft", color: "#f59e0b" },
];

const ACTIVITY = [
  { action: "Card exported", target: "Corporate Badge", time: "2 hours ago", icon: <Download size={13} /> },
  { action: "New card created", target: "Q1 Visitor Pass", time: "Yesterday", icon: <Plus size={13} /> },
  { action: "Form submitted", target: "John Martinez", time: "2 days ago", icon: <FileText size={13} /> },
  { action: "Country added", target: "Netherlands · NL", time: "3 days ago", icon: <Database size={13} /> },
];

const SUPERADMIN_ACTIVITY = [
  { action: "New event created", target: "Startup Founder Gathering", time: "2 hours ago", icon: <CalendarDays size={13} /> },
  { action: "Admin registered", target: "Event Admin", time: "Yesterday", icon: <Users size={13} /> },
  { action: "Master Data updated", target: "New functions added", time: "2 days ago", icon: <Database size={13} /> },
  { action: "System backup", target: "Automated", time: "3 days ago", icon: <ShieldCheck size={13} /> },
];

export function DashboardHome() {
  const { theme, setPage, savedCards, currentUser, events, users, cards } = useApp();
  const isSuperadmin = currentUser?.role === "superadmin";
  const userName = currentUser?.name ?? "User";
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    apiGetDashboardStats().then(setStatsData).catch(console.error);
  }, []);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = isSuperadmin
    ? [
        { label: "Total Cards", value: savedCards.length + 12, change: "+4 this month", icon: <CreditCard size={18} />, color: theme.primaryColor },
        { label: "Active Events", value: events.filter(e => e.active).length, change: `${events.length} total`, icon: <CalendarDays size={18} />, color: "#10b981" },
        { label: "Exports", value: 41, change: "+12 this month", icon: <Download size={18} />, color: "#0ea5e9" },
        { label: "Active Users", value: users.filter(u => u.active).length, change: `${users.length} total`, icon: <Users size={18} />, color: "#f59e0b" },
      ]
    : [
        { label: "My Cards", value: savedCards.filter(c => c.eventId === currentUser?.eventId).length + 5, change: "+2 this week", icon: <CreditCard size={18} />, color: theme.primaryColor },
        { label: "Forms Submitted", value: 8, change: "+3 this week", icon: <FileText size={18} />, color: "#10b981" },
        { label: "Exports", value: 12, change: "+5 this month", icon: <Download size={18} />, color: "#0ea5e9" },
        { label: "My Event", value: 1, change: events.find(e => e.id === currentUser?.eventId)?.name ?? "—", icon: <CalendarDays size={18} />, color: "#f59e0b" },
      ];

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}`, ...extra }}>
      {children}
    </div>
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ borderRadius: R * 2, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
          background: `linear-gradient(135deg, ${theme.primaryColor}18 0%, ${theme.primaryColor}06 100%)`,
          border: `1px solid ${theme.primaryColor}28` }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: theme.textColor, margin: 0 }}>
              {greeting}, {userName.split(" ")[0]} 👋
            </h2>
          </div>
          {isSuperadmin && (
            <p style={{ color: theme.textMutedColor, fontSize: 13, margin: 0 }}>
              {events.filter(e => e.active).length} active events · {users.filter(u => u.active).length} team members
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isSuperadmin ? (
            <button onClick={() => setPage("superadmin-events")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13 }}>
              <CalendarDays size={13} /> Manage Events
            </button>
          ) : (
            <button onClick={() => setPage("forms")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13 }}>
              <FileText size={13} /> Fill Form
            </button>
          )}
        </div>
      </motion.div>

      {/* Superadmin Quick Stats */}
      {isSuperadmin && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {card(
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: R * 1.5, background: `${theme.primaryColor}14`, color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={20} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.textColor, lineHeight: 1 }}>{events.length}</div>
                <div style={{ fontSize: 13, color: theme.textMutedColor, marginTop: 4 }}>Total Events</div>
              </div>
            </div>
          )}
          {card(
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: R * 1.5, background: "rgba(245, 158, 11, 0.14)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.textColor, lineHeight: 1 }}>{users.filter(u => !u.eventId && u.role !== "superadmin").length}</div>
                <div style={{ fontSize: 13, color: theme.textMutedColor, marginTop: 4 }}>Unassigned Admins</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cards + Activity */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {card(
            <div style={{ padding: "18px 20px", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: theme.textColor, margin: 0 }}>Demographics Overview</h3>
              </div>
              <div style={{ display: "flex", gap: 20, flex: 1 }}>
                <div style={{ flex: 1, padding: 24, borderRadius: R * 1.5, background: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 42, fontWeight: 700, color: "#0ea5e9", fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>{cards.filter(c => c.participant_data?.gender?.toLowerCase() === 'male').length}</div>
                  <div style={{ fontSize: 14, color: theme.textColor, fontWeight: 600, marginTop: 12 }}>Male Participants</div>
                  <div style={{ fontSize: 11, color: theme.textMutedColor, marginTop: 4 }}>{isSuperadmin ? `from ${events.length} events` : `from this event`}</div>
                </div>
                <div style={{ flex: 1, padding: 24, borderRadius: R * 1.5, background: "rgba(236, 72, 153, 0.08)", border: "1px solid rgba(236, 72, 153, 0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 42, fontWeight: 700, color: "#ec4899", fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>{cards.filter(c => c.participant_data?.gender?.toLowerCase() === 'female').length}</div>
                  <div style={{ fontSize: 14, color: theme.textColor, fontWeight: 600, marginTop: 12 }}>Female Participants</div>
                  <div style={{ fontSize: 11, color: theme.textMutedColor, marginTop: 4 }}>{isSuperadmin ? `from ${events.length} events` : `from this event`}</div>
                </div>
              </div>
            </div>
          )}

          {/* Activity */}
          {card(
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Clock size={14} style={{ color: theme.textMutedColor }} />
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: theme.textColor, margin: 0 }}>Recent Activity</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(isSuperadmin ? SUPERADMIN_ACTIVITY : ACTIVITY).map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: R, background: `${theme.primaryColor}14`, color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: theme.textColor }}>{a.action}</div>
                      <div style={{ fontSize: 11, color: theme.textMutedColor }}>{a.target} · {a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {/* Country Breakdown */}
          {card(
            <div style={{ padding: "18px 20px", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Database size={14} style={{ color: theme.textMutedColor }} />
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: theme.textColor, margin: 0 }}>Participants by Country</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {(() => {
                  const countryCounts = cards.reduce((acc, c) => {
                    const country = c.participant_data?.country || "Unknown";
                    acc[country] = (acc[country] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                  
                  if (topCountries.length === 0) {
                    return <div style={{ color: theme.textMutedColor, fontSize: 13, textAlign: "center", marginTop: 20 }}>No data available</div>;
                  }

                  const data = topCountries.map(([name, value]) => ({ name, value }));
                  const COLORS = [theme.primaryColor, "#0ea5e9", "#ec4899", "#f59e0b", "#10b981"];

                  return (
                    <div style={{ height: 200, width: "100%", marginTop: 10 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: theme.cardColor, borderColor: theme.borderColor, borderRadius: 8, fontSize: 12, color: theme.textColor }}
                            itemStyle={{ color: theme.textColor, fontWeight: 600 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
      </div>

      {/* Charts Section */}
      <DashboardCharts data={statsData?.chartData || []} />

    </div>
  );
}
