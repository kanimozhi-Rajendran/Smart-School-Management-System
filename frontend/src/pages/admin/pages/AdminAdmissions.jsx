import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { UserPlus, Check, X, Search, Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_STYLE = { Pending:{bg:'#fffbeb',border:'#fde68a',text:'#92400e',icon:Clock}, Approved:{bg:'#ecfdf5',border:'#a7f3d0',text:'#065f46',icon:CheckCircle}, Rejected:{bg:'#fef2f2',border:'#fca5a5',text:'#991b1b',icon:XCircle} };

export default function AdminAdmissions({ showToast }) {
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (statusFilter) p.set('status', statusFilter);
    api.get(`/admissions?${p}`).then(r => setAdmissions(r.data.admissions || [])).catch(() => {});
  };

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, statusFilter]);

  const approve = async (id) => {
    try { await api.put(`/admissions/${id}/approve`); showToast('Approved! Student account created.'); load(); }
    catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const reject = async (id) => {
    if (!confirm('Reject this application?')) return;
    try { await api.put(`/admissions/${id}/reject`); showToast('Application rejected'); load(); }
    catch { showToast('Error', 'error'); }
  };

  const counts = { Pending: admissions.filter(a=>a.status==='Pending').length, Approved: admissions.filter(a=>a.status==='Approved').length, Rejected: admissions.filter(a=>a.status==='Rejected').length };

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-50 dark:bg-pink-900/30">
          <UserPlus className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h1 className="font-black text-gray-900 dark:text-white" style={{ fontFamily:'Outfit,sans-serif' }}>Admissions</h1>
          <p className="text-xs text-gray-400">{counts.Pending} pending approval</p>
        </div>
      </div>

      {/* Status filter cards */}
      <div className="grid grid-cols-3 gap-3">
        {[['Pending','#f59e0b','#fffbeb'],['Approved','#10b981','#ecfdf5'],['Rejected','#ef4444','#fef2f2']].map(([s,c,bg])=>(
          <button key={s} onClick={() => setStatusFilter(statusFilter===s?'':s)}
            className="rounded-2xl p-4 text-left border transition-all"
            style={{ background: statusFilter===s?bg:'#fff', borderColor: statusFilter===s?`${c}50`:'#E2E8F0' }}>
            <p className="text-xl font-black" style={{ color:c, fontFamily:'Outfit,sans-serif' }}>{counts[s]}</p>
            <p className="text-xs font-semibold text-gray-500">{s}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or admission number..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none" />
      </div>

      <div className="space-y-3">
        {admissions.map(a => {
          const s = STATUS_STYLE[a.status] || STATUS_STYLE.Pending;
          const Icon = s.icon;
          return (
            <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#ec4899,#be185d)' }}>
                    {a.student_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{a.student_name}</p>
                    <p className="text-xs text-gray-500">{a.admission_number} · {a.gender} · {a.dob}</p>
                    <p className="text-xs text-gray-400">{a.class_name||'Class not set'} · Father: {a.father_name||'—'} · {a.father_mobile||'—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border"
                    style={{ background:s.bg, borderColor:s.border, color:s.text }}>
                    <Icon className="w-3 h-3" />{a.status}
                  </span>
                  {a.status === 'Pending' && (
                    <>
                      <button onClick={() => approve(a.id)} className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100" title="Approve"><Check className="w-4 h-4"/></button>
                      <button onClick={() => reject(a.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100" title="Reject"><X className="w-4 h-4"/></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {admissions.length === 0 && <p className="py-16 text-center text-gray-400">No admission applications found</p>}
      </div>
    </div>
  );
}
