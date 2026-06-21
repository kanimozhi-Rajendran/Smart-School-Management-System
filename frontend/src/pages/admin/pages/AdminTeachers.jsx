import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';

const inp = 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white';

export default function AdminTeachers({ showToast }) {
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ teacher_id:'',name:'',email:'',phone:'',password:'' });
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    const q = search ? `?search=${search}` : '';
    api.get(`/admin/teachers${q}`).then(r => setTeachers(r.data.teachers || []));
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const reset = () => { setForm({ teacher_id:'',name:'',email:'',phone:'',password:'' }); setEditId(null); setShowForm(false); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/admin/teachers/${editId}`, form);
      else await api.post('/admin/teachers', form);
      showToast(editId ? 'Teacher updated' : 'Teacher added');
      reset(); load();
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete teacher?')) return;
    try { await api.delete(`/admin/teachers/${id}`); showToast('Deleted'); load(); }
    catch { showToast('Delete failed', 'error'); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/30">
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 dark:text-white" style={{ fontFamily:'Outfit,sans-serif' }}>Teachers</h1>
            <p className="text-xs text-gray-400">{teachers.length} total</p>
          </div>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background:'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow:'0 4px 12px rgba(14,165,233,0.25)' }}>
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none" />
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-sky-50 dark:bg-sky-900/20">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">{editId ? 'Edit' : 'New'} Teacher</h3>
          </div>
          <form onSubmit={submit} className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[['teacher_id','Teacher ID'],['name','Full Name'],['email','Email'],['phone','Phone'],['password', editId ? 'New Password (optional)' : 'Password']].map(([k,l]) => (
              <div key={k}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{l}</label>
                <input type={k==='password'?'password':'text'} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className={inp} required={['teacher_id','name','email','phone'].includes(k)||(k==='password'&&!editId)} />
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background:'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>{editId?'Update':'Add'}</button>
              <button type="button" onClick={reset} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>{['Teacher ID','Name','Email','Phone','Dept','Actions'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {teachers.map(t=>(
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-sky-600">{t.teacher_id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.email||'—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.phone||'—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.department||'—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={()=>{ setForm({teacher_id:t.teacher_id,name:t.name,email:t.email||'',phone:t.phone||'',password:''}); setEditId(t.id); setShowForm(true); }} className="p-1.5 rounded-lg bg-sky-50 text-sky-600"><Edit className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>del(t.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length===0&&<tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No teachers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
