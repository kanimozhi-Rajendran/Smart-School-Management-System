import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { MessageSquare, Send } from 'lucide-react';

const STATUS_COLOR = { Pending:'bg-amber-50 text-amber-700', 'In Progress':'bg-sky-50 text-sky-700', Resolved:'bg-green-50 text-green-700' };

export default function AdminComplaints({ showToast }) {
  const [complaints, setComplaints] = useState([]);
  const [replies, setReplies] = useState({});

  const load = () => api.get('/admin/complaints').then(r=>setComplaints(r.data.complaints||[]));
  useEffect(() => { load(); }, []);

  const reply = async (id) => {
    if (!replies[id]) return showToast('Enter reply text','warning');
    try { await api.put(`/admin/complaints/${id}`, { reply: replies[id], status:'Resolved' }); showToast('Reply sent'); setReplies(r=>({...r,[id]:''})); load(); }
    catch { showToast('Error','error'); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50"><MessageSquare className="w-5 h-5 text-purple-500"/></div>
        <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>Complaints</h1><p className="text-xs text-gray-400">{complaints.filter(c=>c.status==='Pending').length} pending</p></div>
      </div>
      <div className="space-y-3">
        {complaints.map(c=>(
          <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {c.category&&<span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">{c.category}</span>}
                  {c.priority&&<span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700">{c.priority}</span>}
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.is_anonymous?'Anonymous':c.student_name} · {c.created_at?.split('T')[0]}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${STATUS_COLOR[c.status]||''}`}>{c.status}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{c.description}</p>
            {(c.reply||c.admin_reply)&&<div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500 text-sm text-gray-700 dark:text-gray-300">Admin: {c.admin_reply||c.reply}</div>}
            {c.status!=='Resolved'&&(
              <div className="flex gap-2">
                <input value={replies[c.id]||''} onChange={e=>setReplies(r=>({...r,[c.id]:e.target.value}))} placeholder="Type a reply..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none"/>
                <button onClick={()=>reply(c.id)} className="p-2.5 rounded-xl text-white" style={{background:'linear-gradient(135deg,#4F46E5,#6366f1)'}}><Send className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        ))}
        {complaints.length===0&&<p className="py-16 text-center text-gray-400">No complaints</p>}
      </div>
    </div>
  );
}
