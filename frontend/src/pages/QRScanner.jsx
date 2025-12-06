import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { markAttendance } from '../api'

function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      setResult(null)
      
      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Success callback
          await handleQRCode(decodedText)
          await html5QrCode.stop()
          html5QrCodeRef.current = null
          setScanning(false)
        },
        (errorMessage) => {
          // Error callback - ignore most errors as they're just scanning attempts
        }
      )

      setScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Failed to start camera. Please check permissions.')
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
      setError(null)
      const response = await markAttendance(qrText)
      
      if (response.success) {
        setResult({
          success: true,
          message: response.message,
          data: response.data
        })
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to mark attendance'
        })
      }
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.error || 'Error marking attendance'
      })
    }
  }

  const handleManualInput = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const qrText = formData.get('qrText')
    
    if (qrText.trim()) {
      await handleQRCode(qrText.trim())
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">QR Code Scanner</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
        </div>

        <div className="flex justify-center space-x-4">
          {!scanning ? (
            <button
              onClick={startScanning}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Stop Scanning
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Or Enter QR Text Manually</h2>
        <form onSubmit={handleManualInput}>
          <div className="flex gap-2">
            <input
              type="text"
              name="qrText"
              placeholder="Enter QR code text (e.g., STUDENT_S001_JOHN_DOE)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Mark Attendance
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`border px-4 py-3 rounded mb-4 ${
            result.success
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}
        >
          <p className="font-bold">{result.message}</p>
          {result.success && result.data && (
            <div className="mt-2 text-sm">
              <p><strong>Student:</strong> {result.data.studentName}</p>
              <p><strong>Class:</strong> {result.data.studentClass}</p>
              <p><strong>Time:</strong> {new Date(result.data.timestamp).toLocaleString()}</p>
            </div>
          )}
          <button
            onClick={() => setResult(null)}
            className="mt-2 text-sm underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

export default QRScanner

