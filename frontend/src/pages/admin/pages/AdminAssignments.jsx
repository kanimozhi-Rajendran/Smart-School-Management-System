import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { ClipboardList } from 'lucide-react';

const PRIORITY_COLOR = { High:'text-red-600 bg-red-50', Medium:'text-amber-600 bg-amber-50', Low:'text-green-600 bg-green-50' };

export default function AdminAssignments({ showToast }) {
  const [assignments, setAssignments] = useState([]);
  useEffect(() => { api.get('/assignments/admin').then(r=>setAssignments(r.data.assignments||[])).catch(()=>{}); }, []);

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50"><ClipboardList className="w-5 h-5 text-amber-500"/></div>
        <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>All Assignments</h1><p className="text-xs text-gray-400">{assignments.length} total assignments</p></div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>{['Title','Subject','Class','Teacher','Due Date','Priority','Submitted'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {assignments.map(a=>(
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white max-w-[200px] truncate">{a.title}</td>
                  <td className="px-4 py-3 text-gray-500">{a.subject_name||'—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.class_name||'All'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.teacher_name||'—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.due_date}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${PRIORITY_COLOR[a.priority]||''}`}>{a.priority}</span></td>
                  <td className="px-4 py-3 text-gray-500">{a.submitted_count||0}</td>
                </tr>
              ))}
              {assignments.length===0&&<tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No assignments yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
