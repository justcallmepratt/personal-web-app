import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, FileText, Heart, Send } from 'lucide-react';

interface AthletePDFReportProps {
  athlete: any;
  onBack: () => void;
}

export function AthletePDFReport({ athlete, onBack }: AthletePDFReportProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* PDF-Style Document */}
      <Card className="p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* PDF Header */}
        <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Reports
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl">
                <FileText className="w-5 h-5 mr-2" />
                Export PDF
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl">
                Print
              </Button>
            </div>
          </div>
          <div className="text-center py-8 border-t border-b border-white/20">
            <p className="text-sm text-gray-200 mb-3 tracking-wider">ATHLINK™ AI SCOUTING REPORT</p>
            <h1 className="text-4xl mb-3">{athlete.name}</h1>
            <p className="text-xl text-gray-100 mb-2">{athlete.sport} • {athlete.position}</p>
            <p className="text-sm text-gray-200">{athlete.school}, {athlete.country}</p>
          </div>
          <div className="grid grid-cols-4 gap-6 mt-8">
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur">
              <p className="text-gray-200 text-xs mb-2 tracking-wide">AI SCORE</p>
              <p className="text-3xl text-[#FF5722]">{athlete.aiScore}</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur">
              <p className="text-gray-200 text-xs mb-2 tracking-wide">CLASS</p>
              <p className="text-3xl">{athlete.yearOfGraduation}</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur">
              <p className="text-gray-200 text-xs mb-2 tracking-wide">GPA (US Equivalent)</p>
              <p className="text-3xl">{athlete.gpa}</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur">
              <p className="text-gray-200 text-xs mb-2 tracking-wide">MATCH</p>
              <p className="text-3xl">{athlete.matchRate}%</p>
            </div>
          </div>
        </div>

        {/* PDF Document Body */}
        <div className="bg-white p-12">
          {/* Report Metadata */}
          <div className="flex items-center justify-between pb-6 mb-8 border-b-2 border-gray-900">
            <div>
              <p className="text-xs text-gray-500 tracking-wide">REPORT DATE</p>
              <p className="text-sm mt-1">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 tracking-wide">REPORT ID</p>
              <p className="text-sm mt-1">RP-{athlete.id}-{new Date().getFullYear()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 tracking-wide">EVALUATOR</p>
              <p className="text-sm mt-1">Rocket AI™ System</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-[#FF5722]"></div>
              <h2 className="text-2xl tracking-tight text-gray-900">EXECUTIVE SUMMARY</h2>
            </div>
            <div className="ml-8">
              <div className="bg-gradient-to-r from-orange-50 via-blue-50 to-orange-50 p-8 rounded-lg border-l-4 border-[#FF5722] shadow-sm">
                <p className="text-gray-700 leading-relaxed mb-6 text-base">{athlete.aiInsights}</p>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-300">
                  <div>
                    <p className="text-xs text-gray-600 mb-2 tracking-wide">DIVISION PROJECTION</p>
                    <Badge className="bg-green-600 text-white px-3 py-1 text-sm">{athlete.projection}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-2 tracking-wide">COMPARABLE PLAYER</p>
                    <p className="text-[#2196F3] text-base">{athlete.comparablePlayer}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Physical Profile */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-[#2196F3]"></div>
              <h2 className="text-2xl tracking-tight text-gray-900">SECTION 1: PHYSICAL PROFILE</h2>
            </div>
            <div className="ml-8">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Height</td>
                    <td className="py-4 text-[#2196F3]">{athlete.height}</td>
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Weight</td>
                    <td className="py-4 text-[#2196F3]">{athlete.weight}</td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Wingspan</td>
                    <td className="py-4 text-[#2196F3]">{athlete.wingspan}</td>
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Dominant Side</td>
                    <td className="py-4 text-[#2196F3]">{athlete.dominantSide}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Jersey Number</td>
                    <td className="py-4 text-[#2196F3]">#{athlete.jerseyNumber}</td>
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Position</td>
                    <td className="py-4 text-[#2196F3]">{athlete.position}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Athletic Testing */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-[#FF5722]"></div>
              <h2 className="text-2xl tracking-tight text-gray-900">SECTION 2: ATHLETIC TESTING RESULTS</h2>
            </div>
            <div className="ml-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Speed & Agility */}
                <div>
                  <h3 className="text-sm tracking-wider text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">SPEED & AGILITY DRILLS</h3>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 text-sm text-gray-600">40-Yard Dash</td>
                        <td className="py-3 text-right text-[#2196F3]">{athlete.fortyYard}</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td className="py-3 text-sm text-gray-600">20-Yard Shuttle</td>
                        <td className="py-3 text-right text-[#2196F3]">{athlete.shuttleRun}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 text-sm text-gray-600">3-Cone Drill</td>
                        <td className="py-3 text-right text-[#2196F3]">{athlete.threeCone}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Power & Explosiveness */}
                <div>
                  <h3 className="text-sm tracking-wider text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">POWER & EXPLOSIVENESS</h3>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 text-sm text-gray-600">Vertical Jump</td>
                        <td className="py-3 text-right text-[#2196F3]">{athlete.verticalJump}</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td className="py-3 text-sm text-gray-600">Standing Jump</td>
                        <td className="py-3 text-right text-[#2196F3]">{athlete.standingJump}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 text-sm text-gray-600">Bench Press</td>
                        <td className="py-3 text-right text-[#2196F3]">{athlete.benchPress}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Athletic Profile Assessment */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-[#2196F3]"></div>
              <h2 className="text-2xl tracking-tight text-gray-900">SECTION 3: ATHLETIC PROFILE ASSESSMENT</h2>
            </div>
            <div className="ml-8">
              <p className="text-sm text-gray-600 mb-6 italic">Ratings are based on position-specific benchmarks and peer comparisons (Scale: 0-100)</p>
              <div className="space-y-5">
                {[
                  { label: 'Speed Rating', value: athlete.speed, color: 'from-[#FF5722] to-[#F4511E]' },
                  { label: 'Strength Rating', value: athlete.strength, color: 'from-[#2196F3] to-[#1976D2]' },
                  { label: 'Agility Rating', value: athlete.agility, color: 'from-[#FF5722] to-[#F4511E]' },
                  { label: 'Flexibility Score', value: parseInt(athlete.flexibility), color: 'from-[#2196F3] to-[#1976D2]' }
                ].map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 tracking-wide">{metric.label}</span>
                      <span className="text-[#2196F3]">{metric.value}/100</span>
                    </div>
                    <div className="w-full h-6 bg-gray-200 rounded-sm overflow-hidden border border-gray-300">
                      <div 
                        className={`h-full bg-gradient-to-r ${metric.color} transition-all duration-500`}
                        style={{ width: `${metric.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Academic Profile */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-[#FF5722]"></div>
              <h2 className="text-2xl tracking-tight text-gray-900">SECTION 4: ACADEMIC PROFILE & ELIGIBILITY</h2>
            </div>
            <div className="ml-8">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-4 text-sm text-gray-600 tracking-wide w-1/3">Cumulative GPA (US Equivalent)</td>
                    <td className="py-4 text-[#2196F3]">{athlete.gpa}</td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Test Scores</td>
                    <td className="py-4 text-[#2196F3]">{athlete.testScores}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-4 text-sm text-gray-600 tracking-wide">High School</td>
                    <td className="py-4 text-[#2196F3]">{athlete.school}</td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <td className="py-4 text-sm text-gray-600 tracking-wide">Graduation Year</td>
                    <td className="py-4 text-[#2196F3]">{athlete.yearOfGraduation}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-4 text-sm text-gray-600 tracking-wide">NCAA Eligibility Center</td>
                    <td className="py-4">
                      <Badge className="bg-green-600 text-white px-3 py-1">{athlete.eligibilityStatus}</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Performance Statistics */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-[#2196F3]"></div>
              <h2 className="text-2xl tracking-tight text-gray-900">SECTION 5: PERFORMANCE STATISTICS</h2>
            </div>
            <div className="ml-8">
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-300">
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div>
                    <p className="text-xs text-gray-600 mb-2 tracking-wider">GAMES PLAYED (CURRENT SEASON)</p>
                    <p className="text-3xl text-[#2196F3]">{athlete.gamesPlayed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-2 tracking-wider">HIGHLIGHT VIDEOS</p>
                    <p className="text-3xl text-[#2196F3]">{athlete.videoCount}</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-300">
                  <p className="text-xs text-gray-600 mb-3 tracking-wider">SEASON STATISTICS</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{athlete.seasonStats}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Achievements */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-[#FF5722]"></div>
              <h2 className="text-2xl tracking-tight text-gray-900">SECTION 6: HONORS & ACHIEVEMENTS</h2>
            </div>
            <div className="ml-8">
              <div className="bg-gradient-to-r from-orange-50 via-blue-50 to-orange-50 p-8 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">{athlete.achievements}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 mt-10 border-t-2 border-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
              <div>
                <p className="mb-1">Athlink™ AI Scouting Report</p>
                <p>Report ID: ATH-{athlete.id}-{new Date().getFullYear()}</p>
              </div>
              <div className="text-right">
                <p className="mb-1">Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p>Page 1 of 1</p>
              </div>
            </div>
            <div className="p-6 bg-gray-100 rounded text-xs text-gray-600 leading-relaxed">
              <p className="mb-3"><strong>Disclaimer:</strong> This report is generated using Athlink's proprietary AI analysis system. All metrics and ratings are based on submitted video footage, academic records, and comparative analysis with peer athletes. This report is intended for recruiting evaluation purposes only.</p>
              <p>© {new Date().getFullYear()} Athlink. All rights reserved. Confidential and proprietary information.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 pb-8">
        <Button className="flex-1 bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl h-14 text-lg">
          <Heart className="w-5 h-5 mr-2" />
          Match with Athlete
        </Button>
        <Button className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-14 text-lg">
          <Send className="w-5 h-5 mr-2" />
          Send Message
        </Button>
      </div>
    </div>
  );
}
