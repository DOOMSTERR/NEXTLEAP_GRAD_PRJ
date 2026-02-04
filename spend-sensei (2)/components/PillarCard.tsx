
import React from 'react';
import { Pillar, SubQuestion } from '../types';

interface PillarCardProps {
  pillar: Pillar;
  onQuestionClick: (q: SubQuestion) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const PillarCard: React.FC<PillarCardProps> = ({ pillar, onQuestionClick, isExpanded, onToggle }) => {
  // NOTE: This component is now largely replaced by the inline navigation in App.tsx
  // to ensure better control over the "Chat bot" like drill down flow requested.
  return null;
};

export default PillarCard;
