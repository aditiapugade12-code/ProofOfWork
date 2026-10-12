import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.ts';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Building,
  GraduationCap,
  FileText,
  UserX,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const [rejectingStudentId, setRejectingStudentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (approvalFilter !== 'all') queryParams.set('approvalStatus', approvalFilter);
      if (departmentFilter !== 'all') queryParams.set('department', departmentFilter);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);

      const data = await apiRequest(`/api/admin/students?${queryParams.toString()}`);
      setStudents(data.students);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [approvalFilter, departmentFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleApprove = async (studentId: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/students/${studentId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus: 'approved' }),
      });
      setMessage({ type: 'success', text: 'Student profile approved successfully!' });
      fetchStudents();
      if (selectedStudent && (selectedStudent._id === studentId || selectedStudent.id === studentId)) {
        setSelectedStudent((prev: any) => ({ ...prev, approvalStatus: 'approved' }));
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingStudentId) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/students/${rejectingStudentId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({
          approvalStatus: 'rejected',
          rejectionReason: rejectionReason.trim() || 'Profile details require verification.',
        }),
      });
      setMessage({ type: 'success', text: 'Student profile rejected with explanation.' });
      setRejectingStudentId(null);
      setRejectionReason('');
      fetchStudents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: string) => {
    setActionLoading(true);
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      await apiRequest(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage({
        type: 'success',
        text: `Student account ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
      fetchStudents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openStudentModal = async (student: any) => {
    setSelectedStudent(student);
    const sId = student._id || student.id;
    try {
      const data = await apiRequest(`/api/admin/students/${sId}`);
      setStudentDetails(data);
    } catch (err) {
      setStudentDetails(null);
    }
  };

  const departments = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Student Profile & Account Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review registered students, approve profiles, and manage active platform permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStudents}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-semibold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, username, or roll number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-gray-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500">Approval:</span>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs"
            >
              <option value="all">All Approvals</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs max-w-xs truncate"
            >
              <option value="all">All Departments</option>
              {departments.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500">Account:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading student directory...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No students found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting your search criteria or register a new student account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Academic Credentials</th>
                  <th className="px-5 py-3.5">Approval Status</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => {
                  const sId = student._id || student.id;
                  const isApproved = student.approvalStatus === 'approved';
                  const isPending = student.approvalStatus === 'pending';
                  const isRejected = student.approvalStatus === 'rejected';

                  return (
                    <tr key={sId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.username}`}
                            alt={student.name}
                            className="w-10 h-10 rounded-full bg-slate-100 border border-gray-200"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                            <div className="text-[11px] text-gray-400 font-mono">@{student.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs space-y-0.5">
                          <div className="font-medium text-gray-900">
                            {student.college || 'Institution Unspecified'}
                          </div>
                          <div className="text-gray-600">
                            {student.department} • {student.year}
                          </div>
                          <div className="text-gray-500 font-mono text-[11px]">
                            Roll: {student.rollNumber || 'N/A'}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Pending Approval
                          </span>
                        )}
                        {isRejected && (
                          <span
                            title={student.rejectionReason}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 cursor-help"
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            student.status === 'active'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {student.status === 'active' ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openStudentModal(student)}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="View Full Profile & Submissions"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleApprove(sId)}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => setRejectingStudentId(sId)}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(sId, student.status)}
                            className={`p-1.5 rounded-md transition-colors ${
                              student.status === 'active'
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={student.status === 'active' ? 'Deactivate Student' : 'Activate Student'}
                          >
                            {student.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Reject Student Profile
            </h3>
            <p className="text-sm text-gray-600">
              Please provide a specific reason for rejection. The student will see this note on their dashboard so they can update their profile.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Roll number does not match registrar records. Please upload valid college ID or correction."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingStudentId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-sm font-semibold text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile & History Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-gray-200 my-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedStudent.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudent.username}`}
                  alt={selectedStudent.name}
                  className="w-14 h-14 rounded-full border-2 border-indigo-200 bg-slate-50"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                  <div className="text-sm text-gray-500">{selectedStudent.email} • @{selectedStudent.username}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Roll No: {selectedStudent.rollNumber || 'N/A'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentDetails(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Academic details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-gray-500 block">College</span>
                <span className="text-gray-900 font-medium">{selectedStudent.college || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Department & Branch</span>
                <span className="text-gray-900 font-medium">
                  {selectedStudent.department} ({selectedStudent.branch || 'General'})
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Year of Study</span>
                <span className="text-gray-900 font-medium">{selectedStudent.year || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Approval Status</span>
                <span className="capitalize font-bold text-indigo-700">
                  {selectedStudent.approvalStatus}
                </span>
              </div>
            </div>

            {/* Skills */}
            {selectedStudent.skills && selectedStudent.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Demonstrated Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions & Evaluation History */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Challenge Submissions History ({studentDetails?.submissions?.length ?? '...'})
              </h4>
              {studentDetails?.submissions?.length === 0 ? (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg">
                  No challenge submissions submitted yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {studentDetails?.submissions?.map((sub: any) => (
                    <div
                      key={sub._id || sub.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-gray-900 block">
                          {sub.challengeTitle}
                        </span>
                        <span className="text-gray-500">
                          {sub.submissionType} • Submitted on{' '}
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-semibold capitalize bg-white border text-gray-700">
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick approval action inside modal */}
            {selectedStudent.approvalStatus === 'pending' && (
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingStudentId(selectedStudent._id || selectedStudent.id);
                    setSelectedStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                >
                  Reject Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedStudent._id || selectedStudent.id)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Approve Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
