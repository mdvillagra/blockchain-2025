import { useState } from 'react';
import { mintAndListNFT, buyNFT, getListing } from '../utils/contract';
import { useWallet } from './WalletProviders';

interface Listing {
    owner: string;
    price: string;
    isSold: boolean;
    uri?: string;
}

export function NFTMarketplace() {
    const { account, isConnecting, connect } = useWallet();
    const [uri, setUri] = useState('');
    const [price, setPrice] = useState('');
    const [tokenIdForCheck, setTokenIdForCheck] = useState('');
    const [tokenIdForBuy, setTokenIdForBuy] = useState('');
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleMint = async () => {
        if (!account) return;
        try {
            const tx = await mintAndListNFT(uri, price);
            console.log('Minted NFT:', tx);
        } catch (error) {
            console.error('Failed to mint:', error);
        }
    };

    const handleBuy = async () => {
        if (!account) return;
        try {
            // First get the listing to get the correct price
            const listingData = await getListing(Number(tokenIdForBuy));
            if (!listingData) {
                throw new Error('Listing not found');
            }
            if (listingData.isSold) {
                throw new Error('NFT is already sold');
            }

            const tx = await buyNFT(Number(tokenIdForBuy), listingData.price);
            console.log('Bought NFT:', tx);
        } catch (error) {
            console.error('Failed to buy:', error);
        }
    };

    const handleGetListing = async () => {
        try {
            setIsLoading(true);
            const listingData = await getListing(Number(tokenIdForCheck));
            setListing(listingData);
        } catch (error) {
            console.error('Failed to get listing:', error);
            setListing(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">NFT Marketplace</h1>

            {!account ? (
                <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            ) : (
                <div>
                    <p className="mb-4">Connected: {account}</p>

                    <div className="mb-4">
                        <h2 className="text-xl font-bold mb-2">Mint NFT</h2>
                        <input
                            type="text"
                            placeholder="NFT URI"
                            value={uri}
                            onChange={(e) => setUri(e.target.value)}
                            className="border p-2 mr-2"
                        />
                        <input
                            type="text"
                            placeholder="Price in ETH"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="border p-2 mr-2"
                        />
                        <button
                            onClick={handleMint}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Mint
                        </button>
                    </div>

                    <div className="mb-4">
                        <h2 className="text-xl font-bold mb-2">Buy NFT</h2>
                        <input
                            type="number"
                            placeholder="Token ID"
                            value={tokenIdForBuy}
                            onChange={(e) => setTokenIdForBuy(e.target.value)}
                            className="border p-2 mr-2"
                        />
                        <button
                            onClick={handleBuy}
                            className="bg-purple-500 text-white px-4 py-2 rounded"
                        >
                            Buy
                        </button>
                    </div>

                    <div className="mb-4">
                        <h2 className="text-xl font-bold mb-2">Check Listing</h2>
                        <input
                            type="number"
                            placeholder="Token ID"
                            value={tokenIdForCheck}
                            onChange={(e) => setTokenIdForCheck(e.target.value)}
                            className="border p-2 mr-2"
                        />
                        <button
                            onClick={handleGetListing}
                            disabled={isLoading}
                            className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Check'}
                        </button>

                        {listing && (
                            <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Listing Details</h3>
                                        <p className="mb-2">
                                            <span className="font-medium">Owner:</span>{' '}
                                            {listing.owner}
                                        </p>
                                        <p className="mb-2">
                                            <span className="font-medium">Price:</span>{' '}
                                            {listing.price} ETH
                                        </p>
                                        <p className="mb-2">
                                            <span className="font-medium">Status:</span>{' '}
                                            <span className={listing.isSold ? 'text-red-500' : 'text-green-500'}>
                                                {listing.isSold ? 'Sold' : 'Available'}
                                            </span>
                                        </p>
                                    </div>
                                    {listing.uri && (
                                        <div className="flex justify-center items-center">
                                            <img
                                                src={listing.uri}
                                                alt={`NFT #${tokenIdForCheck}`}
                                                className="max-w-full h-auto rounded-lg shadow-md"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 