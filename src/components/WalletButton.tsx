
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

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
      if (!provider || !provider.publicKey) return;

      const balance = await provider.request({
        method: "getBalance",
        params: {
          commitment: "processed"
        }
      });

      if (balance?.value) {
        const solBalance = balance.value / 1000000000; // Convert lamports to SOL
        console.log('Current balance:', solBalance);
        setBalance(solBalance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  };

  // Handle account changes
  const handleAccountChanged = (newPublicKey: any) => {
    console.log('Account changed:', newPublicKey?.toString());
    setPublicKey(newPublicKey ? newPublicKey.toString() : null);
    updateBalance();
  };

  // Handle connection changes
  const handleConnect = (publicKey: any) => {
    console.log('Connected:', publicKey.toString());
    setConnected(true);
    setPublicKey(publicKey.toString());
    updateBalance();
  };

  // Handle disconnection
  const handleDisconnect = () => {
    console.log('Disconnected');
    setConnected(false);
    setPublicKey(null);
    setBalance(null);
    toast({
      variant: "destructive",
      title: "Wallet Disconnected",
      description: "Phantom wallet has been disconnected",
    });
  };

  // Initialize provider
  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      setProvider(provider);

      // Check if already connected
      if (provider.isConnected && provider.publicKey) {
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
  }, []);

  // Connect handler
  const connect = useCallback(async () => {
    try {
      if (!provider) return;

      await provider.connect();
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
      {connected && balance !== null && (
        <p className="text-sm text-muted-foreground">
          Balance: {balance.toFixed(2)} SOL
        </p>
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
