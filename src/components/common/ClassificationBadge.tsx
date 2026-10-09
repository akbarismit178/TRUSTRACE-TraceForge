import React from 'react';
import { ClassificationLevel } from '../../types';
import { ShieldCheck, ShieldAlert, Lock } from 'lucide-react';

interface Props {
  classification: ClassificationLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const ClassificationBadge: React.FC<Props> = ({ classification, size = 'md' }) => {
  let bgStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let Icon = ShieldCheck;

  if (classification === 'Confidential') {
    bgStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = Lock;
  } else if (classification === 'Restricted') {
    bgStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-danger-glow';
    Icon = ShieldAlert;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-mono',
    md: 'px-2.5 py-1 text-xs font-semibold font-mono',
    lg: 'px-3 py-1.5 text-sm font-bold font-mono',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bgStyle} ${sizeClasses[size]}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {classification.toUpperCase()}
    </span>
  );
};
