import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { UserCheck, Save, Lock, Unlock, AlertTriangle } from 'lucide-react';

const STATUS_OPTS = ['Present', 'Absent', 'Late', 'Leave'];
const STATUS_STYLE = {
  Present: { bg: '#ecfdf5', border: '#6ee7b7', text: '#059669', active: '#10b981' },
  Absent:  { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', active: '#ef4444' },
  Late:    { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', active: '#f59e0b' },
  Leave:   { bg: '#f0f9ff', border: '#7dd3fc', text: '#0284c7', active: '#0ea5e9' },
};

export default function TAttendance({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filters, setFilters] = useState({ class_id: '', section_id: '', date: new Date().toISOString().split('T')[0] });
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [hasLocked, setHasLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
    api.get('/sections').then(r => setSections(r.data.sections || []));
  }, []);

  useEffect(() => {
    const { class_id, section_id, date } = filters;
    if (!class_id || !section_id || !date) { setStudents([]); setLoaded(false); return; }
    api.get(`/teacher/attendance?class_id=${class_id}&section_id=${section_id}&date=${date}`)
      .then(r => {
        const list = r.data.attendanceList || [];
        setStudents(list);
        setHasLocked(list.some(s => s.is_locked));
        const init = {};
        list.forEach(s => { init[s.student_id] = s.status || 'Present'; });
        setAttendance(init);
        setLoaded(true);
      }).catch(() => showToast('Failed to load attendance', 'error'));
  }, [filters]);

  const handleSave = useCallback(async () => {
    const { class_id, section_id, date } = filters;
    if (!class_id || !section_id || !date) return showToast('Select class, section and date', 'warning');
    setSaving(true);
    try {
      await api.post('/teacher/attendance', {
        class_id, section_id, date,
        attendance: Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }))
      });
      showToast('Attendance saved successfully!');
      // Reload to reflect locked state
      const r = await api.get(`/teacher/attendance?class_id=${class_id}&section_id=${section_id}&date=${date}`);
      const list = r.data.attendanceList || [];
      setStudents(list);
      setHasLocked(list.some(s => s.is_locked));
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving attendance', 'error');
    } finally { setSaving(false); }
  }, [filters, attendance]);

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { if (!s.is_locked) updated[s.student_id] = status; });
    setAttendance(prev => ({ ...prev, ...updated }));
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#ecfdf5' }}>
          <UserCheck className="w-5 h-5" style={{ color: '#10b981' }} />
        </div>
        <div>
          <h1 className="font-black" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Mark Attendance</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Records lock after first edit — Admin can unlock</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap p-4 rounded-2xl border" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
        <select value={filters.class_id} onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none flex-1"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', minWidth: '140px' }}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
        </select>
        <select value={filters.section_id} onChange={e => setFilters(f => ({ ...f, section_id: e.target.value }))}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none flex-1"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', minWidth: '120px' }}>
          <option value="">Select Section</option>
          {sections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
        </select>
        <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }} />
      </div>

      {hasLocked && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
          style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' }}>
          <Lock className="w-4 h-4 flex-shrink-0" />
          Some records are locked. Only Admin can unlock them.
        </div>
      )}

      {loaded && students.length > 0 && (
        <>
          {/* Bulk actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Mark all:</span>
            {STATUS_OPTS.map(s => {
              const st = STATUS_STYLE[s];
              return (
                <button key={s} onClick={() => markAll(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                  style={{ background: st.bg, borderColor: st.border, color: st.text }}>
                  {s}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <table className="w-full text-sm">
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  {['#', 'Register No', 'Student Name', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.student_id} className="table-row-hover" style={{ borderBottom: '1px solid #F8FAFC' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td className="px-5 py-3.5 text-xs font-bold" style={{ color: '#6366f1' }}>{s.register_number}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: '#0F172A' }}>{s.name}</td>
                    <td className="px-5 py-3.5">
                      {s.is_locked ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                          <Lock className="w-3 h-3" /> {attendance[s.student_id] || s.status}
                        </span>
                      ) : (
                        <div className="flex gap-1.5 flex-wrap">
                          {STATUS_OPTS.map(opt => {
                            const st = STATUS_STYLE[opt];
                            const isActive = attendance[s.student_id] === opt;
                            return (
                              <button key={opt} onClick={() => setAttendance(prev => ({ ...prev, [s.student_id]: opt }))}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all"
                                style={{
                                  background: isActive ? st.bg : '#F8FAFC',
                                  borderColor: isActive ? st.border : '#E2E8F0',
                                  color: isActive ? st.text : '#94a3b8',
                                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                }}>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.is_locked && <Unlock className="w-4 h-4" style={{ color: '#94a3b8' }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)', opacity: saving ? 0.7 : 1 }}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </>
      )}

      {loaded && students.length === 0 && (
        <div className="py-16 text-center rounded-2xl border" style={{ background: '#fff', borderColor: '#E2E8F0', color: '#94a3b8' }}>
          No students found for this class and section
        </div>
      )}

      {!loaded && (
        <div className="py-16 text-center rounded-2xl border" style={{ background: '#fff', borderColor: '#E2E8F0', color: '#94a3b8' }}>
          Select class, section and date to load students
        </div>
      )}
    </div>
  );
}
