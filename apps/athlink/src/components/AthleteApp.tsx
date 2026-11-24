import { useState, useEffect } from 'react';
import { Home, Upload, MessageCircle, User, ArrowLeft, Plus, Play, Edit, School, Eye, TrendingUp, Award, DollarSign, Calendar, BookOpen, Activity, Trophy, Target, Dumbbell, GraduationCap, FileText, Clock, MapPin, Video, CheckCircle2, Star, BarChart3, Zap, TrendingDown, Globe, Linkedin, Share2, ExternalLink, Download, Bell, Settings, Search, Filter, Briefcase, Users, LineChart, PieChart, ArrowUpRight, Check, AlertCircle, FileCheck, Package, Lightbulb, PlayCircle, Info, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import athlinkLogo from 'figma:asset/2dea44558ee75ccc34db0ab7f1dff6684b053f54.png';

interface AthleteAppProps {
  profile: any;
  onBack: () => void;
}

const mockVideos = [
  { id: 1, caption: 'State Championship Performance', duration: '45s', thumbnail: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400', views: 234 },
  { id: 2, caption: 'Season Highlights 2024', duration: '60s', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400', views: 512 },
  { id: 3, caption: 'Training Session - Speed & Agility', duration: '38s', thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400', views: 189 },
  { id: 4, caption: 'Championship Final - Game Winning Play', duration: '52s', thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400', views: 421 },
  { id: 5, caption: 'Skills Showcase - Technical Drills', duration: '41s', thumbnail: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400', views: 298 },
];

const mockMatches = [
  { id: 1, name: 'UCLA Bruins', division: 'Division I', interest: 'High', logo: 'https://images.unsplash.com/photo-1562223059-91b2ab891d0d?w=100', message: 'Strong academic fit with excellent athletic program' },
  { id: 2, name: 'Stanford Cardinal', division: 'Division I', interest: 'Medium', logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100', message: 'Impressed by your leadership and stats' },
  { id: 3, name: 'USC Trojans', division: 'Division I', interest: 'High', logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100', message: 'Your skills align perfectly with our program' },
  { id: 4, name: 'University of Michigan', division: 'Division I', interest: 'High', logo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=100', message: 'Excellent academic and athletic profile' },
  { id: 5, name: 'Duke University', division: 'Division I', interest: 'Medium', logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100', message: 'Great potential for our team' },
  { id: 6, name: 'University of Florida', division: 'Division I', interest: 'High', logo: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=100', message: 'Your international background is valuable' },
  { id: 7, name: 'Penn State', division: 'Division I', interest: 'Medium', logo: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=100', message: 'Interested in discussing scholarship opportunities' },
  { id: 8, name: 'University of Texas', division: 'Division I', interest: 'High', logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100', message: 'Outstanding season statistics' },
];

const mockMessages = [
  { 
    id: 1, 
    recruiter: 'Coach Martinez', 
    school: 'UCLA', 
    message: 'Seus highlights são impressionantes! Adoraria conversar sobre nossa equipe.', 
    translation: 'Your highlights are impressive! I would love to talk about our team.',
    language: '🇧🇷 Portuguese',
    time: '2h ago', 
    unread: true, 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' 
  },
  { 
    id: 2, 
    recruiter: 'Coach Tanaka', 
    school: 'Stanford', 
    message: 'あなたの国際的な経験は貴重です。ぜひお話ししましょう。', 
    translation: 'Your international experience is valuable. Let\'s talk soon.',
    language: '🇯🇵 Japanese',
    time: '1d ago', 
    unread: false, 
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100' 
  },
  { 
    id: 3, 
    recruiter: 'Coach Johnson', 
    school: 'USC', 
    message: "I'd love to schedule a call to discuss our program and scholarship opportunities...", 
    translation: null,
    language: '🇺🇸 English',
    time: '2d ago', 
    unread: true, 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' 
  },
  { 
    id: 4, 
    recruiter: 'Coach García', 
    school: 'Michigan', 
    message: 'Tu GPA y puntuaciones son excelentes. ¿Cuándo podemos hablar?', 
    translation: 'Your GPA and scores are excellent. When can we talk?',
    language: '🇪🇸 Spanish',
    time: '3d ago', 
    unread: false, 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' 
  },
  { 
    id: 5, 
    recruiter: 'Coach Dubois', 
    school: 'Duke', 
    message: 'Nous avons un programme solide qui correspond à vos objectifs...', 
    translation: 'We have a strong program that matches your goals...',
    language: '🇫🇷 French',
    time: '4d ago', 
    unread: false, 
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100' 
  },
  { 
    id: 6, 
    recruiter: 'Coach Silva', 
    school: 'Florida', 
    message: 'Sua experiência no campeonato se destaca! Vamos conversar sobre bolsas.', 
    translation: 'Your championship experience stands out! Let\'s talk about scholarships.',
    language: '🇧🇷 Portuguese',
    time: '5d ago', 
    unread: true, 
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' 
  },
];

const mockScholarshipOffers = [
  {
    id: 1,
    school: 'UCLA Bruins',
    logo: 'https://images.unsplash.com/photo-1562223059-91b2ab891d0d?w=100',
    type: 'Full Athletic Scholarship',
    value: '$280,000 (4 years)',
    percentage: '100%',
    deadline: 'Dec 15, 2024',
    status: 'Pending',
    details: 'Full tuition, room & board, books covered',
    coach: 'Coach Martinez'
  },
  {
    id: 2,
    school: 'Stanford Cardinal',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100',
    type: 'Athletic + Academic Scholarship',
    value: '$210,000 (4 years)',
    percentage: '75%',
    deadline: 'Dec 20, 2024',
    status: 'Offer Extended',
    details: '75% athletic + merit aid combination',
    coach: 'Coach Tanaka'
  },
  {
    id: 3,
    school: 'USC Trojans',
    logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100',
    type: 'Partial Athletic Scholarship',
    value: '$140,000 (4 years)',
    percentage: '50%',
    deadline: 'Jan 5, 2025',
    status: 'Under Review',
    details: '50% tuition coverage with financial aid options',
    coach: 'Coach Johnson'
  }
];

const mockTrainingPrograms = [
  {
    id: 1,
    title: 'Speed & Agility Training',
    instructor: 'Coach Williams',
    duration: '8 weeks',
    level: 'Advanced',
    progress: 65,
    nextSession: 'Tomorrow, 6:00 AM',
    description: 'Elite speed development program',
    sessions: 24
  },
  {
    id: 2,
    title: 'Strength & Conditioning',
    instructor: 'Coach Davis',
    duration: '12 weeks',
    level: 'Intermediate',
    progress: 40,
    nextSession: 'Monday, 5:00 PM',
    description: 'Build power and endurance',
    sessions: 36
  },
  {
    id: 3,
    title: 'Technical Skills Workshop',
    instructor: 'Coach Rodriguez',
    duration: '6 weeks',
    level: 'All Levels',
    progress: 85,
    nextSession: 'Friday, 3:30 PM',
    description: 'Position-specific skill development',
    sessions: 18
  }
];

const mockCampusVisits = [
  {
    id: 1,
    school: 'UCLA',
    date: 'Dec 10, 2024',
    time: '10:00 AM PST',
    type: 'Official Visit',
    status: 'Confirmed',
    itinerary: ['Campus tour', 'Meet coaching staff', 'Academic presentation', 'Attend practice'],
    location: 'Los Angeles, CA',
    contact: 'Coach Martinez'
  },
  {
    id: 2,
    school: 'Stanford',
    date: 'Dec 18, 2024',
    time: '9:00 AM PST',
    type: 'Official Visit',
    status: 'Pending Confirmation',
    itinerary: ['Facility tour', 'Academic advisor meeting', 'Team dinner', 'Dorm visit'],
    location: 'Stanford, CA',
    contact: 'Coach Tanaka'
  },
  {
    id: 3,
    school: 'USC',
    date: 'Jan 8, 2025',
    time: '11:00 AM PST',
    type: 'Unofficial Visit',
    status: 'Scheduled',
    itinerary: ['Campus walkthrough', 'Athletic facilities', 'Academic counselor'],
    location: 'Los Angeles, CA',
    contact: 'Coach Johnson'
  }
];

const mockNILOpportunities = [
  {
    id: 1,
    brand: 'Nike',
    type: 'Apparel Endorsement',
    value: '$15,000/year',
    duration: '2 years',
    requirements: ['Social media posts (4/month)', 'Wear Nike gear', '50K+ followers'],
    status: 'Opportunity Available',
    deadline: 'Dec 1, 2024'
  },
  {
    id: 2,
    brand: 'Gatorade',
    type: 'Brand Ambassador',
    value: '$8,000/year',
    duration: '1 year',
    requirements: ['Event appearances (2/year)', 'Content creation', '25K+ followers'],
    status: 'Pre-Qualified',
    deadline: 'Dec 15, 2024'
  },
  {
    id: 3,
    brand: 'Local Sports Store',
    type: 'Social Media Promotion',
    value: '$2,500',
    duration: '6 months',
    requirements: ['Instagram posts (8 total)', 'Store appearance (1)'],
    status: 'Opportunity Available',
    deadline: 'Nov 30, 2024'
  }
];

const mockAcademicProgress = {
  currentGPA: 3.85,
  classRank: '15/342',
  satScore: 1340,
  actScore: 30,
  ncaaEligibility: 'Cleared',
  courses: [
    { name: 'AP Calculus', grade: 'A', credits: 4 },
    { name: 'English Literature', grade: 'A-', credits: 3 },
    { name: 'Physics', grade: 'B+', credits: 4 },
    { name: 'Spanish III', grade: 'A', credits: 3 }
  ]
};

const mockLocalSponsors = [
  {
    id: 1,
    name: 'Tony\'s Pizza & Sports Bar',
    logo: '🍕',
    type: 'Local Business',
    offer: '$500 + Free meals',
    requirements: ['Instagram post (2/month)', 'In-store appearance (1)'],
    location: 'Downtown',
    status: 'Available',
    followers: '5K+ required'
  },
  {
    id: 2,
    name: 'Elite Fitness Gym',
    logo: '💪',
    type: 'Fitness Center',
    offer: 'Free membership + $300/month',
    requirements: ['Gym check-ins (3/week)', 'Story posts (4/month)'],
    location: 'Main Street',
    status: 'Available',
    followers: '2K+ required'
  },
  {
    id: 3,
    name: 'Citywide Car Dealership',
    logo: '🚗',
    type: 'Auto Dealer',
    offer: '$1,200 + Car loan discount',
    requirements: ['Social media campaign', 'Photo shoot at dealership'],
    location: 'Highway 101',
    status: 'Available',
    followers: '10K+ required'
  },
  {
    id: 4,
    name: 'Fresh Smoothie Co.',
    logo: '🥤',
    type: 'Health & Wellness',
    offer: '$400 + Product supply',
    requirements: ['TikTok videos (2/month)', 'Store visits'],
    location: 'University District',
    status: 'Available',
    followers: '3K+ required'
  }
];

const mockTutorials = [
  {
    id: 1,
    title: 'Creating Your First Highlight Reel',
    duration: '8 min',
    category: 'Video Production',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
    views: 12500,
    description: 'Learn the basics of creating an engaging highlight reel that catches coaches\' attention'
  },
  {
    id: 2,
    title: 'Lighting & Camera Angles for Athletes',
    duration: '12 min',
    category: 'Video Production',
    difficulty: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400',
    views: 8300,
    description: 'Professional tips on lighting setup and camera positioning for maximum impact'
  },
  {
    id: 3,
    title: 'Writing the Perfect Athletic Bio',
    duration: '6 min',
    category: 'Profile Building',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
    views: 15200,
    description: 'Craft a compelling bio that tells your story and showcases your strengths'
  },
  {
    id: 4,
    title: 'Video Editing on Mobile: Pro Tips',
    duration: '15 min',
    category: 'Video Production',
    difficulty: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400',
    views: 9800,
    description: 'Edit professional-quality highlight reels right from your smartphone'
  },
  {
    id: 5,
    title: 'What College Coaches Look For',
    duration: '10 min',
    category: 'Recruiting Tips',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
    views: 18900,
    description: 'Inside perspective from D1 coaches on what makes athletes stand out'
  },
  {
    id: 6,
    title: 'Messaging Coaches: Do\'s and Don\'ts',
    duration: '7 min',
    category: 'Communication',
    difficulty: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400',
    views: 14100,
    description: 'Learn how to write effective messages that get responses from coaches'
  }
];

const mockRecruitingChecklist = [
  { id: 1, task: 'Create compelling highlight reel', completed: true, category: 'Video' },
  { id: 2, task: 'Upload transcripts and test scores', completed: true, category: 'Academics' },
  { id: 3, task: 'Complete NCAA Eligibility Center registration', completed: true, category: 'Compliance' },
  { id: 4, task: 'Research 20+ potential schools', completed: false, category: 'Research' },
  { id: 5, task: 'Send intro emails to 15 coaches', completed: false, category: 'Outreach' },
  { id: 6, task: 'Schedule 3 campus visits', completed: false, category: 'Visits' },
  { id: 7, task: 'Request recommendation letters (2-3)', completed: false, category: 'Documents' },
  { id: 8, task: 'Update stats after each game', completed: true, category: 'Performance' },
  { id: 9, task: 'Follow up with interested coaches', completed: false, category: 'Communication' },
  { id: 10, task: 'Apply for athletic scholarships', completed: false, category: 'Financial' }
];

const mockSummerCamps = [
  {
    id: 1,
    school: 'UCLA',
    schoolLogo: 'https://images.unsplash.com/photo-1562223059-91b2ab891d0d?w=100',
    campName: 'Elite Soccer Development Camp',
    coach: 'Coach Martinez',
    dates: 'June 15-20, 2025',
    location: 'Los Angeles, CA',
    cost: 'FREE (Coach Invitation)',
    status: 'Invited',
    description: 'Intensive 5-day camp for top recruits. Includes skills training, scrimmages, and college prep sessions.',
    benefits: ['Free accommodation', 'Meals included', 'College credit workshop', 'Meet current players'],
    deadline: 'Dec 15, 2024'
  },
  {
    id: 2,
    school: 'Stanford',
    schoolLogo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100',
    campName: 'Cardinal Summer Prospect Camp',
    coach: 'Coach Tanaka',
    dates: 'July 8-12, 2025',
    location: 'Stanford, CA',
    cost: 'FREE (Coach Invitation)',
    status: 'Invited',
    description: 'Exclusive camp for identified recruits. Train with D1 coaching staff and tour campus.',
    benefits: ['Position-specific training', 'Academic counseling', 'Campus tour', 'Film session'],
    deadline: 'Dec 20, 2024'
  },
  {
    id: 3,
    school: 'USC',
    schoolLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100',
    campName: 'Trojan Elite Showcase',
    coach: 'Coach Johnson',
    dates: 'June 22-25, 2025',
    location: 'Los Angeles, CA',
    cost: 'FREE (Coach Invitation)',
    status: 'Pending Response',
    description: '4-day showcase camp for high-level recruits with scholarship potential.',
    benefits: ['Scholarship evaluation', 'One-on-one coaching', 'Strength & conditioning', 'NIL education'],
    deadline: 'Jan 5, 2025'
  }
];

export function AthleteApp({ profile, onBack }: AthleteAppProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'messages' | 'profile' | 'scholarships' | 'training' | 'visits' | 'nil' | 'academics' | 'sponsors' | 'tutorials' | 'resources' | 'camps'>('home');
  const [uploadStep, setUploadStep] = useState<'select' | 'details'>('select');
  const [videoCaption, setVideoCaption] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // DISABLED: Show ad popup when switching pages (but not on initial load)
  // useEffect(() => {
  //   if (isInitialLoad) {
  //     setIsInitialLoad(false);
  //     return;
  //   }
  //   setShowAdPopup(true);
  // }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div className="p-6 border-b border-gray-100">
          <button onClick={onBack} className="flex items-center">
            <img src={athlinkLogo} alt="Athlink" className="w-10 h-10 object-contain" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'home' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              setUploadStep('select');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'upload' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'messages' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Messages</span>
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full ml-auto"></div>
          </button>
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'scholarships' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span className="text-sm">Scholarships</span>
            {mockScholarshipOffers.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'scholarships' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>{mockScholarshipOffers.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'training' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-sm">Training</span>
          </button>
          <button
            onClick={() => setActiveTab('nil')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'nil' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">NIL Deals</span>
          </button>
          <button
            onClick={() => setActiveTab('academics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'academics' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm">Academics</span>
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'visits' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Campus Visits</span>
          </button>
          
          <div className="my-6 border-t border-gray-100"></div>
          
          <button
            onClick={() => setActiveTab('tutorials')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'tutorials' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span className="text-sm">Tutorials</span>
          </button>
          <button
            onClick={() => setActiveTab('camps')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'camps' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Summer Camps</span>
          </button>
          
          <div className="my-6 border-t border-gray-100"></div>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'profile' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-sm">Profile</span>
          </button>
        </nav>

        <button onClick={onBack} className="p-6 text-gray-500 hover:text-gray-900 flex items-center gap-2 border-t border-gray-100 text-sm">
          <ArrowLeft className="w-5 h-5" />
          Back to Selection
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:ml-64 pb-20 md:pb-0">
        {/* Pricing Banner */}
        <div className="bg-[#2196F3] text-white py-2 px-4 sticky top-0 z-20">
          <div className="max-w-[1600px] mx-auto text-center">
            <p className="text-xs">
              <Sparkles className="w-3 h-3 inline mr-1" />
              <strong>First 3 months FREE!</strong> Then only $10/month for unlimited uploads, messaging & all features
            </p>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-[#2196F3] text-white p-4 sticky top-8 z-10">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-white flex-1">
              {activeTab === 'home' && 'Dashboard'}
              {activeTab === 'upload' && 'Upload Highlight'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'profile' && 'Profile'}
              {activeTab === 'scholarships' && 'Scholarships'}
              {activeTab === 'training' && 'Training Programs'}
              {activeTab === 'visits' && 'Campus Visits'}
              {activeTab === 'nil' && 'NIL Opportunities'}
              {activeTab === 'academics' && 'Academic Progress'}
              {activeTab === 'sponsors' && 'Local Sponsors'}
              {activeTab === 'tutorials' && 'Video Tutorials'}
              {activeTab === 'resources' && 'Resources'}
              {activeTab === 'camps' && 'Summer Camps'}
            </h2>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block bg-white border-b border-gray-100 sticky top-8 z-10">
          <div className="max-w-[1600px] mx-auto px-8 py-4">
            <h2 className="text-gray-900">
              {activeTab === 'home' && 'Dashboard'}
              {activeTab === 'upload' && 'Upload Highlight'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'profile' && 'Profile'}
              {activeTab === 'scholarships' && 'Scholarships'}
              {activeTab === 'training' && 'Training Programs'}
              {activeTab === 'visits' && 'Campus Visits'}
              {activeTab === 'nil' && 'NIL Opportunities'}
              {activeTab === 'academics' && 'Academic Progress'}
              {activeTab === 'sponsors' && 'Local Sponsors'}
              {activeTab === 'tutorials' && 'Video Tutorials'}
              {activeTab === 'resources' && 'Resources'}
              {activeTab === 'camps' && 'Summer Camps'}
            </h2>
          </div>
        </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-6">
            {/* Welcome Card */}
            <Card className="p-6 bg-white border border-gray-100 rounded-lg">
              <div className="flex items-center mb-6">
                <img 
                  src={profile.profilePicture || 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=100'} 
                  alt={profile.name}
                  className="w-14 h-14 rounded-full object-cover mr-4"
                />
                <div>
                  <h3 className="text-gray-900">{profile.name}</h3>
                  <p className="text-gray-500 text-sm">{profile.sport} • {profile.position}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-2xl text-gray-900">{mockVideos.length}</p>
                  <p className="text-xs text-gray-500">Videos</p>
                </div>
                <div>
                  <p className="text-2xl text-gray-900">{mockMatches.length}</p>
                  <p className="text-xs text-gray-500">Matches</p>
                </div>
                <div>
                  <p className="text-2xl text-gray-900">{profile.gpa || '3.8'}</p>
                  <p className="text-xs text-gray-500">GPA</p>
                </div>
              </div>
            </Card>

            {/* Quick Access */}
            <div>
              <h3 className="text-gray-900 mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className="p-5 rounded-lg hover:shadow-md transition-all cursor-pointer bg-white border border-gray-100 hover:border-[#2196F3]"
                  onClick={() => setActiveTab('scholarships')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2196F3] rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">Scholarships</p>
                      <p className="text-xs text-gray-500">{mockScholarshipOffers.length} Offers</p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className="p-5 rounded-lg hover:shadow-md transition-all cursor-pointer bg-white border border-gray-100 hover:border-[#2196F3]"
                  onClick={() => setActiveTab('training')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00BCD4] rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">Training</p>
                      <p className="text-xs text-gray-500">{mockTrainingPrograms.length} Programs</p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className="p-5 rounded-lg hover:shadow-md transition-all cursor-pointer bg-white border border-gray-100 hover:border-[#2196F3]"
                  onClick={() => setActiveTab('visits')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2196F3] rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">Campus Visits</p>
                      <p className="text-xs text-gray-500">{mockCampusVisits.length} Scheduled</p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className="p-5 rounded-lg hover:shadow-md transition-all cursor-pointer bg-white border border-gray-100 hover:border-[#2196F3]"
                  onClick={() => setActiveTab('nil')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00BCD4] rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">NIL Deals</p>
                      <p className="text-xs text-gray-500">{mockNILOpportunities.length} Opportunities</p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className="p-5 rounded-lg hover:shadow-md transition-all cursor-pointer bg-white border border-gray-100 hover:border-[#2196F3] col-span-2"
                  onClick={() => setActiveTab('academics')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2196F3] rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">Academic Progress</p>
                      <p className="text-xs text-gray-500">{mockAcademicProgress.ncaaEligibility} • Transcript on file</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* My Highlights */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">My Highlights</h3>
                <Button 
                  onClick={() => setActiveTab('upload')}
                  className="bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {mockVideos.map(video => (
                  <Card key={video.id} className="p-0 overflow-hidden rounded-lg border border-gray-100">
                    <div className="flex">
                      <div className="relative w-32 h-24 flex-shrink-0">
                        <img 
                          src={video.thumbnail} 
                          alt={video.caption}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <p className="text-[#2196F3]">{video.caption}</p>
                          <p className="text-sm text-gray-500">{video.views} views</p>
                        </div>
                        <Button variant="ghost" size="sm" className="w-fit">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Matched Colleges */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#2196F3]">Matched Colleges</h3>
                <Badge className="bg-[#2196F3] text-white">{mockMatches.filter(m => m.interest === 'High').length} High Interest</Badge>
              </div>
              <div className="space-y-3">
                {mockMatches.map(match => (
                  <Card key={match.id} className="p-4 rounded-2xl hover:shadow-lg transition-shadow">
                    <div className="flex items-start">
                      <img 
                        src={match.logo} 
                        alt={match.name}
                        className="w-12 h-12 rounded-xl object-cover mr-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[#2196F3]">{match.name}</p>
                            <p className="text-sm text-gray-500">{match.division}</p>
                          </div>
                          <Badge 
                            variant={match.interest === 'High' ? 'default' : 'secondary'}
                            className={match.interest === 'High' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}
                          >
                            {match.interest}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{match.message}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-8 text-xs">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs">
                            Message Coach
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="p-4">
            {uploadStep === 'select' && (
              <div className="space-y-4">
                <Card className="p-8 rounded-lg border-2 border-dashed border-[#2196F3] bg-blue-50 text-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-[#2196F3]" />
                  <h3 className="text-gray-900 mb-2">Upload Video</h3>
                  <p className="text-gray-600 mb-4">Select a video from your device</p>
                  <p className="text-sm text-gray-500">Max 90 seconds • MP4, MOV</p>
                  <Button 
                    onClick={() => setUploadStep('details')}
                    className="mt-4 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg"
                  >
                    Choose File
                  </Button>
                </Card>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">or</span>
                  </div>
                </div>

                <Card className="p-8 rounded-lg border-2 border-dashed border-gray-200 text-center cursor-pointer hover:border-[#2196F3] hover:bg-blue-50 transition-colors">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-gray-900 mb-2">Record Video</h3>
                  <p className="text-gray-600 mb-4">Record directly from camera</p>
                  <Button 
                    variant="outline"
                    className="mt-4 rounded-lg border-[#2196F3] text-[#2196F3] hover:bg-[#2196F3] hover:text-white"
                  >
                    Start Recording
                  </Button>
                </Card>
              </div>
            )}

            {uploadStep === 'details' && (
              <Card className="p-6 rounded-lg space-y-6 border border-gray-100">
                <div>
                  <h3 className="text-gray-900 mb-4">Video Details</h3>
                  
                  {/* Video Preview */}
                  <div className="relative w-full h-64 bg-gray-200 rounded-xl mb-6 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600"
                      alt="Video preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-sm">
                      <p>[Auto-generated subtitles will appear here]</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="caption">Caption</Label>
                      <Textarea
                        id="caption"
                        placeholder="e.g., QB Highlights Week 3"
                        value={videoCaption}
                        onChange={(e) => setVideoCaption(e.target.value)}
                        className="rounded-xl resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setUploadStep('select')}
                    className="flex-1 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => {
                      setUploadStep('select');
                      setActiveTab('home');
                    }}
                    className="flex-1 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl"
                  >
                    Publish
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="p-4 space-y-3">
            <div className="mb-4">
              <h3 className="text-[#2196F3] mb-1">Messages</h3>
              <p className="text-sm text-gray-600">{mockMessages.filter(m => m.unread).length} unread messages</p>
            </div>
            {mockMessages.map(msg => (
              <Card key={msg.id} className="p-4 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start">
                  <Avatar className="w-12 h-12 mr-4">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback>{msg.recruiter[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-[#2196F3]">{msg.recruiter}</p>
                        <p className="text-sm text-gray-500">{msg.school}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{msg.time}</span>
                        {msg.unread && (
                          <div className="w-2 h-2 bg-[#00BCD4] rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-2 text-xs">{msg.language}</Badge>
                    <p className="text-sm text-gray-900 mb-2">{msg.message}</p>
                    {msg.translation && (
                      <div className="bg-blue-50 border-l-4 border-[#2196F3] p-3 rounded-r mb-3">
                        <p className="text-xs text-gray-500 mb-1">Translation:</p>
                        <p className="text-sm text-gray-700 italic">{msg.translation}</p>
                      </div>
                    )}
                    <Button size="sm" className="bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-8 text-xs">
                      Reply
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-6">
            <Card className="p-6 rounded-2xl">
              <div className="flex flex-col items-center mb-6">
                <img 
                  src={profile.profilePicture || 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=200'} 
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <h3 className="text-[#2196F3]">{profile.name}</h3>
                <p className="text-gray-600">{profile.email}</p>
                <Badge className="bg-green-500 text-white mt-2">Profile Complete</Badge>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Sport</Label>
                    <p className="text-[#2196F3]">{profile.sport}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Position</Label>
                    <p className="text-[#2196F3]">{profile.position}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Country</Label>
                    <p className="text-[#2196F3]">{profile.country}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Year</Label>
                    <p className="text-[#2196F3]">{profile.yearOfGraduation}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">High School</Label>
                  <p className="text-[#2196F3]">{profile.highSchool}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Preferred Language</Label>
                  <select 
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-xl text-[#2196F3] bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                  >
                    <option value="English">🇺🇸 English</option>
                    <option value="Portuguese">🇧🇷 Portuguese (Português)</option>
                    <option value="Spanish">🇪🇸 Spanish (Español)</option>
                    <option value="Japanese">🇯🇵 Japanese (日本語)</option>
                    <option value="French">🇫🇷 French (Français)</option>
                    <option value="German">🇩🇪 German (Deutsch)</option>
                    <option value="Italian">🇮🇹 Italian (Italiano)</option>
                    <option value="Chinese">🇨🇳 Chinese (中文)</option>
                    <option value="Korean">🇰🇷 Korean (한국어)</option>
                    <option value="Dutch">🇳🇱 Dutch (Nederlands)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Coaches will see messages in your preferred language</p>
                </div>
              </div>

              <Button 
                className="w-full mt-6 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Card>

            {/* LinkedIn Integration */}
            <Card className="p-6 rounded-2xl border-2 border-[#0A66C2]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[#2196F3]">LinkedIn Profile</h4>
                    <p className="text-sm text-gray-600">Connect your professional network</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Connected</Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-[#0A66C2]/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#0A66C2]" />
                    <span className="text-sm text-[#0A66C2]">linkedin.com/in/{profile.name.toLowerCase().replace(' ', '-')}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/5"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/5"
                  size="sm"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  Update
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border-l-4 border-[#0A66C2] rounded-r">
                <p className="text-xs text-gray-700">
                  <strong>Auto-sync enabled:</strong> Your achievements and highlights are automatically shared to your LinkedIn profile.
                </p>
              </div>
            </Card>

            {/* Performance Stats */}
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Performance Metrics</h4>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Profile Views</span>
                    <span className="text-[#2196F3]">456</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2196F3]" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Video Engagement</span>
                    <span className="text-[#00BCD4]">89%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00BCD4]" style={{ width: '89%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Match Rate</span>
                    <span className="text-[#2196F3]">92%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2196F3] to-[#00BCD4]" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Documents & Test Scores</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm">Transcript.pdf</span>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
                
                {/* SAT/ACT Scores */}
                <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">SAT Score</span>
                    <Badge className="bg-purple-600 text-white">{mockAcademicProgress.satScore}</Badge>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: `${(mockAcademicProgress.satScore / 1600) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Out of 1600 (National Average: 1050)</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">ACT Score</span>
                    <Badge className="bg-blue-600 text-white">{mockAcademicProgress.actScore}</Badge>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${(mockAcademicProgress.actScore / 36) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Out of 36 (National Average: 20.8)</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm">Recommendation.pdf</span>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm">NCAA Clearinghouse</span>
                  <Badge className="bg-green-500 text-white">Cleared</Badge>
                </div>
              </div>
            </Card>

            {/* Subscription Info */}
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-orange-50 border-[#2196F3]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-[#2196F3]">Annual Membership</h4>
                  <p className="text-sm text-gray-600">Active until Dec 2025</p>
                </div>
                <Badge className="bg-green-500 text-white">Active</Badge>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>✓ Unlimited video uploads</p>
                <p>✓ Unlimited recruiter connections</p>
                <p>✓ AI-powered matching</p>
                <p>✓ Performance analytics</p>
              </div>
            </Card>
          </div>
        )}

        {/* Scholarships Tab */}
        {activeTab === 'scholarships' && (
          <div className="p-4 space-y-6">
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Scholarship Offers</h4>
              <div className="space-y-4">
                {mockScholarshipOffers.map(scholarship => (
                  <div key={scholarship.id} className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                    <div className="flex items-start">
                      <img 
                        src={scholarship.logo} 
                        alt={scholarship.school}
                        className="w-12 h-12 rounded-xl object-cover mr-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[#2196F3]">{scholarship.school}</p>
                            <p className="text-sm text-gray-500">{scholarship.type}</p>
                          </div>
                          <Badge 
                            variant={scholarship.status === 'Offer Extended' ? 'default' : 'secondary'}
                            className={scholarship.status === 'Offer Extended' ? 'bg-[#2196F3] text-white' : ''}
                          >
                            {scholarship.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{scholarship.details}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-8 text-xs">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs">
                            Message Coach
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Training Programs Tab */}
        {activeTab === 'training' && (
          <div className="p-4 space-y-6">
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Training Programs</h4>
              <div className="space-y-4">
                {mockTrainingPrograms.map(program => (
                  <div key={program.id} className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                    <div className="flex items-start">
                      <img 
                        src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=100"
                        alt={program.title}
                        className="w-12 h-12 rounded-xl object-cover mr-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[#2196F3]">{program.title}</p>
                            <p className="text-sm text-gray-500">{program.level}</p>
                          </div>
                          <Badge 
                            variant={program.progress >= 80 ? 'default' : 'secondary'}
                            className={program.progress >= 80 ? 'bg-[#2196F3] text-white' : ''}
                          >
                            {program.progress}% Complete
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{program.description}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-8 text-xs">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs">
                            Message Coach
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Campus Visits Tab */}
        {activeTab === 'visits' && (
          <div className="p-4 space-y-6">
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Campus Visits</h4>
              <div className="space-y-4">
                {mockCampusVisits.map(visit => (
                  <div key={visit.id} className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                    <div className="flex items-start">
                      <img 
                        src={visit.logo} 
                        alt={visit.school}
                        className="w-12 h-12 rounded-xl object-cover mr-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[#2196F3]">{visit.school}</p>
                            <p className="text-sm text-gray-500">{visit.type}</p>
                          </div>
                          <Badge 
                            variant={visit.status === 'Confirmed' ? 'default' : 'secondary'}
                            className={visit.status === 'Confirmed' ? 'bg-[#2196F3] text-white' : ''}
                          >
                            {visit.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{visit.itinerary.join(', ')}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-8 text-xs">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs">
                            Message Coach
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* NIL Opportunities Tab */}
        {activeTab === 'nil' && (
          <div className="p-4 space-y-6">
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">NIL Opportunities</h4>
              <div className="space-y-4">
                {mockNILOpportunities.map(opportunity => (
                  <div key={opportunity.id} className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                    <div className="flex items-start">
                      <img 
                        src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=100"
                        alt={opportunity.brand}
                        className="w-12 h-12 rounded-xl object-cover mr-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[#2196F3]">{opportunity.brand}</p>
                            <p className="text-sm text-gray-500">{opportunity.type}</p>
                          </div>
                          <Badge 
                            variant={opportunity.status === 'Opportunity Available' ? 'default' : 'secondary'}
                            className={opportunity.status === 'Opportunity Available' ? 'bg-[#2196F3] text-white' : ''}
                          >
                            {opportunity.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{opportunity.requirements.join(', ')}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-8 text-xs">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs">
                            Message Brand
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Academic Progress Tab */}
        {activeTab === 'academics' && (
          <div className="p-4 space-y-6">
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Academic Progress</h4>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Transcript Status</span>
                    <span className="text-[#2196F3]">✓ On File</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Our AI is processing your transcript to calculate your US GPA equivalent. You'll be notified when complete.</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Class Rank</span>
                    <span className="text-[#00BCD4]">{mockAcademicProgress.classRank}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00BCD4]" style={{ width: '89%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">SAT Score</span>
                    <span className="text-[#2196F3]">{mockAcademicProgress.satScore}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2196F3] to-[#00BCD4]" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">ACT Score</span>
                    <span className="text-[#00BCD4]">{mockAcademicProgress.actScore}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00BCD4]" style={{ width: '89%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">NCAA Eligibility</span>
                    <span className="text-[#2196F3]">{mockAcademicProgress.ncaaEligibility}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2196F3]" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Courses</span>
                    <span className="text-[#00BCD4]">{mockAcademicProgress.courses.length}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00BCD4]" style={{ width: '89%' }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Local Sponsors Tab */}
        {activeTab === 'sponsors' && (
          <div className="p-4 space-y-6">
            <div className="mb-4">
              <h3 className="text-[#2196F3] mb-1">Local Sponsorship Opportunities</h3>
              <p className="text-sm text-gray-600">Connect with local businesses in your area</p>
            </div>
            <div className="space-y-4">
              {mockLocalSponsors.map(sponsor => (
                <Card key={sponsor.id} className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">{sponsor.logo}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-[#2196F3]">{sponsor.name}</h4>
                          <p className="text-sm text-gray-600">{sponsor.location}</p>
                        </div>
                        <Badge className="bg-green-500 text-white">{sponsor.status}</Badge>
                      </div>
                      <Badge variant="outline" className="mb-3">{sponsor.type}</Badge>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      <span className="text-[#2196F3]">{sponsor.offer}</span>
                    </div>
                    <p className="text-xs text-gray-600">{sponsor.followers}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Requirements:</p>
                    <div className="space-y-1">
                      {sponsor.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl">
                      Apply Now
                    </Button>
                    <Button variant="outline" className="rounded-xl px-4">
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="text-[#2196F3] mb-2">How Local Sponsorships Work</h4>
                  <p className="text-sm text-gray-700 mb-3">Local businesses want to support talented athletes in their community while gaining social media exposure.</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">•</span>
                      <span>Browse available opportunities from businesses near you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">•</span>
                      <span>Apply if you meet the follower requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">•</span>
                      <span>Complete simple tasks like social posts or appearances</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">•</span>
                      <span>Earn money, free products, or services</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Video Tutorials Tab */}
        {activeTab === 'tutorials' && (
          <div className="p-4 space-y-6">
            <div className="mb-4">
              <h3 className="text-[#2196F3] mb-1">Video Tutorials</h3>
              <p className="text-sm text-gray-600">Learn how to create professional recruiting content</p>
            </div>

            <div className="space-y-4">
              {mockTutorials.map(tutorial => (
                <Card key={tutorial.id} className="p-0 overflow-hidden rounded-2xl hover:shadow-xl transition-shadow">
                  <div className="relative h-48">
                    <img 
                      src={tutorial.thumbnail}
                      alt={tutorial.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-[#2196F3] ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/70 text-white">{tutorial.duration}</Badge>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-[#2196F3] text-white">{tutorial.category}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[#2196F3]">{tutorial.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{tutorial.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span>{tutorial.views.toLocaleString()} views</span>
                      </div>
                      <Button size="sm" className="bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl">
                        Watch Now
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200">
              <div className="flex items-start gap-3">
                <PlayCircle className="w-6 h-6 text-pink-600 flex-shrink-0" />
                <div>
                  <h4 className="text-[#2196F3] mb-2">Pro Tips for Recruiting Videos</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">✓</span>
                      <span>Keep videos under 90 seconds for best engagement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">✓</span>
                      <span>Use good lighting - natural light or ring lights work great</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">✓</span>
                      <span>Showcase your best plays first to hook coaches immediately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">✓</span>
                      <span>Include game footage, not just practice clips</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00BCD4]">✓</span>
                      <span>Add text overlays with your stats and achievements</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="p-4 space-y-6">
            <div className="mb-4">
              <h3 className="text-[#2196F3] mb-1">Recruiting Resources</h3>
              <p className="text-sm text-gray-600">Everything you need for a successful recruitment journey</p>
            </div>

            {/* Recruiting Checklist */}
            <Card className="p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[#2196F3]">Recruiting Checklist</h4>
                <Badge className="bg-[#2196F3] text-white">
                  {mockRecruitingChecklist.filter(c => c.completed).length}/{mockRecruitingChecklist.length} Complete
                </Badge>
              </div>
              <div className="space-y-3">
                {mockRecruitingChecklist.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {item.completed && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.task}
                      </p>
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Recruiting Timeline</h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                    <div className="w-0.5 h-full bg-green-500 mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <h5 className="text-[#2196F3] mb-1">Freshman/Sophomore Year</h5>
                    <p className="text-sm text-gray-600 mb-2">Build your foundation</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Focus on academics and upload transcripts</li>
                      <li>• Develop athletic skills and attend camps</li>
                      <li>• Start creating highlight videos</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#2196F3] rounded-full flex items-center justify-center text-white flex-shrink-0">
                      2
                    </div>
                    <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <h5 className="text-[#2196F3] mb-1">Junior Year (Current)</h5>
                    <p className="text-sm text-gray-600 mb-2">Active recruiting phase</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Contact coaches regularly</li>
                      <li>• Attend college showcases and camps</li>
                      <li>• Take SAT/ACT and complete NCAA registration</li>
                      <li>• Schedule campus visits</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      3
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[#2196F3] mb-1">Senior Year</h5>
                    <p className="text-sm text-gray-600 mb-2">Decision time</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Evaluate scholarship offers</li>
                      <li>• Make official visits</li>
                      <li>• Sign National Letter of Intent</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Tips */}
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-teal-600 flex-shrink-0" />
                <div>
                  <h4 className="text-[#2196F3] mb-2">Quick Tips for Success</h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="p-3 bg-white rounded-xl">
                      <p className="mb-1"><strong>Be Proactive:</strong></p>
                      <p className="text-xs">Don't wait for coaches to find you. Reach out with personalized messages showing genuine interest in their program.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl">
                      <p className="mb-1"><strong>Stay Organized:</strong></p>
                      <p className="text-xs">Keep a spreadsheet tracking which schools you've contacted, visited, and their responses. Follow up regularly but not annoyingly.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl">
                      <p className="mb-1"><strong>Academics Matter:</strong></p>
                      <p className="text-xs">Coaches look for well-rounded athletes. Strong academic performance opens doors to better programs and more scholarship money. Our AI converts your international transcripts automatically.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl">
                      <p className="mb-1"><strong>Be Yourself:</strong></p>
                      <p className="text-xs">Authenticity stands out. Share your real story, passions, and goals. Coaches want genuine students, not rehearsed robots.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* FAQ */}
            <Card className="p-6 rounded-2xl">
              <h4 className="text-[#2196F3] mb-4">Frequently Asked Questions</h4>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-[#2196F3] flex-shrink-0" />
                    <p className="text-sm"><strong>When should I start contacting coaches?</strong></p>
                  </div>
                  <p className="text-xs text-gray-600 ml-7">You can start as early as freshman year, but most active recruiting happens junior year. NCAA rules vary by sport.</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-[#2196F3] flex-shrink-0" />
                    <p className="text-sm"><strong>How many schools should I contact?</strong></p>
                  </div>
                  <p className="text-xs text-gray-600 ml-7">Cast a wide net! Contact 20-30 schools initially, then narrow down to 10-15 that show serious interest.</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-[#2196F3] flex-shrink-0" />
                    <p className="text-sm"><strong>What if I'm an international student?</strong></p>
                  </div>
                  <p className="text-xs text-gray-600 ml-7">International athletes are highly valued! Make sure to highlight your unique background and take the TOEFL exam for English proficiency.</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-[#2196F3] flex-shrink-0" />
                    <p className="text-sm"><strong>Can I get a full scholarship?</strong></p>
                  </div>
                  <p className="text-xs text-gray-600 ml-7">It depends on your sport! Football and basketball offer full rides more often. Other sports typically offer partial scholarships.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Summer Camps Tab */}
        {activeTab === 'camps' && (
          <div className="p-4 space-y-6">
            <div className="mb-4">
              <h3 className="text-[#2196F3] mb-1">Summer Camp Invitations</h3>
              <p className="text-sm text-gray-600">Exclusive invitations from college coaches</p>
            </div>

            <div className="space-y-4">
              {mockSummerCamps.map(camp => (
                <Card key={camp.id} className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-100">
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={camp.schoolLogo}
                      alt={camp.school}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-[#2196F3]">{camp.campName}</h4>
                          <p className="text-sm text-gray-600">{camp.school}</p>
                        </div>
                        <Badge className={camp.status === 'Invited' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                          {camp.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{camp.dates}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{camp.location}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">{camp.description}</p>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl mb-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-green-700">{camp.cost}</span>
                    </div>
                    <p className="text-xs text-gray-600">Personal invitation from {camp.coach}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Camp Benefits:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {camp.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-xs">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl mb-4 border border-orange-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-700">RSVP Deadline:</span>
                    </div>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">{camp.deadline}</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl">
                      Accept Invitation
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl">
                      More Info
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>Attending camp improves your scholarship chances with this program</span>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="text-[#2196F3] mb-2">Why Summer Camps Matter</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF5722]">✓</span>
                      <span><strong>Direct Access:</strong> Train directly with college coaching staff and show your skills in person</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF5722]">✓</span>
                      <span><strong>Scholarship Evaluation:</strong> Coaches use camps to assess fit and determine scholarship offers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF5722]">✓</span>
                      <span><strong>Campus Experience:</strong> See facilities, meet players, and experience college life firsthand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF5722]">✓</span>
                      <span><strong>Skill Development:</strong> Learn from D1 coaches and improve your game with elite training</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF5722]">✓</span>
                      <span><strong>Network Building:</strong> Connect with other top recruits and build relationships</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-white rounded-xl">
                    <p className="text-xs text-gray-700">
                      <strong>Pro Tip:</strong> Coach invitations mean they're seriously interested! These free camps are reserved for top recruits. Attending shows commitment and gives you an edge over other prospects.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Ad Popup Dialog */}
      <Dialog open={showAdPopup} onOpenChange={setShowAdPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Special Offer!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#2196F3] to-[#00BCD4] rounded-lg p-6 text-white text-center">
              <Star className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl mb-2">Upgrade Your Profile</h3>
              <p className="text-sm opacity-90 mb-4">
                Get featured placement, advanced analytics, and priority messaging with coaches
              </p>
              <div className="bg-white/20 rounded-lg p-3 mb-4">
                <p className="text-2xl">$19.99/month</p>
                <p className="text-xs opacity-80">Premium Athlete Plan</p>
              </div>
              <Button className="w-full bg-white text-[#2196F3] hover:bg-gray-100">
                Upgrade Now
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowAdPopup(false)}
            >
              Continue with Basic Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

        {/* Bottom Navigation - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="grid grid-cols-4 h-16">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'home' ? 'text-[#2196F3]' : 'text-gray-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('upload');
              setUploadStep('select');
            }}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'upload' ? 'text-[#2196F3]' : 'text-gray-400'}`}
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs">Upload</span>
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center justify-center gap-1 relative ${activeTab === 'messages' ? 'text-[#2196F3]' : 'text-gray-400'}`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">Messages</span>
            <div className="absolute top-2 right-6 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'profile' ? 'text-[#2196F3]' : 'text-gray-400'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}