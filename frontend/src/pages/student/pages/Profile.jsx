import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { User, Phone, BookOpen, Bus, Shield, Lock } from 'lucide-react';

const SK = ({ h = 'h-6', w = 'w-full' }) => <div className={`skeleton ${w} ${h} rounded-lg`} />;

function Section({ title, icon: Icon, color, children, darkMode }) {
  const card = darkMode ? '#111827' : '#FFFFFF';
  const bdr  = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  return (
    <div className="rounded-2xl overflow-hidden fade-in" style={{ background: card, border: `1px solid ${bdr}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: `1px solid ${bdr}` }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="font-bold text-sm" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>{title}</span>
      </div>
      <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, darkMode }) {
  const bdr = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${bdr}` }}>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: darkMode ? '#4B5563' : '#9CA3AF' }}>{label}</span>
      <span className="text-sm font-semibold text-right max-w-[60%] truncate" style={{ color: value ? (darkMode ? '#F9FAFB' : '#111827') : (darkMode ? '#374151' : '#D1D5DB') }}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function Profile({ showToast, darkMode }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const d = darkMode;

  useEffect(() => {
    api.get('/student/profile')
      .then(r => { setStudent(r.data.student); setLoading(false); })
      .catch(() => { showToast('Failed to load profile', 'error'); setLoading(false); });
  }, []);

  const bg = d ? '#0B0F1A' : '#F8FAFC';

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }} className="space-y-5">
      {/* Header card */}
      {loading ? <SK h="h-36" w="w-full" /> : !student ? (
        <div className="text-center py-16" style={{ color: d ? '#4B5563' : '#9CA3AF' }}>Profile not found</div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl fade-in"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#6D28D9,#7C3AED)', padding: '28px 32px', boxShadow: '0 12px 40px rgba(79,70,229,0.3)' }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
            <div style={{ position:'absolute', bottom:-20, left:100, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
                style={{ background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.3)' }}>
                {student.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-black text-white">{student.name}</h1>
                <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.7)' }}>{student.register_number} · {student.class_name} · Section {student.section_name}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {[student.gender, 'Active'].filter(Boolean).map(tag => (
                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-lg capitalize"
                      style={{ background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl"
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)' }}>
                <Lock className="w-4 h-4 text-white opacity-60" />
                <span className="text-[11px] text-white opacity-60 font-semibold uppercase tracking-wide">Read Only</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Academic Information" icon={BookOpen} color="#4F46E5" darkMode={d}>
              <Field label="Register Number" value={student.register_number} darkMode={d} />
              <Field label="Admission Number" value={student.admission_number} darkMode={d} />
              <Field label="Roll Number" value={student.roll_number} darkMode={d} />
              <Field label="Class" value={student.class_name} darkMode={d} />
              <Field label="Section" value={student.section_name} darkMode={d} />
              <Field label="Admission Date" value={student.created_at?.split('T')[0]} darkMode={d} />
              <Field label="Status" value="Active" darkMode={d} />
            </Section>

            <Section title="Personal Information" icon={User} color="#8B5CF6" darkMode={d}>
              <Field label="Full Name" value={student.name} darkMode={d} />
              <Field label="Gender" value={student.gender} darkMode={d} />
              <Field label="Date of Birth" value={student.dob} darkMode={d} />
              <Field label="Blood Group" value={student.blood_group} darkMode={d} />
              <Field label="Address" value={student.address} darkMode={d} />
            </Section>

            <Section title="Parent & Guardian" icon={Phone} color="#10B981" darkMode={d}>
              <Field label="Father Name" value={student.father_name} darkMode={d} />
              <Field label="Mother Name" value={student.mother_name} darkMode={d} />
              <Field label="Parent Mobile" value={student.parent_mobile} darkMode={d} />
              <Field label="Parent Email" value={student.parent_email} darkMode={d} />
              <Field label="Emergency Contact" value={student.emergency_contact} darkMode={d} />
            </Section>

            <Section title="Transport & Other" icon={Bus} color="#F59E0B" darkMode={d}>
              <Field label="Transport Details" value={student.transport_details} darkMode={d} />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
