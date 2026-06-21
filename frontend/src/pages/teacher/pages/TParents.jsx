import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../../utils/api';
import {
  Search, Users, MessageSquare, Send, Bell, Calendar,
  Clock, AlertTriangle, Filter, FileText, Share2, Plus,
  ArrowLeft, RefreshCw, UserCheck, BookOpen, DollarSign,
  Video, MapPin, CheckCircle, Mail, Phone, ChevronRight
} from 'lucide-react';

const getGrade = m => m >= 95 ? 'A+' : m >= 90 ? 'A' : m >= 80 ? 'B+' : m >= 70 ? 'B' : m >= 60 ? 'C' : m >= 50 ? 'D' : 'F';
const GRADE_COLOR = { 'A+': '#10b981', A: '#22c55e', 'B+': '#06b6d4', B: '#0ea5e9', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

export default function TParents({ showToast }) {
  // Lists
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  
  // Selection
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedParentDetails, setSelectedParentDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Loaders
  const [loadingParents, setLoadingParents] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'profile' | 'meeting'

  // Form States
  const [chatInput, setChatInput] = useState('');
  const [broadcastForm, setBroadcastForm] = useState({
    class_id: '',
    title: '',
    content: '',
    message_type: 'general'
  });
  const [meetingForm, setMeetingForm] = useState({
    meeting_date: '',
    meeting_time: '',
    purpose: '',
    mode: 'Offline'
  });

  const chatEndRef = useRef(null);

  // Fetch initial parents, classes, and meetings
  const loadData = useCallback(() => {
    setLoadingParents(true);
    Promise.all([
      api.get('/parents'),
      api.get('/classes'),
      api.get('/parents/meetings')
    ]).then(([pr, cr, mr]) => {
      setParents(pr.data.parents || []);
      setClasses(cr.data.classes || []);
      setMeetings(mr.data.meetings || []);
      setLoadingParents(false);
    }).catch(err => {
      console.error(err);
      showToast('Failed to load parental data', 'error');
      setLoadingParents(false);
    });
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch details when selected parent changes
  useEffect(() => {
    if (!selectedParent) {
      setSelectedParentDetails(null);
      setMessages([]);
      return;
    }

    setLoadingDetails(true);
    setLoadingMessages(true);

    Promise.all([
      api.get(`/parents/student/${selectedParent.student_id}`),
      api.get(`/parents/messages/${selectedParent.student_id}`)
    ]).then(([dr, mr]) => {
      setSelectedParentDetails(dr.data);
      setMessages(mr.data.messages || []);
      setLoadingDetails(false);
      setLoadingMessages(false);
      // Reset unread count locally
      setParents(prev => prev.map(p => 
        p.student_id === selectedParent.student_id ? { ...p, unread_count: 0 } : p
      ));
    }).catch(err => {
      console.error(err);
      showToast('Failed to load parent details or message history', 'error');
      setLoadingDetails(false);
      setLoadingMessages(false);
    });
  }, [selectedParent, showToast]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Filters for parent list
  const filteredParents = useMemo(() => {
    let list = [...parents];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.student_name?.toLowerCase().includes(q) ||
        p.father_name?.toLowerCase().includes(q) ||
        p.mother_name?.toLowerCase().includes(q) ||
        p.register_number?.toLowerCase().includes(q) ||
        p.father_phone?.toLowerCase().includes(q)
      );
    }
    if (classFilter) {
      list = list.filter(p => String(p.class_id) === classFilter);
    }
    return list;
  }, [parents, search, classFilter]);

  // Send single chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedParent || sendingMessage) return;

    setSendingMessage(true);
    try {
      const payload = {
        student_id: selectedParent.student_id,
        content: chatInput.trim(),
        message_type: 'text'
      };
      const res = await api.post('/parents/messages', payload);
      
      // Add message locally
      const newMsg = {
        id: res.data.id,
        student_id: selectedParent.student_id,
        sender_role: 'teacher',
        sender_name: 'You',
        message_type: 'text',
        content: chatInput.trim(),
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
      setChatInput('');
      showToast('Message sent successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Send quick alert (e.g. absent, late, fee, marks, homework)
  const handleSendAlert = async (alertType) => {
    if (!selectedParent || sendingAlert) return;
    setSendingAlert(true);
    try {
      await api.post('/parents/alert', {
        student_id: selectedParent.student_id,
        alert_type: alertType
      });
      showToast(`${alertType.toUpperCase()} alert sent successfully!`, 'success');
      
      // Reload conversation messages
      const mr = await api.get(`/parents/messages/${selectedParent.student_id}`);
      setMessages(mr.data.messages || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to send alert', 'error');
    } finally {
      setSendingAlert(false);
    }
  };

  // Schedule a new meeting
  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    const { meeting_date, meeting_time, purpose, mode } = meetingForm;
    if (!meeting_date || !meeting_time || !purpose) {
      showToast('Please fill in all meeting fields', 'warning');
      return;
    }

    try {
      await api.post('/parents/meetings', {
        student_id: selectedParent.student_id,
        meeting_date,
        meeting_time,
        purpose,
        mode
      });
      showToast('Parent meeting scheduled successfully!', 'success');
      setMeetingForm({ meeting_date: '', meeting_time: '', purpose: '', mode: 'Offline' });
      setActiveTab('chat');
      
      // Refresh meetings list & message log
      const mr = await api.get(`/parents/meetings`);
      setMeetings(mr.data.meetings || []);

      const msgr = await api.get(`/parents/messages/${selectedParent.student_id}`);
      setMessages(msgr.data.messages || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to schedule meeting', 'error');
    }
  };

  // Broadcast message to class
  const handleBroadcast = async (e) => {
    e.preventDefault();
    const { class_id, title, content, message_type } = broadcastForm;
    if (!class_id || !content) {
      showToast('Class and Message Content are required', 'warning');
      return;
    }

    try {
      await api.post('/parents/broadcast', {
        class_id,
        title: title || 'Class Announcement',
        content,
        message_type
      });
      showToast('Broadcast sent successfully!', 'success');
      setBroadcastForm({ class_id: '', title: '', content: '', message_type: 'general' });
      // Refresh meetings/messages/parents
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to send broadcast', 'error');
    }
  };

  // Message type styling helper
  const getMessageBubbleStyle = (msg) => {
    const isSelf = msg.sender_role === 'teacher' || msg.sender_role === 'admin';
    if (isSelf) {
      return {
        bg: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
        text: '#white',
        align: 'justify-end',
        radius: 'rounded-2xl rounded-tr-none'
      };
    }
    return {
      bg: '#fff',
      text: '#1e293b',
      align: 'justify-start',
      radius: 'rounded-2xl rounded-tl-none',
      border: '1px solid #e2e8f0'
    };
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'attendance_alert': return <UserCheck className="w-4 h-4 text-rose-500" />;
      case 'fee_reminder': return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'marks_alert': return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'meeting_reminder': return <Calendar className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-sky-500" />;
    }
  };

  const getAlertColorClasses = (type) => {
    switch (type) {
      case 'attendance_alert': return 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/30';
      case 'fee_reminder': return 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30';
      case 'marks_alert': return 'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-900/30';
      case 'meeting_reminder': return 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30';
      default: return 'bg-sky-50 text-sky-800 border-sky-100 dark:bg-sky-950/20 dark:text-sky-300 dark:border-sky-900/30';
    }
  };

  return (
    <div className="flex h-full overflow-hidden fade-in">
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .dark .glass-card {
          background: rgba(17, 24, 39, 0.85);
          border-color: rgba(31, 41, 55, 0.7);
        }
      `}</style>

      {/* ── SIDEBAR: Parents List ────────────────────────────────── */}
      <aside className={`flex flex-col flex-shrink-0 w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300
        ${selectedParent ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              Parents
            </h2>
            <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search parent or student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full py-1 px-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Parents Scroll List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/40">
          {loadingParents ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-950">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No parents found
            </div>
          ) : (
            filteredParents.map(p => {
              const active = selectedParent?.student_id === p.student_id;
              const initials = (p.student_name || '?')[0].toUpperCase();
              return (
                <button
                  key={p.student_id}
                  onClick={() => setSelectedParent(p)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200
                    ${active 
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' 
                      : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-900'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${active 
                      ? 'bg-white/20 text-white' 
                      : 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {initials}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p className={`font-bold text-xs truncate ${active ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        {p.student_name}
                      </p>
                      {p.unread_count > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {p.unread_count}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate ${active ? 'text-sky-100' : 'text-slate-400'}`}>
                      Parent: {p.father_name || p.mother_name || 'Not Provided'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider
                        ${active 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {p.class_name} - {p.section_name}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* ── CASE 1: No Parent Selected (Dashboard & Broadcast) ── */}
        {!selectedParent ? (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                Parent & Community Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage communication, schedule parent-teacher meetings, and broadcast updates to classes.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Parents</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">{parents.length}</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Meetings</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">{meetings.length}</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Broadcasts</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-parent announcements</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Broadcast Card */}
              <div className="glass-card p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Share2 className="w-5 h-5 text-sky-500" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Broadcast Announcement</h3>
                    <p className="text-[11px] text-slate-400">Sends standard notification & parent alert to selected class</p>
                  </div>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-1">Target Class</label>
                    <select
                      value={broadcastForm.class_id}
                      onChange={e => setBroadcastForm(prev => ({ ...prev, class_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="">Select a Class...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-1">Broadcast Type</label>
                      <select
                        value={broadcastForm.message_type}
                        onChange={e => setBroadcastForm(prev => ({ ...prev, message_type: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="general">📢 General Circular</option>
                        <option value="homework">📚 Homework Update</option>
                        <option value="exam_notice">📝 Exam Notification</option>
                        <option value="fee_reminder">💳 Fee Reminder</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-1">Subject / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Science Project Due Date"
                        value={broadcastForm.title}
                        onChange={e => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-1">Message Content</label>
                    <textarea
                      placeholder="Write your broadcast message here..."
                      rows={4}
                      value={broadcastForm.content}
                      onChange={e => setBroadcastForm(prev => ({ ...prev, content: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-500/20"
                  >
                    Send Broadcast Message
                  </button>
                </form>
              </div>

              {/* Meetings List Card */}
              <div className="glass-card p-5 rounded-2xl flex flex-col h-[460px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Scheduled Meetings</h3>
                      <p className="text-[11px] text-slate-400">Upcoming parent consultations</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1">
                  {meetings.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      No meetings scheduled yet.
                    </div>
                  ) : (
                    meetings.map(m => {
                      const isOnline = m.mode?.toLowerCase() === 'online';
                      return (
                        <div key={m.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-white/40 dark:bg-slate-950/40 space-y-2 transition-all hover:bg-white/70 dark:hover:bg-slate-950/70">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-white">{m.student_name}</p>
                              <p className="text-[10px] text-slate-400">Reg No: {m.register_number}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1
                              ${isOnline 
                                ? 'bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                              }`}
                            >
                              {isOnline ? <Video className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                              {m.mode}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-lg">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {m.meeting_date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {m.meeting_time}</span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300 pl-1">
                            <span className="font-semibold text-slate-400">Purpose:</span> {m.purpose}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          
          // ── CASE 2: Parent Selected (Chat, Student Stats, Meeting Form) ──
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Bar / Profile Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm flex-shrink-0">
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedParent(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-sky-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-sky-500/20">
                  {selectedParent.student_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-sm text-slate-800 dark:text-slate-100 leading-none">
                      {selectedParent.student_name}
                    </h2>
                    <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {selectedParent.class_name} - {selectedParent.section_name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Father: <span className="font-medium text-slate-600 dark:text-slate-300">{selectedParent.father_name || 'N/A'}</span>
                    {' • '} Mother: <span className="font-medium text-slate-600 dark:text-slate-300">{selectedParent.mother_name || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full sm:max-w-auto">
                <button
                  onClick={() => handleSendAlert('absent')}
                  disabled={sendingAlert}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30 transition-all flex-shrink-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Absent Alert
                </button>
                <button
                  onClick={() => handleSendAlert('late')}
                  disabled={sendingAlert}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30 transition-all flex-shrink-0"
                >
                  <Clock className="w-3.5 h-3.5" /> Late Alert
                </button>
                <button
                  onClick={() => handleSendAlert('fee')}
                  disabled={sendingAlert}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30 transition-all flex-shrink-0"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Fee Reminder
                </button>
              </div>

            </div>

            {/* Sub Tabs */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex gap-4 flex-shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5
                  ${activeTab === 'chat' 
                    ? 'border-sky-500 text-sky-500' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                <MessageSquare className="w-4 h-4" /> Message Log
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5
                  ${activeTab === 'profile' 
                    ? 'border-sky-500 text-sky-500' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                <FileText className="w-4 h-4" /> Student Analytics
              </button>
              <button
                onClick={() => setActiveTab('meeting')}
                className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5
                  ${activeTab === 'meeting' 
                    ? 'border-sky-500 text-sky-500' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                <Calendar className="w-4 h-4" /> Schedule Meeting
              </button>
            </div>

            {/* TAB PANELS CONTAINER */}
            <div className="flex-1 overflow-hidden relative">

              {/* ── TAB A: Chat Conversations ── */}
              {activeTab === 'chat' && (
                <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-slate-950">
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                        Loading conversation history...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-20 text-xs text-slate-400">
                        No previous messages. Type below to start the conversation!
                      </div>
                    ) : (
                      messages.map((m) => {
                        const style = getMessageBubbleStyle(m);
                        const isSelf = m.sender_role === 'teacher' || m.sender_role === 'admin';
                        const isAlert = m.message_type && m.message_type !== 'text';
                        const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const date = new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

                        return (
                          <div key={m.id} className={`flex w-full ${style.align}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] space-y-1`}>
                              
                              {/* Meta Info */}
                              <div className={`flex items-center gap-1.5 text-[9px] text-slate-400 px-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                                <span className="font-semibold">{m.sender_name}</span>
                                <span>•</span>
                                <span>{date}, {time}</span>
                              </div>

                              {/* Message bubble */}
                              {isAlert ? (
                                <div className={`p-3 rounded-xl border text-[11px] font-medium flex gap-2.5 ${getAlertColorClasses(m.message_type)}`}>
                                  <div className="flex-shrink-0 mt-0.5">{getAlertIcon(m.message_type)}</div>
                                  <div>{m.content}</div>
                                </div>
                              ) : (
                                <div
                                  className={`p-3 text-[11px] font-medium leading-relaxed ${style.radius}`}
                                  style={{
                                    background: style.bg,
                                    color: style.text,
                                    border: style.border
                                  }}
                                >
                                  {m.content}
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Type a message to parent..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={sendingMessage}
                      className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !chatInput.trim()}
                      className="p-2 rounded-xl text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* ── TAB B: Student Analytics ── */}
              {activeTab === 'profile' && (
                <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                  {loadingDetails || !selectedParentDetails ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                      Loading student metrics...
                    </div>
                  ) : (
                    <>
                      {/* Sub Grid 1: Attendance & Fees */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Attendance Card */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm space-y-3">
                          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                            Attendance Summary
                          </h3>

                          {selectedParentDetails.attendance?.total > 0 ? (
                            (() => {
                              const present = selectedParentDetails.attendance.present || 0;
                              const total = selectedParentDetails.attendance.total || 0;
                              const pct = Math.round((present / total) * 100);
                              return (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-end">
                                    <span className="text-2xl font-black text-slate-800 dark:text-white">{pct}%</span>
                                    <span className="text-[10px] text-slate-400">({present} / {total} Days)</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-350 
                                        ${pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg text-emerald-700 dark:text-emerald-400">
                                      <p className="font-bold">Present Days</p>
                                      <p className="text-sm font-black">{present}</p>
                                    </div>
                                    <div className="bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg text-rose-700 dark:text-rose-400">
                                      <p className="font-bold">Absent Days</p>
                                      <p className="text-sm font-black">{selectedParentDetails.attendance.absent || 0}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <p className="text-xs text-slate-400 py-4">No attendance marked yet.</p>
                          )}
                        </div>

                        {/* Fees Card */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm space-y-3">
                          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-sky-500" />
                            Fee Details
                          </h3>

                          {selectedParentDetails.fees ? (
                            (() => {
                              const total = parseFloat(selectedParentDetails.fees.total) || 0;
                              const paid = parseFloat(selectedParentDetails.fees.paid) || 0;
                              const pending = total - paid;
                              const isSettled = pending <= 0;
                              return (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">Outstanding Dues</p>
                                      <p className="text-2xl font-black text-slate-800 dark:text-white">
                                        ₹{pending.toLocaleString()}
                                      </p>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full
                                      ${isSettled 
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                      }`}
                                    >
                                      {isSettled ? 'Paid' : 'Pending'}
                                    </span>
                                  </div>

                                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-sky-500 rounded-full"
                                      style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                                    <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                                      <p className="font-bold">Total Amount</p>
                                      <p className="text-xs font-black">₹{total.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                                      <p className="font-bold">Paid Amount</p>
                                      <p className="text-xs font-black">₹{paid.toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <p className="text-xs text-slate-400 py-4">No fees records found.</p>
                          )}
                        </div>

                      </div>

                      {/* Marks Sheet Table */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm space-y-3">
                        <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                          Academic Marks Report
                        </h3>

                        {!selectedParentDetails.marks || selectedParentDetails.marks.length === 0 ? (
                          <p className="text-xs text-slate-400 py-4">No marks records found.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                  <th className="py-2.5">Subject</th>
                                  <th className="py-2.5 text-center">Marks obtained</th>
                                  <th className="py-2.5 text-center">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                {selectedParentDetails.marks.map((m, idx) => {
                                  const score = parseInt(m.marks_obtained);
                                  const grade = getGrade(score);
                                  return (
                                    <tr key={idx} className="text-slate-700 dark:text-slate-300">
                                      <td className="py-2.5 font-bold">{m.subject_name}</td>
                                      <td className="py-2.5 text-center font-extrabold">{score} / 100</td>
                                      <td className="py-2.5 text-center">
                                        <span 
                                          className="inline-block font-black px-2 py-0.5 rounded text-[10px]"
                                          style={{
                                            background: `${GRADE_COLOR[grade]}15`,
                                            color: GRADE_COLOR[grade]
                                          }}
                                        >
                                          {grade}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── TAB C: Schedule Meeting Form ── */}
              {activeTab === 'meeting' && (
                <div className="absolute inset-0 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950">
                  <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
                    
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Schedule Meeting
                      </h3>
                    </div>

                    <form onSubmit={handleScheduleMeeting} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meeting Date</label>
                          <input
                            type="date"
                            required
                            value={meetingForm.meeting_date}
                            onChange={e => setMeetingForm(prev => ({ ...prev, meeting_date: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meeting Time</label>
                          <input
                            type="time"
                            required
                            value={meetingForm.meeting_time}
                            onChange={e => setMeetingForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Consultation Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMeetingForm(prev => ({ ...prev, mode: 'Offline' }))}
                            className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all
                              ${meetingForm.mode === 'Offline' 
                                ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400' 
                                : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500'}`}
                          >
                            <MapPin className="w-3.5 h-3.5" /> Offline
                          </button>
                          <button
                            type="button"
                            onClick={() => setMeetingForm(prev => ({ ...prev, mode: 'Online' }))}
                            className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all
                              ${meetingForm.mode === 'Online' 
                                ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400' 
                                : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500'}`}
                          >
                            <Video className="w-3.5 h-3.5" /> Online
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purpose of Meeting</label>
                        <textarea
                          placeholder="e.g. Academic performance review or attendance discussion..."
                          rows={3}
                          required
                          value={meetingForm.purpose}
                          onChange={e => setMeetingForm(prev => ({ ...prev, purpose: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg text-xs font-extrabold text-white bg-sky-500 hover:bg-sky-600 transition-all shadow-md shadow-sky-500/20"
                      >
                        Schedule Consult Session
                      </button>
                    </form>

                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
