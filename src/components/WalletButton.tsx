
import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from '@/components/ui/use-toast';

const WalletButton = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const getBalance = async () => {
      if (!publicKey) {
        setBalance(null);
        return;
      }

      try {
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
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

    getBalance();
    
    // Set up balance polling
    const intervalId = setInterval(getBalance, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  return (
    <div className="flex flex-col items-end gap-2">
      {publicKey && (
        <>
          <p className="text-sm text-muted-foreground">
            Address: {`${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`}
          </p>
          <p className="text-sm text-muted-foreground">
            Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
          </p>
        </>
      )}
      <WalletMultiButton className="bg-primary hover:bg-primary/90 text-primary-foreground" />
    </div>
  );
};

export default WalletButton;
