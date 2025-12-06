import React from 'react'
import Toast from './Toast'

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 space-y-2 max-w-sm w-full sm:w-auto px-4 sm:px-0">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  )
}

export default ToastContainer
