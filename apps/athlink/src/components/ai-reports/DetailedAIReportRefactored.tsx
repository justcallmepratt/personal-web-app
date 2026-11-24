/**
 * Main AI Report component - refactored for better code organization
 * Follows best practices: composition, single responsibility, DRY principle
 */

import { useState } from 'react';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Users, Sparkles, Target, GraduationCap, TrendingUp, Trophy, Activity, 
  AlertCircle, Lightbulb, BarChart3, CheckCircle2, Star, MessageCircle, 
  Calendar, Download, LineChart, Video, PlayCircle, Play
} from 'lucide-react';
import athlinkLogo from 'figma:asset/2dea44558ee75ccc34db0ab7f1dff6684b053f54.png';

import { AthleteListItem } from './AthleteListItem';
import { MetricCard } from './MetricCard';
import { SectionHeader } from './SectionHeader';
import { SkillProgressBar } from './SkillProgressBar';
import { PhysicalAttributeCard } from './PhysicalAttributeCard';
import { StrengthItem, WeaknessItem } from './StrengthWeaknessItem';
import { ProgressBar } from './ProgressBar';

import type { Athlete } from '../../types/athlete';
import {
  REPORT_METRICS,
  PHYSICAL_METRICS,
  TECHNICAL_SKILLS_LEFT,
  TECHNICAL_SKILLS_RIGHT,
  MENTAL_ATTRIBUTES,
  SEASON_STATS_PRIMARY,
  SEASON_STATS_SECONDARY,
  TEAM_FIT_ITEMS,
  ROSTER_COMPARISONS,
  VIDEO_HIGHLIGHTS,
  RECRUITING_NEXT_STEPS,
  getStrengthItems,
  WEAKNESS_ITEMS,
} from '../../constants/aiReportData';

interface DetailedAIReportProps {
  athlete: Athlete;
  athletes: Athlete[];
}

export function DetailedAIReportRefactored({ athlete: initialAthlete, athletes }: DetailedAIReportProps) {
  const [selectedAthlete, setSelectedAthlete] = useState(initialAthlete);

  const strengthItems = getStrengthItems(selectedAthlete.gpa);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[#2196F3] mb-2">AI Scouting Reports</h1>
        <p className="text-gray-600 text-sm md:text-base">
          Comprehensive AI-powered analysis of athlete performance, potential, and team fit
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Athlete List Sidebar */}
        <Card className="lg:col-span-1 p-4 rounded-2xl max-h-[400px] lg:max-h-[800px] overflow-y-auto">
          <h3 className="text-[#001F3F] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Athletes
          </h3>
          <div className="space-y-3">
            {athletes.slice(0, 8).map(athlete => (
              <AthleteListItem
                key={athlete.id}
                athlete={athlete}
                isSelected={selectedAthlete.id === athlete.id}
                onClick={() => setSelectedAthlete(athlete)}
              />
            ))}
          </div>
        </Card>

        {/* Main Report Content */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Athlete Header Card */}
          <AthleteHeaderCard athlete={selectedAthlete} />

          {/* Executive Summary */}
          <ExecutiveSummary athlete={selectedAthlete} />

          {/* Key Metrics Grid */}
          <KeyMetricsGrid athlete={selectedAthlete} />

          {/* Strengths & Weaknesses */}
          <StrengthsWeaknessesSection strengthItems={strengthItems} />

          {/* Physical Attributes */}
          <PhysicalAttributesSection />

          {/* Technical Skills */}
          <TechnicalSkillsSection />

          {/* Mental & Tactical */}
          <MentalTacticalSection />

          {/* Statistical Performance */}
          <StatisticalPerformanceSection />

          {/* Team Fit Analysis */}
          <TeamFitSection />

          {/* Recruiting Recommendation */}
          <RecruitingRecommendationSection athlete={selectedAthlete} />

          {/* Roster Comparison */}
          <RosterComparisonSection athlete={selectedAthlete} />

          {/* Video Analysis */}
          <VideoAnalysisSection />
        </div>
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function AthleteHeaderCard({ athlete }: { athlete: Athlete }) {
  return (
    <Card className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-[#2196F3]">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4 flex-1">
          <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white shadow-lg">
            <AvatarImage src={athlete.avatar} alt={athlete.name} />
            <AvatarFallback>{athlete.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-[#001F3F] text-xl md:text-2xl mb-1 truncate">{athlete.name}</h2>
            <p className="text-gray-700 mb-2 text-sm md:text-base">{athlete.sport} • {athlete.position}</p>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-white text-[#2196F3] border-2 border-[#2196F3] text-xs">
                {athlete.country}
              </Badge>
              <Badge className="bg-white text-gray-700 text-xs">
                Class of {athlete.yearOfGraduation}
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-gray-600 truncate">{athlete.school}</p>
          </div>
        </div>
        <div className="text-center md:text-right w-full md:w-auto">
          <div className="bg-gradient-to-br from-[#FF5722] to-[#F4511E] text-white px-4 md:px-6 py-3 rounded-2xl shadow-lg mb-2">
            <p className="text-xs md:text-sm mb-1 opacity-90">AI MATCH SCORE</p>
            <p className="text-3xl md:text-4xl">{athlete.aiScore}</p>
            <p className="text-xs opacity-90">out of 100</p>
          </div>
          <Badge className="bg-green-500 text-white text-xs">HIGHLY RECOMMENDED</Badge>
        </div>
      </div>
    </Card>
  );
}

function ExecutiveSummary({ athlete }: { athlete: Athlete }) {
  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <SectionHeader icon={Sparkles} title="Executive Summary" />
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-xl border-2 border-blue-200">
        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
          <strong>{athlete.name}</strong> is an exceptional international prospect from {athlete.country} with 
          outstanding technical abilities and high academic achievement (GPA: {athlete.gpa}). 
          Our AI analysis indicates <strong>{REPORT_METRICS.COMPATIBILITY_PERCENTAGE}% compatibility</strong> with 
          your program's requirements. {athlete.name} demonstrates elite-level ball control, exceptional vision, 
          and leadership qualities that align perfectly with your team's playing style. 
          With proven international experience and strong work ethic, this athlete presents a{' '}
          <strong>low-risk, high-reward</strong> recruiting opportunity. 
          NCAA eligibility is confirmed, and the athlete shows strong interest in your program.
        </p>
      </div>
    </Card>
  );
}

function KeyMetricsGrid({ athlete }: { athlete: Athlete }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <MetricCard 
        icon={Target} 
        value={`${REPORT_METRICS.ATHLETIC_ABILITY_PERCENTAGE}%`} 
        label="Athletic Ability" 
        colorClass="purple" 
      />
      <MetricCard 
        icon={GraduationCap} 
        value={athlete.gpa} 
        label="GPA" 
        colorClass="green" 
      />
      <MetricCard 
        icon={TrendingUp} 
        value={REPORT_METRICS.POTENTIAL_LEVEL} 
        label="Potential" 
        colorClass="orange" 
      />
      <MetricCard 
        icon={Trophy} 
        value={REPORT_METRICS.CHAMPIONSHIPS_COUNT} 
        label="Championships" 
        colorClass="blue" 
      />
    </div>
  );
}

function StrengthsWeaknessesSection({ strengthItems }: { strengthItems: ReturnType<typeof getStrengthItems> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <Card className="p-4 md:p-6 rounded-2xl">
        <SectionHeader icon={TrendingUp} title="Key Strengths" iconBgColor="bg-green-100" iconColor="text-green-600" />
        <div className="space-y-3">
          {strengthItems.map((item, idx) => (
            <StrengthItem key={idx} title={item.title} description={item.desc} />
          ))}
        </div>
      </Card>

      <Card className="p-4 md:p-6 rounded-2xl">
        <SectionHeader icon={AlertCircle} title="Areas for Development" iconBgColor="bg-orange-100" iconColor="text-orange-600" />
        <div className="space-y-3">
          {WEAKNESS_ITEMS.map((item, idx) => (
            <WeaknessItem key={idx} title={item.title} description={item.desc} severity={item.severity} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function PhysicalAttributesSection() {
  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <SectionHeader icon={Activity} title="Physical & Athletic Profile" iconBgColor="bg-red-100" iconColor="text-red-600" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {PHYSICAL_METRICS.map((metric, idx) => (
          <PhysicalAttributeCard key={idx} metric={metric} />
        ))}
      </div>
    </Card>
  );
}

function TechnicalSkillsSection() {
  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <SectionHeader icon={Target} title="Technical Skills Assessment" iconBgColor="bg-purple-100" iconColor="text-purple-600" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {TECHNICAL_SKILLS_LEFT.map((skill, idx) => (
            <SkillProgressBar key={idx} label={skill.label} value={skill.value} />
          ))}
        </div>
        <div className="space-y-3">
          {TECHNICAL_SKILLS_RIGHT.map((skill, idx) => (
            <SkillProgressBar key={idx} label={skill.label} value={skill.value} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function MentalTacticalSection() {
  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <SectionHeader icon={Lightbulb} title="Mental & Tactical Intelligence" iconBgColor="bg-indigo-100" iconColor="text-indigo-600" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {MENTAL_ATTRIBUTES.map((attr, idx) => (
          <div key={idx} className="bg-indigo-50 p-3 md:p-4 rounded-xl">
            <p className="text-xs text-gray-600 mb-2">{attr.label}</p>
            <p className="text-xl md:text-2xl text-indigo-600 mb-1">{attr.value}</p>
            <p className="text-xs text-gray-600">{attr.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatisticalPerformanceSection() {
  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <SectionHeader icon={BarChart3} title="Season Statistics & Performance Data" iconBgColor="bg-green-100" iconColor="text-green-600" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        <StatCard value="28" label="Games Played" colorClass="blue" />
        <StatCard value="15" label="Goals Scored" colorClass="green" />
        <StatCard value="22" label="Assists" colorClass="purple" />
        <StatCard value="89%" label="Pass Completion" colorClass="orange" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {SEASON_STATS_SECONDARY.map((stat, idx) => (
          <div key={idx} className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs md:text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-base md:text-lg text-[#001F3F]">{stat.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatCard({ value, label, colorClass }: { value: string; label: string; colorClass: string }) {
  const colorMap = {
    blue: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-600' },
    green: { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-600' },
    purple: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-600' },
    orange: { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-600' },
  }[colorClass];

  return (
    <div className={`bg-gradient-to-br ${colorMap.bg} p-3 md:p-4 rounded-xl text-center border-2 ${colorMap.border}`}>
      <p className={`text-2xl md:text-3xl ${colorMap.text} mb-1`}>{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function TeamFitSection() {
  return (
    <Card className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-[#FF5722]">
      <SectionHeader icon={Users} title="Team Fit Analysis" iconBgColor="bg-[#FF5722]" iconColor="text-white" />
      <div className="space-y-3 md:space-y-4">
        {TEAM_FIT_ITEMS.map((item, idx) => (
          <div key={idx} className="bg-white p-3 md:p-4 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs md:text-sm text-gray-700">{item.title}</span>
              <Badge className={`${item.badgeColor} text-white text-xs`}>{item.badge}</Badge>
            </div>
            <p className="text-xs text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecruitingRecommendationSection({ athlete }: { athlete: Athlete }) {
  return (
    <Card className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500">
      <SectionHeader icon={CheckCircle2} title="AI Recruiting Recommendation" iconBgColor="bg-green-500" iconColor="text-white" />
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-sm md:text-base text-gray-700 mb-2">
              <strong>PRIORITY RECRUIT - HIGHLY RECOMMENDED</strong>
            </p>
            <p className="text-xs md:text-sm text-gray-600">
              {athlete.name} represents an exceptional recruiting opportunity that aligns with {REPORT_METRICS.COMPATIBILITY_PERCENTAGE}% 
              of your program's criteria. The combination of elite technical skills, strong academics, international experience, 
              and cultural fit makes this a <strong>low-risk, high-reward prospect</strong>.
            </p>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl">
          <p className="text-xs md:text-sm mb-2"><strong>Recommended Next Steps:</strong></p>
          <ol className="text-xs md:text-sm text-gray-600 space-y-1 list-decimal list-inside">
            {RECRUITING_NEXT_STEPS.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <Button className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl text-sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Send Message
          </Button>
          <Button className="flex-1 bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Call
          </Button>
          <Button variant="outline" className="sm:w-auto px-4 rounded-xl text-sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RosterComparisonSection({ athlete }: { athlete: Athlete }) {
  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <SectionHeader icon={LineChart} title="Comparison vs. Current Roster Average" />
      <div className="space-y-3">
        {ROSTER_COMPARISONS.map((comp, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm text-gray-700">{comp.label}</span>
              <span className="text-xs md:text-sm text-green-600">{comp.diff} above average</span>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gray-400 h-3 rounded-full" style={{ width: `${comp.average}%` }}></div>
              <div className="absolute top-0 bg-green-500 h-3 rounded-full" style={{ width: `${comp.athlete}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Roster Avg: {comp.average}</span>
              <span className="text-green-600">{athlete.name}: {comp.athlete}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VideoAnalysisSection() {
  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <SectionHeader icon={Video} title="Video Analysis Highlights" iconBgColor="bg-red-100" iconColor="text-red-600" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {VIDEO_HIGHLIGHTS.map((video, idx) => (
          <div key={idx} className="bg-gray-50 p-3 md:p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="w-4 h-4 md:w-5 md:h-5 text-[#2196F3]" />
              <span className="text-xs md:text-sm">{video.title}</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">{video.description}</p>
            <Button size="sm" variant="outline" className="w-full rounded-xl text-xs">
              <Play className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Watch Highlights
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
