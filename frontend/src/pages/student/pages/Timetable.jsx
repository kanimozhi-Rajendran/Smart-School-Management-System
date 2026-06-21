import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import { Calendar } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const FULL_SCHED = [1,2,'SB',3,4,'LB',5,6,7,8];

const SUBJECT_PALETTES = [
  { bg:'#EEF2FF', border:'#C7D2FE', text:'#4338CA', darkBg:'rgba(99,102,241,0.15)', darkText:'#A5B4FC', grad:'linear-gradient(135deg,#6366F1,#818CF8)' },
  { bg:'#ECFDF5', border:'#A7F3D0', text:'#065F46', darkBg:'rgba(16,185,129,0.15)', darkText:'#6EE7B7', grad:'linear-gradient(135deg,#10B981,#34D399)' },
  { bg:'#FFFBEB', border:'#FDE68A', text:'#92400E', darkBg:'rgba(245,158,11,0.15)', darkText:'#FCD34D', grad:'linear-gradient(135deg,#F59E0B,#FBBF24)' },
  { bg:'#EFF6FF', border:'#BFDBFE', text:'#1E40AF', darkBg:'rgba(59,130,246,0.15)', darkText:'#93C5FD', grad:'linear-gradient(135deg,#3B82F6,#60A5FA)' },
  { bg:'#FDF4FF', border:'#E9D5FF', text:'#7E22CE', darkBg:'rgba(168,85,247,0.15)', darkText:'#D8B4FE', grad:'linear-gradient(135deg,#A855F7,#C084FC)' },
  { bg:'#FFF1F2', border:'#FECDD3', text:'#9F1239', darkBg:'rgba(244,63,94,0.15)',  darkText:'#FDA4AF', grad:'linear-gradient(135deg,#F43F5E,#FB7185)' },
];

export default function Timetable({ showToast, darkMode }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const d = darkMode;
  const card = d ? '#111827' : '#FFFFFF';
  const bdr  = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const txt  = d ? '#F9FAFB' : '#111827';
  const sub  = d ? '#9CA3AF' : '#6B7280';

  useEffect(() => {
    api.get('/student/timetable')
      .then(r => { setTimetable(r.data.timetable || []); setLoading(false); })
      .catch(() => { showToast('Failed to load timetable', 'error'); setLoading(false); });
  }, []);

  const { grid, colorMap } = useMemo(() => {
    const g = {};
    DAYS.forEach(day => { g[day] = {}; });
    const cm = {};
    let idx = 0;
    timetable.forEach(slot => {
      if (slot.subject_name && !cm[slot.subject_name]) {
        cm[slot.subject_name] = SUBJECT_PALETTES[idx % SUBJECT_PALETTES.length];
        idx++;
      }
      if (slot.day_of_week && slot.period_number) g[slot.day_of_week][slot.period_number] = slot;
    });
    return { grid: g, colorMap: cm };
  }, [timetable]);

  if (loading) return (
    <div style={{ padding:'20px 24px' }}>
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  return (
    <div style={{ padding:'20px 24px', maxWidth:1400, margin:'0 auto' }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: d ? 'rgba(79,70,229,0.15)' : '#EEF2FF' }}>
            <Calendar className="w-5 h-5" style={{ color:'#4F46E5' }} />
          </div>
          <div>
            <h1 className="font-black" style={{ color: txt }}>Class Timetable</h1>
            <p className="text-xs" style={{ color: sub }}>{timetable.length} periods scheduled</p>
          </div>
        </div>
        {/* Legend */}
        <div className="hidden md:flex flex-wrap gap-2">
          {Object.entries(colorMap).map(([subj, pal]) => (
            <span key={subj} className="text-[10px] font-bold px-2.5 py-1 rounded-lg border"
              style={{ background: d ? pal.darkBg : pal.bg, color: d ? pal.darkText : pal.text, borderColor: d ? 'transparent' : pal.border }}>
              {subj}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl overflow-hidden fade-in" style={{ background: card, border:`1px solid ${bdr}`, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ background: d ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: sub, width: 80, borderBottom:`1px solid ${bdr}` }}>Period</th>
                {DAYS.map(day => (
                  <th key={day} className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider"
                    style={{ color: txt, borderBottom:`1px solid ${bdr}`, borderLeft:`1px solid ${bdr}` }}>
                    {day.slice(0,3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FULL_SCHED.map((p, rowIdx) => {
                if (p === 'SB') return (
                  <tr key="sb">
                    <td colSpan={7} className="text-center text-xs font-bold tracking-widest uppercase py-2"
                      style={{ background: d ? 'rgba(245,158,11,0.08)' : '#FFFBEB', color: '#D97706', borderTop:`1px solid ${bdr}` }}>
                      ☕ Short Break
                    </td>
                  </tr>
                );
                if (p === 'LB') return (
                  <tr key="lb">
                    <td colSpan={7} className="text-center text-xs font-bold tracking-widest uppercase py-2"
                      style={{ background: d ? 'rgba(16,185,129,0.08)' : '#ECFDF5', color: '#059669', borderTop:`1px solid ${bdr}` }}>
                      🍽️ Lunch Break
                    </td>
                  </tr>
                );
                return (
                  <tr key={p} className="table-row-hover" style={{ borderTop:`1px solid ${bdr}` }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: d ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: sub }}>P{p}</span>
                    </td>
                    {DAYS.map(day => {
                      const slot = grid[day]?.[p];
                      if (!slot) return (
                        <td key={day} className="px-2 py-2" style={{ borderLeft:`1px solid ${bdr}` }}>
                          <div className="text-center text-xs" style={{ color: d ? '#374151' : '#D1D5DB' }}>—</div>
                        </td>
                      );
                      const pal = colorMap[slot.subject_name] || SUBJECT_PALETTES[0];
                      return (
                        <td key={day} className="px-2 py-2" style={{ borderLeft:`1px solid ${bdr}` }}>
                          <div className="rounded-xl px-3 py-2.5 text-center border"
                            style={{ background: d ? pal.darkBg : pal.bg, borderColor: d ? 'transparent' : pal.border }}>
                            <p className="text-[11px] font-bold leading-tight" style={{ color: d ? pal.darkText : pal.text }}>
                              {slot.subject_name}
                            </p>
                            {slot.teacher_name && (
                              <p className="text-[10px] mt-0.5 truncate" style={{ color: d ? pal.darkText+'99' : pal.text+'99' }}>
                                {slot.teacher_name}
                              </p>
                            )}
                          </div>
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
          <div className="py-16 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: d ? '#374151' : '#E5E7EB' }} />
            <p style={{ color: sub }}>No timetable assigned yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
