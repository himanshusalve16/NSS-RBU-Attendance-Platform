import React, { useEffect } from 'react'

function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      icon: '✓',
      iconBg: 'bg-white bg-opacity-20'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      icon: '✕',
      iconBg: 'bg-white bg-opacity-20'
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      icon: '⚠',
      iconBg: 'bg-white bg-opacity-20'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: 'ℹ',
      iconBg: 'bg-white bg-opacity-20'
    }
  }

  const style = styles[type]

  return (
    <div className={`${style.bg} text-white px-6 py-4 rounded-xl shadow-2xl mb-3 flex items-center justify-between min-w-[320px] max-w-md animate-slide-in backdrop-blur-sm`}>
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <span className="text-lg font-bold">{style.icon}</span>
        </div>
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 font-bold text-xl leading-none transition-colors"
      >
        ×
      </button>
    </div>
  )
}

export default Toast
