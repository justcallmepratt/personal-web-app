/**
 * Consistent section header component used across all report sections
 */

import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function SectionHeader({ 
  icon: Icon, 
  title,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-[#2196F3]'
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-8 h-8 md:w-10 md:h-10 ${iconBgColor} rounded-full flex items-center justify-center`}>
        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
      </div>
      <h3 className="text-[#001F3F] text-base md:text-xl">{title}</h3>
    </div>
  );
}
