import { WalletProvider } from './components/WalletProviders';
import { NFTMarketplace } from './components/NFTMarketplace';

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-100">
        <NFTMarketplace />
      </div>
    </WalletProvider>
  );
}

export default App;
