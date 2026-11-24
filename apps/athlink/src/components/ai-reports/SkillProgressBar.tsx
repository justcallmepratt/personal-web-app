/**
 * Skill progress bar with label and value display
 */

import { ProgressBar } from './ProgressBar';

interface SkillProgressBarProps {
  label: string;
  value: number;
  showGradient?: boolean;
}

export function SkillProgressBar({ label, value, showGradient = true }: SkillProgressBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs md:text-sm text-gray-700">{label}</span>
        <span className="text-xs md:text-sm text-[#2196F3]">{value}/100</span>
      </div>
      <ProgressBar value={value} showGradient={showGradient} />
    </div>
  );
}
