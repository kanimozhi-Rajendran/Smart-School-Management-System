import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { BookOpen, Save, TrendingUp, TrendingDown } from 'lucide-react';

const getGrade = m => m >= 95 ? 'A+' : m >= 90 ? 'A' : m >= 80 ? 'B+' : m >= 70 ? 'B' : m >= 60 ? 'C' : m >= 50 ? 'D' : 'F';
const GRADE_COLOR = { 'A+': '#10b981', A: '#22c55e', 'B+': '#06b6d4', B: '#0ea5e9', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

export default function TMarks({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ class_id: '', section_id: '', subject_id: '' });
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
    api.get('/sections').then(r => setSections(r.data.sections || []));
    api.get('/subjects').then(r => setSubjects(r.data.subjects || []));
  }, []);

  useEffect(() => {
    const { class_id, section_id, subject_id } = filters;
    if (!class_id || !section_id || !subject_id) { setStudents([]); setLoaded(false); return; }
    api.get(`/teacher/marks?class_id=${class_id}&section_id=${section_id}&subject_id=${subject_id}`)
      .then(r => {
        const list = r.data.marksList || [];
        setStudents(list);
        const init = {};
        list.forEach(s => { init[s.student_id] = s.marks_obtained ?? ''; });
        setMarksData(init);
        setLoaded(true);
      }).catch(() => showToast('Failed to load marks', 'error'));
  }, [filters]);

  const handleSave = useCallback(async () => {
    const { class_id, section_id, subject_id } = filters;
    if (!class_id || !section_id || !subject_id) return showToast('Select all filters', 'warning');
    const marksList = Object.entries(marksData)
      .filter(([, v]) => v !== '')
      .map(([student_id, marks_obtained]) => ({ student_id, marks_obtained: Number(marks_obtained) }));
    setSaving(true);
    try {
      await api.post('/teacher/marks', { class_id, section_id, subject_id, marksList });
      showToast('Marks saved successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving marks', 'error');
    } finally { setSaving(false); }
  }, [filters, marksData]);

  // Stats
  const validMarks = students.map(s => Number(marksData[s.student_id])).filter(v => !isNaN(v) && v !== '');
  const topScore = validMarks.length ? Math.max(...validMarks) : null;
  const lowScore = validMarks.length ? Math.min(...validMarks) : null;
  const avgScore = validMarks.length ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length).toFixed(1) : null;

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fffbeb' }}>
          <BookOpen className="w-5 h-5" style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h1 className="font-black" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Enter Marks</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Auto grade calculation • 0–100 range</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap p-4 rounded-2xl border" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
        {[
          ['class_id', 'Select Class', classes, 'id', 'class_name'],
          ['section_id', 'Select Section', sections, 'id', 'section_name'],
          ['subject_id', 'Select Subject', subjects, 'id', 'subject_name'],
        ].map(([key, placeholder, opts, vk, lk]) => (
          <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            className="px-3 py-2.5 rounded-xl text-sm focus:outline-none flex-1"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', minWidth: '130px' }}>
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o[vk]} value={o[vk]}>{o[lk]}</option>)}
          </select>
        ))}
      </div>

      {/* Live stats */}
      {loaded && validMarks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Average', value: avgScore, color: '#6366f1', bg: '#eef2ff' },
            { label: 'Highest', value: topScore, color: '#10b981', bg: '#ecfdf5', icon: TrendingUp },
            { label: 'Lowest',  value: lowScore,  color: '#ef4444', bg: '#fef2f2', icon: TrendingDown },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4 text-center" style={{ background: bg }}>
              {Icon && <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />}
              <p className="text-2xl font-black" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loaded && students.length > 0 && (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <table className="w-full text-sm">
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  {['#', 'Register No', 'Student Name', 'Marks (0–100)', 'Grade', 'Performance'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const val = marksData[s.student_id];
                  const num = Number(val);
                  const grade = val !== '' && !isNaN(num) ? getGrade(num) : '—';
                  const gc = GRADE_COLOR[grade] || '#94a3b8';
                  const pct = val !== '' && !isNaN(num) ? num : 0;
                  const isTop = topScore !== null && num === topScore && val !== '';
                  const isLow = lowScore !== null && num === lowScore && val !== '' && validMarks.length > 1;

                  return (
                    <tr key={s.student_id} className="table-row-hover" style={{ borderBottom: '1px solid #F8FAFC' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <td className="px-5 py-3.5 text-xs font-mono" style={{ color: '#94a3b8' }}>{i + 1}</td>
                      <td className="px-5 py-3.5 text-xs font-bold" style={{ color: '#6366f1' }}>{s.register_number}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: '#0F172A' }}>{s.name}</td>
                      <td className="px-5 py-3.5">
                        <input type="number" min="0" max="100"
                          value={marksData[s.student_id] ?? ''}
                          onChange={e => setMarksData(prev => ({ ...prev, [s.student_id]: e.target.value }))}
                          className="w-20 px-3 py-1.5 rounded-xl text-sm font-bold text-center focus:outline-none transition-all"
                          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-black" style={{ color: gc }}>{grade}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E2E8F0', width: '80px' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: gc }} />
                          </div>
                          {isTop && <span className="text-[10px] font-bold" style={{ color: '#10b981' }}>🏆 Top</span>}
                          {isLow && <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>⚠ Low</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.25)', opacity: saving ? 0.7 : 1 }}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Marks'}
          </button>
        </>
      )}

      {!loaded && (
        <div className="py-16 text-center rounded-2xl border" style={{ background: '#fff', borderColor: '#E2E8F0', color: '#94a3b8' }}>
          Select class, section and subject to load students
        </div>
      )}
    </div>
  );
}
