
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const WalletButton = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const getProvider = () => {
      if ('phantom' in window) {
        const provider = (window as any).phantom?.solana;
    
        if (provider?.isPhantom) {
          return provider;
        }
      }
    
      window.open('https://phantom.app/', '_blank');
    };

    const provider = getProvider();
    if (provider) setWallet(provider);
  }, []);

  const updateBalance = async (publicKey: any) => {
    try {
      console.log('Fetching balance for public key:', publicKey.toString());
      const connection = new (window as any).solanaWeb3.Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Create a subscription to account changes
      const subscriptionId = connection.onAccountChange(
        publicKey,
        (accountInfo: any) => {
          const solBalance = accountInfo.lamports / 1000000000; // Convert lamports to SOL
          console.log('Balance updated:', solBalance);
          setBalance(solBalance);
        },
        "confirmed"
      );

      // Get initial balance
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1000000000; // Convert lamports to SOL
      console.log('Initial balance:', solBalance);
      setBalance(solBalance);

      // Return cleanup function
      return () => {
        connection.removeAccountChangeListener(subscriptionId);
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connect = useCallback(async () => {
    try {
      if (wallet) {
        console.log('Attempting to connect wallet...');
        
        const resp = await wallet.connect();
        console.log('Wallet connected:', resp);
        
        const publicKey = resp.publicKey;
        setConnected(true);
        setPublicKey(publicKey.toString());
        
        // Start listening to balance changes
        const cleanup = await updateBalance(publicKey);
        
        // Setup connection change listener
        wallet.on('connect', (publicKey: any) => {
          console.log('Connected to wallet:', publicKey.toString());
          setConnected(true);
          setPublicKey(publicKey.toString());
          updateBalance(publicKey);
        });

        // Setup disconnect listener
        wallet.on('disconnect', () => {
          console.log('Wallet disconnected');
          setConnected(false);
          setPublicKey(null);
          setBalance(null);
          if (cleanup) cleanup();
          toast({
            variant: "destructive",
            title: "Wallet Disconnected",
            description: "Phantom wallet has been disconnected",
          });
        });
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Phantom wallet",
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect to Phantom wallet",
      });
    }
  }, [wallet]);

  if (!wallet) {
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
        onClick={connected ? () => wallet.disconnect() : connect}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {connected ? 'Disconnect' : 'Connect Wallet'}
      </Button>
    </div>
  );
};

export default WalletButton;
