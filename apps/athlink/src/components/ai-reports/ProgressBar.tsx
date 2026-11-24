/**
 * Reusable progress bar component with customizable colors
 */

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
  showGradient?: boolean;
}

export function ProgressBar({ 
  value, 
  color = '#2196F3', 
  height = 'md',
  showGradient = false 
}: ProgressBarProps) {
  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }[height];

  const barClass = showGradient
    ? 'bg-gradient-to-r from-[#2196F3] to-[#1976D2]'
    : '';

  return (
    <div className={`w-full bg-gray-200 rounded-full ${heightClass}`}>
      <div
        className={`${heightClass} rounded-full ${barClass}`}
        style={{ 
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: showGradient ? undefined : color 
        }}
      />
    </div>
  );
}
