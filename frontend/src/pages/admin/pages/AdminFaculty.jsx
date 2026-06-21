import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Award, Edit, Save, X } from 'lucide-react';

export default function AdminFaculty({ showToast }) {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = () => api.get('/admin/faculty').then(r => setFaculty(r.data.faculty || []));
  useEffect(() => { load(); api.get('/admin/subjects').then(r => setSubjects(r.data.subjects || [])); }, []);

  const startEdit = (f) => {
    setEditId(f.id);
    setEditForm({ name:f.name, email:f.email||'', phone:f.phone||'', department:f.department||'', designation:f.designation||'', qualification:f.qualification||'', experience_yrs:f.experience_yrs||0, subject_id:f.subject_id||'' });
  };

  const save = async () => {
    try { await api.put(`/admin/faculty/${editId}`, editForm); showToast('Faculty updated'); setEditId(null); load(); }
    catch { showToast('Update failed','error'); }
  };

  const inp = 'w-full px-2 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500';

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/30">
          <Award className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="font-black text-gray-900 dark:text-white" style={{ fontFamily:'Outfit,sans-serif' }}>Faculty Management</h1>
          <p className="text-xs text-gray-400">{faculty.length} faculty members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {faculty.map(f => (
          <div key={f.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black"
                    style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {f.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    {editId === f.id ? <input value={editForm.name} onChange={e=>setEditForm(ef=>({...ef,name:e.target.value}))} className={inp} />
                      : <p className="font-black text-gray-900 dark:text-white">{f.name}</p>}
                    <p className="text-xs text-amber-600 font-semibold">{f.teacher_id}</p>
                  </div>
                </div>
                {editId === f.id ? (
                  <div className="flex gap-1.5">
                    <button onClick={save} className="p-1.5 rounded-lg bg-green-50 text-green-600"><Save className="w-3.5 h-3.5"/></button>
                    <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500"><X className="w-3.5 h-3.5"/></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(f)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><Edit className="w-3.5 h-3.5"/></button>
                )}
              </div>

              {editId === f.id ? (
                <div className="grid grid-cols-2 gap-2">
                  {[['department','Department'],['designation','Designation'],['qualification','Qualification'],['experience_yrs','Experience (yrs)']].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-0.5">{l}</label>
                      <input value={editForm[k]} onChange={e=>setEditForm(ef=>({...ef,[k]:e.target.value}))} className={inp} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-0.5">Subject</label>
                    <select value={editForm.subject_id} onChange={e=>setEditForm(ef=>({...ef,subject_id:e.target.value}))} className={inp}>
                      <option value="">None</option>
                      {subjects.map(s=><option key={s.id} value={s.id}>{s.subject_name}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  {[['Subject', f.subject_name||'—'],['Department',f.department||'—'],['Designation',f.designation||'—'],['Qualification',f.qualification||'—'],['Experience',f.experience_yrs ? `${f.experience_yrs} yrs` : '—'],['Classes',f.assigned_classes||0],['Weekly Periods',f.weekly_periods||0],['Phone',f.phone||'—']].map(([l,v])=>(
                    <div key={l}>
                      <span className="text-gray-400 font-semibold">{l}: </span>
                      <span className="text-gray-900 dark:text-white font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {faculty.length === 0 && <p className="col-span-2 py-16 text-center text-gray-400">No faculty records</p>}
      </div>
    </div>
  );
}
