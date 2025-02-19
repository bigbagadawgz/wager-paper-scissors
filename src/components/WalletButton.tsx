
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const WalletButton = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const provider = window?.phantom?.solana;

      if (provider?.isPhantom) {
        setWallet(provider);

        // Check if already connected
        if (provider.isConnected) {
          const publicKey = provider.publicKey;
          setConnected(true);
          setPublicKey(publicKey.toString());
          updateBalance(provider);
        }

        // Listen for state changes
        provider.on("connect", (publicKey: any) => {
          setConnected(true);
          setPublicKey(publicKey.toString());
          updateBalance(provider);
        });

        provider.on("disconnect", () => {
          setConnected(false);
          setPublicKey(null);
          setBalance(null);
          toast({
            variant: "destructive",
            title: "Wallet Disconnected",
            description: "Phantom wallet has been disconnected",
          });
        });

        provider.on("accountChanged", (publicKey: any) => {
          if (publicKey) {
            console.log("Switched account to:", publicKey.toString());
            setPublicKey(publicKey.toString());
            updateBalance(provider);
          }
        });
      }
    }

    return () => {
      if (wallet) {
        wallet.disconnect();
      }
    };
  }, []);

  const updateBalance = async (provider: any) => {
    try {
      if (!provider.publicKey) return;

      // Get balance directly from Phantom provider
      const balance = await provider.request({
        method: "getBalance",
        params: {
          commitment: "processed"
        }
      });

      const solBalance = balance.value / 1000000000; // Convert lamports to SOL
      console.log('Current balance:', solBalance);
      setBalance(solBalance);

      // Set up real-time updates
      provider.on("accountChanged", async () => {
        const newBalance = await provider.request({
          method: "getBalance",
          params: {
            commitment: "processed"
          }
        });
        const newSolBalance = newBalance.value / 1000000000;
        console.log('Balance updated:', newSolBalance);
        setBalance(newSolBalance);
      });

    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  };

  const connect = useCallback(async () => {
    try {
      if (wallet) {
        const response = await wallet.connect();
        console.log('Wallet connected:', response.publicKey.toString());
        
        setConnected(true);
        setPublicKey(response.publicKey.toString());
        await updateBalance(wallet);
        
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
