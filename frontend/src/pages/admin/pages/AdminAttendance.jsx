import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { UserCheck, Unlock } from 'lucide-react';

export default function AdminAttendance({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filters, setFilters] = useState({ class_id:'', section_id:'', date: new Date().toISOString().split('T')[0] });
  const [records, setRecords] = useState([]);

  useEffect(() => { api.get('/admin/classes').then(r=>setClasses(r.data.classes||[])); api.get('/admin/sections').then(r=>setSections(r.data.sections||[])); }, []);
  useEffect(() => {
    if (!filters.class_id || !filters.section_id || !filters.date) return;
    api.get(`/admin/attendance?class_id=${filters.class_id}&section_id=${filters.section_id}&date=${filters.date}`)
      .then(r => setRecords(r.data.attendanceList || []));
  }, [filters]);

  const unlock = async (id) => {
    try { await api.put(`/admin/attendance/unlock/${id}`); showToast('Unlocked'); setRecords(r=>r.map(x=>x.attendance_id===id?{...x,is_locked:0}:x)); }
    catch { showToast('Error','error'); }
  };

  const STATUS_COLOR = { Present:'text-emerald-600 bg-emerald-50', Absent:'text-red-600 bg-red-50', Late:'text-amber-600 bg-amber-50', Leave:'text-sky-600 bg-sky-50' };

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50"><UserCheck className="w-5 h-5 text-emerald-500"/></div>
        <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>Attendance Management</h1><p className="text-xs text-gray-400">Select filters to view</p></div>
      </div>
      <div className="flex gap-3 flex-wrap p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <select value={filters.class_id} onChange={e=>setFilters(f=>({...f,class_id:e.target.value}))} className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none min-w-[130px]">
          <option value="">Select Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.class_name}</option>)}
        </select>
        <select value={filters.section_id} onChange={e=>setFilters(f=>({...f,section_id:e.target.value}))} className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none min-w-[120px]">
          <option value="">Select Section</option>{sections.map(s=><option key={s.id} value={s.id}>{s.section_name}</option>)}
        </select>
        <input type="date" value={filters.date} onChange={e=>setFilters(f=>({...f,date:e.target.value}))} className="px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none"/>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>{['Reg No','Name','Status','Locked','Action'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {records.map(r=>(
                <tr key={r.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-xs font-bold text-indigo-600">{r.register_number}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${STATUS_COLOR[r.status]||'bg-gray-100 text-gray-500'}`}>{r.status||'Not marked'}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.is_locked?'bg-red-50 text-red-600':'bg-green-50 text-green-600'}`}>{r.is_locked?'Locked':'Open'}</span></td>
                  <td className="px-4 py-3">{r.is_locked&&r.attendance_id&&<button onClick={()=>unlock(r.attendance_id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 hover:bg-amber-100"><Unlock className="w-3 h-3"/>Unlock</button>}</td>
                </tr>
              ))}
              {records.length===0&&<tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Select class, section and date to view attendance</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
