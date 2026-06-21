import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { GraduationCap, Plus, Edit, Trash2, Search } from 'lucide-react';

const inp = 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white';

export default function AdminStudents({ showToast }) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ register_number:'',name:'',dob:'',gender:'Male',father_name:'',mother_name:'',parent_mobile:'',address:'',class_id:'',section_id:'' });

  const load = useCallback(() => {
    const q = search ? `?search=${search}` : '';
    api.get(`/admin/students${q}`).then(r => setStudents(r.data.students || []));
  }, [search]);

  useEffect(() => {
    api.get('/admin/classes').then(r => setClasses(r.data.classes || []));
    api.get('/admin/sections').then(r => setSections(r.data.sections || []));
  }, []);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const reset = () => { setForm({ register_number:'',name:'',dob:'',gender:'Male',father_name:'',mother_name:'',parent_mobile:'',address:'',class_id:'',section_id:'' }); setEditId(null); setShowForm(false); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/admin/students/${editId}`, form);
      else await api.post('/admin/students', form);
      showToast(editId ? 'Student updated' : 'Student added');
      reset(); load();
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete student?')) return;
    try { await api.delete(`/admin/students/${id}`); showToast('Deleted'); load(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const startEdit = (s) => {
    setForm({ register_number:s.register_number, name:s.name, dob:s.dob||'', gender:s.gender||'Male', father_name:s.father_name||'', mother_name:s.mother_name||'', parent_mobile:s.parent_mobile||'', address:s.address||'', class_id:s.class_id||'', section_id:s.section_id||'' });
    setEditId(s.id); setShowForm(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30">
            <GraduationCap className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 dark:text-white" style={{ fontFamily:'Outfit,sans-serif' }}>Students</h1>
            <p className="text-xs text-gray-400">{students.length} total</p>
          </div>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background:'linear-gradient(135deg,#4F46E5,#6366f1)', boxShadow:'0 4px 12px rgba(79,70,229,0.25)' }}>
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or register number..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-indigo-50 dark:bg-indigo-900/20">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">{editId ? 'Edit' : 'New'} Student</h3>
          </div>
          <form onSubmit={submit} className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[['register_number','Register Number'],['name','Full Name'],['dob','Date of Birth','date'],['father_name','Father Name'],['mother_name','Mother Name'],['parent_mobile','Parent Mobile'],['address','Address']].map(([k,l,t='text']) => (
              <div key={k}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className={inp} required={['register_number','name','dob','father_name','mother_name','parent_mobile','address'].includes(k)} />
              </div>
            ))}
            {[['gender','Gender',['Male','Female','Other']],['class_id','Class',classes,'id','class_name'],['section_id','Section',sections,'id','section_name']].map(([k,l,opts,vk,lk]) => (
              <div key={k}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{l}</label>
                <select value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className={inp} required>
                  <option value="">Select {l}</option>
                  {Array.isArray(opts) && typeof opts[0]==='string' ? opts.map(o=><option key={o}>{o}</option>) : (opts||[]).map(o=><option key={o[vk]} value={o[vk]}>{o[lk]}</option>)}
                </select>
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background:'linear-gradient(135deg,#4F46E5,#6366f1)' }}>{editId?'Update':'Add'}</button>
              <button type="button" onClick={reset} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>{['Reg No','Name','Class','Section','Father','DOB','Actions'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {students.map(s=>(
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-indigo-600">{s.register_number}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.class_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.section_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.father_name||'—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.dob||'—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={()=>startEdit(s)} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600"><Edit className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>del(s.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length===0&&<tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No students found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
