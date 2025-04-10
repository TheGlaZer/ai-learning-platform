"use client";
import React, { useState } from 'react';
import { Quiz } from '@/app/models/quiz';
import QuizConfirmationDialog from './components/QuizConfirmationDialog';
import QuizSimulationDialog from './components/QuizSimulationDialog';

interface QuizSimulatorProps {
  quiz: Quiz | null;
  onClose: () => void;
  open: boolean;
  resetMode?: boolean;
}

const QuizSimulator: React.FC<QuizSimulatorProps> = ({
  quiz,
  onClose,
  open,
  resetMode = false
}) => {
  const [showConfirmation, setShowConfirmation] = useState(!resetMode);
  const [showSimulation, setShowSimulation] = useState(resetMode);
  
  // Handle starting the quiz
  const handleStartQuiz = () => {
    setShowConfirmation(false);
    setShowSimulation(true);
  };
  
  // Handle closing the simulator
  const handleClose = () => {
    setShowConfirmation(true);
    setShowSimulation(false);
    onClose();
  };
  
  if (!open) return null;
  
  return (
    <>
      <QuizConfirmationDialog
        open={open && showConfirmation}
        onClose={handleClose}
        onStartQuiz={handleStartQuiz}
        quiz={quiz}
      />
      
      <QuizSimulationDialog
        open={open && showSimulation}
        onClose={handleClose}
        quiz={quiz}
        resetMode={resetMode}
      />
    </>
  );
};

export default QuizSimulator; 