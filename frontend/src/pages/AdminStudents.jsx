import React, { useState, useEffect } from 'react'
import { getStudents, addStudent, updateStudent, deleteStudent } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    class: ''
  })
  const { logout } = useAuth()
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await getStudents()
      setStudents(response.data || [])
    } catch (err) {
      error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingStudent) {
        const response = await updateStudent(editingStudent.id, formData)
        if (response.success) {
          success('Student updated successfully!')
          setFormData({ id: '', name: '', class: '' })
          setEditingStudent(null)
          setShowAddForm(false)
          fetchStudents()
        } else {
          error(response.error || 'Failed to update student')
        }
      } else {
        const response = await addStudent(formData)
        if (response.success) {
          success('Student added successfully!')
          setFormData({ id: '', name: '', class: '' })
          setShowAddForm(false)
          fetchStudents()
        } else {
          error(response.error || 'Failed to add student')
        }
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error saving student')
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      id: student.id,
      name: student.name,
      class: student.class
    })
    setShowAddForm(true)
  }

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return
    }

    try {
      await deleteStudent(studentId)
      success('Student deleted successfully!')
      fetchStudents()
    } catch (err) {
      error(err.response?.data?.error || 'Error deleting student')
    }
  }

  const handleCancel = () => {
    setFormData({ id: '', name: '', class: '' })
    setEditingStudent(null)
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6 sm:mb-8">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl">👨‍🎓</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Management</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Add, edit, or remove students</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <button
                onClick={fetchStudents}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-300 text-sm sm:text-base min-h-[44px]"
              >
                Refresh
              </button>
              <button
                onClick={logout}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-6 sm:pb-8 md:pb-10">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student ID {!editingStudent && '*'}
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    required={!editingStudent}
                    disabled={!!editingStudent}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-100 min-h-[44px]"
                    placeholder="e.g., S001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[44px]"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class *
                  </label>
                  <input
                    type="text"
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[44px]"
                    placeholder="e.g., Class 10A"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 sm:py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-base sm:text-lg min-h-[44px]"
                >
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-300 text-base sm:text-lg min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Students Table */}
        {!showAddForm && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-base sm:text-lg min-h-[44px]"
            >
              <span className="text-lg sm:text-xl">+</span>
              <span>Add New Student</span>
            </button>
          </div>
        )}

        {students.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl sm:text-4xl">👨‍🎓</span>
            </div>
            <p className="text-gray-600 text-base sm:text-lg mb-2">No students found.</p>
            <p className="text-sm sm:text-base text-gray-500">Add your first student to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider hidden sm:table-cell">
                      Class
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={index} className="hover:bg-purple-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                        {student.id}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-gray-500 text-xs sm:hidden">{student.class}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {student.class}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors text-left sm:text-center min-h-[44px] sm:min-h-0 px-2 sm:px-0"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-800 font-semibold transition-colors text-left sm:text-center min-h-[44px] sm:min-h-0 px-2 sm:px-0"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Total students: <span className="font-bold text-purple-600">{students.length}</span>
        </div>
      </div>
    </div>
  )
}

export default AdminStudents
