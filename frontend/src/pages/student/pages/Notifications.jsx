import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Bell, Check, CheckCheck } from 'lucide-react';

const TABS = [
  { key:'all', label:'All' },
  { key:'announcement', label:'Announcements' },
  { key:'circular', label:'Circulars' },
  { key:'holiday', label:'Holidays' },
  { key:'exam_notice', label:'Exam Notices' },
  { key:'principal_message', label:"Principal's" },
];
const TYPE_CFG = {
  announcement:      { bg:'#EEF2FF', text:'#4338CA', dBg:'rgba(99,102,241,0.15)', dTxt:'#A5B4FC', dot:'#6366F1' },
  circular:          { bg:'#F5F3FF', text:'#6D28D9', dBg:'rgba(139,92,246,0.15)', dTxt:'#C4B5FD', dot:'#8B5CF6' },
  holiday:           { bg:'#ECFDF5', text:'#065F46', dBg:'rgba(16,185,129,0.15)', dTxt:'#6EE7B7', dot:'#10B981' },
  exam_notice:       { bg:'#FFFBEB', text:'#92400E', dBg:'rgba(245,158,11,0.15)', dTxt:'#FCD34D', dot:'#F59E0B' },
  principal_message: { bg:'#EFF6FF', text:'#1E40AF', dBg:'rgba(59,130,246,0.15)', dTxt:'#93C5FD', dot:'#3B82F6' },
};

export default function Notifications({ showToast, setUnreadCount, darkMode }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const d = darkMode;
  const card = d?'#111827':'#FFFFFF';
  const bdr  = d?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';
  const txt  = d?'#F9FAFB':'#111827';
  const sub  = d?'#9CA3AF':'#6B7280';

  const load = () => {
    api.get('/student/notifications').then(r => {
      const n = r.data.notifications||[];
      setNotifications(n);
      setUnreadCount(n.filter(x=>!x.is_read).length);
      setLoading(false);
    }).catch(()=>{showToast('Failed','error');setLoading(false);});
  };
  useEffect(()=>{load();},[]);

  const markRead = async (id) => {
    try {
      await api.patch(`/student/notifications/read/${id}`);
      setNotifications(prev=>prev.map(n=>n.id===id?{...n,is_read:1}:n));
      setUnreadCount(prev=>Math.max(0,prev-1));
    } catch {}
  };

  const markAll = async () => {
    const unread = notifications.filter(n=>!n.is_read);
    await Promise.all(unread.map(n=>api.patch(`/student/notifications/read/${n.id}`).catch(()=>{})));
    setNotifications(prev=>prev.map(n=>({...n,is_read:1})));
    setUnreadCount(0);
    showToast('All marked as read');
  };

  const filtered = activeTab==='all' ? notifications : notifications.filter(n=>(n.type||'announcement')===activeTab);
  const totalUnread = notifications.filter(n=>!n.is_read).length;

  return (
    <div style={{ padding:'20px 24px', maxWidth:900, margin:'0 auto' }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:d?'rgba(79,70,229,0.15)':'#EEF2FF' }}>
            <Bell className="w-5 h-5" style={{ color:'#4F46E5' }} />
          </div>
          <div>
            <h1 className="font-black" style={{ color:txt }}>Notifications</h1>
            <p className="text-xs" style={{ color:sub }}>{totalUnread} unread messages</p>
          </div>
        </div>
        {totalUnread>0&&(
          <button onClick={markAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background:d?'rgba(79,70,229,0.15)':'#EEF2FF', color:'#4F46E5' }}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ key, label }) => {
          const count = key==='all' ? totalUnread : notifications.filter(n=>(n.type||'announcement')===key&&!n.is_read).length;
          return (
            <button key={key} onClick={()=>setActiveTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
              style={activeTab===key
                ? { background:'linear-gradient(135deg,#4F46E5,#7C3AED)', color:'#fff', boxShadow:'0 4px 12px rgba(79,70,229,0.25)' }
                : { background:d?'rgba(255,255,255,0.05)':card, border:`1px solid ${bdr}`, color:sub }}>
              {label}
              {count>0&&<span className="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{ background:activeTab===key?'rgba(255,255,255,0.2)':'#EF4444', color:'#fff' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden fade-in" style={{ background:card, border:`1px solid ${bdr}` }}>
        {loading ? <div className="p-5 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
        : filtered.length===0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Bell className="w-12 h-12" style={{ color:d?'#374151':'#E5E7EB' }} />
            <p className="text-sm" style={{ color:sub }}>No notifications here</p>
          </div>
        ) : filtered.map((n,i) => {
          const tc = TYPE_CFG[n.type||'announcement']||TYPE_CFG.announcement;
          return (
            <div key={n.id} className="flex gap-4 p-5 table-row-hover"
              style={{ borderTop: i>0 ? `1px solid ${bdr}` : 'none', background: !n.is_read ? (d?'rgba(79,70,229,0.05)':'rgba(79,70,229,0.02)') : 'transparent' }}>
              {/* Dot */}
              <div className="flex-shrink-0 mt-1.5">
                {n.is_read
                  ? <div className="w-2 h-2 rounded-full" style={{ background:d?'#374151':'#E5E7EB' }} />
                  : <div className="w-2 h-2 rounded-full pulse-dot" style={{ background:'#4F46E5' }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg"
                    style={{ background:d?tc.dBg:tc.bg, color:d?tc.dTxt:tc.text }}>
                    {(n.type||'announcement').replace('_',' ')}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px]" style={{ color:d?'#4B5563':'#9CA3AF' }}>{n.created_at?.split('T')[0]}</span>
                    {!n.is_read&&(
                      <button onClick={()=>markRead(n.id)} className="text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors"
                        style={{ background:d?'rgba(79,70,229,0.15)':'#EEF2FF', color:'#4F46E5' }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-bold text-sm" style={{ color: n.is_read ? sub : txt }}>{n.title}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color:sub }}>{n.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
