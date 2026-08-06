import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useApp } from './AppContext';

interface DashboardChartsProps {
  data: any[];
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const { theme, currentUser } = useApp();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  if (!data || data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: theme.cardColor,
          border: `1px solid ${theme.borderColor}`,
          padding: 12,
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: theme.textColor }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
              <span style={{ color: theme.textMutedColor, fontSize: 12 }}>{entry.name}:</span>
              <span style={{ color: theme.textColor, fontWeight: 'bold', fontSize: 12 }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 24 }}>
      {/* Cards Trend Chart */}
      <div style={{ 
        background: theme.cardColor, 
        border: `1px solid ${theme.borderColor}`, 
        borderRadius: 12, 
        padding: 24,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textColor, margin: '0 0 24px 0' }}>Cards Generated Trend</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.primaryColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={theme.primaryColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.borderColor} vertical={false} />
              <XAxis dataKey="name" stroke={theme.textMutedColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={theme.textMutedColor} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cards" name="Cards Generated" stroke={theme.primaryColor} fillOpacity={1} fill="url(#colorCards)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Support Tickets Chart (SuperAdmin only) */}
      {isSuperAdmin && (
        <div style={{ 
          background: theme.cardColor, 
          border: `1px solid ${theme.borderColor}`, 
          borderRadius: 12, 
          padding: 24,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textColor, margin: '0 0 24px 0' }}>Support Tickets History</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.borderColor} vertical={false} />
                <XAxis dataKey="name" stroke={theme.textMutedColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={theme.textMutedColor} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: theme.textMutedColor }} />
                <Bar dataKey="tickets" name="Tickets Created" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
