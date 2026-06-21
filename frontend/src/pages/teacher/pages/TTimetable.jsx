import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Calendar } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SUBJECT_COLORS = [
  { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca' },
  { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
];
const FREE = { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' };

export default function TTimetable({ showToast }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/timetable')
      .then(r => { setTimetable(r.data.timetable || []); setLoading(false); })
      .catch(() => { showToast('Failed to load timetable', 'error'); setLoading(false); });
  }, []);

  // Build lookup: {day: {period: slot}}
  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; });
  const subjectColorMap = {};
  let colorIdx = 0;
  timetable.forEach(slot => {
    if (slot.subject_name && !subjectColorMap[slot.subject_name]) {
      subjectColorMap[slot.subject_name] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
      colorIdx++;
    }
    if (slot.day_of_week) grid[slot.day_of_week][slot.period_number] = slot;
  });

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
  const todaySlots = timetable.filter(t => t.day_of_week === today).sort((a, b) => a.period_number - b.period_number);

  const SCHEDULE = [1, 2, 'SB', 3, 4, 'LB', 5, 6, 7, 8];

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f0f9ff' }}>
          <Calendar className="w-5 h-5" style={{ color: '#0ea5e9' }} />
        </div>
        <div>
          <h1 className="font-black" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>My Timetable</h1>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{timetable.length} periods assigned</p>
        </div>
      </div>

      {/* Today's quick view */}
      {todaySlots.length > 0 && (
        <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderColor: '#bae6fd' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#0369a1' }}>Today — {today}</p>
          <div className="flex gap-2 flex-wrap">
            {todaySlots.map(s => {
              const c = subjectColorMap[s.subject_name] || SUBJECT_COLORS[0];
              return (
                <div key={s.period_number} className="px-3 py-2 rounded-xl border text-center min-w-[90px]"
                  style={{ background: c.bg, borderColor: c.border }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c.text }}>P{s.period_number}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: c.text }}>{s.subject_name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: `${c.text}99` }}>{s.class_name} {s.section_name}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full timetable grid */}
      {loading ? (
        <div className="skeleton h-80 rounded-2xl" />
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          {/* Legend */}
          {Object.keys(subjectColorMap).length > 0 && (
            <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderBottom: '1px solid #F1F5F9' }}>
              {Object.entries(subjectColorMap).map(([subj, c]) => (
                <span key={subj} className="text-[10px] font-bold px-2 py-0.5 rounded-lg border" style={{ background: c.bg, borderColor: c.border, color: c.text }}>{subj}</span>
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[640px]">
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-20" style={{ color: '#64748b', borderBottom: '1px solid #E2E8F0' }}>Period</th>
                  {DAYS.map(d => (
                    <th key={d} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider"
                      style={{ color: d === today ? '#0ea5e9' : '#64748b', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9', background: d === today ? '#f0f9ff' : 'transparent' }}>
                      {d.slice(0, 3)}
                      {d === today && <span className="block text-[9px] font-bold" style={{ color: '#0ea5e9' }}>Today</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE.map(p => {
                  if (p === 'SB') return (
                    <tr key="sb" style={{ background: '#fffbeb' }}>
                      <td colSpan={7} className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wide" style={{ color: '#92400e' }}>
                        ☕ Short Break
                      </td>
                    </tr>
                  );
                  if (p === 'LB') return (
                    <tr key="lb" style={{ background: '#ecfdf5' }}>
                      <td colSpan={7} className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wide" style={{ color: '#065f46' }}>
                        🍽️ Lunch Break
                      </td>
                    </tr>
                  );
                  return (
                    <tr key={p} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: '#F1F5F9', color: '#64748b' }}>P{p}</span>
                      </td>
                      {DAYS.map(d => {
                        const slot = grid[d]?.[p];
                        const c = slot ? (subjectColorMap[slot.subject_name] || SUBJECT_COLORS[0]) : null;
                        return (
                          <td key={d} className="px-2 py-2" style={{ borderLeft: '1px solid #F8FAFC', background: d === today ? '#f9feff' : 'transparent' }}>
                            {slot ? (
                              <div className="rounded-xl px-2.5 py-2 text-center border" style={{ background: c.bg, borderColor: c.border }}>
                                <p className="text-[11px] font-bold leading-tight" style={{ color: c.text }}>{slot.subject_name}</p>
                                <p className="text-[10px] mt-0.5 opacity-70" style={{ color: c.text }}>{slot.class_name} {slot.section_name}</p>
                              </div>
                            ) : (
                              <div className="rounded-xl px-2.5 py-2 text-center border" style={{ background: FREE.bg, borderColor: FREE.border }}>
                                <p className="text-[10px] font-bold" style={{ color: FREE.text }}>FREE</p>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {timetable.length === 0 && (
            <div className="py-16 text-center" style={{ color: '#94a3b8' }}>No timetable assigned yet</div>
          )}
        </div>
      )}
    </div>
  );
}
