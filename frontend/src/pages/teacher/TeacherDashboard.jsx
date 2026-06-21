import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import {
  LayoutDashboard, Users, UserCheck, BookOpen, Calendar,
  LogOut, GraduationCap, Menu, Bell, Sun, Moon, ChevronRight,
  MessageSquare, FileText, UserPlus, ClipboardList, Heart
} from 'lucide-react';

import TDashboard    from './pages/TDashboard';
import TStudents     from './pages/TStudents';
import TAttendance   from './pages/TAttendance';
import TMarks        from './pages/TMarks';
import TTimetable    from './pages/TTimetable';
import TAdmission    from './pages/TAdmission';
import TAssignments  from './pages/TAssignments';
import TParents      from './pages/TParents';

const NAV = [
  { key: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'students',    label: 'Students',    icon: Users },
  { key: 'attendance',  label: 'Attendance',  icon: UserCheck },
  { key: 'marks',       label: 'Marks',       icon: BookOpen },
  { key: 'timetable',   label: 'Timetable',   icon: Calendar },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  { key: 'admission',   label: 'Admission',   icon: UserPlus },
  { key: 'parents',     label: 'Parents',     icon: Heart },
];

export default function TeacherDashboard() {
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

  const initials = (user?.name || 'T')[0].toUpperCase();
  const activeNav = NAV.find(n => n.key === tab);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
      <style>{`
        .dark-portal { background: #0B0F1A !important; }
        .teacher-sidebar { background: #fff; border-right: 1px solid #E2E8F0; }
        .dark .teacher-sidebar { background: #111827; border-color: #1F2937; }
        .teacher-header { background: rgba(255,255,255,0.9); border-bottom: 1px solid #E2E8F0; }
        .dark .teacher-header { background: rgba(17,24,39,0.9); border-color: #1F2937; }
        .teacher-main { background: #F8FAFC; }
        .dark .teacher-main { background: #0B0F1A; }
      `}</style>

      {/* Sidebar */}
      <aside className={`teacher-sidebar flex flex-col flex-shrink-0 transition-all duration-300 z-30
        fixed lg:relative h-full
        ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden`}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0" style={{ borderBottom: '1px solid #E2E8F020' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-black text-sm leading-tight" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Smart School</p>
              <p className="text-[11px] font-bold" style={{ color: '#0EA5E9', letterSpacing: '0.05em' }}>Teacher Portal</p>
            </div>
          )}
        </div>

        {/* Teacher card */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 p-3 rounded-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
                <span className="text-white font-black text-sm">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: '#0F172A' }}>{user?.name || 'Teacher'}</p>
                <p className="text-[11px] font-medium" style={{ color: '#0EA5E9' }}>Faculty</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => { setTab(key); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 relative"
                style={{
                  background: active ? 'linear-gradient(135deg, #0EA5E9, #0284C7)' : 'transparent',
                  color: active ? '#fff' : '#64748b',
                  boxShadow: active ? '0 4px 12px rgba(14,165,233,0.25)' : 'none',
                }}>
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {sidebarOpen && <span className="flex-1 text-left">{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2 flex-shrink-0" style={{ borderTop: '1px solid #E2E8F010' }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{ color: '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="teacher-header h-16 flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-10" style={{ backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-sm">
            <span style={{ color: '#94a3b8' }}>Teacher</span>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: '#cbd5e1' }} />
            <span className="font-bold" style={{ color: '#0F172A' }}>{activeNav?.label}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-xl transition-colors" style={{ color: '#64748b' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', boxShadow: '0 2px 8px rgba(14,165,233,0.3)' }}>
              {initials}
            </div>
          </div>
        </header>

        <main className="teacher-main flex-1 overflow-y-auto">
          {tab === 'dashboard'   && <TDashboard   showToast={showToast} setTab={setTab} />}
          {tab === 'students'    && <TStudents    showToast={showToast} />}
          {tab === 'attendance'  && <TAttendance  showToast={showToast} />}
          {tab === 'marks'       && <TMarks       showToast={showToast} />}
          {tab === 'timetable'   && <TTimetable   showToast={showToast} />}
          {tab === 'assignments' && <TAssignments showToast={showToast} />}
          {tab === 'admission'   && <TAdmission   showToast={showToast} />}
          {tab === 'parents'     && <TParents     showToast={showToast} />}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
