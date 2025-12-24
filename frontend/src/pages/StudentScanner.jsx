import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { markAttendance, verifySession } from '../api'
import { useToast } from '../hooks/useToast'

function StudentScanner() {
  const [scanning, setScanning] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [result, setResult] = useState(null)
  const html5QrCodeRef = useRef(null)
  const { success, error } = useToast()

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setResult(null)
      
      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      // Responsive QR box size based on screen
      const isMobile = window.innerWidth < 768
      const qrBoxSize = isMobile ? 200 : 250

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: qrBoxSize, height: qrBoxSize }
        },
        async (decodedText) => {
          await handleQRCode(decodedText)
          await html5QrCode.stop()
          html5QrCodeRef.current = null
          setScanning(false)
        },
        () => {}
      )

      setScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      error('Failed to start camera. Please check permissions.')
      setScanning(false)
    }
  }

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current = null
      }
      setScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  const handleQRCode = async (qrText) => {
    try {
      // Parse QR code data
      let sessionData
      try {
        sessionData = JSON.parse(qrText)
      } catch {
        error('Invalid QR code format')
        return
      }

      const { sessionId, expiryTime, signature } = sessionData

      if (!sessionId || !expiryTime || !signature) {
        error('Invalid QR code data')
        return
      }

      // Verify session first
      const verifyResponse = await verifySession({ sessionId, expiryTime, signature })
      
      if (!verifyResponse.success) {
        error(verifyResponse.error || 'Invalid or expired QR code')
        return
      }

      // If student ID is not set, ask for it
      if (!studentId || studentId.trim() === '') {
        error('Please enter your Student ID first')
        return
      }

      // Mark attendance
      const response = await markAttendance({
        sessionId,
        studentId: studentId.trim(),
        signature,
        expiryTime
      })
      
      if (response.success) {
        const action = response.action || 'in'
        if (action === 'in') {
          success(`In time marked for ${response.data.studentName}!`)
        } else {
          success(`Out time marked for ${response.data.studentName}!`)
        }
        setResult({
          ...response.data,
          action: action
        })
        // Don't clear studentId - allow them to scan again for out time
      } else {
        error(response.error || 'Failed to mark attendance')
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error marking attendance')
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const qrText = formData.get('qrText')
    
    if (qrText.trim()) {
      await handleQRCode(qrText.trim())
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Student ID Input */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100">
        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
          Enter Your Student ID
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="e.g., S001"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* QR Scanner */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="mb-4">
          <div id="qr-reader" className="w-full max-w-md mx-auto rounded-xl overflow-hidden"></div>
        </div>

        <div className="flex justify-center">
          {!scanning ? (
            <button
              onClick={startScanning}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-base sm:text-lg min-h-[44px]"
            >
              <span>📷</span>
              <span>Start Scanning</span>
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-base sm:text-lg min-h-[44px]"
            >
              <span>⏹</span>
              <span>Stop Scanning</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual Input */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Or Enter QR Code Manually</h3>
        <form onSubmit={handleManualSubmit}>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="qrText"
              placeholder="Paste QR code JSON here"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-base sm:text-lg min-h-[44px]"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Success Result */}
      {result && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 animate-fade-in">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl text-white">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-green-800 mb-2">
                {result.action === 'in' ? 'In Time Marked!' : 'Out Time Marked!'}
              </h3>
              <div className="space-y-1 text-xs sm:text-sm text-green-700">
                <p><strong>Name:</strong> {result.studentName}</p>
                <p><strong>Role:</strong> {result.studentRole || 'Volunteer'}</p>
                <p><strong>Session:</strong> {result.sessionName}</p>
                {result.inTime && (
                  <p><strong>In Time:</strong> {new Date(result.inTime).toLocaleString()}</p>
                )}
                {result.outTime && (
                  <p><strong>Out Time:</strong> {new Date(result.outTime).toLocaleString()}</p>
                )}
                {result.duration && (
                  <p><strong>Duration:</strong> {result.duration} minutes</p>
                )}
                {result.action === 'in' && !result.outTime && (
                  <p className="text-orange-600 font-semibold mt-2">Scan again to mark out time</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-green-600 hover:text-green-800 font-bold text-xl sm:text-2xl flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentScanner
