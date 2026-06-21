import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import {
  LayoutDashboard, User, UserCheck, BookOpen, Calendar,
  FileText, MessageSquare, Bell, Settings, LogOut,
  Menu, X, GraduationCap, Sun, Moon, CreditCard,
  ChevronRight, Search, ClipboardList
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Timetable from './pages/Timetable';
import LeaveApplication from './pages/LeaveApplication';
import Complaints from './pages/Complaints';
import Notifications from './pages/Notifications';
import SettingsPage from './pages/SettingsPage';
import Fees from './pages/Fees';
import Assignments from './pages/Assignments';

const NAV = [
  { key: 'dashboard',     label: 'Dashboard',        icon: LayoutDashboard, group: 'main' },
  { key: 'profile',       label: 'My Profile',        icon: User,           group: 'main' },
  { key: 'attendance',    label: 'Attendance',        icon: UserCheck,      group: 'academic' },
  { key: 'marks',         label: 'Marks',             icon: BookOpen,       group: 'academic' },
  { key: 'timetable',     label: 'Timetable',         icon: Calendar,       group: 'academic' },
  { key: 'assignments',   label: 'Assignments',       icon: ClipboardList,  group: 'academic' },
  { key: 'fees',          label: 'Fees',              icon: CreditCard,     group: 'finance' },
  { key: 'leave',         label: 'Leave Application', icon: FileText,       group: 'services' },
  { key: 'complaints',    label: 'Complaints',        icon: MessageSquare,  group: 'services' },
  { key: 'notifications', label: 'Notifications',     icon: Bell,           group: 'services' },
  { key: 'settings',      label: 'Settings',          icon: Settings,       group: 'other' },
];

const GROUP_LABELS = {
  main: 'Overview',
  academic: 'Academics',
  finance: 'Finance',
  services: 'Services',
  other: null
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function StudentPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : false;
  });

  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    api.get('/student/profile').then(r => setProfile(r.data.student)).catch(() => {});
    api.get('/student/notifications').then(r => {
      setUnreadCount((r.data.notifications || []).filter(n => !n.is_read).length);
    }).catch(() => {});
  }, []);

  const handleLogout = useCallback(() => { logout(); navigate('/login'); }, [logout, navigate]);
  const navTo = useCallback((key) => {
    setTab(key);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const initials = useMemo(() =>
    (profile?.name || user?.name || 'S').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  , [profile, user]);

  const groups = useMemo(() => {
    const g = {};
    NAV.forEach(item => {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    });
    return g;
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${darkMode ? 'dark' : ''}`}
      style={{ background: darkMode ? '#0B0F1A' : '#F8FAFC' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ────────────────────────────────────── */}
      <aside className="fixed lg:relative inset-y-0 left-0 z-30 flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{
          width: sidebarOpen ? 260 : (window.innerWidth >= 1024 ? 72 : 0),
          background: darkMode ? '#111827' : '#FFFFFF',
          borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.06)' : 'none'
        }}>

        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0 overflow-hidden"
          style={{ height: 64, padding: '0 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 12px rgba(79,70,229,0.35)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 slide-in-left">
              <p className="font-bold text-sm leading-tight" style={{ color: darkMode ? '#F9FAFB' : '#111827', fontFamily: 'Outfit,sans-serif' }}>Smart School</p>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#4F46E5' }}>Student ERP</p>
            </div>
          )}
        </div>

        {/* Student Info Card */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 rounded-2xl p-3 flex-shrink-0 slide-in-left"
            style={{
              background: darkMode ? 'rgba(79,70,229,0.12)' : 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
              border: `1px solid ${darkMode ? 'rgba(79,70,229,0.25)' : 'rgba(79,70,229,0.15)'}`,
            }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 10px rgba(79,70,229,0.3)' }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
                  {profile?.name || user?.name || 'Student'}
                </p>
                <p className="text-[11px] truncate" style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}>
                  {profile?.register_number || '—'}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: '#4F46E5' }}>
                  {profile?.class_name}{profile?.section_name ? ` · Sec ${profile.section_name}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto" style={{ padding: '12px 8px' }}>
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-2">
              {sidebarOpen && GROUP_LABELS[group] && (
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: darkMode ? '#4B5563' : '#9CA3AF', letterSpacing: '0.1em' }}>
                  {GROUP_LABELS[group]}
                </p>
              )}
              {items.map(({ key, label, icon: Icon }) => {
                const active = tab === key;
                return (
                  <button key={key} onClick={() => navTo(key)}
                    className="relative w-full flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150 mb-0.5"
                    style={{
                      padding: sidebarOpen ? '10px 12px' : '10px',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      background: active
                        ? (darkMode ? 'rgba(79,70,229,0.2)' : '#EEF2FF')
                        : 'transparent',
                      color: active
                        ? '#4F46E5'
                        : (darkMode ? '#9CA3AF' : '#6B7280'),
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9'; e.currentTarget.style.color = darkMode ? '#F9FAFB' : '#111827'; }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = darkMode ? '#9CA3AF' : '#6B7280'; } }}>
                    {active && <span className="nav-active-indicator" />}
                    <Icon className="flex-shrink-0" style={{ width: 18, height: 18, color: active ? '#4F46E5' : 'inherit' }} />
                    {sidebarOpen && <span className="flex-1 text-left truncate">{label}</span>}
                    {sidebarOpen && key === 'notifications' && unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: '#EF4444', minWidth: 18, textAlign: 'center' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {!sidebarOpen && key === 'notifications' && unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full pulse-dot" style={{ background: '#EF4444' }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="flex-shrink-0 p-2" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150"
            style={{ padding: sidebarOpen ? '10px 12px' : '10px', justifyContent: sidebarOpen ? 'flex-start' : 'center', color: darkMode ? '#6B7280' : '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.12)' : '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = darkMode ? '#6B7280' : '#9CA3AF'; }}>
            <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center gap-3 px-4 lg:px-6"
          style={{
            height: 64,
            background: darkMode ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
            position: 'sticky', top: 0, zIndex: 10
          }}>
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0 rounded-xl p-2 transition-colors"
            style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <Menu style={{ width: 20, height: 20 }} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span style={{ color: darkMode ? '#4B5563' : '#9CA3AF' }}>Student</span>
            <ChevronRight style={{ width: 14, height: 14, color: darkMode ? '#374151' : '#CBD5E1' }} />
            <span style={{ color: darkMode ? '#F9FAFB' : '#111827', fontWeight: 700 }}>
              {NAV.find(n => n.key === tab)?.label}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Date chip */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: darkMode ? '#9CA3AF' : '#6B7280' }}>
            <Calendar style={{ width: 13, height: 13 }} />
            {today}
          </div>

          {/* Dark mode */}
          <button onClick={() => setDarkMode(!darkMode)}
            className="rounded-xl p-2 transition-all"
            style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            {darkMode
              ? <Sun style={{ width: 18, height: 18, color: '#F59E0B' }} />
              : <Moon style={{ width: 18, height: 18 }} />}
          </button>

          {/* Notification bell */}
          <button onClick={() => navTo('notifications')}
            className="relative rounded-xl p-2 transition-all"
            style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <Bell style={{ width: 18, height: 18 }} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full pulse-dot" style={{ background: '#EF4444' }} />
            )}
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' }}
            onClick={() => navTo('profile')}>
            {initials}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto" style={{ background: darkMode ? '#0B0F1A' : '#F8FAFC' }}>
          <div className="page-enter">
            {tab === 'dashboard'     && <Dashboard     showToast={showToast} setTab={navTo} darkMode={darkMode} profile={profile} />}
            {tab === 'profile'       && <Profile       showToast={showToast} darkMode={darkMode} />}
            {tab === 'attendance'    && <Attendance    showToast={showToast} darkMode={darkMode} />}
            {tab === 'marks'         && <Marks         showToast={showToast} darkMode={darkMode} />}
            {tab === 'timetable'     && <Timetable     showToast={showToast} darkMode={darkMode} />}
            {tab === 'assignments'   && <Assignments   showToast={showToast} />}
            {tab === 'fees'          && <Fees          showToast={showToast} darkMode={darkMode} />}
            {tab === 'leave'         && <LeaveApplication showToast={showToast} darkMode={darkMode} />}
            {tab === 'complaints'    && <Complaints    showToast={showToast} darkMode={darkMode} />}
            {tab === 'notifications' && <Notifications showToast={showToast} setUnreadCount={setUnreadCount} darkMode={darkMode} />}
            {tab === 'settings'      && <SettingsPage  showToast={showToast} darkMode={darkMode} setDarkMode={setDarkMode} />}
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
