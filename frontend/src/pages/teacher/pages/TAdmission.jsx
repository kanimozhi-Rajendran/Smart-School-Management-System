import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import { UserPlus, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const INPUT = ({ label, name, value, onChange, type = 'text', required, placeholder, options }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    {options ? (
      <select name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
        onFocus={e => e.target.style.borderColor = '#0ea5e9'}
        onBlur={e => e.target.style.borderColor = '#E2E8F0'}>
        <option value="">Select {label}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
        onFocus={e => e.target.style.borderColor = '#0ea5e9'}
        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
      />
    )}
  </div>
);

const SECTION = ({ title, children, expanded, onToggle }) => (
  <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
    <button type="button" onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4"
      style={{ borderBottom: expanded ? '1px solid #E2E8F0' : 'none' }}>
      <span className="font-bold text-sm" style={{ color: '#0F172A' }}>{title}</span>
      {expanded ? <ChevronUp className="w-4 h-4" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#64748b' }} />}
    </button>
    {expanded && <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>}
  </div>
);

export default function TAdmission({ showToast }) {
  const [form, setForm] = useState({
    student_name: '', gender: '', dob: '', blood_group: '', religion: '', community: '', nationality: 'Indian',
    mother_tongue: '', aadhaar_number: '', class_id: '', section_id: '', academic_year: '2024-25', medium: 'Tamil Medium',
    father_name: '', father_occupation: '', father_mobile: '', father_email: '',
    mother_name: '', mother_occupation: '', mother_mobile: '', mother_email: '',
    permanent_address: '', city: '', district: '', state: 'Tamil Nadu', pin_code: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    previous_school: '', tc_number: '',
  });
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState({ personal: true, academic: false, parents: false, address: false });
  const [activeTab, setActiveTab] = useState('form');

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
    api.get('/sections').then(r => setSections(r.data.sections || []));
    loadAdmissions();
  }, []);

  const loadAdmissions = () => {
    api.get('/admissions').then(r => setAdmissions(r.data.admissions || [])).catch(() => {});
  };

  const age = useMemo(() => {
    if (!form.dob) return '';
    const diff = Date.now() - new Date(form.dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }, [form.dob]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggle = key => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_name || !form.gender || !form.dob) return showToast('Name, Gender and DOB are required', 'warning');
    setSubmitting(true);
    try {
      const res = await api.post('/admissions', form);
      showToast(`Application submitted! Admission No: ${res.data.admission_number}`);
      setForm(f => ({ ...Object.keys(f).reduce((a, k) => ({ ...a, [k]: '' }), {}), nationality: 'Indian', academic_year: '2024-25', medium: 'Tamil Medium', state: 'Tamil Nadu' }));
      loadAdmissions();
      setActiveTab('list');
    } catch (err) {
      showToast(err.response?.data?.message || 'Submission failed', 'error');
    } finally { setSubmitting(false); }
  };

  const STATUS_STYLE = {
    Pending:  { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: Clock },
    Approved: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', icon: CheckCircle },
    Rejected: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: XCircle },
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f0f9ff' }}>
            <UserPlus className="w-5 h-5" style={{ color: '#0ea5e9' }} />
          </div>
          <div>
            <h1 className="font-black" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Student Admission</h1>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Register number auto-generated on approval</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['form', 'list'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize"
              style={{ background: activeTab === t ? '#0ea5e9' : '#F1F5F9', color: activeTab === t ? '#fff' : '#64748b', boxShadow: activeTab === t ? '0 4px 12px rgba(14,165,233,0.25)' : 'none' }}>
              {t === 'form' ? 'New Application' : `Applications (${admissions.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <SECTION title="Personal Information" expanded={expanded.personal} onToggle={() => toggle('personal')}>
            <INPUT label="Student Name" name="student_name" value={form.student_name} onChange={handleChange} required />
            <INPUT label="Gender" name="gender" value={form.gender} onChange={handleChange} required options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]} />
            <INPUT label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" required />
            <div><label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Age</label><div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94a3b8' }}>{age || '—'} years</div></div>
            <INPUT label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange} options={['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(v=>({value:v,label:v}))} />
            <INPUT label="Religion" name="religion" value={form.religion} onChange={handleChange} options={['Hindu','Christian','Muslim','Other'].map(v=>({value:v,label:v}))} />
            <INPUT label="Community" name="community" value={form.community} onChange={handleChange} options={['BC','MBC','SC','ST','OC'].map(v=>({value:v,label:v}))} />
            <INPUT label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} />
            <INPUT label="Mother Tongue" name="mother_tongue" value={form.mother_tongue} onChange={handleChange} />
            <INPUT label="Aadhaar Number" name="aadhaar_number" value={form.aadhaar_number} onChange={handleChange} />
            <INPUT label="Previous School" name="previous_school" value={form.previous_school} onChange={handleChange} />
            <INPUT label="TC Number" name="tc_number" value={form.tc_number} onChange={handleChange} />
          </SECTION>

          <SECTION title="Academic Information" expanded={expanded.academic} onToggle={() => toggle('academic')}>
            <INPUT label="Class" name="class_id" value={form.class_id} onChange={handleChange} options={classes.map(c=>({value:c.id,label:c.class_name}))} />
            <INPUT label="Section" name="section_id" value={form.section_id} onChange={handleChange} options={sections.map(s=>({value:s.id,label:s.section_name}))} />
            <INPUT label="Academic Year" name="academic_year" value={form.academic_year} onChange={handleChange} />
            <INPUT label="Medium" name="medium" value={form.medium} onChange={handleChange} options={['Tamil Medium','English Medium'].map(v=>({value:v,label:v}))} />
          </SECTION>

          <SECTION title="Parent / Guardian Details" expanded={expanded.parents} onToggle={() => toggle('parents')}>
            <INPUT label="Father Name" name="father_name" value={form.father_name} onChange={handleChange} />
            <INPUT label="Father Occupation" name="father_occupation" value={form.father_occupation} onChange={handleChange} />
            <INPUT label="Father Mobile" name="father_mobile" value={form.father_mobile} onChange={handleChange} />
            <INPUT label="Father Email" name="father_email" value={form.father_email} onChange={handleChange} type="email" />
            <INPUT label="Mother Name" name="mother_name" value={form.mother_name} onChange={handleChange} />
            <INPUT label="Mother Occupation" name="mother_occupation" value={form.mother_occupation} onChange={handleChange} />
            <INPUT label="Mother Mobile" name="mother_mobile" value={form.mother_mobile} onChange={handleChange} />
            <INPUT label="Mother Email" name="mother_email" value={form.mother_email} onChange={handleChange} type="email" />
            <INPUT label="Emergency Contact Name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
            <INPUT label="Emergency Contact Phone" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} />
          </SECTION>

          <SECTION title="Address Details" expanded={expanded.address} onToggle={() => toggle('address')}>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Permanent Address</label>
              <textarea name="permanent_address" value={form.permanent_address} onChange={handleChange} rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }} />
            </div>
            <INPUT label="City" name="city" value={form.city} onChange={handleChange} />
            <INPUT label="District" name="district" value={form.district} onChange={handleChange} />
            <INPUT label="State" name="state" value={form.state} onChange={handleChange} />
            <INPUT label="PIN Code" name="pin_code" value={form.pin_code} onChange={handleChange} />
          </SECTION>

          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)', opacity: submitting ? 0.7 : 1 }}>
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {admissions.map(a => {
            const s = STATUS_STYLE[a.status] || STATUS_STYLE.Pending;
            const Icon = s.icon;
            return (
              <div key={a.id} className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                  {a.student_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold" style={{ color: '#0F172A' }}>{a.student_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{a.admission_number} · {a.class_name || '—'} · {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
                  <Icon className="w-3.5 h-3.5" />{a.status}
                </span>
              </div>
            );
          })}
          {admissions.length === 0 && <p className="py-16 text-center" style={{ color: '#94a3b8' }}>No applications yet</p>}
        </div>
      )}
    </div>
  );
}
