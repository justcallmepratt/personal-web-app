/**
 * Individual athlete list item component
 */

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import type { Athlete } from '../../types/athlete';

interface AthleteListItemProps {
  athlete: Athlete;
  isSelected: boolean;
  onClick: () => void;
}

export function AthleteListItem({ athlete, isSelected, onClick }: AthleteListItemProps) {
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer transition-colors border-2 ${
        isSelected 
          ? 'bg-blue-50 border-[#2196F3]' 
          : 'border-transparent hover:bg-blue-50 hover:border-[#2196F3]'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={athlete.avatar} alt={athlete.name} />
          <AvatarFallback>{athlete.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[#001F3F] text-sm truncate mb-1">{athlete.name}</p>
          <div className="flex items-center gap-1 mb-1">
            <Badge className="bg-[#2196F3] text-white text-xs">{athlete.aiScore}</Badge>
            <span className="text-xs text-gray-500">AI Score</span>
          </div>
          <p className="text-xs text-gray-500">{athlete.country}</p>
        </div>
      </div>
    </div>
  );
}
