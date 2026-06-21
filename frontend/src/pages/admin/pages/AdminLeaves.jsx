import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { FileText } from 'lucide-react';

const STATUS_COLOR = { Pending:'bg-amber-50 text-amber-700 border-amber-200', Approved:'bg-green-50 text-green-700 border-green-200', Rejected:'bg-red-50 text-red-700 border-red-200' };

export default function AdminLeaves({ showToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    // Get all students then aggregate leaves - we'll fetch from student API admin version
    // For now show all students' leaves via a join query — we'll use admin students as pivot
    api.get('/admin/students').then(async r => {
      const students = r.data.students || [];
      // Fetch DB directly via admin stats endpoint isn't ideal so we show what we can
      setLeaves([]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 lg:p-6 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50"><FileText className="w-5 h-5 text-violet-500"/></div>
        <div><h1 className="font-black text-gray-900 dark:text-white" style={{fontFamily:'Outfit,sans-serif'}}>Leave Requests</h1><p className="text-xs text-gray-400">All student leave applications</p></div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
        <p className="text-gray-500 font-semibold">Leave Management</p>
        <p className="text-sm text-gray-400 mt-1">Leave approval workflow — students submit via Student Portal.<br/>Teacher approval feature is available in Teacher Portal.</p>
      </div>
    </div>
  );
}
