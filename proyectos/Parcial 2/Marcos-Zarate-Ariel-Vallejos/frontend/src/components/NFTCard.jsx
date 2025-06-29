import toast from 'react-hot-toast'; // Importamos react-hot-toast
import { useNFTPurchase } from '../hooks/useNFTPurchase';

const NFTCard = ({ tokenId, name, price, image, contract, onSuccessfulPurchase }) => {
  const { purchaseNFT, processing, error } = useNFTPurchase(contract, onSuccessfulPurchase);

  const handlePurchase = async () => {
    if (processing) return;

    // Mostrar toast de carga mientras se procesa
    const toastId = toast.loading('Procesando compra...');

    const success = await purchaseNFT(tokenId, price);
    
    if (success) {
      // Actualiza el toast a éxito
      toast.success(`¡Has comprado "${name}" por ${price} ETH!`, {
        id: toastId,
        duration: 5000,
        icon: '🎉',
      });
      console.log("Compra exitosa");
    } else if (error) {
      // Actualiza el toast a error
      toast.error(`Error: ${error.substring(0, 50)}...`, {
        id: toastId,
        duration: 5000,
      });
    }
  };

  return (
    <div className="bg-black rounded-lg">
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={name}
          className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <div className="p-4 border-t border-[hsl(240_10%_20%)]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold truncate">{name}</h3>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-[hsl(240_5%_65%)]">Precio</span>
            <span className="font-medium">{price} ETH</span>
          </div>
          {contract && (
            <button
              className="btn btn-primary disabled:opacity-50"
              onClick={handlePurchase}
              disabled={processing}
            >
              {processing ? 'Procesando...' : 'Comprar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
