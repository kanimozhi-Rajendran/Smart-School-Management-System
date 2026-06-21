import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { BookOpen } from 'lucide-react';

const getGrade = m => m>=95?'A+':m>=90?'A':m>=80?'B+':m>=70?'B':m>=60?'C':m>=50?'D':'F';
const GRADE_COLOR = {'A+':'text-emerald-600','A':'text-green-600','B+':'text-cyan-600','B':'text-sky-600','C':'text-amber-600','D':'text-orange-600','F':'text-red-600'};

export default function AdminMarks({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ class_id:'', section_id:'', subject_id:'' });
  const [marks, setMarks] = useState([]);

  useEffect(() => { api.get('/admin/classes').then(r=>setClasses(r.data.classes||[])); api.get('/admin/sections').then(r=>setSections(r.data.sections||[])); api.get('/admin/subjects').then(r=>setSubjects(r.data.subjects||[])); }, []);
  useEffect(() => {
    if (!filters.class_id||!filters.section_id||!filters.subject_id) return;
    api.get(`/admin/marks?class_id=${filters.class_id}&section_id=${filters.section_id}&subject_id=${filters.subject_id}`)
      .then(r=>setMarks(r.data.marksList||[]));
  }, [filters]);

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50"><BookOpen className="w-5 h-5 text-amber-500"/></div>
        <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>Marks Sheet</h1><p className="text-xs text-gray-400">View marks by class/section/subject</p></div>
      </div>
      <div className="flex gap-3 flex-wrap p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {[['class_id','Select Class',classes,'id','class_name'],['section_id','Select Section',sections,'id','section_name'],['subject_id','Select Subject',subjects,'id','subject_name']].map(([k,ph,opts,vk,lk])=>(
          <select key={k} value={filters[k]} onChange={e=>setFilters(f=>({...f,[k]:e.target.value}))} className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none min-w-[130px]">
            <option value="">{ph}</option>{opts.map(o=><option key={o[vk]} value={o[vk]}>{o[lk]}</option>)}
          </select>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>{['#','Reg No','Name','Marks','Grade','Progress'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {marks.map((m,i)=>{const g=m.marks_obtained!=null?getGrade(m.marks_obtained):'—';return(
                <tr key={m.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-xs text-gray-400">{i+1}</td>
                  <td className="px-4 py-3 text-xs font-bold text-indigo-600">{m.register_number}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{m.name}</td>
                  <td className="px-4 py-3 font-black text-gray-900 dark:text-white">{m.marks_obtained??'—'}<span className="text-gray-400 font-normal">/100</span></td>
                  <td className="px-4 py-3 font-black text-lg"><span className={GRADE_COLOR[g]||'text-gray-500'}>{g}</span></td>
                  <td className="px-4 py-3"><div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{width:`${m.marks_obtained||0}%`}}/></div></td>
                </tr>
              )})}
              {marks.length===0&&<tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Select class, section and subject to view marks</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
