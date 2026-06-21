import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import {
  UserCheck, BookOpen, MessageSquare, FileText, Bell,
  Calendar, Award, Clock, ChevronRight, CreditCard,
  TrendingUp, ArrowUpRight, Zap
} from 'lucide-react';

const SK = ({ w = 'w-full', h = 'h-6', r = 'rounded-lg' }) => (
  <div className={`skeleton ${w} ${h} ${r}`} />
);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '⛅' };
  return { text: 'Good Evening', emoji: '🌙' };
}

const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function Dashboard({ showToast, setTab, darkMode, profile: profileProp }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { text: greet, emoji } = useMemo(() => getGreeting(), []);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { showToast('Failed to load dashboard', 'error'); setLoading(false); });
  }, []);

  const { student, summary, activities = [], announcements = [] } = data || {};
  const s = student || profileProp;

  const txt  = darkMode ? '#F9FAFB' : '#111827';
  const sub  = darkMode ? '#9CA3AF' : '#6B7280';
  const card = darkMode ? '#111827' : '#FFFFFF';
  const bdr  = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const bg   = darkMode ? '#0B0F1A' : '#F8FAFC';

  const STATS = loading ? [] : [
    { label: 'Attendance', value: `${summary?.attendance_pct || 0}%`, icon: UserCheck,    grad: 'linear-gradient(135deg,#10B981,#059669)', shadow: 'rgba(16,185,129,0.25)', tab: 'attendance' },
    { label: 'Total Marks', value: summary?.total_marks ?? '—',       icon: BookOpen,     grad: 'linear-gradient(135deg,#4F46E5,#7C3AED)', shadow: 'rgba(79,70,229,0.25)',  tab: 'marks'      },
    { label: 'Grade',        value: summary?.grade || 'N/A',          icon: Award,        grad: 'linear-gradient(135deg,#F59E0B,#D97706)', shadow: 'rgba(245,158,11,0.25)', tab: 'marks'      },
    { label: 'Pending Fees', value: summary?.pending_fees ?? '—',     icon: CreditCard,   grad: 'linear-gradient(135deg,#EF4444,#DC2626)', shadow: 'rgba(239,68,68,0.25)',  tab: 'fees'       },
    { label: 'Leave Req.',   value: summary?.leave_requests ?? 0,      icon: FileText,     grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', shadow: 'rgba(139,92,246,0.25)', tab: 'leave'      },
    { label: 'Unread',       value: summary?.unread_notifications ?? 0,icon: Bell,         grad: 'linear-gradient(135deg,#0EA5E9,#0284C7)', shadow: 'rgba(14,165,233,0.25)', tab: 'notifications'},
  ];

  const ACTIONS = [
    { label: 'Apply Leave',  icon: FileText,       tab: 'leave',         color: '#8B5CF6', bg: darkMode ? 'rgba(139,92,246,0.12)' : '#F5F3FF', border: darkMode ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.2)' },
    { label: 'Attendance',   icon: UserCheck,      tab: 'attendance',    color: '#10B981', bg: darkMode ? 'rgba(16,185,129,0.12)' : '#ECFDF5', border: darkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.2)' },
    { label: 'View Marks',   icon: BookOpen,       tab: 'marks',         color: '#4F46E5', bg: darkMode ? 'rgba(79,70,229,0.12)' : '#EEF2FF',  border: darkMode ? 'rgba(79,70,229,0.2)' : 'rgba(79,70,229,0.2)'  },
    { label: 'Timetable',    icon: Calendar,       tab: 'timetable',     color: '#0EA5E9', bg: darkMode ? 'rgba(14,165,233,0.12)' : '#F0F9FF', border: darkMode ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.2)' },
    { label: 'Fees',         icon: CreditCard,     tab: 'fees',          color: '#EF4444', bg: darkMode ? 'rgba(239,68,68,0.12)' : '#FEF2F2',  border: darkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.2)'  },
    { label: 'Notifications',icon: Bell,           tab: 'notifications', color: '#F59E0B', bg: darkMode ? 'rgba(245,158,11,0.12)' : '#FFFBEB', border: darkMode ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.2)' },
  ];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }} className="space-y-6">

      {/* ── HERO BANNER ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl fade-in"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6D28D9 50%, #7C3AED 100%)', padding: '28px 32px', boxShadow: '0 12px 40px rgba(79,70,229,0.35)' }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)', filter:'blur(1px)' }} />
        <div style={{ position:'absolute', bottom:-60, left:60, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)', filter:'blur(1px)' }} />
        <div style={{ position:'absolute', top:20, right:200, width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
          {/* Avatar */}
          {loading ? <SK w="w-20" h="h-20" r="rounded-2xl" /> : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
              style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', border:'2px solid rgba(255,255,255,0.25)', boxShadow:'0 8px 20px rgba(0,0,0,0.2)' }}>
              {(s?.name || 'S')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1" style={{ color:'rgba(255,255,255,0.7)' }}>{emoji} {greet}!</p>
            {loading ? <SK w="w-64" h="h-8" r="rounded-lg" /> : (
              <h1 className="text-3xl font-black text-white leading-tight">{s?.name || '—'}</h1>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {[s?.register_number, s?.class_name, s?.section_name ? `Sec ${s.section_name}` : null].filter(Boolean).map(tag => (
                <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)', backdropFilter:'blur(10px)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden lg:block flex-shrink-0">
            <div className="px-4 py-3 rounded-xl text-right"
              style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.6)' }}>Today</p>
              <p className="text-sm font-bold text-white mt-0.5">{today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading ? [...Array(6)].map((_, i) => (
          <div key={i} className={`skeleton h-28 rounded-2xl stagger-${i + 1}`} />
        )) : STATS.map(({ label, value, icon: Icon, grad, shadow, tab: t }, i) => (
          <button key={label} onClick={() => setTab(t)}
            className={`card-hover fade-in stagger-${i + 1} rounded-2xl p-4 text-left group`}
            style={{ background: card, border: `1px solid ${bdr}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
              style={{ background: grad, boxShadow: `0 4px 12px ${shadow}` }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black leading-tight" style={{ color: txt }}>{value}</p>
            <p className="text-[11px] font-semibold mt-0.5 flex items-center gap-1" style={{ color: sub }}>
              {label}
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </button>
        ))}
      </div>

      {/* ── QUICK ACTIONS ───────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" style={{ color: '#4F46E5' }} />
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: sub }}>Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {ACTIONS.map(({ label, icon: Icon, tab: t, color, bg: abg, border }) => (
            <button key={t} onClick={() => setTab(t)}
              className="card-hover fade-in flex flex-col items-center gap-2.5 p-4 rounded-2xl group transition-all"
              style={{ background: card, border: `1px solid ${bdr}` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: abg, border: `1.5px solid ${border}` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight" style={{ color: sub }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM ROW ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="rounded-2xl overflow-hidden" style={{ background: card, border: `1px solid ${bdr}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${bdr}` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: darkMode ? 'rgba(79,70,229,0.15)' : '#EEF2FF' }}>
                <Clock className="w-4 h-4" style={{ color: '#4F46E5' }} />
              </div>
              <span className="font-bold text-sm" style={{ color: txt }}>Recent Activity</span>
            </div>
            <button onClick={() => setTab('attendance')} className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: '#4F46E5' }}>
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex gap-3 items-center" style={{ borderBottom: `1px solid ${bdr}` }}>
                <SK w="w-2" h="h-2" r="rounded-full" /><SK w="w-full" h="h-4" />
              </div>
            )) : activities.length > 0 ? activities.map((a, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3 table-row-hover"
                style={{ borderBottom: i < activities.length - 1 ? `1px solid ${bdr}` : 'none' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#4F46E5' }} />
                <p className="text-sm flex-1 truncate" style={{ color: sub }}>{a.description}</p>
                <span className="text-[11px] flex-shrink-0" style={{ color: darkMode ? '#4B5563' : '#9CA3AF' }}>
                  {a.created_at?.split('T')[0]}
                </span>
              </div>
            )) : (
              <div className="py-10 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: darkMode ? '#374151' : '#E5E7EB' }} />
                <p className="text-sm" style={{ color: sub }}>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="rounded-2xl overflow-hidden" style={{ background: card, border: `1px solid ${bdr}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${bdr}` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: darkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' }}>
                <Bell className="w-4 h-4" style={{ color: '#F59E0B' }} />
              </div>
              <span className="font-bold text-sm" style={{ color: txt }}>Latest Notices</span>
            </div>
            <button onClick={() => setTab('notifications')} className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: '#4F46E5' }}>
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-3.5" style={{ borderBottom: `1px solid ${bdr}` }}>
                <SK h="h-4" r="rounded" /><SK w="w-3/4" h="h-3" r="rounded mt-2" />
              </div>
            )) : announcements.length > 0 ? announcements.map((a, i) => (
              <div key={a.id} className="px-5 py-4 table-row-hover"
                style={{ borderBottom: i < announcements.length - 1 ? `1px solid ${bdr}` : 'none' }}>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#4F46E5' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: txt }}>{a.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: sub }}>{a.message}</p>
                    <p className="text-[11px] mt-1" style={{ color: darkMode ? '#4B5563' : '#9CA3AF' }}>{a.created_at?.split('T')[0]}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: darkMode ? '#374151' : '#E5E7EB' }} />
                <p className="text-sm" style={{ color: sub }}>No announcements</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
