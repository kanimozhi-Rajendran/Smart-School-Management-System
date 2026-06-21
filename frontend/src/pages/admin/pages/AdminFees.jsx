import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { CreditCard } from 'lucide-react';

const fmt = n => '₹' + parseFloat(n||0).toLocaleString('en-IN');
const STATUS_COLOR = { Paid:'bg-emerald-50 text-emerald-700', Partial:'bg-amber-50 text-amber-700', Pending:'bg-gray-100 text-gray-600', Overdue:'bg-red-50 text-red-700' };

export default function AdminFees({ showToast }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { api.get('/admin/students').then(r=>setStudents(r.data.students||[])); }, []);

  const openStudent = async (s) => {
    setSelected(s);
    // Fetch fees via student-level api (using student's token won't work, use admin context)
    // We'll just show placeholder - in a real app you'd add admin fee view endpoint
    setFees([]);
    setPayments([]);
  };

  const filtered = students.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.register_number?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50"><CreditCard className="w-5 h-5 text-green-500"/></div>
        <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>Fees Management</h1><p className="text-xs text-gray-400">View and manage student fees</p></div>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student..."
        className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none"/>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>{['Reg No','Name','Class','Section'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.slice(0,50).map(s=>(
                <tr key={s.id} className="hover:bg-indigo-50/30 dark:hover:bg-gray-800/30 cursor-pointer transition-colors" onClick={()=>openStudent(s)}>
                  <td className="px-4 py-3 text-xs font-bold text-indigo-600">{s.register_number}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.class_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.section_name}</td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No students found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
