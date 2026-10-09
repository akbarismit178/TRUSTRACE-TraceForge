import React, { useState } from 'react';
import { TrustScoreBreakdown } from '../../types';
import { ShieldCheck, AlertTriangle, ShieldX, Info } from 'lucide-react';

interface Props {
  trustScore: TrustScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
}

export const TrustScoreWidget: React.FC<Props> = ({ trustScore, size = 'md' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { totalScore, band, evidenceCoverage, retrievalConfidence, sourceAuthority, consistency, policyIntegrity, penalties } = trustScore;

  let strokeColor = '#10B981'; // Green (Verified 90-100)
  let textColor = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30';
  let Icon = ShieldCheck;

  if (totalScore < 70) {
    strokeColor = '#EF4444'; // Red (Low <70)
    textColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/15 border-rose-500/40';
    Icon = ShieldX;
  } else if (totalScore < 90) {
    strokeColor = '#F59E0B'; // Amber (Moderate 70-89)
    textColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30';
    Icon = AlertTriangle;
  }

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div className={`flex items-center gap-3 p-2 rounded-xl border glass-card cursor-pointer hover:border-brand-500/40 transition-all`}>
        {/* Animated Circular Progress Ring */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="w-14 h-14 -rotate-90 transform">
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="#1E2B50"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke={strokeColor}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className={`absolute text-sm font-extrabold font-mono ${textColor}`}>
            {totalScore}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-400">Trust Score</span>
            <Info className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${badgeBg} ${textColor} flex items-center gap-1`}>
              <Icon className="w-3 h-3" />
              {band} ({totalScore}/100)
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-darkCard border border-darkBorder shadow-2xl z-50 text-xs backdrop-blur-xl">
          <div className="font-bold text-gray-200 mb-2 border-b border-gray-800 pb-1.5 flex justify-between items-center">
            <span>Trust Score Breakdown</span>
            <span className={`font-mono ${textColor}`}>{totalScore}/100</span>
          </div>
          <div className="space-y-1.5 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Evidence Coverage (30%):</span>
              <span className="font-mono text-emerald-400">{Math.round(evidenceCoverage)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Retrieval Confidence (25%):</span>
              <span className="font-mono text-emerald-400">{Math.round(retrievalConfidence)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Source Authority (20%):</span>
              <span className="font-mono text-emerald-400">{Math.round(sourceAuthority)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Consistency (15%):</span>
              <span className="font-mono text-amber-400">{Math.round(consistency)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Policy Integrity (10%):</span>
              <span className="font-mono text-emerald-400">{Math.round(policyIntegrity)}%</span>
            </div>
            {penalties > 0 && (
              <div className="flex justify-between text-rose-400 font-semibold border-t border-gray-800 pt-1">
                <span>Conflict Penalties:</span>
                <span className="font-mono">-{penalties} pts</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
