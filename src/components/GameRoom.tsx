
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import GameChoice from './GameChoice';
import WalletButton from './WalletButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const GameRoom = () => {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [roomCode, setRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we're joining a room
    const params = new URLSearchParams(location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code);
      setGameStarted(true);
    }
  }, [location]);

  const createRoom = () => {
    if (!betAmount) {
      toast({
        variant: "destructive",
        title: "Set Bet Amount",
        description: "Please set a bet amount first",
      });
      return;
    }
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(newRoomCode);
    setIsHost(true);
    setGameStarted(true);
    navigate(`/?room=${newRoomCode}`);
    toast({
      title: "Room Created",
      description: `Share this code with your opponent: ${newRoomCode}`,
    });
  };

  const joinRoom = () => {
    if (!roomCode) {
      toast({
        variant: "destructive",
        title: "Enter Room Code",
        description: "Please enter a room code to join",
      });
      return;
    }
    navigate(`/?room=${roomCode}`);
    setGameStarted(true);
  };

  const handleChoice = (choice: string) => {
    setPlayerChoice(choice);
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
    navigate('/');
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
                </div>
                <Button variant="outline" onClick={leaveRoom}>Leave Room</Button>
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
