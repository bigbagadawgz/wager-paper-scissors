
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const WalletButton = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if ('phantom' in window) {
      const phantom = (window as any).phantom?.solana;
      if (phantom?.isPhantom) {
        setWallet(phantom);
        // Check if we're already connected
        phantom.connect({ onlyIfTrusted: true })
          .then((response: any) => {
            console.log('Auto-connect successful:', response);
            setConnected(true);
            setPublicKey(response.publicKey.toString());
            updateBalance(response.publicKey);
          })
          .catch(() => {
            console.log('Not already connected');
          });
      }
    }
  }, []);

  const updateBalance = async (publicKey: any) => {
    try {
      console.log('Fetching balance for public key:', publicKey.toString());
      const connection = new (window as any).solanaWeb3.Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
      const balance = await connection.getBalance(publicKey);
      console.log('Retrieved balance:', balance);
      const solBalance = balance / 1000000000; // Convert lamports to SOL
      console.log('Balance in SOL:', solBalance);
      setBalance(solBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connect = useCallback(async () => {
    try {
      if (wallet) {
        console.log('Attempting to connect wallet...');
        const response = await wallet.connect();
        console.log('Wallet connected:', response);
        setConnected(true);
        setPublicKey(response.publicKey.toString());
        await updateBalance(response.publicKey);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Phantom wallet",
        });

        // Listen for wallet connection changes
        wallet.on('disconnect', () => {
          console.log('Wallet disconnected');
          setConnected(false);
          setPublicKey(null);
          setBalance(null);
          toast({
            variant: "destructive",
            title: "Wallet Disconnected",
            description: "Phantom wallet has been disconnected",
          });
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
