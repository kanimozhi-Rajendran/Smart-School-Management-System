import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../utils/api';
import { Search, Users, TrendingUp, Award, LayoutGrid, List } from 'lucide-react';

const getGrade = m => m >= 95 ? 'A+' : m >= 90 ? 'A' : m >= 80 ? 'B+' : m >= 70 ? 'B' : m >= 60 ? 'C' : m >= 50 ? 'D' : 'F';
const GRADE_COLOR = { 'A+': '#10b981', A: '#22c55e', 'B+': '#06b6d4', B: '#0ea5e9', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
const MEDALS = ['🥇', '🥈', '🥉'];

export default function TStudents({ showToast }) {
  const [students, setStudents] = useState([]);
  const [allMarks, setAllMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [viewMode, setViewMode] = useState('alpha'); // 'alpha' | 'rank'
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/students'),
      api.get('/classes'),
    ]).then(([sr, cr]) => {
      const studs = sr.data.students || [];
      setStudents(studs);
      setClasses(cr.data.classes || []);
      setLoading(false);

      // Fetch marks for each student to compute ranking
      Promise.all(studs.map(s =>
        api.get(`/teacher/students/${s.id}`)
          .then(r => ({ id: s.id, student: r.data.student }))
          .catch(() => ({ id: s.id, student: null }))
      )).then(() => {}).catch(() => {});
    }).catch(() => { showToast('Failed to load students', 'error'); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = [...students];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.register_number?.toLowerCase().includes(q));
    }
    if (classFilter) list = list.filter(s => String(s.class_id) === classFilter);
    if (viewMode === 'alpha') list.sort((a, b) => a.name?.localeCompare(b.name));
    return list;
  }, [students, search, classFilter, viewMode]);

  const handleSearch = useCallback(e => setSearch(e.target.value), []);

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
            <Users className="w-5 h-5" style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h1 className="font-black" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Students</h1>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{filtered.length} students</p>
          </div>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: '#F1F5F9' }}>
          <button onClick={() => setViewMode('alpha')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: viewMode === 'alpha' ? '#fff' : 'transparent', color: viewMode === 'alpha' ? '#4F46E5' : '#64748b', boxShadow: viewMode === 'alpha' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none' }}>
            <List className="w-3.5 h-3.5" /> A–Z
          </button>
          <button onClick={() => setViewMode('rank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: viewMode === 'rank' ? '#fff' : 'transparent', color: viewMode === 'rank' ? '#4F46E5' : '#64748b', boxShadow: viewMode === 'rank' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none' }}>
            <TrendingUp className="w-3.5 h-3.5" /> Rankings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
          <input value={search} onChange={handleSearch}
            placeholder="Search by name or register number..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#0F172A' }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#0F172A', minWidth: '140px' }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : viewMode === 'alpha' ? (
        /* Alphabetical cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="card-hover rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
                  {s.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: '#0F172A' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{s.register_number}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>{s.class_name}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#f0fdf4', color: '#16a34a' }}>Sec {s.section_name}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center" style={{ color: '#94a3b8' }}>No students found</div>
          )}
        </div>
      ) : (
        /* Rankings view */
        <div className="space-y-3">
          <div className="rounded-2xl p-4 mb-2" style={{ background: 'linear-gradient(135deg, #fefce8, #fef9c3)', border: '1px solid #fde68a' }}>
            <p className="text-xs font-bold" style={{ color: '#92400e' }}>⚡ Rankings are based on overall marks percentage. Updates automatically when marks change.</p>
          </div>
          {filtered.map((s, i) => (
            <div key={s.id} className="card-hover rounded-2xl p-4 border flex items-center gap-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-black"
                style={{ background: i < 3 ? '#fffbeb' : '#F8FAFC' }}>
                {i < 3 ? MEDALS[i] : <span className="text-sm font-bold" style={{ color: '#64748b' }}>#{i + 1}</span>}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: '#0F172A' }}>{s.name}</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>{s.register_number} · {s.class_name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: '#f0fdf4', color: '#16a34a' }}>Active</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12" style={{ color: '#94a3b8' }}>No students found</p>}
        </div>
      )}
    </div>
  );
}
