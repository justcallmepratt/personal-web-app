/**
 * Physical attribute metric card with progress bar
 */

import { ProgressBar } from './ProgressBar';
import type { PhysicalMetric } from '../../types/athlete';

interface PhysicalAttributeCardProps {
  metric: PhysicalMetric;
}

export function PhysicalAttributeCard({ metric }: PhysicalAttributeCardProps) {
  return (
    <div className="bg-gray-50 p-3 md:p-4 rounded-xl">
      <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
      <div className="flex items-end gap-2 mb-2">
        <p className="text-xl md:text-2xl" style={{ color: metric.color }}>
          {metric.text || metric.value}
        </p>
        {!metric.text && <span className="text-xs text-gray-500 mb-1">/100</span>}
      </div>
      <ProgressBar value={metric.value} color={metric.color} />
    </div>
  );
}
