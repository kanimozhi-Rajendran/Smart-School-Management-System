import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import { CreditCard, Bus, Receipt, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

const fmt = n => '₹' + parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:2});

const STATUS_CFG = {
  Paid:    { icon:CheckCircle, bg:'#ECFDF5', text:'#065F46', dBg:'rgba(16,185,129,0.15)', dTxt:'#34D399', dot:'#10B981' },
  Partial: { icon:AlertCircle, bg:'#FFFBEB', text:'#92400E', dBg:'rgba(245,158,11,0.15)', dTxt:'#FCD34D', dot:'#F59E0B' },
  Pending: { icon:Clock,       bg:'#F8FAFC', text:'#475569', dBg:'rgba(100,116,139,0.15)',dTxt:'#94A3B8', dot:'#94A3B8' },
  Overdue: { icon:XCircle,     bg:'#FEF2F2', text:'#991B1B', dBg:'rgba(239,68,68,0.15)',  dTxt:'#F87171', dot:'#EF4444' },
};

export default function Fees({ showToast, darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const d = darkMode;
  const card = d ? '#111827' : '#FFFFFF';
  const bdr  = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const txt  = d ? '#F9FAFB' : '#111827';
  const sub  = d ? '#9CA3AF' : '#6B7280';

  useEffect(() => {
    api.get('/student/fees')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { showToast('Failed to load fees', 'error'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ padding:'20px 24px' }} className="space-y-4">
      {[...Array(3)].map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );

  const { fees=[], summary={}, payments=[], transport=null } = data || {};
  const paidPct = parseFloat(summary.paidPct || 0);
  const r=42, cx=50, cy=50, circ=2*Math.PI*r;
  const dash = circ - (paidPct/100)*circ;
  const color = paidPct >= 80 ? '#10B981' : paidPct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ padding:'20px 24px', maxWidth:1200, margin:'0 auto' }} className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total Fees',  value:fmt(summary.totalFees),   color:'#4F46E5', bg: d?'rgba(79,70,229,0.12)':'#EEF2FF' },
          { label:'Paid',        value:fmt(summary.totalPaid),   color:'#10B981', bg: d?'rgba(16,185,129,0.12)':'#ECFDF5' },
          { label:'Pending',     value:fmt(summary.totalPending),color:'#EF4444', bg: d?'rgba(239,68,68,0.12)':'#FEF2F2' },
          { label:'Paid %',      value:`${paidPct}%`,            color:'#8B5CF6', bg: d?'rgba(139,92,246,0.12)':'#F5F3FF' },
        ].map(({ label, value, color: c, bg: abg }, i) => (
          <div key={label} className={`rounded-2xl p-5 fade-in stagger-${i+1}`} style={{ background: abg, border:`1.5px solid ${c}20` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c+'CC' }}>{label}</p>
            <p className="text-2xl font-black" style={{ color: d ? '#F9FAFB' : '#111827' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut */}
        <div className="rounded-2xl p-6 flex flex-col items-center gap-4 fade-in" style={{ background: card, border:`1px solid ${bdr}` }}>
          <p className="font-bold text-sm self-start" style={{ color: txt }}>Payment Progress</p>
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={d?'#1F2937':'#F3F4F6'} strokeWidth="10" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`} style={{ transition:'stroke-dashoffset 1s ease' }} />
            <text x={cx} y={cy-4} textAnchor="middle" fontSize="15" fontWeight="900" fill={d?'#F9FAFB':'#111827'}>{paidPct}%</text>
            <text x={cx} y={cy+10} textAnchor="middle" fontSize="7" fill={d?'#6B7280':'#9CA3AF'}>Paid</text>
          </svg>
          <div className="w-full space-y-2.5">
            {[['Paid',summary.totalPaid,'#10B981'],['Pending',summary.totalPending,'#EF4444']].map(([l,v,c])=>(
              <div key={l} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2" style={{ color: sub }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}
                </span>
                <span className="font-bold" style={{ color: txt }}>{fmt(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee table */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden fade-in" style={{ background: card, border:`1px solid ${bdr}` }}>
          <div className="px-5 py-4" style={{ borderBottom:`1px solid ${bdr}` }}>
            <span className="font-bold text-sm" style={{ color: txt }}>Fee Breakdown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: d?'rgba(255,255,255,0.03)':'#F8FAFC' }}>
                  {['Type','Term','Total','Paid','Pending','Due','Status'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: sub, borderBottom:`1px solid ${bdr}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.map(f => {
                  const s = STATUS_CFG[f.status] || STATUS_CFG.Pending;
                  const Icon = s.icon;
                  const barW = f.total_amount > 0 ? (parseFloat(f.paid_amount)/parseFloat(f.total_amount)*100) : 0;
                  return (
                    <tr key={f.id} className="table-row-hover" style={{ borderTop:`1px solid ${bdr}` }}>
                      <td className="px-4 py-3.5 font-bold whitespace-nowrap" style={{ color: txt }}>{f.fee_type}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: sub }}>{f.term}</td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: txt }}>{fmt(f.total_amount)}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold" style={{ color:'#10B981' }}>{fmt(f.paid_amount)}</div>
                        <div className="w-16 h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: d?'#1F2937':'#F3F4F6' }}>
                          <div className="h-full rounded-full" style={{ width:`${barW}%`, background:'#10B981' }} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color:'#EF4444' }}>{fmt(f.pending_amount)}</td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: sub }}>{f.due_date||'—'}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: d?s.dBg:s.bg, color: d?s.dTxt:s.text }}>
                          <Icon className="w-3 h-3" />{f.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {fees.length===0&&<tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{color:sub}}>No fee records</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transport */}
      {transport && (
        <div className="rounded-2xl overflow-hidden fade-in" style={{ background: card, border:`1px solid ${bdr}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:`1px solid ${bdr}` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: d?'rgba(245,158,11,0.15)':'#FFFBEB' }}>
                <Bus className="w-4 h-4" style={{ color:'#F59E0B' }} />
              </div>
              <span className="font-bold text-sm" style={{ color: txt }}>Transport Details</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: transport.status==='Active'?(d?'rgba(16,185,129,0.15)':'#ECFDF5'):(d?'rgba(100,116,139,0.15)':'#F1F5F9'), color: transport.status==='Active'?(d?'#34D399':'#065F46'):(d?'#94A3B8':'#475569') }}>
              {transport.status}
            </span>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[['Route',transport.route_name],['Pickup Point',transport.pickup_point],['Vehicle No.',transport.vehicle_number],['Monthly Fee',fmt(transport.monthly_fee)],['Months Paid',`${transport.months_paid}/${transport.total_months}`],['Pending Months',transport.total_months-transport.months_paid],['Total Fee',fmt(transport.monthly_fee*transport.total_months)],['Pending',fmt(transport.pending_amount)]].map(([l,v])=>(
              <div key={l}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: sub }}>{l}</p>
                <p className="font-bold" style={{ color: txt }}>{v||'—'}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: sub }}>
              <span>{transport.months_paid} months paid</span>
              <span>{transport.total_months-transport.months_paid} remaining</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: d?'#1F2937':'#F3F4F6' }}>
              <div className="h-full rounded-full progress-bar" style={{ width:`${(transport.months_paid/transport.total_months)*100}%`, background:'linear-gradient(90deg,#F59E0B,#FCD34D)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="rounded-2xl overflow-hidden fade-in" style={{ background: card, border:`1px solid ${bdr}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:`1px solid ${bdr}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: d?'rgba(79,70,229,0.15)':'#EEF2FF' }}>
              <Receipt className="w-4 h-4" style={{ color:'#4F46E5' }} />
            </div>
            <span className="font-bold text-sm" style={{ color: txt }}>Payment History</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ background:d?'rgba(255,255,255,0.05)':'#F1F5F9', color:sub }}>{payments.length} transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: d?'rgba(255,255,255,0.03)':'#F8FAFC' }}>
                {['Receipt','Fee Type','Term','Amount','Date','Mode'].map(h=>(
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color:sub, borderBottom:`1px solid ${bdr}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p=>(
                <tr key={p.id} className="table-row-hover" style={{ borderTop:`1px solid ${bdr}` }}>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color:'#4F46E5' }}>{p.receipt_number}</td>
                  <td className="px-5 py-3.5 font-semibold" style={{ color:txt }}>{p.fee_type}</td>
                  <td className="px-5 py-3.5" style={{ color:sub }}>{p.term}</td>
                  <td className="px-5 py-3.5 font-bold" style={{ color:'#10B981' }}>{fmt(p.amount)}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap" style={{ color:sub }}>{p.payment_date}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background:d?'rgba(14,165,233,0.15)':'#E0F2FE', color:d?'#38BDF8':'#0369A1' }}>{p.payment_mode}</span>
                  </td>
                </tr>
              ))}
              {payments.length===0&&<tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{color:sub}}>No payment records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
