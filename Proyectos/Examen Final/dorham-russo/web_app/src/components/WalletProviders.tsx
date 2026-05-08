import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSyncProviders } from "../hooks/useSyncProviders"
import { formatAddress } from "../utils"

interface WalletContextType {
    account: string | null;
    isConnecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
    account: null,
    isConnecting: false,
    connect: async () => { },
    disconnect: () => { },
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>()
    const providers = useSyncProviders()

    const connect = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        if (isConnecting) {
            console.log('Connection request already pending...');
            return;
        }

        try {
            setIsConnecting(true);
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            setAccount(accounts[0]);
            setSelectedWallet(providers.find(p => p.info.name === "MetaMask")!)
        } catch (error: any) {
            if (error.code === -32002) {
                console.log('Connection request already pending. Please check MetaMask.');
            } else {
                console.error('Failed to connect:', error);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAccount(null);
        setSelectedWallet(undefined)
    };

    // Listen for account changes
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                // User disconnected their wallet
                setAccount(null);
            } else {
                setAccount(accounts[0]);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        // Check if already connected
        window.ethereum.request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                }
            })
            .catch(console.error);

        return () => {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        };
    }, []);

    // Display detected providers as connect buttons.
    return (
        <WalletContext.Provider value={{ account, isConnecting, connect, disconnect }}>
            {children}
        </WalletContext.Provider>
    );
}