import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Calendar, Plus } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function AdminTimetable({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [viewFilter, setViewFilter] = useState({ class_id:'', section_id:'' });
  const [form, setForm] = useState({ class_id:'', section_id:'', subject_id:'', teacher_id:'', day_of_week:'Monday', period_number:1 });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/admin/classes').then(r=>setClasses(r.data.classes||[]));
    api.get('/admin/sections').then(r=>setSections(r.data.sections||[]));
    api.get('/admin/subjects').then(r=>setSubjects(r.data.subjects||[]));
    api.get('/admin/teachers').then(r=>setTeachers(r.data.teachers||[]));
  }, []);

  useEffect(() => {
    if (!viewFilter.class_id||!viewFilter.section_id) return;
    api.get(`/admin/timetable?class_id=${viewFilter.class_id}&section_id=${viewFilter.section_id}`)
      .then(r=>setTimetable(r.data.timetable||[]));
  }, [viewFilter]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/timetable', form);
      showToast('Slot saved');
      api.get(`/admin/timetable?class_id=${viewFilter.class_id}&section_id=${viewFilter.section_id}`).then(r=>setTimetable(r.data.timetable||[]));
    } catch (err) { showToast(err.response?.data?.message||'Error','error'); }
  };

  const grid = {};
  DAYS.forEach(d=>{grid[d]={};});
  timetable.forEach(t=>{ if(t.day_of_week) grid[t.day_of_week][t.period_number]=t; });

  const inp = 'flex-1 px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none min-w-[120px]';

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50"><Calendar className="w-5 h-5 text-sky-500"/></div>
          <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>Timetable</h1><p className="text-xs text-gray-400">Select class and section to view</p></div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}>
          <Plus className="w-4 h-4"/> Add Slot
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={viewFilter.class_id} onChange={e=>setViewFilter(f=>({...f,class_id:e.target.value}))} className={inp}>
          <option value="">View Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.class_name}</option>)}
        </select>
        <select value={viewFilter.section_id} onChange={e=>setViewFilter(f=>({...f,section_id:e.target.value}))} className={inp}>
          <option value="">View Section</option>{sections.map(s=><option key={s.id} value={s.id}>{s.section_name}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[['class_id','Class',classes,'id','class_name'],['section_id','Section',sections,'id','section_name'],['subject_id','Subject',subjects,'id','subject_name'],['teacher_id','Teacher',teachers,'id','name']].map(([k,l,opts,vk,lk])=>(
            <div key={k}>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">{l}</label>
              <select value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="w-full px-2 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none" required>
                <option value="">Select</option>{opts.map(o=><option key={o[vk]} value={o[vk]}>{o[lk]}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Day</label>
            <select value={form.day_of_week} onChange={e=>setForm(f=>({...f,day_of_week:e.target.value}))} className="w-full px-2 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none">
              {DAYS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Period</label>
            <input type="number" min="1" max="8" value={form.period_number} onChange={e=>setForm(f=>({...f,period_number:e.target.value}))} className="w-full px-2 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none" required/>
          </div>
          <div className="col-span-2 lg:col-span-2 flex items-end gap-3">
            <button type="submit" className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}>Save Slot</button>
            <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Cancel</button>
          </div>
        </form>
      )}

      {timetable.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 w-16">Period</th>
                  {DAYS.map(d=><th key={d} className="px-3 py-3 text-center text-xs font-bold uppercase text-gray-500 border-l border-gray-100 dark:border-gray-800">{d.slice(0,3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8].map(p=>(
                  <tr key={p} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="px-4 py-2"><span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">P{p}</span></td>
                    {DAYS.map(d=>{const s=grid[d]?.[p];return(
                      <td key={d} className="px-2 py-2 border-l border-gray-50 dark:border-gray-800">
                        {s?<div className="rounded-xl px-2 py-1.5 text-center bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
                          <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">{s.subject_name}</p>
                          <p className="text-[10px] text-indigo-500 opacity-70">{s.teacher_name}</p>
                        </div>:<div className="h-8 rounded-xl bg-gray-50 dark:bg-gray-800/30"/>}
                      </td>
                    )})}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {timetable.length===0&&viewFilter.class_id&&viewFilter.section_id&&<p className="py-8 text-center text-gray-400">No timetable entries. Add slots above.</p>}
      {!viewFilter.class_id&&<p className="py-8 text-center text-gray-400">Select a class and section to view the timetable.</p>}
    </div>
  );
}
