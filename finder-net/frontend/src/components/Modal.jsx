import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'default', // default, success, warning, danger, info
  size = 'md', // sm, md, lg, xl
  showCloseButton = true,
  closeOnOverlayClick = true
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const typeConfig = {
    default: {
      icon: null,
      iconBg: '',
      iconColor: ''
    },
    success: {
      icon: FiCheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    warning: {
      icon: FiAlertTriangle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    danger: {
      icon: FiAlertCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    info: {
      icon: FiInfo,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    }
  };

  const config = typeConfig[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full ${sizeClasses[size]} overflow-hidden`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {config.icon && (
                    <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
                      <config.icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                  )}
                  {title && <h3 className="text-lg font-semibold">{title}</h3>}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Confirm Dialog Component
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} size="sm">
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="btn-secondary"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
            type === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : type === 'warning'
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-primary-600 hover:bg-primary-700'
          } disabled:opacity-50`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default Modal;
