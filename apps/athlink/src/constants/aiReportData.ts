/**
 * Constants and static data for AI Reports
 */

import type { 
  PhysicalMetric, 
  TechnicalSkill, 
  MentalAttribute, 
  TeamFitItem,
  StatComparison,
  VideoHighlight
} from '../types/athlete';

export const COLORS = {
  PRIMARY: '#2196F3',
  PRIMARY_DARK: '#1976D2',
  ACCENT: '#FF5722',
  ACCENT_DARK: '#F4511E',
  TEXT_PRIMARY: '#001F3F',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
} as const;

export const AI_SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  AVERAGE: 70,
  BELOW_AVERAGE: 60,
} as const;

export const REPORT_METRICS = {
  COMPATIBILITY_PERCENTAGE: 96,
  ATHLETIC_ABILITY_PERCENTAGE: 94,
  CHAMPIONSHIPS_COUNT: 12,
  POTENTIAL_LEVEL: 'Very High',
} as const;

export const PHYSICAL_METRICS: PhysicalMetric[] = [
  { label: 'Speed', value: 88, color: COLORS.PRIMARY },
  { label: 'Agility', value: 93, color: COLORS.PRIMARY },
  { label: 'Stamina', value: 86, color: COLORS.PRIMARY },
  { label: 'Strength', value: 72, color: COLORS.PRIMARY },
  { label: 'Acceleration', value: 90, color: COLORS.PRIMARY },
  { label: 'Jump/Power', value: 78, color: COLORS.PRIMARY },
  { label: 'Balance', value: 91, color: COLORS.PRIMARY },
  { label: 'Injury Risk', value: 85, color: COLORS.SUCCESS, text: 'Low' },
];

export const TECHNICAL_SKILLS_LEFT: TechnicalSkill[] = [
  { label: 'Ball Control', value: 97 },
  { label: 'Passing Accuracy', value: 92 },
  { label: 'Dribbling', value: 95 },
  { label: 'Shooting', value: 84 },
];

export const TECHNICAL_SKILLS_RIGHT: TechnicalSkill[] = [
  { label: 'Crossing', value: 88 },
  { label: 'Tackling', value: 73 },
  { label: 'Set Pieces', value: 91 },
  { label: 'Weak Foot', value: 80 },
];

export const MENTAL_ATTRIBUTES: MentalAttribute[] = [
  { label: 'Game IQ', value: 94, desc: 'Exceptional field awareness' },
  { label: 'Composure', value: 89, desc: 'Performs under pressure' },
  { label: 'Work Rate', value: 87, desc: 'High motor, competitive' },
  { label: 'Positioning', value: 90, desc: 'Excellent spatial awareness' },
  { label: 'Leadership', value: 92, desc: 'Natural captain material' },
  { label: 'Coachability', value: 96, desc: 'Eager to learn & improve' },
];

export const SEASON_STATS_PRIMARY = [
  { value: '28', label: 'Games Played', colorClass: 'blue' },
  { value: '15', label: 'Goals Scored', colorClass: 'green' },
  { value: '22', label: 'Assists', colorClass: 'purple' },
  { value: '89%', label: 'Pass Completion', colorClass: 'orange' },
] as const;

export const SEASON_STATS_SECONDARY = [
  { label: 'Minutes Played', value: '2,340' },
  { label: 'Shots on Target', value: '67%' },
  { label: 'Key Passes/Game', value: '4.2' },
  { label: 'Dribbles/Game', value: '5.8' },
];

export const TEAM_FIT_ITEMS: TeamFitItem[] = [
  {
    title: 'Playing Style Match',
    badge: '96% Match',
    badgeColor: 'bg-green-500',
    desc: 'Possession-based style aligns perfectly with your program\'s philosophy. Excels in quick passing combinations.',
  },
  {
    title: 'Formation Versatility',
    badge: 'High',
    badgeColor: 'bg-blue-500',
    desc: 'Can play multiple positions: CAM, LW, RW. Provides tactical flexibility for different opponents.',
  },
  {
    title: 'Cultural Fit',
    badge: 'Excellent',
    badgeColor: 'bg-green-500',
    desc: 'Mature, team-first mentality. Strong English proficiency. Has experience training with international coaches.',
  },
  {
    title: 'Immediate Impact Potential',
    badge: 'Very High',
    badgeColor: 'bg-[#FF5722]',
    desc: 'Physical maturity and technical ability suggest immediate contribution as freshman. Could start or rotate heavily.',
  },
];

export const ROSTER_COMPARISONS: StatComparison[] = [
  { label: 'Technical Ability', average: 73, athlete: 97, diff: '+24%' },
  { label: 'Athletic Ability', average: 78, athlete: 94, diff: '+16%' },
  { label: 'Game IQ', average: 75, athlete: 94, diff: '+19%' },
];

export const VIDEO_HIGHLIGHTS: VideoHighlight[] = [
  {
    title: 'Championship Performance',
    description: '2 goals, 1 assist in title game. Exceptional under pressure.',
  },
  {
    title: 'Skills Compilation',
    description: 'Technical ability showcase - ball control & dribbling.',
  },
];

export const RECRUITING_NEXT_STEPS = [
  'Schedule 1-on-1 Zoom call within next 7 days',
  'Extend summer camp invitation (3 camps recommended)',
  'Coordinate official campus visit for Fall 2025',
  'Begin scholarship offer discussion (estimated value: 60-80%)',
  'Maintain weekly communication through recruiting process',
] as const;

export const getStrengthItems = (athleteGPA: string) => [
  {
    title: 'Elite Technical Skills (97/100)',
    desc: 'Exceptional first touch, ball control, and dribbling ability. Consistently beats defenders 1v1.',
  },
  {
    title: 'Vision & Creativity (94/100)',
    desc: 'Outstanding field awareness with ability to create scoring opportunities through key passes.',
  },
  {
    title: 'Leadership Qualities (92/100)',
    desc: 'Team captain with proven ability to elevate teammates\' performance. Natural communicator.',
  },
  {
    title: `Academic Excellence (GPA: ${athleteGPA})`,
    desc: 'Strong student with SAT 1340/ACT 30. NCAA core course requirements exceeded.',
  },
  {
    title: 'International Experience (90/100)',
    desc: 'Competed at youth national level. Adapts quickly to different playing styles.',
  },
];

export const WEAKNESS_ITEMS = [
  {
    title: 'Physical Strength (72/100)',
    desc: 'Could benefit from strength training to compete with larger, more physical defenders.',
    severity: 'orange' as const,
  },
  {
    title: 'Defensive Work Rate (75/100)',
    desc: 'Tracking back and defensive positioning could be improved for two-way play.',
    severity: 'orange' as const,
  },
  {
    title: 'Cultural Adjustment',
    desc: 'As international athlete, will need support adapting to US college culture and systems.',
    severity: 'yellow' as const,
  },
  {
    title: 'Decision Making Under Pressure',
    desc: 'Occasionally holds ball too long in final third. Can improve decision-making speed.',
    severity: 'yellow' as const,
  },
];
