import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { FileText, Plus, Calendar, Clock, Loader2 } from 'lucide-react';

const LEAVE_TYPES = ['Sick Leave','Medical Leave','Casual Leave','Emergency Leave','Family Function','Sports','Other'];
const STATUS_CFG = {
  Pending:  { bg:'#FFFBEB', text:'#92400E', dBg:'rgba(245,158,11,0.15)', dTxt:'#FCD34D' },
  Approved: { bg:'#ECFDF5', text:'#065F46', dBg:'rgba(16,185,129,0.15)', dTxt:'#34D399' },
  Rejected: { bg:'#FEF2F2', text:'#991B1B', dBg:'rgba(239,68,68,0.15)',  dTxt:'#F87171' },
};

export default function LeaveApplication({ showToast, darkMode }) {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type:'', from_date:'', to_date:'', reason:'' });
  const d = darkMode;
  const card = d ? '#111827' : '#FFFFFF';
  const bdr  = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const txt  = d ? '#F9FAFB' : '#111827';
  const sub  = d ? '#9CA3AF' : '#6B7280';

  const load = () => api.get('/student/leave').then(r=>{setLeaves(r.data.leaves||[]);setLoading(false);}).catch(()=>{showToast('Failed to load','error');setLoading(false);});
  useEffect(()=>{load();},[]);

  const days = (f,t) => { const d=Math.ceil((new Date(t)-new Date(f))/(864e5))+1; return d>0?d:1; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type) return showToast('Select a leave type','warning');
    if (new Date(form.from_date) > new Date(form.to_date)) return showToast('From date must be before To date','warning');
    setSubmitting(true);
    try {
      await api.post('/student/leave', form);
      showToast('Leave application submitted!');
      setForm({type:'',from_date:'',to_date:'',reason:''});
      setShowForm(false); load();
    } catch(err) { showToast(err.response?.data?.message||'Failed','error'); }
    finally { setSubmitting(false); }
  };

  const inputStyle = { background: d?'#1F2937':'#F8FAFC', border:`1px solid ${d?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, color: txt, borderRadius:12, padding:'10px 14px', fontSize:14, width:'100%', outline:'none' };

  return (
    <div style={{ padding:'20px 24px', maxWidth:1000, margin:'0 auto' }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: d?'rgba(139,92,246,0.15)':'#F5F3FF' }}>
            <FileText className="w-5 h-5" style={{ color:'#8B5CF6' }} />
          </div>
          <div>
            <h1 className="font-black" style={{ color:txt }}>Leave Application</h1>
            <p className="text-xs" style={{ color:sub }}>{leaves.length} applications submitted</p>
          </div>
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
          style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl overflow-hidden scale-in" style={{ background:card, border:`1px solid rgba(79,70,229,0.25)`, boxShadow:'0 8px 24px rgba(79,70,229,0.1)' }}>
          <div className="px-6 py-4" style={{ background:'linear-gradient(135deg,rgba(79,70,229,0.08),rgba(124,58,237,0.08))', borderBottom:`1px solid ${bdr}` }}>
            <h2 className="font-bold" style={{ color:txt }}>New Leave Application</h2>
            <p className="text-xs mt-0.5" style={{ color:sub }}>Fill in all details. Your class teacher will review the request.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color:sub }}>Leave Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LEAVE_TYPES.map(type => (
                  <button key={type} type="button" onClick={()=>setForm({...form,type})}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold border text-center transition-all"
                    style={form.type===type
                      ? { background:'linear-gradient(135deg,#4F46E5,#7C3AED)', color:'#fff', border:'1.5px solid #4F46E5', boxShadow:'0 4px 12px rgba(79,70,229,0.25)' }
                      : { background:d?'rgba(255,255,255,0.04)':'#F8FAFC', border:`1px solid ${bdr}`, color:sub }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['from_date','From Date'],['to_date','To Date']].map(([k,l])=>(
                <div key={k}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:sub }}>{l} *</label>
                  <input type="date" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}
                    style={inputStyle} className="input-premium" required />
                </div>
              ))}
            </div>
            {form.from_date && form.to_date && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background:d?'rgba(79,70,229,0.12)':'#EEF2FF' }}>
                <Calendar className="w-4 h-4" style={{ color:'#4F46E5' }} />
                <span className="text-sm font-bold" style={{ color:'#4F46E5' }}>{days(form.from_date,form.to_date)} day(s) of leave</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:sub }}>Reason *</label>
              <textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} rows={4}
                placeholder="Describe the reason for your leave request..."
                style={{ ...inputStyle, resize:'none' }} className="input-premium" required />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
                style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)', opacity:submitting?0.7:1, boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>
                {submitting ? <><Loader2 className="w-4 h-4 spin" /> Submitting...</> : 'Submit Application'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background:d?'rgba(255,255,255,0.06)':'#F1F5F9', color:sub }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl overflow-hidden fade-in" style={{ background:card, border:`1px solid ${bdr}` }}>
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom:`1px solid ${bdr}` }}>
          <Clock className="w-4 h-4" style={{ color:sub }} />
          <span className="font-bold text-sm" style={{ color:txt }}>Leave History</span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(2)].map((_,i)=><div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background:d?'rgba(255,255,255,0.03)':'#F8FAFC' }}>
                  {['#','Type','From','To','Days','Status','Applied'].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color:sub, borderBottom:`1px solid ${bdr}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.map((l,i)=>{
                  const s = STATUS_CFG[l.status]||STATUS_CFG.Pending;
                  return (
                    <tr key={l.id} className="table-row-hover" style={{ borderTop:`1px solid ${bdr}` }}>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color:sub }}>{String(i+1).padStart(2,'0')}</td>
                      <td className="px-5 py-3.5 font-bold" style={{ color:txt }}>{l.type}</td>
                      <td className="px-5 py-3.5" style={{ color:sub }}>{l.from_date}</td>
                      <td className="px-5 py-3.5" style={{ color:sub }}>{l.to_date}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color:txt }}>{days(l.from_date,l.to_date)}d</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background:d?s.dBg:s.bg, color:d?s.dTxt:s.text }}>{l.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color:sub }}>{l.created_at?.split('T')[0]}</td>
                    </tr>
                  );
                })}
                {leaves.length===0&&<tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{color:sub}}>No leave applications yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
