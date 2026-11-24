/**
 * Type definitions for athlete-related data structures
 */

export interface Athlete {
  id: number;
  name: string;
  sport: string;
  position: string;
  gpa: string;
  country: string;
  school: string;
  avatar: string;
  yearOfGraduation: string;
  aiScore: number;
  aiInsights?: string;
  height?: string;
  weight?: string;
  videoCount?: number;
  matchRate?: number;
}

export interface PhysicalMetric {
  label: string;
  value: number;
  color: string;
  text?: string;
}

export interface TechnicalSkill {
  label: string;
  value: number;
}

export interface MentalAttribute {
  label: string;
  value: number;
  desc: string;
}

export interface StrengthItem {
  title: string;
  desc: string;
}

export interface WeaknessItem {
  title: string;
  desc: string;
  severity: 'orange' | 'yellow';
}

export interface TeamFitItem {
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
}

export interface StatComparison {
  label: string;
  average: number;
  athlete: number;
  diff: string;
}

export interface VideoHighlight {
  title: string;
  description: string;
}
