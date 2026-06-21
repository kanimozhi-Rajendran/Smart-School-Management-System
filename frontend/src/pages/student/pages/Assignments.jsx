import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';

const STATUS_STYLE = {
  Pending:   { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', icon: Clock },
  Submitted: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', icon: CheckCircle },
  Graded:    { bg: '#eef2ff', border: '#c7d2fe', text: '#4f46e5', icon: CheckCircle },
  Late:      { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', icon: AlertTriangle },
};

const PRIORITY_BG = { High: '#fef2f2', Medium: '#fffbeb', Low: '#ecfdf5' };
const PRIORITY_TEXT = { High: '#dc2626', Medium: '#d97706', Low: '#059669' };

export default function Assignments({ showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/student/assignments')
      .then(r => { setAssignments(r.data.assignments || []); setLoading(false); })
      .catch(() => { showToast('Failed to load assignments', 'error'); setLoading(false); });
  }, []);

  const filtered = assignments.filter(a => {
    if (filter === 'pending') return a.submission_status === 'Pending';
    if (filter === 'submitted') return ['Submitted', 'Graded'].includes(a.submission_status);
    if (filter === 'graded') return a.submission_status === 'Graded';
    return true;
  });

  const counts = {
    all: assignments.length,
    pending: assignments.filter(a => a.submission_status === 'Pending').length,
    submitted: assignments.filter(a => ['Submitted','Graded'].includes(a.submission_status)).length,
    graded: assignments.filter(a => a.submission_status === 'Graded').length,
  };

  const isOverdue = (dueDate, status) => new Date(dueDate) < new Date() && status === 'Pending';

  if (loading) return (
    <div className="p-4 lg:p-6 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fffbeb' }}>
          <ClipboardList className="w-5 h-5" style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h1 className="font-black" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Assignments</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{counts.pending} pending · {counts.graded} graded</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Total', color: '#6366f1', bg: '#eef2ff' },
          { key: 'pending', label: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
          { key: 'submitted', label: 'Submitted', color: '#10b981', bg: '#ecfdf5' },
          { key: 'graded', label: 'Graded', color: '#0ea5e9', bg: '#f0f9ff' },
        ].map(({ key, label, color, bg }) => (
          <button key={key} onClick={() => setFilter(key)}
            className="rounded-2xl p-4 text-left transition-all"
            style={{
              background: filter === key ? bg : '#fff',
              border: `1px solid ${filter === key ? color + '40' : '#E2E8F0'}`,
              boxShadow: filter === key ? `0 4px 12px ${color}20` : 'none',
            }}>
            <p className="text-2xl font-black" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{counts[key]}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{label}</p>
          </button>
        ))}
      </div>

      {/* Assignment list */}
      <div className="space-y-3">
        {filtered.map(a => {
          const s = STATUS_STYLE[a.submission_status] || STATUS_STYLE.Pending;
          const Icon = s.icon;
          const overdue = isOverdue(a.due_date, a.submission_status);

          return (
            <div key={a.id} className="rounded-2xl border overflow-hidden transition-all hover:shadow-md"
              style={{ background: '#fff', borderColor: '#E2E8F0' }}>
              <div className="h-1" style={{ background: `linear-gradient(to right, ${PRIORITY_BG[a.priority]}, ${PRIORITY_TEXT[a.priority]}40)` }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {a.subject_name && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                          {a.subject_name}
                        </span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: PRIORITY_BG[a.priority], color: PRIORITY_TEXT[a.priority] }}>
                        {a.priority}
                      </span>
                      {overdue && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          ⚠ Overdue
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold" style={{ color: '#0F172A' }}>{a.title}</h3>
                    {a.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#64748b' }}>{a.description}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}>
                        <Clock className="w-3 h-3" />Due: <strong style={{ color: overdue ? '#dc2626' : '#0F172A' }}>{a.due_date}</strong>
                      </span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>Max: {a.max_marks} marks</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border"
                      style={{ background: s.bg, borderColor: s.border, color: s.text }}>
                      <Icon className="w-3.5 h-3.5" />{a.submission_status}
                    </span>
                    {a.submission_status === 'Graded' && a.marks_obtained !== null && (
                      <div className="mt-2 text-right">
                        <p className="text-2xl font-black" style={{ color: '#4f46e5', fontFamily: 'Outfit, sans-serif' }}>
                          {a.marks_obtained}<span className="text-sm font-normal" style={{ color: '#94a3b8' }}>/{a.max_marks}</span>
                        </p>
                        {a.remarks && <p className="text-xs mt-0.5 max-w-[150px]" style={{ color: '#64748b' }}>{a.remarks}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center rounded-2xl border" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
            <p style={{ color: '#94a3b8' }}>No {filter !== 'all' ? filter : ''} assignments</p>
          </div>
        )}
      </div>
    </div>
  );
}
