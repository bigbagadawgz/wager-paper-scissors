
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import GameChoice from './GameChoice';
import WalletButton from './WalletButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const GameRoom = () => {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [roomCode, setRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code);
      setGameStarted(true);
    }
  }, [location]);

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

      // Send transaction to wallet for signing
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

  const createRoom = async (publicKey: string) => {
    if (!betAmount) {
      toast({
        variant: "destructive",
        title: "Set Bet Amount",
        description: "Please set a bet amount first",
      });
      return;
    }

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
        title: "Room Creation Failed",
        description: error.message,
      });
      return;
    }

    setRoomCode(newRoomCode);
    setIsHost(true);
    setGameStarted(true);
    navigate(`/?room=${newRoomCode}`);
    
    await handleDeposit(publicKey);

    toast({
      title: "Room Created",
      description: `Share this code with your opponent: ${newRoomCode}`,
    });
  };

  const joinRoom = async (publicKey: string) => {
    if (!roomCode) {
      toast({
        variant: "destructive",
        title: "Enter Room Code",
        description: "Please enter a room code to join",
      });
      return;
    }

    const { data: match, error } = await supabase
      .from('game_matches')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (error || !match) {
      toast({
        variant: "destructive",
        title: "Room Not Found",
        description: "Please check the room code and try again",
      });
      return;
    }

    setBetAmount(match.bet_amount);
    navigate(`/?room=${roomCode}`);
    setGameStarted(true);
    
    await handleDeposit(publicKey);
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

  const leaveRoom = () => {
    setRoomCode('');
    setGameStarted(false);
    setPlayerChoice(null);
    setIsHost(false);
    setDepositSubmitted(false);
    navigate('/');
  };

  // Effect to watch for game completion
  useEffect(() => {
    if (!roomCode) return;

    const subscription = supabase
      .from('game_matches')
      .on('UPDATE', (payload) => {
        const match = payload.new;
        
        // Check if both players have made their choices
        if (match.host_choice && match.opponent_choice) {
          // Determine winner
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
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
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

              <div className="flex flex-col gap-4">
                <Button 
                  onClick={createRoom}
                  className="w-full"
                  disabled={!betAmount}
                >
                  Create New Game
                </Button>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter room code"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  />
                  <Button onClick={joinRoom}>Join Game</Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <p className="text-lg">Room Code: {roomCode}</p>
                  <p className="text-sm text-muted-foreground">
                    {isHost ? 'Waiting for opponent to join...' : 'Game joined!'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bet Amount: {betAmount} SOL
                  </p>
                </div>
                <Button variant="outline" onClick={leaveRoom}>Leave Room</Button>
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
