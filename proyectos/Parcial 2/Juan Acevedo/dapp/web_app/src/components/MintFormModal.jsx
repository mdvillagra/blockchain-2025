import { useState } from 'react';

const CheckIcon = () => (
  <svg width="16" height="16" fill="#10b981" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
  </svg>
);

const ConfirmIcon = () => (
  <svg width="16" height="16" fill="#ffffff" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" fill="#ffffff" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 11-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05a1 1 0 011.414-1.414L10 8.586z" clipRule="evenodd" />
  </svg>
);

const CoinIcon = () => (
  <svg width="20" height="20" fill="#eab308" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.03 2 11c0 4.97 4.48 9 10 9s10-4.03 10-9c0-4.97-4.48-9-10-9zm0 16c-3.86 0-7-2.69-7-6s3.14-6 7-6 7 2.69 7 6-3.14 6-7 6z" />
    <circle cx="12" cy="11" r="3" />
  </svg>
);

const MintFormModal = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');

  const nameRegex = /^(?=.{1,9}$)[a-zA-Z]+( [a-zA-Z]+)*$/;
  const validateName = (value) => {
    if (value.trim() === '') {
      setNameError('El nombre no puede estar vacío');
      return false;
    } else if (!nameRegex.test(value)) {
      setNameError('Nombre inválido (solo letras y espacios entre letras con límite de 9 caracteres)');
      return false;
    }
    setNameError('');
    return true;
  };

  const priceRegex = /^\d+(\.\d{1,6})?$/; // Acepta números enteros o con hasta 6 decimales
  const MAX_ETH = 1000000; // 1 millón de ETH como límite máximo
  const validatePrice = (value) => {
    // Primero verifica que cumpla con el formato básico
    if (!priceRegex.test(value)) {
      setPriceError('Precio inválido (debe ser un número positivo con hasta 6 decimales)');
      return false;
    }
    
    // Luego verifica que no supere el límite máximo
    const numericValue = parseFloat(value);
    if (numericValue > MAX_ETH) {
      setPriceError(`El precio no puede ser mayor a ${MAX_ETH} ETH`);
      return false;
    }
    
    setPriceError('');
    return true;
  };

  const handleConfirm = () => {
    const nameValid = validateName(name);
    const priceValid = validatePrice(price);
    if (nameValid && priceValid) {
      onConfirm(name.trim(), price);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>
          <span style={{ marginRight: '8px', verticalAlign: 'middle' }}><CoinIcon /></span>
          Mintear nuevo NFT
        </h2>

        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Nombre del NFT"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateName(e.target.value);
            }}
            style={styles.input}
          />
          {name && !nameError && <span style={styles.valid}><CheckIcon /></span>}
          {nameError && <p style={styles.error}>{nameError}</p>}
        </div>

        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Precio (ETH)"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              validatePrice(e.target.value);
            }}
            style={styles.input}
          />
          {price && !priceError && <span style={styles.valid}><CheckIcon /></span>}
          {priceError && <p style={styles.error}>{priceError}</p>}
        </div>

        <div style={styles.actions}>
          <button
            onClick={handleConfirm}
            style={styles.confirm}
            onMouseEnter={(e) => (e.target.style.background = styles.confirmHover.background)}
            onMouseLeave={(e) => (e.target.style.background = styles.confirm.background)}
          >
            <span style={{ marginRight: '6px', verticalAlign: 'middle' }}><ConfirmIcon /></span>
            Confirmar
          </button>
          <button
            onClick={onCancel}
            style={styles.cancel}
            onMouseEnter={(e) => (e.target.style.background = styles.cancelHover.background)}
            onMouseLeave={(e) => (e.target.style.background = styles.cancel.background)}
          >
            <span style={{ marginRight: '6px', verticalAlign: 'middle' }}><XIcon /></span>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  modal: {
    background: 'linear-gradient(145deg, #1f1f1f, #0f0f0f)',
    color: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    width: '360px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    border: '1px solid #2e2e2e',
    textAlign: 'center',
  },
  title: {
    marginBottom: '20px',
    fontSize: '20px',
    fontWeight: 700,
    color: '#f1f1f1',
    letterSpacing: '0.02em',
  },
  inputGroup: {
    position: 'relative',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    backgroundColor: '#121212',
    color: '#e2e8f0',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  },
  error: {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '6px',
    textAlign: 'left',
    fontWeight: 500,
  },
  valid: {
    position: 'absolute',
    right: '12px',
    top: '10px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  confirm: {
    padding: '10px 20px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.2s ease, transform 0.1s ease',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  confirmHover: {
    background: '#047857',
  },
  cancel: {
    padding: '10px 20px',
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.2s ease, transform 0.1s ease',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  cancelHover: {
    background: '#b91c1c',
  },
};

export default MintFormModal;
