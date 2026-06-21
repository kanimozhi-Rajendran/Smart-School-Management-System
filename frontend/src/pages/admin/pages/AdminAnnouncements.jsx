import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Bell, Send, Pin } from 'lucide-react';

export default function AdminAnnouncements({ showToast }) {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title:'', message:'', role:'all', category:'General', priority:'Normal' });
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/notifications').then(r=>setNotifications(r.data.notifications||[]));
  useEffect(() => { load(); }, []);

  const send = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/notifications', form); showToast('Announcement sent!'); setForm({title:'',message:'',role:'all',category:'General',priority:'Normal'}); setShowForm(false); load(); }
    catch { showToast('Error','error'); }
  };

  const PRIORITY_COLOR = { Normal:'bg-gray-100 text-gray-600', Important:'bg-amber-50 text-amber-700', Urgent:'bg-red-50 text-red-700' };
  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500';

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50"><Bell className="w-5 h-5 text-indigo-500"/></div>
          <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>Announcements</h1><p className="text-xs text-gray-400">{notifications.length} total</p></div>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#4F46E5,#6366f1)',boxShadow:'0 4px 12px rgba(79,70,229,0.25)'}}>
          <Send className="w-4 h-4"/> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-indigo-50 dark:bg-indigo-900/20">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Create Announcement</h3>
          </div>
          <form onSubmit={send} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Title</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={inp} required/>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Message</label>
                <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={3} className={`${inp} resize-none`} required/>
              </div>
              {[['role','Target Audience',[['all','Everyone'],['student','Students Only'],['teacher','Teachers Only'],['admin','Admin Only']]],
                ['category','Category',[['General','General'],['Event','Event'],['Exam','Exam'],['Holiday','Holiday'],['Fees','Fees'],['Meeting','Meeting']]],
                ['priority','Priority',[['Normal','Normal'],['Important','Important'],['Urgent','Urgent']]]].map(([k,l,opts])=>(
                <div key={k}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{l}</label>
                  <select value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className={inp}>
                    {opts.map(([v,lb])=><option key={v} value={v}>{lb}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{background:'linear-gradient(135deg,#4F46E5,#6366f1)'}}><Send className="w-4 h-4"/>Send</button>
              <button type="button" onClick={()=>setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(n=>(
          <div key={n.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {n.is_pinned===1&&<span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700"><Pin className="w-3 h-3"/>Pinned</span>}
                  {n.category&&<span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{n.category}</span>}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${PRIORITY_COLOR[n.priority]||PRIORITY_COLOR.Normal}`}>{n.priority||'Normal'}</span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{n.title}</p>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 capitalize">{n.role}</span>
                <p className="text-xs text-gray-400 mt-1">{n.created_at?.split('T')[0]}</p>
              </div>
            </div>
          </div>
        ))}
        {notifications.length===0&&<p className="py-16 text-center text-gray-400">No announcements yet</p>}
      </div>
    </div>
  );
}
