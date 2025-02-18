
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import GameChoice from './GameChoice';
import WalletButton from './WalletButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const GameRoom = () => {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeposit = async (publicKey: string) => {
    try {
      const response = await fetch('/api/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isHost ? 'createEscrow' : 'joinEscrow',
          roomCode,
          betAmount,
          publicKey,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const transaction = (window as any).solanaWeb3.Transaction.from(
        data.transaction.data
      );
      
      const connection = new (window as any).solanaWeb3.Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      const signedTx = await (window as any).phantom?.solana.signAndSendTransaction(
        transaction
      );

      await connection.confirmTransaction(signedTx.signature);
      
      setDepositSubmitted(true);
      toast({
        title: "Deposit Successful",
        description: "Your bet has been placed in escrow",
      });
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: error.message,
      });
    }
  };

  const findMatch = async () => {
    if (!betAmount) {
      toast({
        variant: "destructive",
        title: "Set Bet Amount",
        description: "Please set a bet amount first",
      });
      return;
    }

    const provider = (window as any).phantom?.solana;
    if (!provider?.isConnected) {
      toast({
        variant: "destructive",
        title: "Connect Wallet",
        description: "Please connect your wallet first",
      });
      return;
    }

    const publicKey = provider.publicKey.toString();

    // First, check for available matches with the same bet amount
    const { data: existingMatch } = await supabase
      .from('game_matches')
      .select('*')
      .eq('bet_amount', betAmount)
      .eq('status', 'pending')
      .is('opponent_pubkey', null)
      .neq('host_pubkey', publicKey)
      .limit(1)
      .single();

    if (existingMatch) {
      // Join existing match
      setRoomCode(existingMatch.room_code);
      setGameStarted(true);
      setIsHost(false);
      await handleDeposit(publicKey);
      
      toast({
        title: "Match Found!",
        description: "You've been matched with an opponent",
      });
    } else {
      // Create new match
      const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from('game_matches')
        .insert({
          room_code: newRoomCode,
          bet_amount: betAmount,
          host_pubkey: publicKey,
          status: 'pending'
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to Create Match",
          description: error.message,
        });
        return;
      }

      setRoomCode(newRoomCode);
      setIsHost(true);
      setGameStarted(true);
      await handleDeposit(publicKey);

      toast({
        title: "Waiting for Opponent",
        description: "Looking for a player with the same bet amount...",
      });
    }
  };

  const handleChoice = async (choice: string) => {
    setPlayerChoice(choice);
    
    const { error } = await supabase
      .from('game_matches')
      .update({
        [isHost ? 'host_choice' : 'opponent_choice']: choice
      })
      .eq('room_code', roomCode);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to Submit Choice",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Choice Selected",
      description: `You chose ${choice}`,
    });
  };

  const leaveGame = () => {
    setGameStarted(false);
    setPlayerChoice(null);
    setIsHost(false);
    setDepositSubmitted(false);
    setRoomCode('');
    navigate('/');
  };

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase
      .channel('game_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_matches',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          const match = payload.new;
          
          if (match.host_choice && match.opponent_choice) {
            const result = determineWinner(match.host_choice, match.opponent_choice);
            if (result === 'tie') {
              toast({
                title: "It's a Tie!",
                description: "The game ended in a draw",
              });
            } else {
              const isWinner = 
                (isHost && result === 'host') || 
                (!isHost && result === 'opponent');
              
              toast({
                title: isWinner ? "You Won!" : "You Lost!",
                description: isWinner 
                  ? "Congratulations! You can now claim your winnings." 
                  : "Better luck next time!",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, isHost]);

  const determineWinner = (hostChoice: string, opponentChoice: string) => {
    if (hostChoice === opponentChoice) return 'tie';
    if (
      (hostChoice === 'rock' && opponentChoice === 'scissors') ||
      (hostChoice === 'paper' && opponentChoice === 'rock') ||
      (hostChoice === 'scissors' && opponentChoice === 'paper')
    ) {
      return 'host';
    }
    return 'opponent';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Rock Paper Scissors</h1>
            <WalletButton />
          </div>

          {!gameStarted ? (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-xl mb-4">Your Bet: {betAmount} SOL</h2>
                <div className="flex gap-4">
                  <Button onClick={() => setBetAmount(0.1)}>0.1 SOL</Button>
                  <Button onClick={() => setBetAmount(0.5)}>0.5 SOL</Button>
                  <Button onClick={() => setBetAmount(1)}>1 SOL</Button>
                </div>
              </div>

              <Button 
                onClick={findMatch}
                className="w-full"
                disabled={!betAmount}
              >
                Find Match
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isHost ? 'Waiting for opponent to join...' : 'Game joined!'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bet Amount: {betAmount} SOL
                  </p>
                </div>
                <Button variant="outline" onClick={leaveGame}>Leave Game</Button>
              </div>

              {depositSubmitted ? (
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
              ) : (
                <div className="text-center">
                  <p className="text-lg mb-4">
                    Please deposit {betAmount} SOL to start playing
                  </p>
                </div>
              )}

              {playerChoice && (
                <div className="mt-8 text-center">
                  <p className="text-lg mb-4">Waiting for opponent...</p>
                  <Button variant="outline" onClick={() => setPlayerChoice(null)}>
                    Change Choice
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GameRoom;
