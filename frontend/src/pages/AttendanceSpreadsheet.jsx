import React from 'react';
import { Link } from 'react-router-dom';
import { exportAttendanceCSVWithRole } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

function AttendanceSpreadsheet() {
  const { logout } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const handleExport = async () => {
    try {
      // We are exporting all data, so we pass an empty filters object.
      const blob = await exportAttendanceCSVWithRole({});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Attendance data exported successfully!');
    } catch (err) {
      console.error('Export failed:', err); // Log the full error
      error('Failed to export attendance data. See console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Export Attendance</h1>
            <div className="flex items-center gap-3">
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
              >
                ← Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📄</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Export All Attendance Data</h2>
          <p className="text-gray-600 mb-6">Click the button below to download a CSV file of all attendance records.</p>
          <button
            onClick={handleExport}
            className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Export to Excel (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceSpreadsheet;
