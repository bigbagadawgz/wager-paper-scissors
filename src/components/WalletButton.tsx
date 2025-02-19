
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const WalletButton = () => {
  const [provider, setProvider] = useState<Window['phantom']['solana']>(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Function to detect if Phantom is installed
  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;

      if (provider?.isPhantom) {
        return provider;
      }
    }

    window.open('https://phantom.app/', '_blank');
  };

  // Handle balance updates
  const updateBalance = async () => {
    try {
      if (!provider || !provider.publicKey) {
        console.log('No provider or public key available for balance update');
        return;
      }

      console.log('Fetching SOL balance for address:', provider.publicKey.toString());

      // Using Phantom's request method to get Solana balance
      const result = await provider.request({
        method: 'eth_getBalance',
        params: [provider.publicKey.toString()]
      });

      console.log('Raw balance response:', result);

      if (result) {
        const solBalance = parseInt(result, 16) / LAMPORTS_PER_SOL;
        console.log('Balance in SOL:', solBalance);
        setBalance(solBalance);
        toast({
          title: "Balance Updated",
          description: `Current balance: ${solBalance.toFixed(4)} SOL`,
        });
      } else {
        console.log('Invalid balance response:', result);
        setBalance(null);
        toast({
          variant: "destructive",
          title: "Balance Error",
          description: "Invalid balance response format",
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
      toast({
        variant: "destructive",
        title: "Balance Error",
        description: "Failed to fetch SOL balance",
      });
    }
  };

  // Handle account changes
  const handleAccountChanged = useCallback((newPublicKey: any) => {
    console.log('Account changed:', newPublicKey?.toString());
    setPublicKey(newPublicKey ? newPublicKey.toString() : null);
    updateBalance();
  }, []);

  // Handle connection changes
  const handleConnect = useCallback((publicKey: any) => {
    console.log('Connected:', publicKey.toString());
    setConnected(true);
    setPublicKey(publicKey.toString());
    updateBalance();
  }, []);

  // Handle disconnection
  const handleDisconnect = useCallback(() => {
    console.log('Disconnected');
    setConnected(false);
    setPublicKey(null);
    setBalance(null);
    toast({
      variant: "destructive",
      title: "Wallet Disconnected",
      description: "Phantom wallet has been disconnected",
    });
  }, []);

  // Initialize provider
  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      console.log('Setting up provider...');
      setProvider(provider);

      // Check if already connected
      if (provider.isConnected && provider.publicKey) {
        console.log('Wallet already connected:', provider.publicKey.toString());
        setConnected(true);
        setPublicKey(provider.publicKey.toString());
        updateBalance();
      }

      // Add event listeners
      provider.on("connect", handleConnect);
      provider.on("disconnect", handleDisconnect);
      provider.on("accountChanged", handleAccountChanged);

      // Cleanup
      return () => {
        provider.removeAllListeners();
      };
    }
  }, [handleConnect, handleDisconnect, handleAccountChanged]);

  // Connect handler
  const connect = useCallback(async () => {
    try {
      if (!provider) {
        console.log('No provider available for connection');
        return;
      }

      console.log('Attempting to connect...');
      await provider.connect();
      updateBalance(); // Add explicit balance update after connection
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Phantom wallet",
      });
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect to Phantom wallet",
      });
    }
  }, [provider]);

  // Disconnect handler
  const disconnect = useCallback(async () => {
    try {
      if (!provider) return;
      await provider.disconnect();
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }, [provider]);

  if (!provider) {
    return (
      <Button 
        variant="outline" 
        onClick={() => window.open('https://phantom.app/', '_blank')}
      >
        Install Phantom Wallet
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {connected && publicKey && (
        <>
          <p className="text-sm text-muted-foreground">
            Address: {`${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`}
          </p>
          <p className="text-sm text-muted-foreground">
            Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
          </p>
        </>
      )}
      <Button 
        onClick={connected ? disconnect : connect}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {connected ? 'Disconnect' : 'Connect Wallet'}
      </Button>
    </div>
  );
};

export default WalletButton;
