/**
 * Utility functions for athlete data processing and formatting
 */

import type { Athlete } from '../types/athlete';
import { AI_SCORE_THRESHOLDS } from '../constants/aiReportData';

/**
 * Get recommendation level based on AI score
 */
export function getRecommendationLevel(aiScore: number): string {
  if (aiScore >= AI_SCORE_THRESHOLDS.EXCELLENT) return 'HIGHLY RECOMMENDED';
  if (aiScore >= AI_SCORE_THRESHOLDS.GOOD) return 'RECOMMENDED';
  if (aiScore >= AI_SCORE_THRESHOLDS.AVERAGE) return 'CONSIDER';
  return 'NOT RECOMMENDED';
}

/**
 * Get color class based on AI score
 */
export function getScoreColorClass(aiScore: number): string {
  if (aiScore >= AI_SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-500';
  if (aiScore >= AI_SCORE_THRESHOLDS.GOOD) return 'bg-blue-500';
  if (aiScore >= AI_SCORE_THRESHOLDS.AVERAGE) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Format athlete name with fallback
 */
export function formatAthleteName(athlete: Athlete): string {
  return athlete.name || 'Unknown Athlete';
}

/**
 * Calculate percentage difference between two values
 */
export function calculatePercentageDiff(current: number, average: number): string {
  const diff = ((current - average) / average) * 100;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${Math.round(diff)}%`;
}

/**
 * Validate if athlete has all required fields
 */
export function isAthleteComplete(athlete: Partial<Athlete>): boolean {
  const requiredFields: (keyof Athlete)[] = [
    'id',
    'name',
    'sport',
    'position',
    'gpa',
    'country',
    'school',
    'avatar',
    'yearOfGraduation',
    'aiScore',
  ];

  return requiredFields.every(field => athlete[field] !== undefined && athlete[field] !== null);
}

/**
 * Sort athletes by AI score (descending)
 */
export function sortAthletesByScore(athletes: Athlete[]): Athlete[] {
  return [...athletes].sort((a, b) => b.aiScore - a.aiScore);
}

/**
 * Filter athletes by minimum AI score
 */
export function filterAthletesByScore(athletes: Athlete[], minScore: number): Athlete[] {
  return athletes.filter(athlete => athlete.aiScore >= minScore);
}

/**
 * Get athlete initials for avatar fallback
 */
export function getAthleteInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format GPA with proper decimal places
 */
export function formatGPA(gpa: string | number): string {
  const numericGPA = typeof gpa === 'string' ? parseFloat(gpa) : gpa;
  return numericGPA.toFixed(1);
}

/**
 * Check if athlete is eligible for NCAA
 */
export function isNCAA Eligible(gpa: string | number, testScore?: number): boolean {
  const numericGPA = typeof gpa === 'string' ? parseFloat(gpa) : gpa;
  const MIN_GPA = 2.3;
  const MIN_TEST_SCORE = 1000; // SAT equivalent

  if (numericGPA < MIN_GPA) return false;
  if (testScore && testScore < MIN_TEST_SCORE) return false;
  
  return true;
}

/**
 * Get performance category based on metric value
 */
export function getPerformanceCategory(value: number): 'elite' | 'excellent' | 'good' | 'average' | 'below-average' {
  if (value >= 95) return 'elite';
  if (value >= 85) return 'excellent';
  if (value >= 75) return 'good';
  if (value >= 60) return 'average';
  return 'below-average';
}

/**
 * Calculate average of numeric values
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
