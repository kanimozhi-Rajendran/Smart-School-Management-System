import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { BookOpen, TrendingUp, TrendingDown, Award } from 'lucide-react';

const GRADE_CFG = {
  'A+': { color:'#059669', bg:'#ECFDF5', darkBg:'rgba(16,185,129,0.12)', bar:'#10B981' },
  'A':  { color:'#047857', bg:'#D1FAE5', darkBg:'rgba(16,185,129,0.15)', bar:'#34D399' },
  'B+': { color:'#0369A1', bg:'#E0F2FE', darkBg:'rgba(14,165,233,0.12)', bar:'#0EA5E9' },
  'B':  { color:'#1D4ED8', bg:'#EFF6FF', darkBg:'rgba(59,130,246,0.12)', bar:'#3B82F6' },
  'C':  { color:'#B45309', bg:'#FFFBEB', darkBg:'rgba(245,158,11,0.12)', bar:'#F59E0B' },
  'D':  { color:'#C2410C', bg:'#FFF7ED', darkBg:'rgba(249,115,22,0.12)', bar:'#F97316' },
  'F':  { color:'#B91C1C', bg:'#FEF2F2', darkBg:'rgba(239,68,68,0.12)',  bar:'#EF4444' },
};

const SUBJECT_GRADS = [
  'linear-gradient(135deg,#4F46E5,#7C3AED)',
  'linear-gradient(135deg,#059669,#0D9488)',
  'linear-gradient(135deg,#D97706,#DC2626)',
  'linear-gradient(135deg,#0284C7,#0369A1)',
  'linear-gradient(135deg,#9333EA,#C026D3)',
  'linear-gradient(135deg,#0891B2,#0E7490)',
];

export default function Marks({ showToast, darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const d = darkMode;
  const card = d ? '#111827' : '#FFFFFF';
  const bdr  = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const txt  = d ? '#F9FAFB' : '#111827';
  const sub  = d ? '#9CA3AF' : '#6B7280';

  useEffect(() => {
    api.get('/student/marks')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { showToast('Failed to load marks', 'error'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ padding:'20px 24px' }} className="space-y-4">
      <div className="skeleton h-40 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_,i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    </div>
  );

  const { marks = [], summary = {} } = data || {};
  const pct = parseFloat(summary.percentage || 0);
  const grade = summary.grade || 'N/A';
  const gc = GRADE_CFG[grade] || GRADE_CFG['F'];
  const r = 50, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  return (
    <div style={{ padding:'20px 24px', maxWidth:1200, margin:'0 auto' }} className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Doughnut */}
        <div className="rounded-2xl p-6 flex flex-col items-center gap-3 fade-in" style={{ background: card, border:`1px solid ${bdr}` }}>
          <p className="font-bold text-sm self-start" style={{ color: txt }}>Overall Performance</p>
          <svg viewBox="0 0 120 120" className="w-36 h-36">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={d ? '#1F2937' : '#F3F4F6'} strokeWidth="11" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={gc.bar} strokeWidth="11"
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`} style={{ transition:'stroke-dashoffset 1s ease' }} />
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize="20" fontWeight="900" fill={d ? '#F9FAFB' : '#111827'}>{pct}%</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill={d ? '#6B7280' : '#9CA3AF'}>Overall Score</text>
          </svg>
          <div className="text-center">
            <span className="text-4xl font-black" style={{ color: d ? gc.bar : gc.color }}>{grade}</span>
            <p className="text-xs mt-0.5 font-semibold" style={{ color: sub }}>Current Grade</p>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[
            { label:'Total Marks', value:`${summary.total||0}/${summary.maxPossible||0}`, sub:'points scored', icon:BookOpen, color:'#4F46E5' },
            { label:'Percentage',  value:`${pct}%`,              sub:'overall score',   icon:Award,     color:'#8B5CF6' },
            { label:'Top Subject', value:summary.top_subject||'—', sub:'best performance', icon:TrendingUp, color:'#10B981' },
            { label:'Weak Subject',value:summary.weak_subject||'—',sub:'needs attention',  icon:TrendingDown,color:'#EF4444' },
          ].map(({ label, value, sub: s, icon: Icon, color }, i) => (
            <div key={label} className={`rounded-2xl p-4 fade-in stagger-${i+1}`} style={{ background: card, border:`1px solid ${bdr}` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color+'20' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: sub }}>{label}</span>
              </div>
              <p className="font-black text-xl leading-tight truncate" style={{ color: txt }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: sub }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subject cards */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: sub }}>Subject-wise Report Card</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marks.length > 0 ? marks.map((m, i) => {
            const g = GRADE_CFG[m.grade] || GRADE_CFG['F'];
            const barPct = Math.round((m.marks / (m.max_marks || 100)) * 100);
            return (
              <div key={m.subject} className={`rounded-2xl overflow-hidden card-hover fade-in stagger-${(i%6)+1}`}
                style={{ background: card, border:`1px solid ${bdr}`, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Color strip */}
                <div className="h-1.5 w-full" style={{ background: SUBJECT_GRADS[i % SUBJECT_GRADS.length] }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold" style={{ color: txt }}>{m.subject}</h3>
                      <p className="text-xs mt-0.5" style={{ color: sub }}>{m.marks} / {m.max_marks || 100} marks</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl text-lg font-black"
                      style={{ background: d ? g.darkBg : g.bg, color: d ? g.bar : g.color }}>
                      {m.grade}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span style={{ color: sub }}>Score</span>
                      <span style={{ color: txt }}>{barPct}%</span>
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: d ? '#1F2937' : '#F3F4F6' }}>
                      <div className="absolute inset-y-0 left-0 rounded-full progress-bar"
                        style={{ width:`${barPct}%`, background: g.bar }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-3 py-16 flex flex-col items-center gap-3">
              <BookOpen className="w-12 h-12" style={{ color: d ? '#374151' : '#E5E7EB' }} />
              <p style={{ color: sub }}>No marks available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
