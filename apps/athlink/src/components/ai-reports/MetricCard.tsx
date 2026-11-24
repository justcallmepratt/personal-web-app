/**
 * Reusable metric card component for displaying athlete statistics
 */

import { Card } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  colorClass: 'purple' | 'green' | 'orange' | 'blue';
}

const colorConfig = {
  purple: {
    bg: 'from-purple-50 to-purple-100',
    icon: 'text-purple-600',
    text: 'text-purple-600',
  },
  green: {
    bg: 'from-green-50 to-green-100',
    icon: 'text-green-600',
    text: 'text-green-600',
  },
  orange: {
    bg: 'from-orange-50 to-orange-100',
    icon: 'text-orange-600',
    text: 'text-orange-600',
  },
  blue: {
    bg: 'from-blue-50 to-blue-100',
    icon: 'text-blue-600',
    text: 'text-blue-600',
  },
};

export function MetricCard({ icon: Icon, value, label, colorClass }: MetricCardProps) {
  const colors = colorConfig[colorClass];

  return (
    <Card className={`p-3 md:p-4 rounded-2xl text-center bg-gradient-to-br ${colors.bg}`}>
      <Icon className={`w-6 h-6 md:w-8 md:h-8 ${colors.icon} mx-auto mb-2`} />
      <p className={`text-xl md:text-2xl ${colors.text} mb-1`}>{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </Card>
  );
}
