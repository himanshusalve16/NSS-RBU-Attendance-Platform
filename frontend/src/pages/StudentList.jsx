import React, { useState, useEffect } from 'react'
import { getStudents, addStudent } from '../api'

function StudentList() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    class: '',
    qrText: ''
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await getStudents()
      setStudents(response.data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      setMessage({ type: 'error', text: 'Failed to load students' })
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

  const generateQRText = (id, name) => {
    return `STUDENT_${id}_${name.toUpperCase().replace(/\s+/g, '_')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    try {
      // Auto-generate QR text if not provided
      const qrText = formData.qrText || generateQRText(formData.id, formData.name)
      
      const response = await addStudent({
        ...formData,
        qrText
      })

      if (response.success) {
        setMessage({ type: 'success', text: 'Student added successfully!' })
        setFormData({ id: '', name: '', class: '', qrText: '' })
        setShowAddForm(false)
        fetchStudents()
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to add student' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error adding student'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading students...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student List</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Student'}
          </button>
          <button
            onClick={fetchStudents}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-400'
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Student</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID *
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., S001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Class 10A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QR Text (auto-generated if empty)
                </label>
                <input
                  type="text"
                  name="qrText"
                  value={formData.qrText}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated from ID and Name"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}

      {students.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No students found.</p>
          <p className="text-gray-500 mt-2">Add your first student to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Text
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.class}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {student.qrText}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Total students: {students.length}
      </div>
    </div>
  )
}

export default StudentList

