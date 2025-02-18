
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const WalletButton = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if ('phantom' in window) {
      const phantom = (window as any).phantom?.solana;
      if (phantom?.isPhantom) {
        setWallet(phantom);
      }
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      if (wallet) {
        const response = await wallet.connect();
        setConnected(true);
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Phantom wallet",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect to Phantom wallet",
      });
    }
  }, [wallet]);

  if (!wallet) {
    return (
      <Button variant="outline" onClick={() => window.open('https://phantom.app/', '_blank')}>
        Install Phantom Wallet
      </Button>
    );
  }

  return (
    <Button 
      onClick={connect}
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      {connected ? 'Connected' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletButton;
