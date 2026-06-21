import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, Eye, EyeOff, Loader2, BookOpen, UserCheck,
  Calendar, CreditCard, FileText, MessageSquare, ChevronRight,
  Users, Award, Clock
} from 'lucide-react';

const ROLES = [
  { key: 'student', label: 'Student',  color: '#10B981' },
  { key: 'teacher', label: 'Teacher',  color: '#0EA5E9' },
  { key: 'admin',   label: 'Admin',    color: '#4F46E5' },
];

const FEATURES = [
  { icon: UserCheck,  label: 'Attendance Tracking',  color: '#10B981' },
  { icon: BookOpen,   label: 'Academic Marks',       color: '#F59E0B' },
  { icon: Calendar,   label: 'Smart Timetable',      color: '#0EA5E9' },
  { icon: CreditCard, label: 'Fees Management',      color: '#8B5CF6' },
  { icon: FileText,   label: 'Leave Applications',   color: '#EC4899' },
  { icon: MessageSquare, label: 'Complaint System',  color: '#EF4444' },
];

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [user]);

  const switchRole = useCallback((r) => {
    setRole(r);
    setForm({ username: '', password: '' });
    setError('');
    setShowPass(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) return setError(role === 'student' ? 'Please enter your Register Number' : 'Please enter your Username');
    if (!form.password.trim()) return setError(role === 'student' ? 'Please enter your Date of Birth' : 'Please enter your Password');
    setLoading(true);
    try {
      const u = await login(form.username.trim(), form.password.trim());
      if (u.role === 'admin') navigate('/admin', { replace: true });
      else if (u.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  const isStudent = role === 'student';
  const activeRole = ROLES.find(r => r.key === role);

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#0B0F1A' }}>

      {/* ── Left Panel ──────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(135deg, #1a1f35 0%, #0f1729 40%, #130d2e 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #4F46E5, transparent)' }} />
        <div className="absolute top-1/2 -right-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0EA5E9, transparent)' }} />
        <div className="absolute -bottom-24 left-1/4 w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />

        {/* Floating shapes */}
        <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-indigo-400 opacity-60" style={{ animation: 'float1 4s ease-in-out infinite' }} />
        <div className="absolute top-1/3 left-16 w-2 h-2 rounded-full bg-sky-400 opacity-50" style={{ animation: 'float2 5s ease-in-out infinite' }} />
        <div className="absolute bottom-40 right-32 w-2.5 h-2.5 rounded-full bg-violet-400 opacity-50" style={{ animation: 'float1 3.5s ease-in-out infinite reverse' }} />

        <style>{`
          @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        `}</style>

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 8px 20px rgba(79,70,229,0.4)' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-lg leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Smart School</p>
              <p className="text-xs font-semibold" style={{ color: '#6366f1', letterSpacing: '0.1em' }}>MANAGEMENT SYSTEM</p>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-sm font-semibold mb-2" style={{ color: '#818cf8' }}>{greeting} 👋</p>
            <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your Complete<br />
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                School ERP
              </span><br />
              Solution
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b', maxWidth: '380px' }}>
              A unified platform for students, teachers and administrators — manage everything from attendance to fees in one place.
            </p>
          </div>
        </div>

        {/* Features grid */}
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Everything You Need</p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[['500+', 'Students'],['50+', 'Teachers'],['99%', 'Uptime']].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{n}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ─────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Smart School</p>
              <p className="text-xs" style={{ color: '#6366f1' }}>Management System</p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>

            {/* Role Tabs */}
            <div className="flex p-1.5 gap-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {ROLES.map(({ key, label, color }) => (
                <button key={key} onClick={() => switchRole(key)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200"
                  style={{
                    background: role === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: role === key ? '#fff' : '#64748b',
                    boxShadow: role === key ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    borderBottom: role === key ? `2px solid ${color}` : '2px solid transparent',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="p-7">
              <div className="mb-6">
                <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {isStudent ? 'Student Login' : role === 'teacher' ? 'Teacher Login' : 'Admin Login'}
                </h2>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                  {isStudent ? 'Enter your Register Number and Date of Birth' : 'Enter your credentials to continue'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                  <span className="flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                {/* Username field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                    {isStudent ? 'Register Number' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder={isStudent ? 'e.g. S101, S102, S103, S104' : role === 'teacher' ? 'e.g. T101' : 'admin'}
                    autoComplete="off"
                    className="input-premium w-full px-4 py-3 rounded-xl text-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = activeRole.color; e.target.style.boxShadow = `0 0 0 3px ${activeRole.color}22`; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Password / DOB field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                    {isStudent ? 'Date of Birth' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : (isStudent ? 'date' : 'password')}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={isStudent ? 'YYYY-MM-DD' : 'Enter password'}
                      autoComplete="off"
                      className="input-premium w-full px-4 py-3 rounded-xl text-sm text-white pr-11"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                      onFocus={e => { e.target.style.borderColor = activeRole.color; e.target.style.boxShadow = `0 0 0 3px ${activeRole.color}22`; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                      style={{ color: '#64748b' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#cbd5e1'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isStudent && (
                    <p className="text-xs" style={{ color: '#475569' }}>Password is your Date of Birth in YYYY-MM-DD format</p>
                  )}
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all duration-200 mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${activeRole.color}, ${activeRole.color}cc)`,
                    boxShadow: `0 8px 24px ${activeRole.color}35`,
                    opacity: loading ? 0.75 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    : <>{`Sign In as ${activeRole.label}`} <ChevronRight className="w-4 h-4" /></>
                  }
                </button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Demo Credentials</p>
                {isStudent ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[['S101','2005-04-12','Alice'],['S102','2006-03-18','Ravi'],['S103','2005-11-25','Priya'],['S104','2006-01-14','Mohammed']].map(([reg, dob, name]) => (
                      <button key={reg} type="button" onClick={() => setForm({ username: reg, password: dob })}
                        className="py-2 px-3 rounded-xl text-left transition-all duration-150"
                        style={{
                          background: form.username === reg ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                          border: form.username === reg ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.07)',
                          color: form.username === reg ? '#34d399' : '#94a3b8',
                        }}>
                        <span className="text-xs font-bold block">{reg} · {name}</span>
                        <span className="text-[10px] opacity-60">{dob}</span>
                      </button>
                    ))}
                  </div>
                ) : role === 'teacher' ? (
                  <button type="button" onClick={() => setForm({ username: 'T101', password: 'teacher123' })}
                    className="w-full py-2.5 px-3 rounded-xl text-left text-xs transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                    <span className="font-bold text-sky-400">T101</span> · John Doe · <span className="opacity-60">teacher123</span>
                  </button>
                ) : (
                  <button type="button" onClick={() => setForm({ username: 'admin', password: 'admin123' })}
                    className="w-full py-2.5 px-3 rounded-xl text-left text-xs transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                    <span className="font-bold text-indigo-400">admin</span> · System Admin · <span className="opacity-60">admin123</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
