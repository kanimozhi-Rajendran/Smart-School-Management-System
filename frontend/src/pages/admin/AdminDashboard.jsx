import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import {
  LayoutDashboard, Users, GraduationCap, UserCheck, BookOpen,
  Calendar, MessageSquare, Bell, LogOut, Menu, ChevronRight,
  Sun, Moon, TrendingUp, CreditCard, FileText, UserPlus,
  ClipboardList, Settings, Award, Trash2, Edit, Plus,
  Send, Lock, Unlock, BarChart2, Search, Check, X
} from 'lucide-react';

import AdminDash          from './pages/AdminDash';
import AdminStudents      from './pages/AdminStudents';
import AdminTeachers      from './pages/AdminTeachers';
import AdminFaculty       from './pages/AdminFaculty';
import AdminAdmissions    from './pages/AdminAdmissions';
import AdminAttendance    from './pages/AdminAttendance';
import AdminMarks         from './pages/AdminMarks';
import AdminTimetable     from './pages/AdminTimetable';
import AdminAssignments   from './pages/AdminAssignments';
import AdminFees          from './pages/AdminFees';
import AdminLeaves        from './pages/AdminLeaves';
import AdminComplaints    from './pages/AdminComplaints';
import AdminAnnouncements from './pages/AdminAnnouncements';

const NAV = [
  { key: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard, group: 'main' },
  { key: 'students',    label: 'Students',     icon: GraduationCap,   group: 'academic' },
  { key: 'teachers',    label: 'Teachers',     icon: Users,           group: 'academic' },
  { key: 'faculty',     label: 'Faculty',      icon: Award,           group: 'academic' },
  { key: 'admissions',  label: 'Admissions',   icon: UserPlus,        group: 'academic' },
  { key: 'attendance',  label: 'Attendance',   icon: UserCheck,       group: 'academic' },
  { key: 'marks',       label: 'Marks',        icon: BookOpen,        group: 'academic' },
  { key: 'timetable',   label: 'Timetable',    icon: Calendar,        group: 'academic' },
  { key: 'assignments', label: 'Assignments',  icon: ClipboardList,   group: 'academic' },
  { key: 'fees',        label: 'Fees',         icon: CreditCard,      group: 'finance' },
  { key: 'leaves',      label: 'Leave',        icon: FileText,        group: 'services' },
  { key: 'complaints',  label: 'Complaints',   icon: MessageSquare,   group: 'services' },
  { key: 'announcements', label: 'Announcements', icon: Bell,         group: 'services' },
];

const GROUPS = { main: 'Overview', academic: 'Academic', finance: 'Finance', services: 'Services' };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');

  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);
  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const grouped = useMemo(() => {
    const g = {};
    NAV.forEach(n => {
      if (!g[n.group]) g[n.group] = [];
      g[n.group].push(n);
    });
    return g;
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0B0F1A]">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-30 flex flex-col transition-all duration-300
        bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800
        ${sidebarOpen ? 'w-60' : 'w-0 lg:w-16'} overflow-hidden flex-shrink-0`}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-black text-sm text-gray-900 dark:text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>Smart School</p>
              <p className="text-[11px] font-bold" style={{ color: '#4F46E5' }}>Admin Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              {sidebarOpen && <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1 text-gray-400 dark:text-gray-600">{GROUPS[group]}</p>}
              <div className="space-y-0.5">
                {items.map(({ key, label, icon: Icon }) => {
                  const active = tab === key;
                  return (
                    <button key={key} onClick={() => { setTab(key); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                      style={{
                        background: active ? 'linear-gradient(135deg,#4F46E5,#6366f1)' : 'transparent',
                        color: active ? '#fff' : '#64748b',
                        boxShadow: active ? '0 4px 12px rgba(79,70,229,0.25)' : 'none',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                      {sidebarOpen && <span className="flex-1 text-left">{label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 transition-all"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-bold text-gray-900 dark:text-white capitalize">{NAV.find(n => n.key === tab)?.label}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDarkMode(d => !d)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              A
            </div>
            {sidebarOpen && <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user?.name || 'Admin'}</span>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0B0F1A]">
          {tab === 'dashboard'    && <AdminDash     showToast={showToast} setTab={setTab} />}
          {tab === 'students'     && <AdminStudents  showToast={showToast} />}
          {tab === 'teachers'     && <AdminTeachers  showToast={showToast} />}
          {tab === 'faculty'      && <AdminFaculty   showToast={showToast} />}
          {tab === 'admissions'   && <AdminAdmissions showToast={showToast} />}
          {tab === 'attendance'   && <AdminAttendance showToast={showToast} />}
          {tab === 'marks'        && <AdminMarks     showToast={showToast} />}
          {tab === 'timetable'    && <AdminTimetable showToast={showToast} />}
          {tab === 'assignments'  && <AdminAssignments showToast={showToast} />}
          {tab === 'fees'         && <AdminFees      showToast={showToast} />}
          {tab === 'leaves'       && <AdminLeaves    showToast={showToast} />}
          {tab === 'complaints'   && <AdminComplaints showToast={showToast} />}
          {tab === 'announcements'&& <AdminAnnouncements showToast={showToast} />}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
// ── Shared helpers ──────────────────────────────────────
const SK = ({ h = 'h-24', w = 'w-full' }) => <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-2xl ${h} ${w}`} />;

const StatCard = ({ label, value, icon: Icon, color, bg, border, onClick }) => (
  <div onClick={onClick} className={`rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''}`}
    style={{ background: bg, border: `1px solid ${border}` }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>{label}</p>
        <p className="text-3xl font-black" style={{ color, fontFamily: 'Outfit,sans-serif' }}>{value ?? '—'}</p>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

const Table = ({ cols, rows, empty = 'No records', keyField = 'id' }) => (
  <div className="rounded-2xl border overflow-hidden bg-white dark:bg-gray-900" style={{ borderColor: '#E2E8F0' }}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <tr>{cols.map(c => <th key={c} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {rows.length > 0 ? rows : (
            <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-gray-400">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const Select = ({ value, onChange, options, placeholder, style }) => (
  <select value={value} onChange={onChange}
    className="px-3 py-2.5 rounded-xl text-sm focus:outline-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
    style={style}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

