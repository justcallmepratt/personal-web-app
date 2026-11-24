import { useState } from 'react';
import { AthleteOnboarding } from './components/AthleteOnboarding';
import { AthleteApp } from './components/AthleteApp';
import { AthletePayment } from './components/AthletePayment';
import { RecruiterApp } from './components/RecruiterApp';
import { RecruiterSignup } from './components/RecruiterSignup';
import { Button } from './components/ui/button';
import { Rocket, Users, TrendingUp, Globe, Check, Star, Video, Shield, MessageSquare, Award, Target, Clock, DollarSign, BookOpen, BarChart, Zap, Heart, MapPin, ChevronDown, Eye, Scan, Sparkles, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { School } from 'lucide-react';
import athlinkLogo from 'figma:asset/2dea44558ee75ccc34db0ab7f1dff6684b053f54.png';

export default function App() {
  const [view, setView] = useState<'select' | 'athlete-onboarding' | 'athlete-payment' | 'athlete-app' | 'recruiter-signup' | 'recruiter-app'>('select');
  const [athleteProfile, setAthleteProfile] = useState<any>(null);

  const handleAthleteOnboardingComplete = (profile: any) => {
    setAthleteProfile(profile);
    setView('athlete-app');
  };

  const handleAthletePaymentComplete = () => {
    setView('athlete-app');
  };

  const handleRecruiterComplete = () => {
    setView('recruiter-app');
  };

  if (view === 'select') {
    return (
      <div className="min-h-screen bg-white">
        {/* Top Announcement Bar */}
        <div className="bg-gradient-to-r from-[#2196F3] to-[#00BCD4] text-white py-2.5">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>12,000+ Athletes</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <School className="w-4 h-4" />
                <span>500+ Partner Schools</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>87 Countries</span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>First 3 Months Free for Athletes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header / Top Bar */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img src={athlinkLogo} className="w-10 h-10 object-contain" alt="Athlink Logo" />
                <div className="hidden md:block">
                  <h1 className="text-gray-900">Athlink</h1>
                  <p className="text-xs text-gray-500">Global Athletic Recruiting</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <a href="#how-it-works" className="text-sm text-gray-700 hover:text-[#2196F3] transition-colors">
                  How It Works
                </a>
                <a href="#features" className="text-sm text-gray-700 hover:text-[#2196F3] transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-sm text-gray-700 hover:text-[#2196F3] transition-colors">
                  Pricing
                </a>
                <a href="#for-coaches" className="text-sm text-gray-700 hover:text-[#2196F3] transition-colors">
                  For Coaches
                </a>
              </nav>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setView('recruiter-signup')}
                  variant="outline"
                  className="hidden sm:flex h-10 px-5 border-[#2196F3] text-[#2196F3] hover:bg-[#2196F3] hover:text-white rounded-lg text-sm"
                >
                  For Coaches
                </Button>
                <Button
                  onClick={() => setView('athlete-onboarding')}
                  className="h-10 px-5 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-lg text-sm"
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#0D47A1] to-[#01579B]" id="home">
          {/* Background Image - Football Field */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1761258772772-4e510721353f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGZpZWxkJTIwZ2FtZSUyMGFjdGlvbnxlbnwxfHx8fDE3NjI3MTAxNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Football field game action"
              className="w-full h-full object-cover opacity-100"
            />
            {/* Minimal overlay gradient on left side only for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00BCD4] rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#2196F3] rounded-full opacity-10 blur-3xl"></div>
          </div>

          <div className="relative max-w-[1600px] mx-auto px-4 py-20">
            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
              <div className="text-white space-y-6">
                {/* Expanded International Badge Section */}
                <div className="bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/40 p-2 rounded-lg backdrop-blur-sm shadow-lg">
                      <Globe className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    <p className="text-white text-lg drop-shadow-lg">International Students Welcome</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇧🇷</span>
                      <span className="text-white ml-2 text-sm">Brazil</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇯🇵</span>
                      <span className="text-white ml-2 text-sm">Japan</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇲🇽</span>
                      <span className="text-white ml-2 text-sm">Mexico</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇩🇪</span>
                      <span className="text-white ml-2 text-sm">Germany</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇨🇦</span>
                      <span className="text-white ml-2 text-sm">Canada</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇦🇺</span>
                      <span className="text-white ml-2 text-sm">Australia</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇬🇧</span>
                      <span className="text-white ml-2 text-sm">UK</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇫🇷</span>
                      <span className="text-white ml-2 text-sm">France</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇪🇸</span>
                      <span className="text-white ml-2 text-sm">Spain</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇮🇳</span>
                      <span className="text-white ml-2 text-sm">India</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇰🇷</span>
                      <span className="text-white ml-2 text-sm">S. Korea</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-2xl">🇨🇳</span>
                      <span className="text-white ml-2 text-sm">China</span>
                    </div>
                    <div className="bg-gradient-to-r from-[#00BCD4]/40 to-[#2196F3]/40 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-[#00BCD4] hover:from-[#00BCD4]/60 hover:to-[#2196F3]/60 transition-all cursor-pointer">
                      <span className="text-white text-sm">+77 More Countries</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-white/90">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00BCD4]" />
                      <span>15+ Languages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00BCD4]" />
                      <span>Local Business Connections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00BCD4]" />
                      <span>GPA Conversion</span>
                    </div>
                  </div>
                </div>

                <h1 className="text-5xl md:text-6xl leading-tight">
                  <span className="text-white font-bold drop-shadow-[0_4px_15px_rgba(0,0,0,1)] [text-shadow:_0_2px_30px_rgb(0_0_0_/_100%)]">From Your Hometown to</span>
                  <span className="block text-[#00BCD4] drop-shadow-[0_4px_15px_rgba(0,0,0,1)] [text-shadow:_0_2px_30px_rgb(0_188_212_/_80%)]">NCAA Division I</span>
                </h1>
                <p className="text-xl text-white max-w-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_20px_rgb(0_0_0_/_80%)]">
                  The #1 platform for international student-athletes. We handle scholarships, recruiting, and local business connections - you focus on playing your best.
                </p>

                {/* International Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div className="bg-black/50 backdrop-blur-md rounded-xl p-4 border-2 border-white/30 shadow-xl">
                    <p className="text-3xl text-[#00BCD4] drop-shadow-[0_2px_10px_rgba(0,188,212,0.8)]">89</p>
                    <p className="text-sm text-white drop-shadow-lg">Countries</p>
                  </div>
                  <div className="bg-black/50 backdrop-blur-md rounded-xl p-4 border-2 border-white/30 shadow-xl">
                    <p className="text-3xl text-[#00BCD4] drop-shadow-[0_2px_10px_rgba(0,188,212,0.8)]">12K+</p>
                    <p className="text-sm text-white drop-shadow-lg">Int'l Athletes</p>
                  </div>
                  <div className="bg-black/50 backdrop-blur-md rounded-xl p-4 border-2 border-white/30 shadow-xl">
                    <p className="text-3xl text-[#00BCD4] drop-shadow-[0_2px_10px_rgba(0,188,212,0.8)]">15+</p>
                    <p className="text-sm text-white drop-shadow-lg">Languages</p>
                  </div>
                </div>
              </div>

              {/* CTA Cards */}
              <div className="space-y-6">
                <Card className="p-8 rounded-3xl bg-white/98 backdrop-blur-md shadow-2xl border-2 border-white/50 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-gradient-to-br from-[#00BCD4] to-[#2196F3] p-4 rounded-2xl">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[#2196F3]">For Athletes</h3>
                        <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white">$9.99/mo</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <p className="text-gray-700">Sports camps & training programs</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <p className="text-gray-700">Multilingual platform (15+ languages)</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <p className="text-gray-700">International credential evaluation</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <p className="text-gray-700">Scholarship matching for int'l students</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setView('athlete-onboarding')}
                    className="w-full h-14 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl shadow-lg"
                  >
                    Get Started Free
                  </Button>
                </Card>

                <Card className="p-8 rounded-3xl bg-white/98 backdrop-blur-md shadow-2xl border-2 border-white/50 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1" id="for-coaches">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] p-4 rounded-2xl">
                      <School className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[#2196F3]">For Coaches & Recruiters</h3>
                        <Badge className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] text-white">$3,000/mo</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#2196F3] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <p className="text-gray-700">Access 12,000+ verified international athletes</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#2196F3] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-700">AI-powered athlete matching & scouting</p>
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#2196F3] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-700">SportsRadar verified statistics & metrics</p>
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#2196F3] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-700">Direct messaging & integrated Zoom calls</p>
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setView('recruiter-signup')}
                    className="w-full h-14 bg-gradient-to-r from-[#2196F3] to-[#1976D2] hover:from-[#1976D2] hover:to-[#1565C0] text-white rounded-xl shadow-lg"
                  >
                    Join as Coach
                  </Button>
                </Card>
              </div>
            </div>

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-8 pt-12 border-t border-white/20">
              <div className="text-center text-white">
                <div className="bg-white/10 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-[#00BCD4]" />
                </div>
                <h4 className="text-white mb-2">Global Reach</h4>
                <p className="text-gray-200 text-sm">Connect with universities across the United States and beyond</p>
              </div>
              <div className="text-center text-white">
                <div className="bg-white/10 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-[#8BC34A]" />
                </div>
                <h4 className="text-white mb-2">Smart Matching</h4>
                <p className="text-gray-200 text-sm">AI-powered system matches athletes with the right programs</p>
              </div>
              <div className="text-center text-white">
                <div className="bg-white/10 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8 text-[#00BCD4]" />
                </div>
                <h4 className="text-white mb-2">Fast Results</h4>
                <p className="text-gray-200 text-sm">Get noticed by recruiters within days of creating your profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sports Gallery Showcase */}
        <div className="bg-white py-16" id="features">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white border-0 px-4 py-2 mb-4">
                All Sports Welcome
              </Badge>
              <h2 className="text-[#2196F3] mb-4">Your Sport. Your Journey. Your Future.</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                From soccer to swimming, basketball to track - we connect athletes from every sport with NCAA opportunities
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64">
                <img 
                  src="https://images.unsplash.com/photo-1629977007371-0ba395424741?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBwbGF5ZXIlMjBhY3Rpb258ZW58MXx8fHwxNzYyNjg2MzQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Soccer" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white">⚽ Soccer</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64">
                <img 
                  src="https://images.unsplash.com/photo-1612768875331-0447b960fa40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwcGxheWVyJTIwanVtcGluZ3xlbnwxfHx8fDE3NjI2MTc5NDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Basketball" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white">🏀 Basketball</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64">
                <img 
                  src="https://images.unsplash.com/photo-1691675996849-78a298efe96a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwcnVubmluZyUyMHRyYWNrfGVufDF8fHx8MTc2MjYwMjUzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Track & Field" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white">🏃 Track & Field</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64">
                <img 
                  src="https://images.unsplash.com/photo-1599509055064-8a742910930a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2xsZXliYWxsJTIwcGxheWVyfGVufDF8fHx8MTc2MjcwNjc0N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Volleyball" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white">🏐 Volleyball</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64">
                <img 
                  src="https://images.unsplash.com/photo-1761286753856-2f39b4413c1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW5uaXMlMjBwbGF5ZXIlMjBhY3Rpb258ZW58MXx8fHwxNzYyNjMyOTM4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Tennis" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white">🎾 Tennis</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64">
                <img 
                  src="https://images.unsplash.com/photo-1700776708892-42fd7aaff85d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHBsYXllciUyMGdhbWV8ZW58MXx8fHwxNzYyNzA2NzQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Football" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white">🏈 Football</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64">
                <img 
                  src="https://images.unsplash.com/photo-1650409905754-8360b38a34ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2ltbWluZyUyMGF0aGxldGV8ZW58MXx8fHwxNzYyNjIyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Swimming" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white">🏊 Swimming</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-64 bg-gradient-to-br from-[#2196F3] to-[#00BCD4] flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <p className="text-4xl mb-2">+20</p>
                  <p className="text-sm">More Sports</p>
                  <p className="text-xs mt-2 opacity-80">Baseball, Lacrosse, Golf & More</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] py-20" id="how-it-works">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-[#00BCD4]/20 text-[#00BCD4] border-0 px-4 py-2 mb-4">
                Simple Process
              </Badge>
              <h2 className="text-[#00BCD4] mb-4">How Athlink Works</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Get started in minutes and connect with your dream school in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="p-8 rounded-2xl bg-white/95 border-2 border-[#00BCD4]/30 hover:border-[#00BCD4] transition-all hover:shadow-xl">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-xl">1</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Create Your Profile</h3>
                <p className="text-gray-700 mb-4">
                  Build a comprehensive athletic profile with your stats, highlight videos, academic records, and achievements in just minutes.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0" />
                    Upload unlimited videos
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0" />
                    Add performance metrics
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0" />
                    Showcase academic excellence
                  </li>
                </ul>
              </Card>

              <Card className="p-8 rounded-2xl bg-white/95 border-2 border-[#00BCD4]/30 hover:border-[#00BCD4] transition-all hover:shadow-xl">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-xl">2</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Get Matched</h3>
                <p className="text-gray-700 mb-4">
                  Our AI-powered system analyzes your profile and matches you with NCAA programs that fit your skills, academics, and goals.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0" />
                    Smart AI recommendations
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0" />
                    Personalized fit scores
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0" />
                    Real-time opportunities
                  </li>
                </ul>
              </Card>

              <Card className="p-8 rounded-2xl bg-white/95 border-2 border-[#2196F3]/30 hover:border-[#2196F3] transition-all hover:shadow-xl">
                <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-xl">3</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Connect & Sign</h3>
                <p className="text-gray-700 mb-4">
                  Communicate directly with coaches, schedule visits, and receive scholarship offers through our secure messaging platform.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0" />
                    Direct coach messaging
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0" />
                    Virtual campus tours
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0" />
                    Scholarship tracking
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>

        {/* International Student Support Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 py-20">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white border-0 px-4 py-2 mb-4">
                <Globe className="w-4 h-4 mr-2" />
                Built for International Students
              </Badge>
              <h2 className="text-[#2196F3] mb-4">Your Complete International Support System</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                We understand the unique challenges international student-athletes face. That's why we built specialized tools and support to make your journey seamless.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-8 rounded-2xl hover:shadow-xl transition-all border-2 border-[#00BCD4]/20 hover:border-[#00BCD4]">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl">⚽</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Sports Camps & Training</h3>
                <p className="text-gray-700 mb-4">
                  Access elite summer camps, showcase events, and training programs at top NCAA universities.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    D1 university summer camps
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    Elite showcase tournaments
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    Specialized training programs
                  </li>
                </ul>
              </Card>

              <Card className="p-8 rounded-2xl hover:shadow-xl transition-all border-2 border-[#2196F3]/20 hover:border-[#2196F3]">
                <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl">🌍</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Multilingual Platform</h3>
                <p className="text-gray-700 mb-4">
                  Communicate with coaches in your native language with real-time translation support.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    15+ language support
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    AI-powered message translation
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    Native language customer support
                  </li>
                </ul>
              </Card>

              <Card className="p-8 rounded-2xl hover:shadow-xl transition-all border-2 border-[#00BCD4]/20 hover:border-[#00BCD4]">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Academic Credentials</h3>
                <p className="text-gray-700 mb-4">
                  We evaluate international transcripts and convert grades to US GPA standards.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    GPA conversion assistance
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    NCAA eligibility verification
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    TOEFL/SAT guidance
                  </li>
                </ul>
              </Card>

              <Card className="p-8 rounded-2xl hover:shadow-xl transition-all border-2 border-[#2196F3]/20 hover:border-[#2196F3]">
                <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl">💰</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Scholarship Support</h3>
                <p className="text-gray-700 mb-4">
                  Specialized assistance for international student scholarship applications and financial aid.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    International scholarship database
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    Financial aid application help
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    Cost-of-living calculators
                  </li>
                </ul>
              </Card>

              <Card className="p-8 rounded-2xl hover:shadow-xl transition-all border-2 border-[#00BCD4]/20 hover:border-[#00BCD4]">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl">🏡</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Cultural Integration</h3>
                <p className="text-gray-700 mb-4">
                  Connect with other international athletes and access resources to adapt to life in the USA.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    International student community
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    US culture & lifestyle guides
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00BCD4] mr-2 flex-shrink-0 mt-0.5" />
                    Mentorship from alumni
                  </li>
                </ul>
              </Card>

              <Card className="p-8 rounded-2xl hover:shadow-xl transition-all border-2 border-[#2196F3]/20 hover:border-[#2196F3]">
                <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl">💳</span>
                </div>
                <h3 className="text-[#2196F3] mb-3">Global Payment Options</h3>
                <p className="text-gray-700 mb-4">
                  Pay easily from anywhere in the world with international payment methods.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    International credit/debit cards
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    Multiple currency support
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#2196F3] mr-2 flex-shrink-0 mt-0.5" />
                    Transparent pricing (no hidden fees)
                  </li>
                </ul>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Card className="p-8 rounded-2xl bg-gradient-to-br from-[#00BCD4]/10 to-[#2196F3]/10 border-2 border-[#2196F3]/30 max-w-3xl mx-auto">
                <h3 className="text-[#2196F3] mb-3">24/7 International Support Team</h3>
                <p className="text-gray-700 mb-4">
                  Our dedicated team understands the challenges of international recruiting because we've been there. Get support in your timezone, in your language.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Average response time: 2 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Support in 15+ languages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Global coverage 24/7</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* AI/AR Technology Section */}
        <div className="bg-white py-20" id="features">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white border-0 px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Cutting-Edge Technology
              </Badge>
              <h2 className="text-[#2196F3] mb-4">AI/AR Verified Measurements</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                First platform to use artificial intelligence and augmented reality to verify athlete measurements and performance metrics
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Computer Vision */}
              <Card className="p-8 rounded-2xl shadow-xl border-2 border-[#00BCD4]/20 hover:border-[#00BCD4] transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] p-3 rounded-xl">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[#2196F3] mb-2">AI Computer Vision</h3>
                    <p className="text-gray-600 text-sm">
                      Advanced machine learning analyzes video footage to verify athletic performance
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00BCD4] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800">Frame-by-frame movement analysis</p>
                      <p className="text-xs text-gray-500">AI evaluates technique, speed, and agility in real-time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00BCD4] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800">Automatic stat calculation</p>
                      <p className="text-xs text-gray-500">Extracts performance metrics from game footage</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00BCD4] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800">Fraud detection</p>
                      <p className="text-xs text-gray-500">Identifies manipulated or misleading videos</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-[#00BCD4]/10 rounded-xl border border-[#00BCD4]/20">
                  <p className="text-xs text-gray-700">
                    <strong>Trained on 500K+ athlete videos</strong> across all major sports
                  </p>
                </div>
              </Card>

              {/* AR Measurements */}
              <Card className="p-8 rounded-2xl shadow-xl border-2 border-[#2196F3]/20 hover:border-[#2196F3] transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] p-3 rounded-xl">
                    <Scan className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[#2196F3] mb-2">AR Body Scanning</h3>
                    <p className="text-gray-600 text-sm">
                      Mobile augmented reality technology captures precise physical measurements
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#2196F3] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800">±0.5" accuracy guarantee</p>
                      <p className="text-xs text-gray-500">Height, wingspan, standing reach verified to NCAA standards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#2196F3] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800">3D body mapping</p>
                      <p className="text-xs text-gray-500">Creates comprehensive physical profile using LiDAR technology</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#2196F3] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800">Instant verification</p>
                      <p className="text-xs text-gray-500">No need for expensive combine testing or in-person measurements</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-[#2196F3]/10 rounded-xl border border-[#2196F3]/20">
                  <p className="text-xs text-gray-700">
                    <strong>Works on any smartphone</strong> with AR capability (iOS 12+ / Android 9+)
                  </p>
                </div>
              </Card>
            </div>

            {/* SportsRadar Integration */}
            <Card className="p-8 rounded-2xl shadow-xl bg-gradient-to-br from-[#00BCD4]/10 to-[#2196F3]/10 border-2 border-[#2196F3]/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#2196F3] to-[#00BCD4] p-3 rounded-xl">
                    <BarChart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[#2196F3] mb-1">SportsRadar API Integration</h3>
                    <p className="text-gray-600 text-sm">
                      Official partnership with SportsRadar for real-time verified statistics and performance data
                    </p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-[#2196F3] to-[#00BCD4] text-white border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified Partner
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl border border-[#2196F3]/20">
                  <div className="text-3xl text-[#2196F3] mb-2">100%</div>
                  <p className="text-sm text-gray-700">Stat Verification Rate</p>
                  <p className="text-xs text-gray-500 mt-1">All stats cross-referenced with SportsRadar API database</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#00BCD4]/20">
                  <div className="text-3xl text-[#00BCD4] mb-2">35K+</div>
                  <p className="text-sm text-gray-700">Data Sources</p>
                  <p className="text-xs text-gray-500 mt-1">Connected to SportsRadar's global sports network</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#2196F3]/20">
                  <div className="text-3xl text-[#2196F3] mb-2">Real-time</div>
                  <p className="text-sm text-gray-700">Stat Updates</p>
                  <p className="text-xs text-gray-500 mt-1">Automatic sync with SportsRadar live game data</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/70 rounded-xl border border-[#2196F3]/30">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#2196F3] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <strong>Why it matters:</strong> Coaches can trust that all statistics are verified by SportsRadar, the world's leading sports data and content provider. No more inflated stats or unverified claims – every number is backed by official game records and real-time API data from 35,000+ global sources.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Platform Features Section */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-[#00BCD4]/20 text-[#00BCD4] border-0 px-4 py-2 mb-4">
                <Zap className="w-4 h-4 mr-2" />
                Powerful Features
              </Badge>
              <h2 className="text-[#2196F3] mb-4">Everything You Need to Succeed</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Comprehensive tools designed specifically for international student-athletes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-[#2196F3]/20 relative">
                <div className="absolute top-4 right-4">
                  <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                </div>
                <div className="bg-[#2196F3]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-[#2196F3]" />
                </div>
                <h4 className="text-[#2196F3] mb-2 flex items-center gap-2">
                  Video Showcase
                  <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-white text-xs px-2 py-0.5">Premium</Badge>
                </h4>
                <p className="text-sm text-gray-600">
                  Upload unlimited highlight reels, game footage, and training videos
                </p>
              </Card>

              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-[#00BCD4]/20 relative">
                <div className="absolute top-4 right-4">
                  <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                </div>
                <div className="bg-[#00BCD4]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <BarChart className="w-6 h-6 text-[#00BCD4]" />
                </div>
                <h4 className="text-[#2196F3] mb-2 flex items-center gap-2">
                  Performance Analytics
                  <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-white text-xs px-2 py-0.5">Premium</Badge>
                </h4>
                <p className="text-sm text-gray-600">
                  Track your stats and see how you compare to other athletes
                </p>
              </Card>

              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow">
                <div className="bg-[#2196F3]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-[#2196F3]" />
                </div>
                <h4 className="text-[#2196F3] mb-2">Multilingual Messaging</h4>
                <p className="text-sm text-gray-600">
                  Chat with coaches in 15+ languages with real-time translation
                </p>
              </Card>

              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow">
                <div className="bg-[#00BCD4]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#00BCD4]" />
                </div>
                <h4 className="text-[#2196F3] mb-2">NCAA Compliance</h4>
                <p className="text-sm text-gray-600">
                  Stay compliant with all NCAA recruiting regulations
                </p>
              </Card>

              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-[#2196F3]/20 relative">
                <div className="absolute top-4 right-4">
                  <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                </div>
                <div className="bg-[#2196F3]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[#2196F3]" />
                </div>
                <h4 className="text-[#2196F3] mb-2 flex items-center gap-2">
                  Smart Matching
                  <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-white text-xs px-2 py-0.5">Premium</Badge>
                </h4>
                <p className="text-sm text-gray-600">
                  AI finds the best program fit based on your profile
                </p>
              </Card>

              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow">
                <div className="bg-[#00BCD4]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[#00BCD4]" />
                </div>
                <h4 className="text-[#2196F3] mb-2">International Credentials</h4>
                <p className="text-sm text-gray-600">
                  GPA conversion, TOEFL/SAT help, and NCAA eligibility support
                </p>
              </Card>

              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow">
                <div className="bg-[#2196F3]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-[#2196F3]" />
                </div>
                <h4 className="text-[#2196F3] mb-2">24/7 Access</h4>
                <p className="text-sm text-gray-600">
                  Manage your recruiting journey anytime, anywhere
                </p>
              </Card>

              <Card className="p-6 rounded-2xl hover:shadow-xl transition-shadow">
                <div className="bg-[#2196F3]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[#2196F3]" />
                </div>
                <h4 className="text-[#2196F3] mb-2">Instant Notifications</h4>
                <p className="text-sm text-gray-600">
                  Get alerts when coaches view your profile or send messages
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Success Stories Section */}
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] py-20" id="success-stories">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-[#00BCD4]/20 text-[#00BCD4] border-0 px-4 py-2 mb-4">
                <Heart className="w-4 h-4 mr-2" />
                Success Stories
              </Badge>
              <h2 className="text-[#00BCD4] mb-4">Athletes Living Their Dreams</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Join thousands of international athletes who found their perfect college fit through Athlink
              </p>
            </div>

            {/* Featured Success Image */}
            <div className="relative rounded-3xl overflow-hidden mb-16 max-w-5xl mx-auto">
              <img 
                src="https://images.unsplash.com/photo-1714962962355-1035a90cb7d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwYXRobGV0ZXMlMjBjZWxlYnJhdGluZ3xlbnwxfHx8fDE3NjI3MDY3NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Athletes celebrating success"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-8">
                <div className="text-white">
                  <p className="text-3xl mb-2">Your Journey Starts Here</p>
                  <p className="text-gray-200">Join 12,000+ international athletes achieving their NCAA dreams</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2196F3] to-[#1976D2] rounded-full flex items-center justify-center text-white text-xl">
                    LS
                  </div>
                  <div>
                    <p className="text-[#2196F3]">Lucas Senna</p>
                    <p className="text-sm text-gray-600">Soccer • Brazil → UCLA</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-5 h-5 fill-[#00BCD4] text-[#00BCD4]" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "Coming from Brazil, I was nervous about the recruiting process. Athlink's scholarship support and Portuguese translation made everything easy. Connected with UCLA in 2 weeks!"
                </p>
                <Badge className="bg-green-500 text-white">Full Scholarship</Badge>
              </Card>

              <Card className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] rounded-full flex items-center justify-center text-white text-xl">
                    YT
                  </div>
                  <div>
                    <p className="text-[#2196F3]">Yuki Tanaka</p>
                    <p className="text-sm text-gray-600">Basketball • Japan → Stanford</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-5 h-5 fill-[#2196F3] text-[#2196F3]" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "As an international student from Japan, the GPA conversion and TOEFL guidance were crucial. The Japanese-language support made me feel comfortable throughout the entire process!"
                </p>
                <Badge className="bg-green-500 text-white">Academic + Athletic Scholarship</Badge>
              </Card>

              <Card className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2196F3] to-[#1976D2] rounded-full flex items-center justify-center text-white text-xl">
                    AS
                  </div>
                  <div>
                    <p className="text-[#2196F3]">Ana Senna</p>
                    <p className="text-sm text-gray-600">Volleyball • Brazil → Penn State</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-5 h-5 fill-[#00BCD4] text-[#00BCD4]" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "The international credential evaluation saved me months! They converted my Brazilian transcripts to US GPA and helped with my NCAA eligibility. Received 15 offers!"
                </p>
                <Badge className="bg-green-500 text-white">Multiple Offers</Badge>
              </Card>
            </div>

            {/* Stats Below Success Stories */}
            <div className="mt-16 grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-4xl text-[#00BCD4] mb-2">2,500+</p>
                <p className="text-sm text-gray-300">Scholarship Offers</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-4xl text-[#2196F3] mb-2">96%</p>
                <p className="text-sm text-gray-300">Athlete Satisfaction</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-4xl text-[#00BCD4] mb-2">$45M+</p>
                <p className="text-sm text-gray-300">Total Scholarships</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-4xl text-[#2196F3] mb-2">18 Days</p>
                <p className="text-sm text-gray-300">Avg. Time to Match</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sports Coverage Section */}
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] py-20" id="for-coaches">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-[#00BCD4]/20 text-[#00BCD4] border-0 px-4 py-2 mb-4">
                <Award className="w-4 h-4 mr-2" />
                For NCAA Coaches & Recruiters
              </Badge>
              <h2 className="text-[#00BCD4] mb-4">Recruit Elite International Athletes Across 25+ Sports</h2>
              <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                Access 12,000+ verified international student-athletes from 89 countries. AI-verified measurements, SportsRadar statistics, and comprehensive athlete profiles – all in one platform for $3,000/month.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { name: 'Soccer', emoji: '⚽' },
                { name: 'Basketball', emoji: '🏀' },
                { name: 'Volleyball', emoji: '🏐' },
                { name: 'Baseball', emoji: '⚾' },
                { name: 'Track & Field', emoji: '🏃' },
                { name: 'Swimming', emoji: '🏊' },
                { name: 'Tennis', emoji: '🎾' },
                { name: 'Golf', emoji: '⛳' },
                { name: 'Softball', emoji: '🥎' },
                { name: 'Lacrosse', emoji: '🥍' },
                { name: 'Wrestling', emoji: '🤼' },
                { name: 'Gymnastics', emoji: '🤸' },
                { name: 'Cross Country', emoji: '🏃' },
                { name: 'Rowing', emoji: '🚣' },
                { name: 'Field Hockey', emoji: '🏑' },
                { name: 'Ice Hockey', emoji: '🏒' },
                { name: 'Football', emoji: '🏈' },
                { name: 'Water Polo', emoji: '🤽' },
                { name: 'Fencing', emoji: '🤺' },
                { name: 'Skiing', emoji: '⛷️' }
              ].map((sport, index) => (
                <Card 
                  key={sport.name} 
                  className={`p-6 rounded-2xl text-center border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                    index % 2 === 0 
                      ? 'bg-gradient-to-br from-[#00BCD4]/10 to-[#00BCD4]/5 border-[#00BCD4]/30 hover:border-[#00BCD4]' 
                      : 'bg-gradient-to-br from-[#2196F3]/10 to-[#2196F3]/5 border-[#2196F3]/30 hover:border-[#2196F3]'
                  }`}
                >
                  <div className="text-4xl mb-3">{sport.emoji}</div>
                  <p className={`text-sm ${
                    index % 2 === 0 
                      ? 'text-[#00BCD4]' 
                      : 'text-[#2196F3]'
                  }`}>
                    {sport.name}
                  </p>
                </Card>
              ))}
            </div>

            {/* Additional Sports Info */}
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              <Card className="p-8 rounded-2xl bg-gradient-to-br from-[#00BCD4]/10 to-[#00BCD4]/5 border-2 border-[#00BCD4]/30 hover:border-[#00BCD4] transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-[#00BCD4] w-12 h-12 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-[#00BCD4]">Global Talent Pool</h4>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Access 12,000+ athletes from 89 countries competing in international leagues, national teams, and elite academies worldwide
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#00BCD4] mr-2" />
                    International league players
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#00BCD4] mr-2" />
                    National team members
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#00BCD4] mr-2" />
                    Elite academy graduates
                  </div>
                </div>
              </Card>

              <Card className="p-8 rounded-2xl bg-gradient-to-br from-[#2196F3]/10 to-[#2196F3]/5 border-2 border-[#2196F3]/30 hover:border-[#2196F3] transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-[#2196F3] w-12 h-12 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-[#2196F3]">100% Verified Data</h4>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  All athlete statistics and measurements verified through industry-leading technology partners
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#2196F3] mr-2" />
                    SportsRadar API verification
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#2196F3] mr-2" />
                    AI/AR physical measurements
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#2196F3] mr-2" />
                    Academic credential evaluation
                  </div>
                </div>
              </Card>

              <Card className="p-8 rounded-2xl bg-gradient-to-br from-[#00BCD4]/10 to-[#00BCD4]/5 border-2 border-[#00BCD4]/30 hover:border-[#00BCD4] transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-[#00BCD4] w-12 h-12 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-[#00BCD4]">Complete Athlete Profiles</h4>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Access comprehensive athlete data including videos, stats, academics, and direct communication tools
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#00BCD4] mr-2" />
                    Game highlights & footage
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#00BCD4] mr-2" />
                    Performance analytics
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Check className="w-3 h-3 text-[#00BCD4] mr-2" />
                    Direct messaging & Zoom
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Stats & Impact Section */}
        <div className="bg-white py-20">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-[#00BCD4]/20 text-[#00BCD4] border-0 px-4 py-2 mb-4">
                <BarChart className="w-4 h-4 mr-2" />
                Platform Impact
              </Badge>
              <h2 className="text-[#2196F3] mb-4">Making an Impact</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Real numbers from real athletes achieving their dreams
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 rounded-2xl text-center bg-gradient-to-br from-[#00BCD4]/5 to-[#00BCD4]/10 border-2 border-[#00BCD4]/20 hover:border-[#00BCD4] transition-all hover:shadow-xl">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <School className="w-10 h-10 text-white" />
                </div>
                <p className="text-5xl text-[#00BCD4] mb-3">150+</p>
                <p className="text-gray-800 mb-2">Partner Universities</p>
                <p className="text-sm text-gray-500">Division I, II, III programs across the United States</p>
              </Card>

              <Card className="p-8 rounded-2xl text-center bg-gradient-to-br from-[#2196F3]/5 to-[#2196F3]/10 border-2 border-[#2196F3]/20 hover:border-[#2196F3] transition-all hover:shadow-xl">
                <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <p className="text-5xl text-[#2196F3] mb-3">12,000+</p>
                <p className="text-gray-800 mb-2">Active Athletes</p>
                <p className="text-sm text-gray-500">International student-athletes from 50+ countries</p>
              </Card>

              <Card className="p-8 rounded-2xl text-center bg-gradient-to-br from-[#00BCD4]/5 to-[#00BCD4]/10 border-2 border-[#00BCD4]/20 hover:border-[#00BCD4] transition-all hover:shadow-xl">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#00ACC1] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <p className="text-5xl text-[#00BCD4] mb-3">89%</p>
                <p className="text-gray-800 mb-2">Success Rate</p>
                <p className="text-sm text-gray-500">Athletes placed in NCAA programs successfully</p>
              </Card>
            </div>

            {/* Additional Impact Metrics */}
            <div className="grid md:grid-cols-4 gap-6 mt-12">
              <div className="text-center p-6">
                <p className="text-3xl text-[#2196F3] mb-2">$45M+</p>
                <p className="text-sm text-gray-600">Scholarships Awarded</p>
              </div>
              <div className="text-center p-6">
                <p className="text-3xl text-[#00BCD4] mb-2">25+</p>
                <p className="text-sm text-gray-600">Sports Covered</p>
              </div>
              <div className="text-center p-6">
                <p className="text-3xl text-[#2196F3] mb-2">95%</p>
                <p className="text-sm text-gray-600">Coach Satisfaction</p>
              </div>
              <div className="text-center p-6">
                <p className="text-3xl text-[#00BCD4] mb-2">24/7</p>
                <p className="text-sm text-gray-600">Platform Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] py-20" id="pricing">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-[#00BCD4]/20 text-[#00BCD4] border-0 px-4 py-2 mb-4">
                <DollarSign className="w-4 h-4 mr-2" />
                Simple Pricing
              </Badge>
              <h2 className="text-[#00BCD4] mb-4">Choose Your Plan</h2>
              <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                Transparent pricing with no hidden fees. Start connecting today.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Athlete Plan */}
              <Card className="p-10 rounded-3xl bg-gradient-to-br from-[#00BCD4]/10 to-[#2196F3]/10 border-2 border-[#00BCD4]/30 hover:border-[#00BCD4] transition-all hover:shadow-2xl hover:shadow-[#00BCD4]/20 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#00BCD4]/20 to-transparent rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-[#00BCD4] to-[#2196F3] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00BCD4]/50">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-[#00BCD4] mb-3">For Athletes</h3>
                    <div className="flex items-baseline justify-center gap-2 mb-3">
                      <span className="text-6xl text-white">$9.99</span>
                      <span className="text-gray-400 text-lg">/month</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-0 px-4 py-1.5">
                      <Sparkles className="w-3 h-3 mr-1.5 inline" />
                      First 3 months free
                    </Badge>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#00BCD4] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#00BCD4]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Create detailed athlete profile with stats & videos</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#00BCD4] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#00BCD4]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Connect with NCAA coaches & recruiters</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#00BCD4] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#00BCD4]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">AI/AR verified physical measurements</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#00BCD4] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#00BCD4]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Scholarship matching & recommendations</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#00BCD4] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#00BCD4]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Access to sports camps & training programs</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#00BCD4] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#00BCD4]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Multilingual support (15+ languages)</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setView('athlete-onboarding')}
                    className="w-full h-14 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl shadow-lg text-lg group"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>

              {/* Coach/Recruiter Plan */}
              <Card className="p-10 rounded-3xl bg-gradient-to-br from-[#2196F3]/10 to-[#1976D2]/10 border-2 border-[#2196F3]/30 hover:border-[#2196F3] transition-all hover:shadow-2xl hover:shadow-[#2196F3]/20 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[#2196F3]/20 to-transparent rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-[#2196F3] to-[#1976D2] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2196F3]/50">
                      <School className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-[#2196F3] mb-3">For Coaches & Recruiters</h3>
                    <div className="flex items-baseline justify-center gap-2 mb-3">
                      <span className="text-6xl text-white">$3,000</span>
                      <span className="text-gray-400 text-lg">/month</span>
                    </div>
                    <Badge className="bg-[#2196F3]/20 text-[#2196F3] border-0 px-4 py-1.5">
                      <Zap className="w-3 h-3 mr-1.5 inline" />
                      AI Team Fit Analysis: $125
                    </Badge>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#2196F3]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Access 12,000+ verified international athletes</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#2196F3]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-300">AI-powered athlete matching & scouting</p>
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700] flex-shrink-0" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#2196F3]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-300">SportsRadar verified statistics & metrics</p>
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700] flex-shrink-0" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#2196F3]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-300">Direct messaging & integrated Zoom calls</p>
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700] flex-shrink-0" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#2196F3]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Advanced search filters by sport, position, stats</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-[#2196F3]/30">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-300">Unlimited athlete profile views & video access</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setView('recruiter-signup')}
                    className="w-full h-14 bg-gradient-to-r from-[#2196F3] to-[#1976D2] hover:from-[#1976D2] hover:to-[#1565C0] text-white rounded-xl shadow-lg text-lg group"
                  >
                    <span>Join as Coach</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            </div>

            <div className="mt-12 text-center space-y-4">
              <p className="text-gray-400 text-sm">
                All plans include 24/7 customer support • No hidden fees • Cancel anytime
              </p>
              <div className="flex items-center justify-center gap-6 text-gray-500 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Money-back Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Reach Section */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-gradient-to-r from-[#00BCD4]/10 to-[#2196F3]/10 text-[#2196F3] border-0 px-4 py-2 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                Worldwide Network
              </Badge>
              <h2 className="text-[#2196F3] mb-4">Athletes From Around The Globe</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Our platform connects talent from every corner of the world with opportunities in the United States
              </p>
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-4xl text-[#2196F3] mb-1">12,000+</p>
                  <p className="text-sm text-gray-600">Total Athletes</p>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-4xl text-[#00BCD4] mb-1">850+</p>
                  <p className="text-sm text-gray-600">New Sign-ups This Month</p>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-4xl text-[#2196F3] mb-1">89</p>
                  <p className="text-sm text-gray-600">Countries</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { country: 'Brazil', flag: '🇧🇷', count: '3,200+', signups: '215' },
                { country: 'Japan', flag: '🇯🇵', count: '1,800+', signups: '142' },
                { country: 'Mexico', flag: '🇲🇽', count: '1,500+', signups: '128' },
                { country: 'Germany', flag: '🇩🇪', count: '1,200+', signups: '95' },
                { country: 'Canada', flag: '🇨🇦', count: '2,100+', signups: '167' },
                { country: 'Australia', flag: '🇦🇺', count: '900+', signups: '73' }
              ].map((item) => (
                <Card key={item.country} className="p-6 rounded-2xl text-center hover:shadow-xl transition-shadow border-2 border-[#2196F3]/10 hover:border-[#00BCD4]/30">
                  <div className="text-5xl mb-3">{item.flag}</div>
                  <p className="text-[#2196F3] mb-1">{item.country}</p>
                  <p className="text-2xl text-[#2196F3] mb-1">{item.count}</p>
                  <p className="text-xs text-gray-500 mb-2">Total Athletes</p>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-[#00BCD4] mb-0.5">+{item.signups}</p>
                    <p className="text-xs text-gray-500">This Month</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-gradient-to-br from-[#006064] via-[#004D40] to-[#00251A] py-24 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-20 w-96 h-96 bg-[#00BCD4] rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#2196F3] rounded-full opacity-10 blur-3xl"></div>
          </div>

          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <Badge className="bg-[#00BCD4]/20 text-[#00BCD4] border-0 px-6 py-2 mb-6">
              <Rocket className="w-4 h-4 mr-2" />
              Join 12,000+ Athletes Worldwide
            </Badge>

            <h2 className="text-white text-4xl md:text-6xl mb-6 leading-tight">
              Your Dream of Playing in the
              <span className="block text-[#00BCD4]">USA Starts Here</span>
            </h2>
            
            <p className="text-gray-200 text-xl mb-4 max-w-2xl mx-auto">
              Join 12,000+ international student-athletes from 89 countries already on their journey to NCAA programs.
            </p>
            <p className="text-[#00BCD4] text-2xl mb-12">
              We speak your language. We understand your journey.
            </p>

            {/* Stats Banner */}
            <div className="grid grid-cols-3 gap-8 mb-12 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-3xl text-[#00BCD4] mb-1">89</p>
                <p className="text-sm text-gray-200">Countries Represented</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-3xl text-[#00BCD4] mb-1">15+</p>
                <p className="text-sm text-gray-200">Languages Supported</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-3xl text-[#00BCD4] mb-1">$45M+</p>
                <p className="text-sm text-gray-200">Scholarships Awarded</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => setView('athlete-onboarding')}
                className="h-16 px-12 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl text-lg shadow-2xl"
              >
                <Rocket className="w-6 h-6 mr-2" />
                Get Started Free
              </Button>
              <Button
                onClick={() => setView('recruiter-signup')}
                variant="outline"
                className="h-16 px-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 rounded-xl text-lg"
              >
                <School className="w-6 h-6 mr-2" />
                Join as Coach
              </Button>
            </div>

            <div className="flex items-center justify-center text-white/90">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm">First 3 Months Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'athlete-onboarding' && !athleteProfile) {
    return <AthleteOnboarding onComplete={handleAthleteOnboardingComplete} onBack={() => setView('select')} />;
  }

  if (view === 'athlete-payment') {
    return <AthletePayment onComplete={handleAthletePaymentComplete} onBack={() => setView('athlete-onboarding')} />;
  }

  if (view === 'athlete-app') {
    return <AthleteApp profile={athleteProfile} onBack={() => setView('select')} />;
  }

  if (view === 'recruiter-signup') {
    return <RecruiterSignup onComplete={handleRecruiterComplete} onBack={() => setView('select')} />;
  }

  if (view === 'recruiter-app') {
    return <RecruiterApp onBack={() => setView('select')} />;
  }

  return null;
}