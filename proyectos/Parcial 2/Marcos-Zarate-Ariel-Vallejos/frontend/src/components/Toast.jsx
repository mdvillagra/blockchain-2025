
// src/components/Toast.jsx
import React, { useEffect } from 'react';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-[hsl(240_20%_10%)] border border-[hsl(240_10%_20%)] p-4 rounded-md shadow-lg z-50 animate-fade-in">
      <div className="flex items-center">
        <p className="text-sm font-medium text-[hsl(0_0%_95%)]">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_95%)]"
        >
          <span className="sr-only">Cerrar</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
