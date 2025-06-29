import { useState } from 'react';
import MintFormModal from './MintFormModal';

const MintButton = ({ mintInitialBatch, compact }) => {
  const [showModal, setShowModal] = useState(false);

  const handleConfirm = (name, price) => {
    setShowModal(false);
    mintInitialBatch(name, price);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const styles = {
    button: {
      backgroundColor: 'transparent',
      color: 'white',
      border: '1px solid white',
      borderRadius: '8px',
      padding: '8px 16px',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      ...(compact && {
        backgroundColor: '#2a2a2a',
      })
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} style={styles.button}>
        + Mint NFT
      </button>
      {showModal && (
        <MintFormModal 
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default MintButton;
