import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  Users, Sparkles, Target, GraduationCap, TrendingUp, Trophy, Activity, 
  AlertCircle, Check, ArrowUpRight, Info, Lightbulb, BarChart3, CheckCircle2,
  Star, MessageCircle, Calendar, Download, LineChart, Video, PlayCircle, Play
} from 'lucide-react';

interface Athlete {
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
}

interface DetailedAIReportProps {
  athlete: Athlete;
  athletes: Athlete[];
}

export function DetailedAIReport({ athlete: initialAthlete, athletes }: DetailedAIReportProps) {
  const [selectedAthlete, setSelectedAthlete] = useState(initialAthlete);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#2196F3] mb-2">AI Scouting Reports</h1>
        <p className="text-gray-600 text-sm md:text-base">Comprehensive AI-powered analysis of athlete performance, potential, and team fit</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Athlete List */}
        <Card className="lg:col-span-1 p-4 rounded-2xl max-h-[400px] lg:max-h-[800px] overflow-y-auto">
          <h3 className="text-[#001F3F] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Athletes
          </h3>
          <div className="space-y-3">
            {athletes.slice(0, 8).map(ath => (
              <div 
                key={ath.id}
                onClick={() => setSelectedAthlete(ath)}
                className={`p-3 rounded-xl cursor-pointer transition-colors border-2 ${
                  selectedAthlete.id === ath.id 
                    ? 'bg-blue-50 border-[#2196F3]' 
                    : 'border-transparent hover:bg-blue-50 hover:border-[#2196F3]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={ath.avatar} />
                    <AvatarFallback>{ath.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#001F3F] text-sm truncate mb-1">{ath.name}</p>
                    <div className="flex items-center gap-1 mb-1">
                      <Badge className="bg-[#2196F3] text-white text-xs">{ath.aiScore}</Badge>
                      <span className="text-xs text-gray-500">AI Score</span>
                    </div>
                    <p className="text-xs text-gray-500">{ath.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detailed Report */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Header Card */}
          <Card className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-[#2196F3]">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 md:gap-4 flex-1">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white shadow-lg">
                  <AvatarImage src={selectedAthlete.avatar} />
                  <AvatarFallback>{selectedAthlete.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[#001F3F] text-xl md:text-2xl mb-1 truncate">{selectedAthlete.name}</h2>
                  <p className="text-gray-700 mb-2 text-sm md:text-base">{selectedAthlete.sport} • {selectedAthlete.position}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-white text-[#2196F3] border-2 border-[#2196F3] text-xs">
                      {selectedAthlete.country}
                    </Badge>
                    <Badge className="bg-white text-gray-700 text-xs">
                      Class of {selectedAthlete.yearOfGraduation}
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 truncate">{selectedAthlete.school}</p>
                </div>
              </div>
              <div className="text-center md:text-right w-full md:w-auto">
                <div className="bg-gradient-to-br from-[#FF5722] to-[#F4511E] text-white px-4 md:px-6 py-3 rounded-2xl shadow-lg mb-2">
                  <p className="text-xs md:text-sm mb-1 opacity-90">AI MATCH SCORE</p>
                  <p className="text-3xl md:text-4xl">{selectedAthlete.aiScore}</p>
                  <p className="text-xs opacity-90">out of 100</p>
                </div>
                <Badge className="bg-green-500 text-white text-xs">HIGHLY RECOMMENDED</Badge>
              </div>
            </div>
          </Card>

          {/* Executive Summary */}
          <Card className="p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#2196F3]" />
              </div>
              <h3 className="text-[#001F3F] text-lg md:text-xl">Executive Summary</h3>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-xl border-2 border-blue-200">
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                <strong>{selectedAthlete.name}</strong> is an exceptional international prospect from {selectedAthlete.country} with outstanding technical abilities and high academic achievement (GPA: {selectedAthlete.gpa}). 
                Our AI analysis indicates <strong>96% compatibility</strong> with your program's requirements. 
                {selectedAthlete.name} demonstrates elite-level ball control, exceptional vision, and leadership qualities that align perfectly with your team's playing style. 
                With proven international experience and strong work ethic, this athlete presents a <strong>low-risk, high-reward</strong> recruiting opportunity. 
                NCAA eligibility is confirmed, and the athlete shows strong interest in your program.
              </p>
            </div>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-3 md:p-4 rounded-2xl text-center bg-gradient-to-br from-purple-50 to-purple-100">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xl md:text-2xl text-purple-600 mb-1">94%</p>
              <p className="text-xs text-gray-600">Athletic Ability</p>
            </Card>
            <Card className="p-3 md:p-4 rounded-2xl text-center bg-gradient-to-br from-green-50 to-green-100">
              <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-green-600 mx-auto mb-2" />
              <p className="text-xl md:text-2xl text-green-600 mb-1">{selectedAthlete.gpa}</p>
              <p className="text-xs text-gray-600">GPA</p>
            </Card>
            <Card className="p-3 md:p-4 rounded-2xl text-center bg-gradient-to-br from-orange-50 to-orange-100">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-xl md:text-2xl text-orange-600 mb-1">Very High</p>
              <p className="text-xs text-gray-600">Potential</p>
            </Card>
            <Card className="p-3 md:p-4 rounded-2xl text-center bg-gradient-to-br from-blue-50 to-blue-100">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xl md:text-2xl text-blue-600 mb-1">12</p>
              <p className="text-xs text-gray-600">Championships</p>
            </Card>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="p-4 md:p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <h3 className="text-[#001F3F] text-base md:text-lg">Key Strengths</h3>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Elite Technical Skills (97/100)', desc: 'Exceptional first touch, ball control, and dribbling ability. Consistently beats defenders 1v1.' },
                  { title: 'Vision & Creativity (94/100)', desc: 'Outstanding field awareness with ability to create scoring opportunities through key passes.' },
                  { title: 'Leadership Qualities (92/100)', desc: 'Team captain with proven ability to elevate teammates\' performance. Natural communicator.' },
                  { title: `Academic Excellence (GPA: ${selectedAthlete.gpa})`, desc: 'Strong student with SAT 1340/ACT 30. NCAA core course requirements exceeded.' },
                  { title: 'International Experience (90/100)', desc: 'Competed at youth national level. Adapts quickly to different playing styles.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm text-gray-700"><strong>{item.title}</strong></p>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 md:p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                </div>
                <h3 className="text-[#001F3F] text-base md:text-lg">Areas for Development</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-gray-700"><strong>Physical Strength (72/100)</strong></p>
                    <p className="text-xs text-gray-600">Could benefit from strength training to compete with larger, more physical defenders.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-gray-700"><strong>Defensive Work Rate (75/100)</strong></p>
                    <p className="text-xs text-gray-600">Tracking back and defensive positioning could be improved for two-way play.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-gray-700"><strong>Cultural Adjustment</strong></p>
                    <p className="text-xs text-gray-600">As international athlete, will need support adapting to US college culture and systems.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-gray-700"><strong>Decision Making Under Pressure</strong></p>
                    <p className="text-xs text-gray-600">Occasionally holds ball too long in final third. Can improve decision-making speed.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Physical Attributes */}
          <Card className="p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">Physical & Athletic Profile</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Speed', value: 88, color: '#2196F3' },
                { label: 'Agility', value: 93, color: '#2196F3' },
                { label: 'Stamina', value: 86, color: '#2196F3' },
                { label: 'Strength', value: 72, color: '#2196F3' },
                { label: 'Acceleration', value: 90, color: '#2196F3' },
                { label: 'Jump/Power', value: 78, color: '#2196F3' },
                { label: 'Balance', value: 91, color: '#2196F3' },
                { label: 'Injury Risk', value: 85, color: '#10b981', text: 'Low' }
              ].map((metric, idx) => (
                <div key={idx} className="bg-gray-50 p-3 md:p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                  <div className="flex items-end gap-2 mb-2">
                    <p className="text-xl md:text-2xl" style={{ color: metric.color }}>
                      {metric.text || metric.value}
                    </p>
                    {!metric.text && <span className="text-xs text-gray-500 mb-1">/100</span>}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${metric.value}%`, backgroundColor: metric.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Technical Skills */}
          <Card className="p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">Technical Skills Assessment</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {[
                  { label: 'Ball Control', value: 97 },
                  { label: 'Passing Accuracy', value: 92 },
                  { label: 'Dribbling', value: 95 },
                  { label: 'Shooting', value: 84 }
                ].map((skill, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs md:text-sm text-gray-700">{skill.label}</span>
                      <span className="text-xs md:text-sm text-[#2196F3]">{skill.value}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] h-2 rounded-full" style={{ width: `${skill.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Crossing', value: 88 },
                  { label: 'Tackling', value: 73 },
                  { label: 'Set Pieces', value: 91 },
                  { label: 'Weak Foot', value: 80 }
                ].map((skill, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs md:text-sm text-gray-700">{skill.label}</span>
                      <span className="text-xs md:text-sm text-[#2196F3]">{skill.value}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] h-2 rounded-full" style={{ width: `${skill.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Mental & Tactical */}
          <Card className="p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">Mental & Tactical Intelligence</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[
                { label: 'Game IQ', value: 94, desc: 'Exceptional field awareness' },
                { label: 'Composure', value: 89, desc: 'Performs under pressure' },
                { label: 'Work Rate', value: 87, desc: 'High motor, competitive' },
                { label: 'Positioning', value: 90, desc: 'Excellent spatial awareness' },
                { label: 'Leadership', value: 92, desc: 'Natural captain material' },
                { label: 'Coachability', value: 96, desc: 'Eager to learn & improve' }
              ].map((attr, idx) => (
                <div key={idx} className="bg-indigo-50 p-3 md:p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-2">{attr.label}</p>
                  <p className="text-xl md:text-2xl text-indigo-600 mb-1">{attr.value}</p>
                  <p className="text-xs text-gray-600">{attr.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Statistical Performance */}
          <Card className="p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">Season Statistics & Performance Data</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 md:p-4 rounded-xl text-center border-2 border-blue-200">
                <p className="text-2xl md:text-3xl text-blue-600 mb-1">28</p>
                <p className="text-xs text-gray-600">Games Played</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 md:p-4 rounded-xl text-center border-2 border-green-200">
                <p className="text-2xl md:text-3xl text-green-600 mb-1">15</p>
                <p className="text-xs text-gray-600">Goals Scored</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 md:p-4 rounded-xl text-center border-2 border-purple-200">
                <p className="text-2xl md:text-3xl text-purple-600 mb-1">22</p>
                <p className="text-xs text-gray-600">Assists</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 md:p-4 rounded-xl text-center border-2 border-orange-200">
                <p className="text-2xl md:text-3xl text-orange-600 mb-1">89%</p>
                <p className="text-xs text-gray-600">Pass Completion</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Minutes Played', value: '2,340' },
                { label: 'Shots on Target', value: '67%' },
                { label: 'Key Passes/Game', value: '4.2' },
                { label: 'Dribbles/Game', value: '5.8' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-base md:text-lg text-[#001F3F]">{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Team Fit Analysis */}
          <Card className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-[#FF5722]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FF5722] rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">Team Fit Analysis</h3>
            </div>
            <div className="space-y-3 md:space-y-4">
              {[
                { title: 'Playing Style Match', badge: '96% Match', badgeColor: 'bg-green-500', desc: 'Possession-based style aligns perfectly with your program\'s philosophy. Excels in quick passing combinations.' },
                { title: 'Formation Versatility', badge: 'High', badgeColor: 'bg-blue-500', desc: 'Can play multiple positions: CAM, LW, RW. Provides tactical flexibility for different opponents.' },
                { title: 'Cultural Fit', badge: 'Excellent', badgeColor: 'bg-green-500', desc: 'Mature, team-first mentality. Strong English proficiency. Has experience training with international coaches.' },
                { title: 'Immediate Impact Potential', badge: 'Very High', badgeColor: 'bg-[#FF5722]', desc: 'Physical maturity and technical ability suggest immediate contribution as freshman. Could start or rotate heavily.' }
              ].map((item, idx) => (
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

          {/* Recruiting Recommendation */}
          <Card className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">AI Recruiting Recommendation</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-sm md:text-base text-gray-700 mb-2">
                    <strong>PRIORITY RECRUIT - HIGHLY RECOMMENDED</strong>
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    {selectedAthlete.name} represents an exceptional recruiting opportunity that aligns with 96% of your program's criteria. 
                    The combination of elite technical skills, strong academics, international experience, and cultural fit makes this a <strong>low-risk, high-reward prospect</strong>.
                  </p>
                </div>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-xl">
                <p className="text-xs md:text-sm mb-2"><strong>Recommended Next Steps:</strong></p>
                <ol className="text-xs md:text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Schedule 1-on-1 Zoom call within next 7 days</li>
                  <li>Extend summer camp invitation (3 camps recommended)</li>
                  <li>Coordinate official campus visit for Fall 2025</li>
                  <li>Begin scholarship offer discussion (estimated value: 60-80%)</li>
                  <li>Maintain weekly communication through recruiting process</li>
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

          {/* Comparison to Current Roster */}
          <Card className="p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <LineChart className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">Comparison vs. Current Roster Average</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Technical Ability', average: 73, athlete: 97, diff: '+24%' },
                { label: 'Athletic Ability', average: 78, athlete: 94, diff: '+16%' },
                { label: 'Game IQ', average: 75, athlete: 94, diff: '+19%' }
              ].map((comp, idx) => (
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
                    <span className="text-green-600">{selectedAthlete.name}: {comp.athlete}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Video Analysis */}
          <Card className="p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Video className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
              </div>
              <h3 className="text-[#001F3F] text-base md:text-xl">Video Analysis Highlights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-gray-50 p-3 md:p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-4 h-4 md:w-5 md:h-5 text-[#2196F3]" />
                  <span className="text-xs md:text-sm">Championship Performance</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">2 goals, 1 assist in title game. Exceptional under pressure.</p>
                <Button size="sm" variant="outline" className="w-full rounded-xl text-xs">
                  <Play className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Watch Highlights
                </Button>
              </div>
              <div className="bg-gray-50 p-3 md:p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-4 h-4 md:w-5 md:h-5 text-[#2196F3]" />
                  <span className="text-xs md:text-sm">Skills Compilation</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">Technical ability showcase - ball control & dribbling.</p>
                <Button size="sm" variant="outline" className="w-full rounded-xl text-xs">
                  <Play className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Watch Highlights
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}