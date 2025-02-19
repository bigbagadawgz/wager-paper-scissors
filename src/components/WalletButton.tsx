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
      if (!provider || !publicKey) {
        console.log('No public key available for balance update');
        return;
      }

      console.log('Fetching SOL balance using Phantom');
      
      const balance = await provider.request({
        method: "wallet_getBalance",
        params: {},
      });
      
      const solBalance = Number(balance) / LAMPORTS_PER_SOL;
      console.log('Balance in SOL:', solBalance);
      
      setBalance(solBalance);
      toast({
        title: "Balance Updated",
        description: `Current balance: ${solBalance.toFixed(4)} SOL`,
      });
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
    if (newPublicKey) {
      const newPubKey = newPublicKey.toString();
      setPublicKey(newPubKey);
      // Trigger balance update after public key is set
      setTimeout(() => updateBalance(), 100);
    } else {
      setPublicKey(null);
      setBalance(null);
    }
  }, []);

  // Handle connection changes
  const handleConnect = useCallback(async (connectedPublicKey: any) => {
    console.log('Connected:', connectedPublicKey.toString());
    const pubKey = connectedPublicKey.toString();
    setConnected(true);
    setPublicKey(pubKey);
    // Trigger balance update after connection
    setTimeout(() => updateBalance(), 100);
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
        const pubKey = provider.publicKey.toString();
        console.log('Wallet already connected:', pubKey);
        setConnected(true);
        setPublicKey(pubKey);
        // Initial balance check
        setTimeout(() => updateBalance(), 100);
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
      const { publicKey } = await provider.connect();
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
