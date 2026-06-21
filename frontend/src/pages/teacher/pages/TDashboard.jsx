import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { Users, UserCheck, BookOpen, Calendar, ChevronRight, Clock } from 'lucide-react';

const SK = ({ h = 'h-28', w = 'w-full' }) => (
  <div className={`skeleton rounded-2xl ${h} ${w}`} />
);

export default function TDashboard({ showToast, setTab }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    api.get('/teacher/students').then(r => {
      setStats(prev => ({ ...prev, students: (r.data.students || []).length }));
    }).catch(() => {});
    api.get('/teacher/timetable').then(r => {
      setTimetable(r.data.timetable || []);
    }).catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayDay = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';

  const todaySlots = timetable.filter(t => t.day_of_week === todayDay)
    .sort((a, b) => a.period_number - b.period_number);

  const ACTIONS = [
    { label: 'Students',   icon: Users,      tab: 'students',   grad: 'linear-gradient(135deg,#6366f1,#4338ca)' },
    { label: 'Attendance', icon: UserCheck,  tab: 'attendance', grad: 'linear-gradient(135deg,#10b981,#059669)' },
    { label: 'Marks',      icon: BookOpen,   tab: 'marks',      grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { label: 'Timetable',  icon: Calendar,   tab: 'timetable',  grad: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)', boxShadow: '0 8px 32px rgba(14,165,233,0.25)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute -bottom-8 left-10 w-36 h-36 rounded-full bg-sky-300/30 blur-xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-white">{(user?.name || 'T')[0].toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="text-sky-200 text-sm font-semibold">{greeting} 👋</p>
            <h1 className="text-2xl font-black text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {user?.name || 'Teacher'}
            </h1>
            <p className="text-sky-200 text-sm mt-1">Faculty · Smart School</p>
          </div>
          <div className="hidden sm:block">
            <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-2.5 text-right">
              <p className="text-sky-200 text-[11px] uppercase tracking-wide">Today</p>
              <p className="text-white text-sm font-semibold mt-0.5">{today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'My Students', value: stats?.students ?? '—', icon: Users, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
          { label: "Today's Classes", value: todaySlots.length, icon: Calendar, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
          { label: 'Free Periods', value: Math.max(0, 8 - todaySlots.length), icon: Clock, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
          { label: 'Total Periods', value: timetable.length, icon: BookOpen, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="card-hover rounded-2xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${color}18` }}>
              <Icon className="w-[18px] h-[18px]" style={{ color }} />
            </div>
            <p className="text-3xl font-black" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIONS.map(({ label, icon: Icon, tab, grad }) => (
            <button key={tab} onClick={() => setTab(tab)}
              className="card-hover group flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all"
              style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: grad, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Schedule */}
      {todaySlots.length > 0 && (
        <div className="rounded-2xl overflow-hidden border" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff' }}>
              <Calendar className="w-4 h-4" style={{ color: '#0ea5e9' }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: '#0F172A' }}>Today's Schedule — {todayDay}</h3>
          </div>
          <div className="divide-y" style={{ divideColor: '#F8FAFC' }}>
            {todaySlots.map((s, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-sky-50/30 transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
                  P{s.period_number}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{s.subject_name}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{s.class_name} · {s.section_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
