import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { BookOpen, Plus, Trash2, Edit, Eye, Check, Clock, AlertTriangle } from 'lucide-react';

const PRIORITY_STYLE = { High: { bg:'#fef2f2',border:'#fca5a5',text:'#dc2626' }, Medium: { bg:'#fffbeb',border:'#fde68a',text:'#d97706' }, Low: { bg:'#ecfdf5',border:'#a7f3d0',text:'#059669' } };
const SUB_STATUS_STYLE = { Pending: { bg:'#f8fafc',text:'#64748b' }, Submitted: { bg:'#ecfdf5',text:'#059669' }, Graded: { bg:'#eef2ff',text:'#4f46e5' }, Late: { bg:'#fef2f2',text:'#dc2626' } };

export default function TAssignments({ showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAsg, setSelectedAsg] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ title: '', subject_id: '', class_id: '', section_id: '', description: '', instructions: '', due_date: '', max_marks: 20, priority: 'Medium' });

  const load = useCallback(() => {
    api.get('/assignments/teacher').then(r => setAssignments(r.data.assignments || [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    api.get('/classes').then(r => setClasses(r.data.classes || []));
    api.get('/sections').then(r => setSections(r.data.sections || []));
    api.get('/subjects').then(r => setSubjects(r.data.subjects || []));
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.due_date) return showToast('Title and due date required', 'warning');
    try {
      await api.post('/assignments/teacher', form);
      showToast('Assignment created!');
      setShowForm(false);
      setForm({ title: '', subject_id: '', class_id: '', section_id: '', description: '', instructions: '', due_date: '', max_marks: 20, priority: 'Medium' });
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    try { await api.delete(`/assignments/teacher/${id}`); showToast('Deleted'); load(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const viewSubmissions = async (asg) => {
    setSelectedAsg(asg);
    const r = await api.get(`/assignments/teacher/${asg.id}/submissions`);
    setSubmissions(r.data.submissions || []);
  };

  const gradeSubmission = async (subId, marks, remarks) => {
    try {
      await api.put(`/assignments/teacher/submission/${subId}/grade`, { marks_obtained: marks, remarks });
      showToast('Graded!');
      viewSubmissions(selectedAsg);
    } catch { showToast('Failed to grade', 'error'); }
  };

  const overdue = (dueDate) => new Date(dueDate) < new Date();

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fffbeb' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1 className="font-black" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Assignments</h1>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{assignments.length} total</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
          <Plus className="w-4 h-4" /> Create Assignment
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9', background: '#fffbeb' }}>
            <h3 className="font-bold text-sm" style={{ color: '#0F172A' }}>New Assignment</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[['Title','title','text'],['Due Date','due_date','date'],['Max Marks','max_marks','number']].map(([l,k,t]) => (
              <div key={k}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            ))}
            {[['Subject','subject_id',subjects,'id','subject_name'],['Class','class_id',classes,'id','class_name'],['Section','section_id',sections,'id','section_name']].map(([l,k,opts,vk,lk]) => (
              <div key={k}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>{l}</label>
                <select value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}>
                  <option value="">Select {l}</option>
                  {opts.map(o => <option key={o[vk]} value={o[vk]}>{o[lk]}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Priority</label>
              <div className="flex gap-2">
                {['Low','Medium','High'].map(p => {
                  const s = PRIORITY_STYLE[p];
                  return (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                      style={{ background: form.priority === p ? s.bg : '#F8FAFC', borderColor: form.priority === p ? s.border : '#E2E8F0', color: form.priority === p ? s.text : '#94a3b8' }}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }} />
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Create</button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F1F5F9', color: '#64748b' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Assignment List */}
      <div className="space-y-3">
        {assignments.map(a => {
          const p = PRIORITY_STYLE[a.priority] || PRIORITY_STYLE.Medium;
          const isDue = overdue(a.due_date);
          return (
            <div key={a.id} className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg border"
                      style={{ background: p.bg, borderColor: p.border, color: p.text }}>{a.priority}</span>
                    {isDue && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>Overdue</span>}
                    {a.subject_name && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: '#eef2ff', color: '#4f46e5' }}>{a.subject_name}</span>}
                  </div>
                  <h3 className="font-bold" style={{ color: '#0F172A' }}>{a.title}</h3>
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                    {a.class_name} · Due: {a.due_date} · Max: {a.max_marks} marks · {a.submitted_count}/{a.total_assigned || '?'} submitted
                  </p>
                  {a.description && <p className="text-xs mt-1 line-clamp-1" style={{ color: '#64748b' }}>{a.description}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => viewSubmissions(a)}
                    className="p-2 rounded-xl transition-all" title="View Submissions"
                    style={{ background: '#eef2ff', color: '#4f46e5' }}>
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(a.id)}
                    className="p-2 rounded-xl transition-all" title="Delete"
                    style={{ background: '#fef2f2', color: '#dc2626' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {assignments.length === 0 && (
          <p className="py-16 text-center" style={{ color: '#94a3b8' }}>No assignments yet. Create one above.</p>
        )}
      </div>

      {/* Submissions panel */}
      {selectedAsg && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9', background: '#eef2ff' }}>
            <h3 className="font-bold text-sm" style={{ color: '#0F172A' }}>Submissions — {selectedAsg.title}</h3>
            <button onClick={() => setSelectedAsg(null)} className="text-xs font-bold" style={{ color: '#6366f1' }}>Close</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  {['Student','Reg No','Status','Marks','Remarks','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => {
                  const st = SUB_STATUS_STYLE[s.status] || SUB_STATUS_STYLE.Pending;
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#0F172A' }}>{s.student_name}</td>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: '#6366f1' }}>{s.register_number}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: st.bg, color: st.text }}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.status === 'Submitted' ? (
                          <input type="number" min="0" max={selectedAsg.max_marks}
                            defaultValue={s.marks_obtained || ''} id={`m-${s.id}`}
                            className="w-16 px-2 py-1 rounded-lg text-xs text-center focus:outline-none"
                            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                        ) : (
                          <span className="text-sm font-black" style={{ color: s.marks_obtained !== null ? '#4f46e5' : '#94a3b8' }}>
                            {s.marks_obtained !== null ? s.marks_obtained : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{s.remarks || '—'}</td>
                      <td className="px-4 py-3">
                        {s.status === 'Submitted' && (
                          <button onClick={() => {
                            const marks = document.getElementById(`m-${s.id}`)?.value;
                            gradeSubmission(s.id, marks, '');
                          }} className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ background: '#4f46e5' }}>Grade</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: '#94a3b8' }}>No submissions yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
