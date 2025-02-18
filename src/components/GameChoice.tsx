
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GameChoiceProps {
  choice: 'rock' | 'paper' | 'scissors';
  onSelect: (choice: string) => void;
  disabled?: boolean;
}

const GameChoice = ({ choice, onSelect, disabled }: GameChoiceProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const icons = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  };

  return (
    <motion.button
      className={cn(
        'game-choice',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => !disabled && onSelect(choice)}
      disabled={disabled}
    >
      <div className="text-4xl mb-2">{icons[choice]}</div>
      <div className="text-lg capitalize">{choice}</div>
      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 bg-primary/10 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.button>
  );
};

export default GameChoice;
