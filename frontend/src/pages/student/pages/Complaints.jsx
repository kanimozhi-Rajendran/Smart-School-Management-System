import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { MessageSquare, Loader2 } from 'lucide-react';

const CATEGORIES = [
  {name:'Academic',icon:'📚'},{name:'Teacher Behaviour',icon:'👨‍🏫'},{name:'Bullying',icon:'⚠️'},
  {name:'Transport',icon:'🚌'},{name:'Exam',icon:'📝'},{name:'Fee',icon:'💰'},
  {name:'Library',icon:'📖'},{name:'Lab',icon:'🔬'},{name:'Sports',icon:'⚽'},
  {name:'Infrastructure',icon:'🏫'},{name:'Hostel',icon:'🏠'},{name:'Classroom',icon:'🪑'},{name:'Other',icon:'📌'},
];
const PRIORITIES = ['Low','Medium','High'];
const PRIORITY_CFG = {
  Low:    { bg:'#F8FAFC', text:'#475569', dBg:'rgba(100,116,139,0.15)', dTxt:'#94A3B8' },
  Medium: { bg:'#FFFBEB', text:'#92400E', dBg:'rgba(245,158,11,0.15)',  dTxt:'#FCD34D' },
  High:   { bg:'#FEF2F2', text:'#991B1B', dBg:'rgba(239,68,68,0.15)',   dTxt:'#F87171' },
};
const STATUS_CFG = {
  Pending:      { bg:'#FFFBEB', text:'#92400E', dBg:'rgba(245,158,11,0.15)',  dTxt:'#FCD34D' },
  'In Progress':{ bg:'#EFF6FF', text:'#1E40AF', dBg:'rgba(59,130,246,0.15)', dTxt:'#93C5FD' },
  Resolved:     { bg:'#ECFDF5', text:'#065F46', dBg:'rgba(16,185,129,0.15)', dTxt:'#34D399' },
};

export default function Complaints({ showToast, darkMode }) {
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', priority:'Medium', is_anonymous:false });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const d = darkMode;
  const card = d?'#111827':'#FFFFFF';
  const bdr  = d?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';
  const txt  = d?'#F9FAFB':'#111827';
  const sub  = d?'#9CA3AF':'#6B7280';

  const load = () => api.get('/student/complaints').then(r=>{setComplaints(r.data.complaints||[]);setLoading(false);}).catch(()=>{showToast('Failed','error');setLoading(false);});
  useEffect(()=>{load();},[]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/student/complaints', { ...form, category:selected, is_anonymous:form.is_anonymous?1:0 });
      showToast('Complaint submitted!');
      setForm({title:'',description:'',priority:'Medium',is_anonymous:false});
      setSelected(null); load();
    } catch(err) { showToast(err.response?.data?.message||'Failed','error'); }
    finally { setSubmitting(false); }
  };

  const inputStyle = { background:d?'#1F2937':'#F8FAFC', border:`1px solid ${d?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}`, color:txt, borderRadius:12, padding:'10px 14px', fontSize:14, width:'100%', outline:'none' };

  return (
    <div style={{ padding:'20px 24px', maxWidth:1100, margin:'0 auto' }} className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:d?'rgba(239,68,68,0.15)':'#FEF2F2' }}>
          <MessageSquare className="w-5 h-5" style={{ color:'#EF4444' }} />
        </div>
        <div>
          <h1 className="font-black" style={{ color:txt }}>Complaints</h1>
          <p className="text-xs" style={{ color:sub }}>Select a category to file a complaint</p>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-2xl p-5 fade-in" style={{ background:card, border:`1px solid ${bdr}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:sub }}>Select Category</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
          {CATEGORIES.map(({ name, icon }) => (
            <button key={name} type="button" onClick={()=>setSelected(selected===name?null:name)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all"
              style={selected===name
                ? { background:'linear-gradient(135deg,#4F46E5,#7C3AED)', borderColor:'#4F46E5', transform:'scale(1.05)', boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }
                : { background:d?'rgba(255,255,255,0.04)':'#F8FAFC', borderColor: bdr, color:sub }}>
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-bold leading-tight" style={{ color: selected===name?'#fff':sub }}>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {selected && (
        <div className="rounded-2xl overflow-hidden scale-in" style={{ background:card, border:`1px solid rgba(79,70,229,0.2)`, boxShadow:'0 8px 24px rgba(79,70,229,0.08)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ background:'linear-gradient(135deg,rgba(79,70,229,0.08),rgba(124,58,237,0.08))', borderBottom:`1px solid ${bdr}` }}>
            <span className="text-xl">{CATEGORIES.find(c=>c.name===selected)?.icon}</span>
            <div>
              <h2 className="font-bold" style={{ color:txt }}>{selected} Complaint</h2>
              <p className="text-xs" style={{ color:sub }}>Your complaint will be reviewed by administration</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:sub }}>Title *</label>
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                placeholder="Brief title of your complaint" style={inputStyle} className="input-premium" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:sub }}>Description *</label>
              <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4}
                placeholder="Describe in detail..." style={{ ...inputStyle, resize:'none' }} className="input-premium" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:sub }}>Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p=>{const pc=PRIORITY_CFG[p]; return (
                    <button key={p} type="button" onClick={()=>setForm({...form,priority:p})}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                      style={form.priority===p ? { background:d?pc.dBg:pc.bg, color:d?pc.dTxt:pc.text, borderColor:d?pc.dTxt:pc.text } : { background:d?'rgba(255,255,255,0.04)':'#F8FAFC', borderColor:bdr, color:sub }}>
                      {p}
                    </button>
                  );})}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:sub }}>Identity</label>
                <div className="flex gap-2">
                  {[['Show Identity',false],['Anonymous',true]].map(([l,v])=>(
                    <button key={l} type="button" onClick={()=>setForm({...form,is_anonymous:v})}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                      style={form.is_anonymous===v ? { background:'linear-gradient(135deg,#4F46E5,#7C3AED)', color:'#fff', borderColor:'#4F46E5' } : { background:d?'rgba(255,255,255,0.04)':'#F8FAFC', borderColor:bdr, color:sub }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)', opacity:submitting?0.7:1, boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>
                {submitting?<><Loader2 className="w-4 h-4 spin"/>Submitting...</>:'Submit Complaint'}
              </button>
              <button type="button" onClick={()=>setSelected(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background:d?'rgba(255,255,255,0.06)':'#F1F5F9', color:sub }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl overflow-hidden fade-in" style={{ background:card, border:`1px solid ${bdr}` }}>
        <div className="px-5 py-4" style={{ borderBottom:`1px solid ${bdr}` }}>
          <span className="font-bold text-sm" style={{ color:txt }}>Complaint History</span>
        </div>
        {loading ? <div className="p-5 space-y-3">{[...Array(2)].map((_,i)=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
        : complaints.length===0 ? <div className="py-12 text-center text-sm" style={{color:sub}}>No complaints submitted yet</div>
        : complaints.map(c=>{
          const s=STATUS_CFG[c.status]||STATUS_CFG.Pending;
          const pc=PRIORITY_CFG[c.priority]||PRIORITY_CFG.Medium;
          return (
            <div key={c.id} className="p-5 table-row-hover" style={{ borderTop:`1px solid ${bdr}` }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold" style={{ color:sub }}>#{c.id}</span>
                  {c.category&&<span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background:d?'rgba(79,70,229,0.15)':'#EEF2FF', color:d?'#A5B4FC':'#4338CA' }}>{c.category}</span>}
                  {c.priority&&<span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background:d?pc.dBg:pc.bg, color:d?pc.dTxt:pc.text }}>{c.priority}</span>}
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ background:d?s.dBg:s.bg, color:d?s.dTxt:s.text }}>{c.status}</span>
              </div>
              <p className="font-bold mb-1" style={{ color:txt }}>{c.title}</p>
              <p className="text-xs line-clamp-2 mb-2" style={{ color:sub }}>{c.description}</p>
              {(c.admin_reply||c.reply)&&(
                <div className="flex gap-2 px-3 py-2 rounded-xl" style={{ background:d?'rgba(79,70,229,0.12)':'#EEF2FF' }}>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color:'#4F46E5' }}>Admin:</span>
                  <p className="text-xs" style={{ color:d?'#C7D2FE':'#4338CA' }}>{c.admin_reply||c.reply}</p>
                </div>
              )}
              <p className="text-[11px] mt-2" style={{ color:d?'#374151':'#D1D5DB' }}>{c.created_at?.split('T')[0]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
