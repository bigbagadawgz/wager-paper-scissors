
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import GameChoice from './GameChoice';
import WalletButton from './WalletButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const GameRoom = () => {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const { toast } = useToast();

  const handleChoice = (choice: string) => {
    setPlayerChoice(choice);
    toast({
      title: "Choice Selected",
      description: `You chose ${choice}`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Rock Paper Scissors</h1>
            <WalletButton />
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl mb-4">Your Bet: {betAmount} SOL</h2>
            <div className="flex gap-4">
              <Button onClick={() => setBetAmount(0.1)}>0.1 SOL</Button>
              <Button onClick={() => setBetAmount(0.5)}>0.5 SOL</Button>
              <Button onClick={() => setBetAmount(1)}>1 SOL</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {['rock', 'paper', 'scissors'].map((choice) => (
              <GameChoice
                key={choice}
                choice={choice as 'rock' | 'paper' | 'scissors'}
                onSelect={handleChoice}
                disabled={!betAmount}
              />
            ))}
          </div>

          {playerChoice && (
            <div className="mt-8 text-center">
              <p className="text-lg mb-4">Waiting for opponent...</p>
              <Button variant="outline" onClick={() => setPlayerChoice(null)}>
                Cancel
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GameRoom;
