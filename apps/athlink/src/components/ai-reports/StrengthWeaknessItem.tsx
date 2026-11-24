/**
 * Strength and weakness list item components
 */

import { Check, ArrowUpRight, Info } from 'lucide-react';

interface StrengthItemProps {
  title: string;
  description: string;
}

export function StrengthItem({ title, description }: StrengthItemProps) {
  return (
    <div className="flex items-start gap-2 md:gap-3">
      <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm text-gray-700"><strong>{title}</strong></p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}

interface WeaknessItemProps {
  title: string;
  description: string;
  severity: 'orange' | 'yellow';
}

export function WeaknessItem({ title, description, severity }: WeaknessItemProps) {
  const bgColor = severity === 'orange' ? 'bg-orange-500' : 'bg-yellow-500';
  const Icon = severity === 'orange' ? ArrowUpRight : Info;

  return (
    <div className="flex items-start gap-2 md:gap-3">
      <div className={`w-5 h-5 md:w-6 md:h-6 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm text-gray-700"><strong>{title}</strong></p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}
