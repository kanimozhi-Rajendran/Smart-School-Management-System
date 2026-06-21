import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Users, GraduationCap, UserCheck, BookOpen, CreditCard, FileText, MessageSquare, Bell, TrendingUp, AlertCircle, UserPlus, ClipboardList } from 'lucide-react';

const SK = ({ h = 'h-24', cls = '' }) => <div className={`skeleton rounded-2xl ${h} ${cls}`} />;
const fmt = n => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function AdminDash({ showToast, setTab }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/enhanced-stats')
      .then(r => setData(r.data))
      .catch(() => showToast('Failed to load dashboard', 'error'));
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const { stats, monthlyAttendance = [], monthlyFees = [] } = data || {};

  const CARDS = stats ? [
    { label: 'Total Students', value: stats.students, icon: GraduationCap, color: '#4F46E5', bg: '#eef2ff', border: '#c7d2fe', tab: 'students' },
    { label: 'Total Teachers', value: stats.teachers, icon: Users, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', tab: 'teachers' },
    { label: 'Present Today', value: stats.presentToday, icon: UserCheck, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', tab: 'attendance' },
    { label: 'Absent Today', value: stats.absentToday, icon: AlertCircle, color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', tab: 'attendance' },
    { label: 'Pending Leave', value: stats.pendingLeaves, icon: FileText, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', tab: 'leaves' },
    { label: 'Pending Complaints', value: stats.pendingComplaints, icon: MessageSquare, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', tab: 'complaints' },
    { label: 'Pending Admissions', value: stats.pendingAdmissions, icon: UserPlus, color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', tab: 'admissions' },
    { label: 'Fees Pending', value: fmt(stats.feesPending), icon: CreditCard, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', tab: 'fees' },
  ] : [];

  const attPct = stats?.attPct || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#6366f1 50%,#7C3AED 100%)', boxShadow: '0 8px 32px rgba(79,70,229,0.25)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-semibold">Welcome back, Admin 👋</p>
            <h1 className="text-2xl lg:text-3xl font-black text-white mt-1" style={{ fontFamily: 'Outfit,sans-serif' }}>Smart School ERP</h1>
            <p className="text-indigo-200 text-sm mt-1">{today}</p>
          </div>
          <div className="sm:ml-auto flex gap-3">
            <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{attPct}%</p>
              <p className="text-indigo-200 text-xs">Attendance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {!data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SK key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {CARDS.map(({ label, value, icon: Icon, color, bg, border, tab: t }) => (
            <button key={label} onClick={() => setTab(t)}
              className="card-hover rounded-2xl p-5 text-left border transition-all"
              style={{ background: bg, borderColor: border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                <Icon className="w-[18px] h-[18px]" style={{ color }} />
              </div>
              <p className="text-2xl font-black" style={{ color, fontFamily: 'Outfit,sans-serif' }}>{value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Attendance Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Monthly Attendance (last 6 months)</h3>
          {monthlyAttendance.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {monthlyAttendance.map(m => {
                const pct = m.total > 0 ? (m.present / m.total * 100) : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold" style={{ color: '#4F46E5' }}>{Math.round(pct)}%</span>
                    <div className="w-full rounded-t-lg" style={{ height: `${Math.max(8, pct)}%`, background: 'linear-gradient(180deg,#6366f1,#4F46E5)', minHeight: '8px' }} />
                    <span className="text-[9px] text-gray-400">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fee Collection */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Fee Collection (last 6 months)</h3>
          {monthlyFees.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No payment data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {monthlyFees.map(m => {
                const maxFee = Math.max(...monthlyFees.map(f => f.collected));
                const pct = maxFee > 0 ? (m.collected / maxFee * 100) : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold" style={{ color: '#10b981' }}>₹{Math.round(m.collected / 1000)}k</span>
                    <div className="w-full rounded-t-lg" style={{ height: `${Math.max(8, pct)}%`, background: 'linear-gradient(180deg,#34d399,#10b981)', minHeight: '8px' }} />
                    <span className="text-[9px] text-gray-400">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
