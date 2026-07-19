import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null); // { title, message, onConfirm, onCancel, type: 'confirm'|'alert' }

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showModal = useCallback((title, message, type = 'alert', onConfirm = null, onCancel = null) => {
    return new Promise((resolve) => {
      setModal({
        title,
        message,
        type,
        onConfirm: () => {
          setModal(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          if (onCancel) onCancel();
          resolve(false);
        }
      });
    });
  }, []);

  // Alert simulation helper to drop-in replace window.alert
  const showAlert = useCallback((message, title = 'Notification') => {
    return showModal(title, message, 'alert');
  }, [showModal]);

  // Confirm simulation helper to drop-in replace window.confirm
  const showConfirm = useCallback((message, title = 'Confirm Action') => {
    return showModal(title, message, 'confirm');
  }, [showModal]);

  return (
    <ToastContext.Provider value={{ toast: showToast, alert: showAlert, confirm: showConfirm, showModal }}>
      {children}

      {/* Toaster Container */}
      <div className="toaster-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Premium Custom Modal Dialog */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-content-header">
              <h3 className="modal-content-title">
                {modal.type === 'confirm' ? '❓ ' : 'ℹ️ '}
                {modal.title}
              </h3>
              <button className="modal-close-btn" onClick={modal.onCancel}>×</button>
            </div>
            <div className="modal-content-body">
              <p>{modal.message}</p>
            </div>
            <div className="modal-content-footer">
              {modal.type === 'confirm' && (
                <button className="btn btn-secondary" onClick={modal.onCancel}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={modal.onConfirm}>
                {modal.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
