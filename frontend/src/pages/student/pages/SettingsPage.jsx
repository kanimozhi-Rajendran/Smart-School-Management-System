import React, { useState } from 'react';
import { Settings, Moon, Sun, Lock, LogOut, Loader2, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

export default function SettingsPage({ showToast, darkMode, setDarkMode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ current:'', newPw:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const d = darkMode;
  const card = d?'#111827':'#FFFFFF';
  const bdr  = d?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';
  const txt  = d?'#F9FAFB':'#111827';
  const sub  = d?'#9CA3AF':'#6B7280';
  const inputStyle = { background:d?'#1F2937':'#F8FAFC', border:`1px solid ${d?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, color:txt, borderRadius:12, padding:'10px 14px', fontSize:14, width:'100%', outline:'none' };

  const handlePw = async (e) => {
    e.preventDefault();
    if (pw.newPw!==pw.confirm) return showToast('Passwords do not match','error');
    if (pw.newPw.length<6) return showToast('Minimum 6 characters','warning');
    setSaving(true);
    try {
      await api.post('/auth/change-password',{currentPassword:pw.current,newPassword:pw.newPw});
      showToast('Password updated!');
      setPw({current:'',newPw:'',confirm:''});
    } catch(err) { showToast(err.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const Section = ({ title, children }) => (
    <div className="rounded-2xl overflow-hidden fade-in" style={{ background:card, border:`1px solid ${bdr}` }}>
      <div className="px-5 py-4" style={{ borderBottom:`1px solid ${bdr}` }}>
        <span className="font-bold text-sm" style={{ color:txt }}>{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <div style={{ padding:'20px 24px', maxWidth:680, margin:'0 auto' }} className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:d?'rgba(100,116,139,0.15)':'#F1F5F9' }}>
          <Settings className="w-5 h-5" style={{ color:sub }} />
        </div>
        <h1 className="font-black" style={{ color:txt }}>Settings</h1>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-semibold" style={{ color:txt }}>Theme</p>
            <p className="text-xs mt-0.5" style={{ color:sub }}>Switch between light and dark mode</p>
          </div>
          <button onClick={()=>setDarkMode(!d)}
            className="relative flex-shrink-0 transition-colors"
            style={{ width:48, height:26, borderRadius:999, background:d?'#4F46E5':'#E2E8F0' }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform"
              style={{ left: d?'calc(100% - 22px)':2 }} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[[false,'Light','#F59E0B',Sun],[true,'Dark','#4F46E5',Moon]].map(([val,label,color,Icon])=>(
            <button key={label} onClick={()=>setDarkMode(val)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-sm transition-all"
              style={d===val ? { background:color+'15', borderColor:color, color } : { background:d?'rgba(255,255,255,0.04)':'#F8FAFC', borderColor:bdr, color:sub }}>
              <Icon className="w-4 h-4" />
              {label} Mode
            </button>
          ))}
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password">
        <p className="text-xs mb-4" style={{ color:sub }}>Your default password is your Date of Birth (YYYY-MM-DD)</p>
        <form onSubmit={handlePw} className="space-y-3">
          {[['current','Current Password'],['newPw','New Password'],['confirm','Confirm Password']].map(([k,l])=>(
            <div key={k}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:sub }}>{l}</label>
              <input type="password" value={pw[k]} onChange={e=>setPw({...pw,[k]:e.target.value})}
                style={inputStyle} className="input-premium" required />
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold mt-2 transition-all"
            style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)', opacity:saving?0.7:1, boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>
            {saving?<><Loader2 className="w-4 h-4 spin"/>Saving...</>:<><Lock className="w-4 h-4"/>Update Password</>}
          </button>
        </form>
      </Section>

      {/* Logout */}
      <div className="rounded-2xl p-5 fade-in" style={{ background:card, border:`1px solid rgba(239,68,68,0.2)` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold" style={{ color:txt }}>Sign Out</p>
            <p className="text-xs mt-0.5" style={{ color:sub }}>Securely log out of your account</p>
          </div>
          <button onClick={()=>{logout();navigate('/login');}}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background:d?'rgba(239,68,68,0.12)':'#FEF2F2', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444' }}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
