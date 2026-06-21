import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { UserCheck } from 'lucide-react';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const STATUS_CONFIG = {
  Present: { bg: '#ECFDF5', text: '#065F46', dark: 'rgba(16,185,129,0.15)', darkText: '#34D399', dot: '#10B981' },
  Absent:  { bg: '#FEF2F2', text: '#991B1B', dark: 'rgba(239,68,68,0.15)',  darkText: '#F87171', dot: '#EF4444' },
  Late:    { bg: '#FFFBEB', text: '#92400E', dark: 'rgba(245,158,11,0.15)', darkText: '#FCD34D', dot: '#F59E0B' },
  Leave:   { bg: '#EFF6FF', text: '#1E40AF', dark: 'rgba(59,130,246,0.15)', darkText: '#93C5FD', dot: '#3B82F6' },
};

export default function Attendance({ showToast, darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const d = darkMode;
  const card = d ? '#111827' : '#FFFFFF';
  const bdr  = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const txt  = d ? '#F9FAFB' : '#111827';
  const sub  = d ? '#9CA3AF' : '#6B7280';

  useEffect(() => {
    api.get('/student/attendance')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { showToast('Failed to load attendance', 'error'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ padding: '20px 24px' }} className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );

  const { attendance = [], stats = {}, monthly = [] } = data || {};
  const pct = parseFloat(stats.percentage || 0);
  const r = 44, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }} className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Circle */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl flex flex-col items-center justify-center gap-2 py-5 fade-in"
          style={{ background: card, border: `1px solid ${bdr}` }}>
          <svg viewBox="0 0 100 100" className="w-28 h-28">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={d ? '#1F2937' : '#F3F4F6'} strokeWidth="9" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="17" fontWeight="800" fill={d ? '#F9FAFB' : '#111827'}>{pct}%</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7.5" fill={d ? '#6B7280' : '#9CA3AF'}>Attendance</text>
          </svg>
          <p className="text-xs font-semibold" style={{ color: sub }}>{stats.total || 0} Total Days</p>
        </div>

        {[
          ['Present', stats.present || 0, 'Present'],
          ['Absent',  stats.absent  || 0, 'Absent'],
          ['Late',    stats.late    || 0, 'Late'],
          ['Leave',   stats.leave   || 0, 'Leave'],
        ].map(([label, value, key]) => {
          const cfg = STATUS_CONFIG[key];
          return (
            <div key={label} className="rounded-2xl p-5 flex flex-col justify-between fade-in"
              style={{ background: card, border: `1px solid ${bdr}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sub }}>{label}</span>
              </div>
              <p className="text-4xl font-black" style={{ color: d ? cfg.darkText : cfg.text }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: sub }}>school days</p>
            </div>
          );
        })}
      </div>

      {/* Monthly chart */}
      {monthly.length > 0 && (
        <div className="rounded-2xl overflow-hidden fade-in" style={{ background: card, border: `1px solid ${bdr}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${bdr}` }}>
            <span className="font-bold text-sm" style={{ color: txt }}>Monthly Attendance Overview</span>
          </div>
          <div className="p-5">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {monthly.map(m => {
                const total = (m.present + m.absent + m.late + m.leave) || 1;
                const month = new Date(m.month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' });
                return (
                  <div key={m.month} className="flex-shrink-0 flex flex-col items-center gap-2" style={{ minWidth: 52 }}>
                    <div className="flex flex-col-reverse rounded-lg overflow-hidden" style={{ width: 32, height: 80 }}>
                      {[['present','#10B981'],['absent','#EF4444'],['late','#F59E0B'],['leave','#3B82F6']].map(([k, c]) =>
                        m[k] > 0 ? <div key={k} style={{ height:`${(m[k]/total)*100}%`, background:c, minHeight:3 }} /> : null
                      )}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: sub }}>{month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {[['#10B981','Present'],['#EF4444','Absent'],['#F59E0B','Late'],['#3B82F6','Leave']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
                  <span className="text-xs font-medium" style={{ color: sub }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="rounded-2xl overflow-hidden fade-in" style={{ background: card, border: `1px solid ${bdr}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${bdr}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: d ? 'rgba(79,70,229,0.15)' : '#EEF2FF' }}>
              <UserCheck className="w-4 h-4" style={{ color: '#4F46E5' }} />
            </div>
            <span className="font-bold text-sm" style={{ color: txt }}>Attendance History</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
            style={{ background: d ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: sub }}>
            {attendance.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: d ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                {['Date','Day','Status','Remarks'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: sub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, i) => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.Present;
                return (
                  <tr key={i} className="table-row-hover" style={{ borderTop: `1px solid ${bdr}` }}>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: txt }}>{a.date}</td>
                    <td className="px-5 py-3.5" style={{ color: sub }}>{DAYS[new Date(a.date).getDay()]}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: d ? cfg.dark : cfg.bg, color: d ? cfg.darkText : cfg.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: sub }}>{a.remarks || '—'}</td>
                  </tr>
                );
              })}
              {attendance.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-14 text-center text-sm" style={{ color: sub }}>No attendance records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
