import { useState, useEffect } from 'react';
import { Home, Search, MessageCircle, User, ArrowLeft, Heart, X, Send, Filter, ChevronDown, Play, TrendingUp, Star, FileText, BarChart3, Zap, Activity, Shield, Eye, Scan, Sparkles, Video, Calendar, Clock, Link2, Copy, CheckCircle2, Handshake, Globe, DollarSign, Trophy, FileSignature, MapPin, Building2, Users, Award, Briefcase, Target, Tag, Linkedin, Share2, ExternalLink, Brain, Download, Mail, Phone, SlidersHorizontal, ArrowUpRight, TrendingDown, Percent, Package, Settings, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DetailedAIReport } from './DetailedAIReport';
import { DetailedAIReportRefactored } from './ai-reports/DetailedAIReportRefactored';
import athlinkLogo from 'figma:asset/2dea44558ee75ccc34db0ab7f1dff6684b053f54.png';
import tsubasaImage from 'figma:asset/a6e0f0455aae745a0e72af14385a8621261466ed.png';
import tsubasaAwardPhoto from 'figma:asset/d0766429ed24a99b2e4b7f768aad06f72b4624be.png';
import tsubasaJapanJerseyPhoto from 'figma:asset/28af9554859390cb24a7b1bb435f24613e47c708.png';

interface RecruiterAppProps {
  onBack: () => void;
}

const mockAthletes = [
  {
    id: 1,
    name: 'Tsubasa Brennan',
    sport: 'Football',
    position: 'Wide Receiver',
    gpa: '3.9',
    country: 'Japan',
    school: 'Koshien Bowl High School',
    video: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600',
    caption: 'Koshien Bowl Championship Highlights 2024',
    stats: '62 receptions, 1,124 yards, 14 TDs',
    avatar: tsubasaImage,
    bio: 'Elite wide receiver from Osaka, Japan with exceptional route-running and hands. Started playing American football at age 12 and quickly rose through Japan\'s competitive high school football scene. Known for precise route running, reliable hands, and elite speed off the line. Seeking a top Division I program to continue developing while pursuing a degree in International Business.',
    photos: [
      tsubasaImage,
      tsubasaAwardPhoto,
      tsubasaJapanJerseyPhoto,
      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600',
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600'
    ],
    gradeLevel: 'Senior (12th Grade)',
    credits: '43 (NCAA Core: 39)',
    height: "6'1\"",
    weight: '190 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '18',
    dominantSide: 'Right',
    gamesPlayed: '11',
    seasonStats: '62 REC, 1,124 YDS, 14 TDs, 18.1 YDS/REC, 87% catch rate',
    achievements: 'Koshien Bowl All-Star 2024, Japan National U-19 Team, Leading Receiver Kansai Region',
    phone: '+81 6-8765-4321',
    testScores: 'SAT: 1390, TOEFL: 108',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 9,
    matchRate: 94,
    // Combine-style metrics
    wingspan: "6'3\"",
    verticalJump: '36 inches',
    standingJump: '31 inches',
    fortyYard: '4.42s',
    shuttleRun: '4.15s',
    threeCone: '6.89s',
    benchPress: '225 lbs x 10 reps',
    flexibility: '86/100',
    agility: '94/100',
    strength: '89/100',
    speed: '95/100',
    aiScore: 95,
    aiInsights: 'Exceptional route precision with NFL-level footwork. Elite separation skills at the top of routes. Reliable hands with strong catching radius. Excellent body control on contested catches. Shows maturity in release techniques against press coverage. Needs to continue building strength for physical SEC/Big Ten play.',
    projection: 'Division I - Power 5 Conference (Top WR Prospect)',
    comparablePlayer: 'Hines Ward (playing style)',
    aiVerified: true,
    arVerified: true,
    sportsRadarId: 'tsubasa-brennan-2025',
    sportsRadarStats: {
      gamesPlayed: 11,
      receptions: 62,
      receivingYards: 1124,
      touchdowns: 14,
      yardsPerReception: 18.1,
      catchPercentage: 87
    },
    youtubeVideos: [
      {
        title: 'Japan National Team vs USA All-Stars Game Highlights',
        url: 'https://www.youtube.com/embed/yG-oY2VCZkM',
        description: 'International game performance showcasing elite route running and hands'
      },
      {
        title: 'Tsubasa Brennan Season Highlights',
        url: 'https://www.youtube.com/embed/C-acIZP7oxs',
        description: 'Full season highlight reel - 62 receptions, 1,124 yards, 14 touchdowns'
      }
    ],
  },
  {
    id: 2,
    name: 'Lucas Senna',
    sport: 'Soccer',
    position: 'Forward',
    gpa: '3.8',
    country: 'Brazil',
    school: 'Colégio Bandeirantes',
    video: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
    caption: 'Brazilian Championship Goals Compilation',
    stats: '18 goals, 12 assists',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    bio: 'Passionate forward with international tournament experience. Started playing at age 5 and has represented Brazil at U-17 and U-19 levels. Known for technical skills, finishing ability, and creative playmaking. Seeking a top Division I program to continue developing while pursuing a degree in Sports Management.',
    photos: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600',
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600'
    ],
    gradeLevel: 'Senior (12th Grade)',
    credits: '42 (NCAA Core: 38)',
    height: "5'11\"",
    weight: '165 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '10',
    dominantSide: 'Right',
    gamesPlayed: '28',
    seasonStats: '18 goals, 12 assists, 82% pass accuracy, 3.2 shots on target per game',
    achievements: 'São Paulo State Championship Winner 2024, U-19 Brazilian National Team, Top Scorer Regional League',
    phone: '+55 11 98765-4321',
    testScores: 'SAT: 1350, TOEFL: 105',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 8,
    matchRate: 92,
    // Combine-style metrics
    wingspan: "6'1\"",
    verticalJump: '32 inches',
    standingJump: '28 inches',
    fortyYard: '4.68s',
    shuttleRun: '4.32s',
    threeCone: '7.21s',
    benchPress: '185 lbs x 12 reps',
    flexibility: '85/100',
    agility: '92/100',
    strength: '88/100',
    speed: '89/100',
    aiScore: 94,
    aiInsights: 'Exceptional technical skills with elite ball control. Shows excellent vision and decision-making in the final third. Natural finisher with both feet. Needs to improve defensive work rate and tracking back.',
    projection: 'Division I - Top 50 Program',
    comparablePlayer: 'Neymar Jr. (playing style)',
    aiVerified: true,
    arVerified: true,
    sportsRadarId: 'lucas-senna-2025',
    sportsRadarStats: {
      gamesPlayed: 28,
      goals: 18,
      assists: 12,
      shots: 89,
      shotsOnTarget: 67,
      passAccuracy: 82
    },
  },
  {
    id: 3,
    name: 'Yuki Tanaka',
    sport: 'Basketball',
    position: 'Point Guard',
    gpa: '3.9',
    country: 'Japan',
    school: 'Tokyo International Academy',
    video: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
    caption: 'All-Japan High School Tournament Highlights',
    stats: '24 points, 9 assists',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    bio: 'Elite point guard with exceptional court vision and leadership qualities. Captain of U-18 Japan National Team. Combines traditional Japanese discipline with modern playing style. Interested in studying Computer Science while competing at the highest collegiate level.',
    photos: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
      'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=600',
      'https://images.unsplash.com/photo-1519766304817-4f37bda74a26?w=600'
    ],
    gradeLevel: 'Senior (12th Grade)',
    credits: '44 (NCAA Core: 40)',
    height: "6'0\"",
    weight: '170 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '7',
    dominantSide: 'Right',
    gamesPlayed: '32',
    seasonStats: '24.3 PPG, 9.1 APG, 4.2 RPG, 51% FG, 41% 3PT, 2.8 SPG',
    achievements: 'All-Japan High School Tournament MVP 2024, Tokyo District Champion, U-18 Japan National Team Captain',
    phone: '+81 3-1234-5678',
    testScores: 'SAT: 1420, TOEFL: 110',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 12,
    matchRate: 95,
    // Combine-style metrics
    wingspan: "6'4\"",
    verticalJump: '38 inches',
    standingJump: '34 inches',
    fortyYard: '4.52s',
    shuttleRun: '3.98s',
    threeCone: '6.87s',
    benchPress: '165 lbs x 15 reps',
    flexibility: '88/100',
    agility: '95/100',
    strength: '82/100',
    speed: '91/100',
    aiScore: 96,
    aiInsights: 'Elite court vision and basketball IQ. Exceptional ball-handling skills with ability to break down defenses. High-level playmaker with consistent 3-point shooting. Leadership qualities evident as team captain.',
    projection: 'Division I - Power 5 Conference',
    comparablePlayer: 'Chris Paul (playing style)',
    aiVerified: true,
    arVerified: true,
    sportsRadarId: 'yuki-tanaka-2025',
    sportsRadarStats: {
      gamesPlayed: 32,
      ppg: 24.3,
      apg: 9.1,
      rpg: 4.2,
      fgPercentage: 51,
      threePointPercentage: 41
    },
  },
  {
    id: 4,
    name: 'Ana Senna',
    sport: 'Volleyball',
    position: 'Outside Hitter',
    gpa: '4.0',
    country: 'Brazil',
    school: 'Escola Americana do Rio',
    video: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600',
    caption: 'State Championship Performance 2024',
    stats: '28 kills, 15 blocks',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
    height: "6'1\"",
    weight: '155 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '12',
    dominantSide: 'Right',
    gamesPlayed: '35',
    seasonStats: '4.2 kills/set, 2.8 digs/set, .385 hitting %, 1.2 blocks/set, 89% serve reception',
    achievements: 'Rio State Championship MVP 2024, U-19 Brazilian National Team, Best Outside Hitter South American Championships',
    phone: '+55 21 91234-5678',
    testScores: 'SAT: 1480, TOEFL: 115',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 15,
    matchRate: 98,
    // Combine-style metrics
    wingspan: "6'5\"",
    verticalJump: '29 inches',
    standingJump: '25 inches',
    fortyYard: '4.89s',
    shuttleRun: '4.45s',
    threeCone: '7.56s',
    benchPress: '145 lbs x 10 reps',
    flexibility: '90/100',
    agility: '87/100',
    strength: '85/100',
    speed: '84/100',
    aiScore: 97,
    aiInsights: 'Outstanding attacking presence at the net with powerful swing mechanics. Exceptional spatial awareness and timing on blocks. Consistent serve reception and defensive positioning. Natural leader on court.',
    projection: 'Division I - National Championship Contender',
    comparablePlayer: 'Gabriela Guimarães (playing style)',
  },
  {
    id: 5,
    name: 'Diego Martinez',
    sport: 'Baseball',
    position: 'Pitcher',
    gpa: '3.7',
    country: 'Mexico',
    school: 'American School of Mexico City',
    video: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600',
    caption: 'Perfect Game Showcase',
    stats: '2.1 ERA, 95 strikeouts',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    height: "6'3\"",
    weight: '195 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '22',
    dominantSide: 'Right',
    gamesPlayed: '24',
    seasonStats: '2.1 ERA, 95 K, 1.05 WHIP, 92 MPH avg fastball, 78 MPH curveball',
    achievements: 'Mexico National U-18 Team, Regional Pitcher of the Year 2024, Perfect Game All-American',
    phone: '+52 55 1234-5678',
    testScores: 'SAT: 1310, TOEFL: 98',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 10,
    matchRate: 88,
    // Combine-style metrics
    wingspan: "6'7\"",
    verticalJump: '24 inches',
    standingJump: '21 inches',
    fortyYard: '4.95s',
    shuttleRun: '4.67s',
    threeCone: '7.89s',
    benchPress: '195 lbs x 8 reps',
    flexibility: '82/100',
    agility: '80/100',
    strength: '90/100',
    speed: '78/100',
    aiScore: 90,
    aiInsights: 'Excellent arm strength with three quality pitches. Command and control improving consistently. Shows mental toughness in high-pressure situations. Mechanics are clean with good repeatable delivery.',
    projection: 'Division I - Mid-Major Excellence',
    comparablePlayer: 'Marcus Stroman (mechanics)',
  },
  {
    id: 6,
    name: 'Sofia Kowalski',
    sport: 'Track & Field',
    position: '400m / 800m',
    gpa: '3.9',
    country: 'Canada',
    school: 'Toronto International College',
    video: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600',
    caption: 'Canadian National Championships 2024',
    stats: '52.3s (400m), 2:01.8 (800m)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    height: "5'8\"",
    weight: '135 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '17',
    dominantSide: 'Right',
    gamesPlayed: '18',
    seasonStats: '400m: 52.3s (PR), 800m: 2:01.8 (PR), 4x400 relay gold medalist',
    achievements: 'Canadian National Champion 400m 2024, Pan Am Junior Games Silver Medal, OFSAA Record Holder',
    phone: '+1 416-555-0123',
    testScores: 'SAT: 1390, Canadian Diploma',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 9,
    matchRate: 91,
    // Combine-style metrics
    wingspan: "5'11\"",
    verticalJump: '26 inches',
    standingJump: '23 inches',
    fortyYard: '4.72s',
    shuttleRun: '4.28s',
    threeCone: '7.34s',
    benchPress: '125 lbs x 10 reps',
    flexibility: '94/100',
    agility: '93/100',
    strength: '78/100',
    speed: '96/100',
    aiScore: 93,
    aiInsights: 'Elite speed and endurance combination. Outstanding race strategy and pacing. Shows excellent form and efficiency in both 400m and 800m events. Mental toughness in championship settings.',
    projection: 'Division I - Track Powerhouse',
    comparablePlayer: 'Athing Mu (speed profile)',
  },
  {
    id: 7,
    name: 'Hiroshi Yamamoto',
    sport: 'Tennis',
    position: 'Singles',
    gpa: '3.8',
    country: 'Japan',
    school: 'Osaka International School',
    video: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600',
    caption: 'National Junior Championships Final',
    stats: 'ITF Rank: 45, W-L: 34-8',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    height: "5'10\"",
    weight: '160 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '-',
    dominantSide: 'Right',
    gamesPlayed: '42',
    seasonStats: 'ITF Junior Ranking: 45, Win-Loss: 34-8, Serve Speed: 125 mph, First Serve %: 68%',
    achievements: 'Japan National Junior Champion 2024, ITF Circuit Winner (3 titles), Asian Junior Championships Finalist',
    phone: '+81 6-1234-5678',
    testScores: 'SAT: 1360, TOEFL: 102',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 11,
    matchRate: 89,
    // Combine-style metrics
    wingspan: "5'11\"",
    verticalJump: '30 inches',
    standingJump: '26 inches',
    fortyYard: '4.65s',
    shuttleRun: '4.05s',
    threeCone: '6.98s',
    benchPress: '155 lbs x 12 reps',
    flexibility: '91/100',
    agility: '94/100',
    strength: '83/100',
    speed: '90/100',
    aiScore: 91,
    aiInsights: 'Excellent court coverage with quick first step. Powerful serve with good placement. Strong mental game and competitive spirit. Technical fundamentals are solid with room for tactical growth.',
    projection: 'Division I - Strong Program',
    comparablePlayer: 'Kei Nishikori (movement)',
  },
  {
    id: 8,
    name: 'Isabella Silva',
    sport: 'Swimming',
    position: 'Freestyle/Butterfly',
    gpa: '3.95',
    country: 'Brazil',
    school: 'Graded School São Paulo',
    video: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600',
    caption: 'South American Championships Highlights',
    stats: '50m: 24.8s, 100m: 54.2s',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
    height: "5'9\"",
    weight: '145 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '-',
    dominantSide: 'Right',
    gamesPlayed: '28',
    seasonStats: '50m Free: 24.8s, 100m Free: 54.2s, 100m Fly: 58.9s, 200m Free: 1:58.3',
    achievements: 'South American Junior Champion 2024, Brazilian National Record Holder (50m Free U-18), 3x Gold Pan Am Junior Games',
    phone: '+55 11 97654-3210',
    testScores: 'SAT: 1440, TOEFL: 108',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 14,
    matchRate: 96,
    // Combine-style metrics
    wingspan: "6'0\"",
    verticalJump: '28 inches',
    standingJump: '24 inches',
    fortyYard: '4.58s',
    shuttleRun: '4.12s',
    threeCone: '7.05s',
    benchPress: '135 lbs x 11 reps',
    flexibility: '95/100',
    agility: '89/100',
    strength: '80/100',
    speed: '97/100',
    aiScore: 95,
    aiInsights: 'Exceptional technique and efficiency in the water. Outstanding underwater phase and turns. Strong closing speed with excellent race awareness. World-class potential in multiple events.',
    projection: 'Division I - Olympic Development Level',
    comparablePlayer: 'Caeleb Dressel (explosiveness)',
  },
  {
    id: 9,
    name: 'Carlos Ruiz',
    sport: 'Football',
    position: 'Linebacker',
    gpa: '3.6',
    country: 'Mexico',
    school: 'Instituto Tecnológico de Monterrey',
    video: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600',
    caption: 'Regional Championship Defensive Highlights',
    stats: '98 tackles, 12 sacks',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
    height: "6'2\"",
    weight: '220 lbs',
    yearOfGraduation: '2025',
    jerseyNumber: '54',
    dominantSide: 'Right',
    gamesPlayed: '12',
    seasonStats: '98 total tackles, 12 sacks, 3 forced fumbles, 2 INT, 88% tackle success rate',
    achievements: 'Mexico National Team U-19, Regional Defensive Player of the Year, All-Conference First Team',
    phone: '+52 81 8765-4321',
    testScores: 'SAT: 1280, TOEFL: 95',
    eligibilityStatus: 'NCAA Cleared',
    videoCount: 13,
    matchRate: 87,
    // Combine-style metrics
    wingspan: "6'6\"",
    verticalJump: '35 inches',
    standingJump: '31 inches',
    fortyYard: '4.62s',
    shuttleRun: '4.18s',
    threeCone: '7.12s',
    benchPress: '225 lbs x 18 reps',
    flexibility: '85/100',
    agility: '91/100',
    strength: '94/100',
    speed: '88/100',
    aiScore: 92,
    aiInsights: 'Explosive athlete with excellent instincts for the ball. Strong tackler with good gap discipline. Shows ability to rush the passer and drop into coverage. High motor and competitive nature.',
    projection: 'Division I - FBS Level Talent',
    comparablePlayer: 'Bobby Wagner (instincts)',
  },
];

const mockMessages = [
  { id: 1, athlete: 'Lucas Senna', message: 'Obrigado! Looking forward to discussing opportunities...', time: '10m ago', unread: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' },
  { id: 2, athlete: 'Yuki Tanaka', message: 'ありがとう Thank you for your interest in my profile!', time: '2h ago', unread: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
];

const mockUpcomingMeetings = [
  {
    id: 1,
    athlete: 'Lucas Senna',
    athleteAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    date: 'Today',
    time: '2:00 PM EST',
    duration: '30 min',
    zoomLink: 'https://zoom.us/j/123456789',
    status: 'upcoming'
  },
  {
    id: 2,
    athlete: 'Yuki Tanaka',
    athleteAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    date: 'Tomorrow',
    time: '11:00 AM EST',
    duration: '45 min',
    zoomLink: 'https://zoom.us/j/987654321',
    status: 'upcoming'
  },
  {
    id: 3,
    athlete: 'Ana Senna',
    athleteAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    date: 'Nov 12',
    time: '4:00 PM EST',
    duration: '30 min',
    zoomLink: 'https://zoom.us/j/456789123',
    status: 'upcoming'
  }
];

const mockSponsors = [
  {
    id: 1,
    name: 'Nike',
    logo: '👟',
    type: 'Apparel',
    budget: '$50,000 - $100,000',
    sports: ['Soccer', 'Basketball', 'Track & Field'],
    athletes: 45,
    description: 'Looking for emerging international talent for NIL partnerships',
    contact: 'partnerships@nike.com',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Red Bull',
    logo: '🔵',
    type: 'Energy/Lifestyle',
    budget: '$25,000 - $75,000',
    sports: ['Extreme Sports', 'Soccer', 'Basketball'],
    athletes: 32,
    description: 'Seeking high-energy athletes with strong social media presence',
    contact: 'athlete-marketing@redbull.com',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Under Armour',
    logo: '⚡',
    type: 'Apparel',
    budget: '$30,000 - $80,000',
    sports: ['Football', 'Baseball', 'Basketball'],
    athletes: 28,
    description: 'International athlete program for NCAA Division I talent',
    contact: 'recruiting@underarmour.com',
    status: 'Active'
  },
  {
    id: 4,
    name: 'Gatorade',
    logo: '🥤',
    type: 'Nutrition',
    budget: '$20,000 - $60,000',
    sports: ['All Sports'],
    athletes: 67,
    description: 'NIL deals for high-performing student-athletes',
    contact: 'sports@gatorade.com',
    status: 'Active'
  }
];

const mockFederations = [
  {
    id: 1,
    name: 'Brazilian Football Confederation (CBF)',
    country: 'Brazil',
    flag: '🇧🇷',
    sport: 'Soccer',
    athletes: 1243,
    verified: true,
    contact: 'international@cbf.com.br',
    partnerships: 45,
    description: 'Official partnership for Brazilian soccer talent pipeline to NCAA'
  },
  {
    id: 2,
    name: 'Japan Basketball Association',
    country: 'Japan',
    flag: '🇯🇵',
    sport: 'Basketball',
    athletes: 567,
    verified: true,
    contact: 'usa@japanbasketball.jp',
    partnerships: 28,
    description: 'Connecting Japanese basketball players with US collegiate programs'
  },
  {
    id: 3,
    name: 'Mexican Volleyball Federation',
    country: 'Mexico',
    flag: '🇲🇽',
    sport: 'Volleyball',
    athletes: 423,
    verified: true,
    contact: 'ncaa@fmvb.mx',
    partnerships: 22,
    description: 'Elite volleyball talent development and NCAA placement'
  },
  {
    id: 4,
    name: 'German Swimming Federation',
    country: 'Germany',
    flag: '🇩🇪',
    sport: 'Swimming',
    athletes: 389,
    verified: true,
    contact: 'recruitment@dsv.de',
    partnerships: 34,
    description: 'Premier swimming talent from Germany to US universities'
  },
  {
    id: 5,
    name: 'Australian Rugby Union',
    country: 'Australia',
    flag: '🇦🇺',
    sport: 'Rugby',
    athletes: 298,
    verified: true,
    contact: 'pathways@rugby.com.au',
    partnerships: 18,
    description: 'Rugby and football crossover talent for American programs'
  }
];

const mockNILDeals = [
  {
    id: 1,
    athlete: 'Lucas Senna',
    athleteAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    sport: 'Soccer',
    sponsor: 'Nike',
    dealValue: '$45,000/year',
    duration: '2 years',
    status: 'Active',
    startDate: 'Aug 2024',
    socialFollowers: '125K',
    engagement: '8.5%'
  },
  {
    id: 2,
    athlete: 'Yuki Tanaka',
    athleteAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    sport: 'Basketball',
    sponsor: 'Gatorade',
    dealValue: '$32,000/year',
    duration: '1 year',
    status: 'Active',
    startDate: 'Sep 2024',
    socialFollowers: '89K',
    engagement: '12.3%'
  },
  {
    id: 3,
    athlete: 'Ana Senna',
    athleteAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    sport: 'Volleyball',
    sponsor: 'Under Armour',
    dealValue: '$28,000/year',
    duration: '18 months',
    status: 'Pending',
    startDate: 'Nov 2024',
    socialFollowers: '67K',
    engagement: '9.8%'
  }
];

const mockCamps = [
  {
    id: 1,
    name: 'Elite Soccer Showcase',
    location: 'Orlando, FL',
    dates: 'Dec 15-18, 2024',
    sport: 'Soccer',
    level: 'Division I',
    cost: '$450',
    coaches: 45,
    capacity: 200,
    registered: 156,
    organizer: 'IMG Academy',
    description: 'Top-tier showcase for international soccer talent. NCAA D1 coaches confirmed.',
    benefits: ['Film provided', 'Exposure to 40+ D1 coaches', 'Combine testing']
  },
  {
    id: 2,
    name: 'International Basketball Camp',
    location: 'Los Angeles, CA',
    dates: 'Jan 5-8, 2025',
    sport: 'Basketball',
    level: 'All Divisions',
    cost: '$550',
    coaches: 38,
    capacity: 150,
    registered: 142,
    organizer: 'Nike Basketball',
    description: 'Premier basketball camp featuring NCAA coaches and NBA scouts.',
    benefits: ['Nike gear package', 'Pro coaching', 'Scout evaluations']
  },
  {
    id: 3,
    name: 'Volleyball National Showcase',
    location: 'Dallas, TX',
    dates: 'Feb 20-23, 2025',
    sport: 'Volleyball',
    level: 'Division I & II',
    cost: '$425',
    coaches: 52,
    capacity: 180,
    registered: 98,
    organizer: 'AAU Volleyball',
    description: 'The largest college volleyball recruiting event in the nation.',
    benefits: ['Match footage', '50+ college coaches', 'Skills sessions']
  },
  {
    id: 4,
    name: 'Track & Field Elite Camp',
    location: 'Eugene, OR',
    dates: 'Mar 10-12, 2025',
    sport: 'Track & Field',
    level: 'Division I',
    cost: '$375',
    coaches: 34,
    capacity: 120,
    registered: 67,
    organizer: 'USATF',
    description: 'Official USATF camp at historic Hayward Field.',
    benefits: ['Timing technology', 'Olympic coaches', 'Performance analysis']
  }
];

const mockContracts = [
  {
    id: 1,
    athlete: 'Lucas Senna',
    athleteAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    school: 'UCLA',
    sport: 'Soccer',
    type: 'Letter of Intent',
    status: 'Signed',
    signDate: 'Nov 2, 2024',
    startDate: 'Aug 2025',
    scholarship: 'Full Ride',
    value: '$280,000 (4 years)',
    contractDoc: 'UCLA_LOI_2024.pdf'
  },
  {
    id: 2,
    athlete: 'Yuki Tanaka',
    athleteAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    school: 'Stanford',
    sport: 'Basketball',
    type: 'National Letter of Intent',
    status: 'Pending Signature',
    signDate: '-',
    startDate: 'Aug 2025',
    scholarship: '75% Athletic + Academic',
    value: '$195,000 (4 years)',
    contractDoc: 'Stanford_NLI_2024.pdf'
  },
  {
    id: 3,
    athlete: 'Ana Senna',
    athleteAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    school: 'Penn State',
    sport: 'Volleyball',
    type: 'Financial Aid Agreement',
    status: 'Under Review',
    signDate: '-',
    startDate: 'Aug 2025',
    scholarship: 'Full Athletic',
    value: '$240,000 (4 years)',
    contractDoc: 'PennState_FAA_2024.pdf'
  }
];

export function RecruiterApp({ onBack }: RecruiterAppProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'discover' | 'saved' | 'messages' | 'reports' | 'compare' | 'profile' | 'sponsors' | 'federations' | 'nil' | 'camps' | 'contracts'>('dashboard');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [savedAthletes, setSavedAthletes] = useState<number[]>([1, 3, 8]); // IDs of saved athletes
  const [compareAthletes, setCompareAthletes] = useState<number[]>([]);
  const [showZoomScheduler, setShowZoomScheduler] = useState(false);
  const [zoomMeetingCreated, setZoomMeetingCreated] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [filters, setFilters] = useState({
    sport: '',
    position: '',
    gpa: '',
    country: '',
  });

  const handleMatch = () => {
    if (currentVideoIndex < mockAthletes.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handlePass = () => {
    if (currentVideoIndex < mockAthletes.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const toggleSaveAthlete = (athleteId: number) => {
    setSavedAthletes(prev => 
      prev.includes(athleteId) 
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  const toggleCompareAthlete = (athleteId: number) => {
    setCompareAthletes(prev => {
      if (prev.includes(athleteId)) {
        return prev.filter(id => id !== athleteId);
      } else if (prev.length < 3) {
        return [...prev, athleteId];
      }
      return prev; // Max 3 athletes
    });
  };

  const currentAthlete = mockAthletes[currentVideoIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div className="p-6 border-b border-gray-100">
          <button onClick={onBack} className="flex items-center">
            <img src={athlinkLogo} alt="Athlink" className="w-10 h-10 object-contain" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'dashboard' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'discover' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Discover</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'saved' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="text-sm">Saved</span>
            {savedAthletes.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>{savedAthletes.length}</span>
            )}
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
            onClick={() => setActiveTab('compare')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'compare' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Compare</span>
            {compareAthletes.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'compare' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>{compareAthletes.length}/3</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'reports' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">AI Reports</span>
          </button>
          
          <div className="my-6 border-t border-gray-100"></div>
          
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'sponsors' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Handshake className="w-4 h-4" />
            <span className="text-sm">Sponsors</span>
          </button>
          <button
            onClick={() => setActiveTab('federations')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'federations' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm">Federations</span>
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
            onClick={() => setActiveTab('camps')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'camps' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Summer Camps</span>
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'contracts' ? 'bg-[#2196F3] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span className="text-sm">Contracts</span>
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
      <div className="flex-1 overflow-auto md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-[#2196F3] text-white p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={onBack}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-white">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'discover' && 'Discover'}
              {activeTab === 'saved' && 'Saved Athletes'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'compare' && 'Compare Athletes'}
              {activeTab === 'reports' && 'AI Reports'}
              {activeTab === 'sponsors' && 'Sponsors'}
              {activeTab === 'federations' && 'International Federations'}
              {activeTab === 'nil' && 'NIL Deals'}
              {activeTab === 'camps' && 'Summer Camps'}
              {activeTab === 'contracts' && 'Contracts'}
              {activeTab === 'profile' && 'Profile'}
            </h2>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <h1 className="text-gray-900 mb-8">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 rounded-lg bg-white border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Athletes Viewed</p>
                <p className="text-3xl text-gray-900 mb-2">234</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </Card>
              <Card className="p-6 rounded-lg bg-white border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Matched</p>
                <p className="text-3xl text-gray-900 mb-2">67</p>
                <p className="text-xs text-green-600">+23% from last month</p>
              </Card>
              <Card className="p-6 rounded-lg bg-white border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Messages Sent</p>
                <p className="text-3xl text-gray-900 mb-2">156</p>
                <p className="text-xs text-green-600">+8% from last month</p>
              </Card>
              <Card className="p-6 rounded-lg bg-white border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Response Rate</p>
                <p className="text-3xl text-gray-900 mb-2">78%</p>
                <p className="text-xs text-green-600">+5% from last month</p>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 rounded-lg bg-white border border-gray-100">
                <h3 className="text-gray-900 mb-4">Top Countries</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Brazil</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00BCD4] to-[#2196F3]" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Japan</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2196F3]" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">30%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mexico</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00BCD4] to-[#2196F3]" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Canada</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2196F3]" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">10%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 rounded-lg bg-white border border-gray-100">
                <h3 className="text-gray-900 mb-4">Sport Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Soccer</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00BCD4] to-[#2196F3]" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">35%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Basketball</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2196F3]" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volleyball</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00BCD4] to-[#2196F3]" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other Sports</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2196F3]" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">20%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-6 rounded-lg bg-white border border-gray-100 mb-8">
              <h3 className="text-gray-900 mb-4">Search Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filters.sport} onValueChange={(value) => setFilters({...filters, sport: value})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="soccer">Soccer</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.position} onValueChange={(value) => setFilters({...filters, position: value})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qb">Quarterback</SelectItem>
                    <SelectItem value="pg">Point Guard</SelectItem>
                    <SelectItem value="mid">Midfielder</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.gpa} onValueChange={(value) => setFilters({...filters, gpa: value})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Min GPA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3.5">3.5+</SelectItem>
                    <SelectItem value="3.7">3.7+</SelectItem>
                    <SelectItem value="3.9">3.9+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.country} onValueChange={(value) => setFilters({...filters, country: value})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="mexico">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Recent Athletes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">Recent Athletes</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                    All Sports
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                    High Match Rate
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockAthletes.map(athlete => (
                  <Card 
                    key={athlete.id} 
                    className="p-0 overflow-hidden rounded-lg hover:shadow-md transition-shadow cursor-pointer group border border-gray-100"
                    onClick={() => setSelectedAthlete(athlete)}
                  >
                    <div className="relative h-48">
                      <img src={athlete.video} alt={athlete.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      <Badge className="absolute top-3 right-3 bg-[#2196F3] text-white border-0">
                        GPA {athlete.gpa}
                      </Badge>
                      <Badge className="absolute top-3 left-3 bg-white/95 text-gray-900 border border-gray-200">
                        {athlete.matchRate}% Match
                      </Badge>
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                          {athlete.country}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <Avatar className="w-10 h-10 mr-3">
                          <AvatarImage src={athlete.avatar} />
                          <AvatarFallback>{athlete.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-gray-900 flex items-center gap-1">
                            {athlete.name}
                            {athlete.aiVerified && athlete.arVerified && (
                              <CheckCircle2 className="w-4 h-4 text-[#2196F3]" />
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{athlete.sport} • {athlete.position}</p>
                        </div>
                      </div>
                      <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                        <span>{athlete.height}</span>
                        <span>•</span>
                        <span>{athlete.weight}</span>
                        <span>•</span>
                        <span>Class of {athlete.yearOfGraduation}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{athlete.stats}</p>
                      
                      {/* 3 Verification Checkmarks */}
                      <div className="mb-3 flex items-center gap-2 text-xs flex-wrap">
                        <div className="flex items-center gap-1 text-[#00BCD4]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-gray-600">NCAA Eligible</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#00BCD4]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-gray-600">AI/AR</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#00BCD4]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-gray-600">Academic</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg text-sm h-9">
                          <Heart className="w-3 h-3 mr-1" />
                          Match
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-lg text-sm h-9 border-gray-200 hover:border-[#2196F3] hover:text-[#2196F3]">
                          <Send className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Discover Tab - TikTok Style Feed */}
        {activeTab === 'discover' && (
          <div className="h-screen flex items-center justify-center bg-black relative">
            {currentAthlete && (
              <>
                {/* Video Background */}
                <div className="absolute inset-0">
                  <img 
                    src={currentAthlete.video} 
                    alt={currentAthlete.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 max-w-md w-full mx-auto h-full flex flex-col justify-between p-6">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-6 h-6 text-white" />
                      <span className="text-white text-sm">Filters Active</span>
                    </div>
                    <div className="text-white text-sm">{currentVideoIndex + 1} / {mockAthletes.length}</div>
                  </div>

                  {/* Bottom Info */}
                  <div className="space-y-6">
                    {/* Athlete Info */}
                    <div className="text-white space-y-2">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-12 h-12 border-2 border-white">
                          <AvatarImage src={currentAthlete.avatar} />
                          <AvatarFallback>{currentAthlete.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-white flex items-center gap-2">
                            {currentAthlete.name}
                            {currentAthlete.aiVerified && currentAthlete.arVerified && (
                              <CheckCircle2 className="w-5 h-5 text-[#00BCD4]" />
                            )}
                          </p>
                          <p className="text-sm text-gray-200">{currentAthlete.sport} • {currentAthlete.position}</p>
                        </div>
                      </div>
                      <p className="text-white mb-2">{currentAthlete.caption}</p>
                      <p className="text-gray-200 text-sm">{currentAthlete.stats}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white border-0">
                          GPA {currentAthlete.gpa}
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {currentAthlete.country}
                        </Badge>
                        {currentAthlete.aiVerified && currentAthlete.arVerified && (
                          <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <Button
                        onClick={handlePass}
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl border-2 border-white bg-white/10 hover:bg-white/20 text-white backdrop-blur"
                      >
                        <X className="w-6 h-6 mr-2" />
                        Pass
                      </Button>
                      <Button
                        onClick={() => {
                          toggleSaveAthlete(currentAthlete.id);
                          handleMatch();
                        }}
                        className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white border-0"
                      >
                        <Heart className={`w-6 h-6 mr-2 ${savedAthletes.includes(currentAthlete.id) ? 'fill-current' : ''}`} />
                        {savedAthletes.includes(currentAthlete.id) ? 'Saved' : 'Match'}
                      </Button>
                    </div>

                    <Button
                      onClick={() => setSelectedAthlete(currentAthlete)}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-white bg-white/10 hover:bg-white/20 text-white backdrop-blur"
                    >
                      View Full Profile
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Saved Athletes Tab */}
        {activeTab === 'saved' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-gray-900 mb-2">Saved Athletes</h1>
                <p className="text-gray-600">{savedAthletes.length} athletes in your favorites</p>
              </div>
              <Button className="bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg">
                <FileText className="w-4 h-4 mr-2" />
                Export List
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAthletes
                .filter(athlete => savedAthletes.includes(athlete.id))
                .map(athlete => (
                  <Card key={athlete.id} className="p-6 rounded-lg hover:shadow-md transition-shadow bg-white border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={athlete.avatar} />
                        <AvatarFallback>{athlete.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSaveAthlete(athlete.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCompareAthlete(athlete.id)}
                          className={compareAthletes.includes(athlete.id) ? "text-[#2196F3]" : ""}
                        >
                          <BarChart3 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-gray-900 mb-1">{athlete.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{athlete.country} • Class of {athlete.yearOfGraduation}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-[#2196F3] text-white">{athlete.sport}</Badge>
                      <Badge variant="outline" className="border-gray-200">{athlete.position}</Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Match Rate</span>
                        <span className="text-gray-900">{athlete.matchRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">AI Score</span>
                        <span className="text-gray-900">{athlete.aiScore}/100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GPA</span>
                        <span className="text-gray-900">{athlete.gpa}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg"
                        onClick={() => setSelectedAthlete(athlete)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-lg border-gray-200 hover:border-[#2196F3] hover:text-[#2196F3]"
                        onClick={() => setActiveTab('messages')}
                      >
                        Message
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>

            {savedAthletes.length === 0 && (
              <Card className="p-12 rounded-2xl text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-600 mb-2">No Saved Athletes Yet</h3>
                <p className="text-sm text-gray-500 mb-6">Start saving athletes to build your recruiting list</p>
                <Button 
                  className="bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl"
                  onClick={() => setActiveTab('discover')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Discover Athletes
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Compare Athletes Tab */}
        {activeTab === 'compare' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="mb-8">
              <h1 className="text-gray-900 mb-2">Compare Athletes</h1>
              <p className="text-gray-600">Side-by-side comparison (select up to 3 athletes)</p>
            </div>

            {compareAthletes.length === 0 ? (
              <Card className="p-12 rounded-2xl text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-600 mb-2">No Athletes Selected</h3>
                <p className="text-sm text-gray-500 mb-6">Select athletes from Discover or Saved to compare their profiles</p>
                <Button 
                  className="bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl"
                  onClick={() => setActiveTab('discover')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Athletes
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Athletes Being Compared */}
                <Card className="p-6 rounded-2xl">
                  <h3 className="text-[#2196F3] mb-4">Athletes in Comparison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockAthletes
                      .filter(athlete => compareAthletes.includes(athlete.id))
                      .map(athlete => (
                        <div key={athlete.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={athlete.avatar} />
                            <AvatarFallback>{athlete.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{athlete.name}</p>
                            <p className="text-xs text-gray-500">{athlete.sport}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCompareAthlete(athlete.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </Card>

                {/* Comparison Table */}
                <Card className="p-6 rounded-2xl overflow-x-auto">
                  <h3 className="text-[#2196F3] mb-4">Performance Metrics</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Metric</th>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <th key={athlete.id} className="text-center py-3 px-4 text-sm font-medium text-[#2196F3]">
                              {athlete.name}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">AI Score</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm font-semibold text-[#FF5722]">
                              {athlete.aiScore}/100
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Match Rate</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm font-semibold">
                              {athlete.matchRate}%
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">
                          GPA 
                          <span className="text-xs text-gray-400 block">AI-Converted</span>
                        </td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm font-semibold">
                              {athlete.gpa}
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Height</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm">
                              {athlete.height}
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Weight</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm">
                              {athlete.weight}
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Speed</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm">
                              {athlete.speed}/100
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Agility</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm">
                              {athlete.agility}/100
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Strength</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm">
                              {athlete.strength}/100
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Graduation Year</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center text-sm">
                              {athlete.yearOfGraduation}
                            </td>
                          ))}
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">NCAA Status</td>
                        {mockAthletes
                          .filter(athlete => compareAthletes.includes(athlete.id))
                          .map(athlete => (
                            <td key={athlete.id} className="py-3 px-4 text-center">
                              <Badge className="bg-green-500 text-white text-xs">
                                {athlete.eligibilityStatus}
                              </Badge>
                            </td>
                          ))}
                      </tr>
                    </tbody>
                  </table>
                </Card>

                {/* AI Insights Comparison */}
                <Card className="p-6 rounded-2xl">
                  <h3 className="text-[#2196F3] mb-4">AI Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockAthletes
                      .filter(athlete => compareAthletes.includes(athlete.id))
                      .map(athlete => (
                        <div key={athlete.id} className="p-4 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl">
                          <p className="text-sm font-medium text-[#2196F3] mb-2">{athlete.name}</p>
                          <p className="text-xs text-gray-700 mb-3">{athlete.aiInsights}</p>
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Projection:</p>
                            <p className="text-xs font-medium text-[#FF5722]">{athlete.projection}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>

                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setActiveTab('saved')}
                  >
                    Add More Athletes
                  </Button>
                  <Button
                    className="bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export Comparison
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[#2196F3]">Messages</h1>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
                <Video className="w-4 h-4 mr-2" />
                Zoom Enabled
              </Badge>
            </div>

            {/* Upcoming Zoom Meetings */}
            <Card className="p-6 rounded-2xl mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[#2196F3]">Upcoming Zoom Meetings</h3>
                    <p className="text-sm text-gray-600">{mockUpcomingMeetings.length} scheduled meetings</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockUpcomingMeetings.map(meeting => (
                  <Card key={meeting.id} className="p-4 rounded-xl hover:shadow-lg transition-shadow bg-white">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={meeting.athleteAvatar} />
                        <AvatarFallback>{meeting.athlete[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-[#2196F3] text-sm">{meeting.athlete}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{meeting.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-[#FF5722]" />
                        <span className="text-gray-700">{meeting.time}</span>
                        <Badge className="bg-gray-100 text-gray-700 text-xs ml-auto">{meeting.duration}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl h-9 text-sm"
                        onClick={() => window.open(meeting.zoomLink, '_blank')}
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                      <Button 
                        variant="outline" 
                        className="rounded-xl h-9 px-3"
                        onClick={() => {
                          navigator.clipboard.writeText(meeting.zoomLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                      >
                        {copiedLink ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Message List */}
              <Card className="lg:col-span-1 p-4 rounded-2xl h-[600px] overflow-y-auto">
                <div className="space-y-3">
                  {mockMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start">
                        <Avatar className="w-10 h-10 mr-3">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback>{msg.athlete[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-[#001F3F] text-sm truncate">{msg.athlete}</p>
                            <span className="text-xs text-gray-500">{msg.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                        </div>
                        {msg.unread && (
                          <div className="w-2 h-2 bg-[#FFC300] rounded-full ml-2 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-2 p-0 rounded-2xl h-[600px] flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={mockMessages[0].avatar} />
                      <AvatarFallback>{mockMessages[0].athlete[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[#001F3F]">{mockMessages[0].athlete}</p>
                      <p className="text-sm text-gray-500">Soccer • Forward • Brazil</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowZoomScheduler(!showZoomScheduler)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Schedule Zoom
                  </Button>
                </div>

                {/* Zoom Scheduler */}
                {showZoomScheduler && (
                  <div className="p-4 border-b bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#2196F3] mb-1">Schedule Zoom Meeting</h4>
                        <p className="text-sm text-gray-600">Set up a video call with {mockMessages[0].athlete}</p>
                      </div>
                      <button onClick={() => setShowZoomScheduler(false)}>
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Date</label>
                        <Input type="date" className="rounded-xl text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Time</label>
                        <Input type="time" className="rounded-xl text-sm" defaultValue="14:00" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Duration</label>
                        <select className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm">
                          <option>15 minutes</option>
                          <option>30 minutes</option>
                          <option selected>45 minutes</option>
                          <option>60 minutes</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Timezone</label>
                        <select className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm">
                          <option>EST (Eastern)</option>
                          <option>CST (Central)</option>
                          <option>MST (Mountain)</option>
                          <option>PST (Pacific)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs text-gray-600 mb-1 block">Meeting Topic (Optional)</label>
                      <Input placeholder="e.g., Program Discussion, Campus Tour Info" className="rounded-xl text-sm" />
                    </div>

                    <Button 
                      onClick={() => {
                        setZoomMeetingCreated(true);
                        setShowZoomScheduler(false);
                        setTimeout(() => setZoomMeetingCreated(false), 5000);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Create Zoom Meeting & Send Invite
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-2">
                      Meeting link will be automatically sent to athlete via email & in-app notification
                    </p>
                  </div>
                )}

                {/* Meeting Created Notification */}
                {zoomMeetingCreated && (
                  <div className="p-4 border-b bg-green-50 border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-green-900">Zoom meeting created successfully!</p>
                        <p className="text-xs text-green-700">Meeting invite sent to {mockMessages[0].athlete}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-2xl rounded-tl-sm max-w-xs shadow-sm">
                        <p className="text-sm">Thank you for reaching out!</p>
                        <span className="text-xs text-gray-500 mt-1">10:23 AM</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#2196F3] text-white p-3 rounded-2xl rounded-tr-sm max-w-xs">
                        <p className="text-sm">Great to connect with you! I watched your highlights and was impressed.</p>
                        <span className="text-xs text-gray-100 mt-1">10:25 AM</span>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-2xl rounded-tl-sm max-w-xs shadow-sm">
                        <p className="text-sm">Obrigado! I would love to learn more about your program.</p>
                        <span className="text-xs text-gray-500 mt-1">10:27 AM</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#2196F3] text-white p-3 rounded-2xl rounded-tr-sm max-w-xs">
                        <p className="text-sm">Would you be available for a Zoom call this week to discuss?</p>
                        <span className="text-xs text-gray-100 mt-1">10:29 AM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="rounded-xl"
                      title="Schedule Zoom Meeting"
                      onClick={() => setShowZoomScheduler(!showZoomScheduler)}
                    >
                      <Video className="w-5 h-5 text-blue-600" />
                    </Button>
                    <Input 
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl"
                    />
                    <Button className="bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl px-6">
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <DetailedAIReportRefactored athlete={mockAthletes[0]} athletes={mockAthletes} />
        )}

        {/* Sponsors Tab */}
        {activeTab === 'sponsors' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[#2196F3] mb-2">Sponsor Partnerships</h1>
                <p className="text-gray-600">Connect athletes with brand sponsors for NIL opportunities</p>
              </div>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
                <Handshake className="w-4 h-4 mr-2" />
                {mockSponsors.length} Active Sponsors
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockSponsors.map(sponsor => (
                <Card key={sponsor.id} className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-purple-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{sponsor.logo}</div>
                      <div>
                        <h3 className="text-[#2196F3] mb-1">{sponsor.name}</h3>
                        <Badge className="bg-purple-100 text-purple-700">{sponsor.type}</Badge>
                      </div>
                    </div>
                    <Badge className={`${sponsor.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
                      {sponsor.status}
                    </Badge>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{sponsor.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Budget Range</p>
                      <p className="text-[#2196F3]">{sponsor.budget}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Athletes Signed</p>
                      <p className="text-[#FF5722]">{sponsor.athletes}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Target Sports</p>
                    <div className="flex flex-wrap gap-2">
                      {sponsor.sports.map(sport => (
                        <Badge key={sport} className="bg-gray-100 text-gray-700 text-xs">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl">
                      <Handshake className="w-4 h-4 mr-2" />
                      Connect Athletes
                    </Button>
                    <Button variant="outline" className="rounded-xl px-4">
                      <Link2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Contact: {sponsor.contact}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Federations Tab */}
        {activeTab === 'federations' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[#2196F3] mb-2">International Federations</h1>
                <p className="text-gray-600">Official partnerships with global sports federations</p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2">
                <Globe className="w-4 h-4 mr-2" />
                {mockFederations.length} Federation Partners
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {mockFederations.map(federation => (
                <Card key={federation.id} className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">{federation.flag}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[#2196F3]">{federation.name}</h3>
                          {federation.verified && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-100 text-gray-700">{federation.sport}</Badge>
                          <Badge className="bg-orange-100 text-orange-700">{federation.country}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{federation.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <Users className="w-6 h-6 text-[#2196F3] mx-auto mb-2" />
                      <p className="text-2xl text-[#2196F3] mb-1">{federation.athletes}</p>
                      <p className="text-xs text-gray-600">Athletes</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <Building2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl text-green-600 mb-1">{federation.partnerships}</p>
                      <p className="text-xs text-gray-600">US Partnerships</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl text-center">
                      <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl text-purple-600 mb-1">A+</p>
                      <p className="text-xs text-gray-600">Rating</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl">
                      <Users className="w-4 h-4 mr-2" />
                      View Athletes
                    </Button>
                    <Button variant="outline" className="rounded-xl">
                      Contact Federation
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Contact: {federation.contact}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* NIL Deals Tab */}
        {activeTab === 'nil' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[#2196F3] mb-2">NIL Deals</h1>
                <p className="text-gray-600">Name, Image, and Likeness opportunities for athletes</p>
              </div>
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2">
                <DollarSign className="w-4 h-4 mr-2" />
                {mockNILDeals.length} Active Deals
              </Badge>
            </div>

            {/* NIL Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-3xl text-green-600 mb-1">$2.4M</p>
                <p className="text-sm text-gray-600">Total NIL Value</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                <Users className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-3xl text-blue-600 mb-1">67</p>
                <p className="text-sm text-gray-600">Athletes with Deals</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <Handshake className="w-8 h-8 text-purple-600 mb-3" />
                <p className="text-3xl text-purple-600 mb-1">12</p>
                <p className="text-sm text-gray-600">Brand Partners</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
                <TrendingUp className="w-8 h-8 text-orange-600 mb-3" />
                <p className="text-3xl text-orange-600 mb-1">+145%</p>
                <p className="text-sm text-gray-600">Growth YoY</p>
              </Card>
            </div>

            {/* Active NIL Deals */}
            <h3 className="text-[#2196F3] mb-4">Active NIL Agreements</h3>
            <div className="space-y-4">
              {mockNILDeals.map(deal => (
                <Card key={deal.id} className="p-6 rounded-2xl hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={deal.athleteAvatar} />
                        <AvatarFallback>{deal.athlete[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-[#2196F3] mb-1">{deal.athlete}</h4>
                        <Badge className="bg-gray-100 text-gray-700 text-xs">{deal.sport}</Badge>
                      </div>
                    </div>
                    <Badge className={`${
                      deal.status === 'Active' ? 'bg-green-500' : 
                      deal.status === 'Pending' ? 'bg-yellow-500' : 'bg-gray-400'
                    } text-white`}>
                      {deal.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Deal Value</p>
                      <p className="text-green-700">{deal.dealValue}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Sponsor</p>
                      <p className="text-blue-700">{deal.sponsor}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="text-purple-700">{deal.duration}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Followers</p>
                      <p className="text-orange-700">{deal.socialFollowers}</p>
                    </div>
                    <div className="bg-pink-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Engagement</p>
                      <p className="text-pink-700">{deal.engagement}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl">
                      <FileText className="w-4 h-4 mr-2" />
                      View Contract
                    </Button>
                    <Button variant="outline" className="rounded-xl">
                      Edit Deal
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Create New NIL Deal */}
            <Card className="p-8 rounded-2xl mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 text-center">
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="text-[#2196F3] mb-2">Create New NIL Deal</h4>
              <p className="text-gray-600 text-sm mb-4">Connect athletes with sponsors for endorsement opportunities</p>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl">
                <Handshake className="w-4 h-4 mr-2" />
                Start New NIL Agreement
              </Button>
            </Card>
          </div>
        )}

        {/* Summer Camps Tab */}
        {activeTab === 'camps' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[#2196F3] mb-2">Summer Camps & Showcases</h1>
                <p className="text-gray-600">Elite recruiting events and training camps</p>
              </div>
              <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2">
                <Trophy className="w-4 h-4 mr-2" />
                {mockCamps.length} Upcoming Events
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockCamps.map(camp => (
                <Card key={camp.id} className="p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-orange-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[#2196F3] mb-2">{camp.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-700">{camp.sport}</Badge>
                        <Badge className="bg-blue-100 text-blue-700">{camp.level}</Badge>
                      </div>
                    </div>
                    <Trophy className="w-10 h-10 text-orange-500" />
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{camp.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-gray-600">Dates</p>
                      </div>
                      <p className="text-sm text-blue-700">{camp.dates}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-gray-600">Location</p>
                      </div>
                      <p className="text-sm text-purple-700">{camp.location}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-gray-600">Cost</p>
                      </div>
                      <p className="text-sm text-green-700">{camp.cost}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-gray-600">Coaches</p>
                      </div>
                      <p className="text-sm text-orange-700">{camp.coaches} attending</p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-600">Registration</p>
                      <p className="text-xs text-gray-700">{camp.registered}/{camp.capacity} athletes</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" 
                        style={{ width: `${(camp.registered / camp.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Benefits Included:</p>
                    <div className="space-y-1">
                      {camp.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <p className="text-xs text-gray-700">{benefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl">
                      <Trophy className="w-4 h-4 mr-2" />
                      Register Athletes
                    </Button>
                    <Button variant="outline" className="rounded-xl">
                      Details
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Organized by: {camp.organizer}</p>
                </Card>
              ))}
            </div>

            {/* Add New Camp */}
            <Card className="p-8 rounded-2xl mt-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-dashed border-orange-300 text-center">
              <Trophy className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h4 className="text-[#2196F3] mb-2">Host Your Own Camp</h4>
              <p className="text-gray-600 text-sm mb-4">Create recruiting events and showcase camps through Athlink</p>
              <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl">
                <Calendar className="w-4 h-4 mr-2" />
                Create New Camp
              </Button>
            </Card>
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[#2196F3] mb-2">Recruitment Contracts</h1>
                <p className="text-gray-600">Letters of Intent and scholarship agreements</p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2">
                <FileSignature className="w-4 h-4 mr-2" />
                {mockContracts.length} Active Contracts
              </Badge>
            </div>

            {/* Contract Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-3xl text-green-600 mb-1">
                  {mockContracts.filter(c => c.status === 'Signed').length}
                </p>
                <p className="text-sm text-gray-600">Signed Contracts</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
                <Clock className="w-8 h-8 text-yellow-600 mb-3" />
                <p className="text-3xl text-yellow-600 mb-1">
                  {mockContracts.filter(c => c.status === 'Pending Signature').length}
                </p>
                <p className="text-sm text-gray-600">Pending Signature</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                <DollarSign className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-3xl text-blue-600 mb-1">$715K</p>
                <p className="text-sm text-gray-600">Total Scholarship Value</p>
              </Card>
            </div>

            {/* Contract List */}
            <div className="space-y-4">
              {mockContracts.map(contract => (
                <Card key={contract.id} className="p-6 rounded-2xl hover:shadow-lg transition-shadow border-2 border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={contract.athleteAvatar} />
                        <AvatarFallback>{contract.athlete[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-[#2196F3] mb-1">{contract.athlete}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-100 text-gray-700 text-xs">{contract.sport}</Badge>
                          <Badge className="bg-blue-100 text-blue-700 text-xs">{contract.school}</Badge>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${
                      contract.status === 'Signed' ? 'bg-green-500' : 
                      contract.status === 'Pending Signature' ? 'bg-yellow-500' : 
                      'bg-blue-500'
                    } text-white`}>
                      {contract.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-purple-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Contract Type</p>
                      <p className="text-sm text-purple-700">{contract.type}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Scholarship</p>
                      <p className="text-sm text-green-700">{contract.scholarship}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Total Value</p>
                      <p className="text-sm text-blue-700">{contract.value}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Start Date</p>
                      <p className="text-sm text-orange-700">{contract.startDate}</p>
                    </div>
                  </div>

                  {contract.status === 'Signed' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-green-900">Contract signed on {contract.signDate}</p>
                        <p className="text-xs text-green-700">All parties have executed the agreement</p>
                      </div>
                    </div>
                  )}

                  {contract.status === 'Pending Signature' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-yellow-900">Awaiting athlete signature</p>
                        <p className="text-xs text-yellow-700">Contract sent for review and execution</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl">
                      <FileText className="w-4 h-4 mr-2" />
                      View Contract
                    </Button>
                    {contract.status !== 'Signed' && (
                      <Button variant="outline" className="rounded-xl">
                        <Send className="w-4 h-4 mr-2" />
                        Send Reminder
                      </Button>
                    )}
                    <Button variant="outline" className="rounded-xl px-4">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Document: {contract.contractDoc}</p>
                </Card>
              ))}
            </div>

            {/* Create New Contract */}
            <Card className="p-8 rounded-2xl mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 text-center">
              <FileSignature className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-[#2196F3] mb-2">Create New Contract</h4>
              <p className="text-gray-600 text-sm mb-4">Generate Letter of Intent or scholarship agreement</p>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl">
                <FileSignature className="w-4 h-4 mr-2" />
                Draft New Contract
              </Button>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-[#2196F3] mb-6">Recruiter Profile</h1>
            <Card className="p-6 rounded-2xl">
              <div className="flex items-center mb-6">
                <Avatar className="w-20 h-20 mr-4">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" />
                  <AvatarFallback>CM</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-[#2196F3]">Coach Martinez</h3>
                  <p className="text-gray-600">UCLA Bruins</p>
                  <p className="text-sm text-gray-500">Division I • Football</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-[#2196F3]">coach.martinez@ucla.edu</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Institution</p>
                  <p className="text-[#2196F3]">University of California, Los Angeles</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Division</p>
                  <p className="text-[#2196F3]">Division I (NCAA)</p>
                </div>
              </div>
            </Card>

            {/* LinkedIn Integration */}
            <Card className="p-6 rounded-2xl border-2 border-[#0A66C2] mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[#2196F3]">LinkedIn Profile</h4>
                    <p className="text-sm text-gray-600">Professional network integration</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Connected</Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-[#0A66C2]/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#0A66C2]" />
                    <span className="text-sm text-[#0A66C2]">linkedin.com/in/coach-martinez-ucla</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded-xl text-center">
                    <p className="text-2xl text-[#0A66C2] mb-1">487</p>
                    <p className="text-xs text-gray-600">Connections</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl text-center">
                    <p className="text-2xl text-green-600 mb-1">2.3K</p>
                    <p className="text-xs text-gray-600">Followers</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl text-center">
                    <p className="text-2xl text-orange-600 mb-1">156</p>
                    <p className="text-xs text-gray-600">Posts</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button 
                  variant="outline" 
                  className="rounded-xl border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/5"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Successes
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/5"
                  size="sm"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </div>

              <div className="p-3 bg-blue-50 border-l-4 border-[#0A66C2] rounded-r">
                <p className="text-xs text-gray-700 mb-2">
                  <strong>Auto-share enabled:</strong> Athlete signings and recruitment milestones are automatically posted to your LinkedIn.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">Last shared: Lucas Senna commitment - 2 days ago</span>
                </div>
              </div>
            </Card>

            {/* Subscription & Pricing */}
            <Card className="p-6 rounded-2xl mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2196F3] to-[#1976D2] rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[#2196F3]">Your Subscription</h4>
                    <p className="text-sm text-gray-600">Manage your plan and add-ons</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Active</Badge>
              </div>

              {/* Current Plan */}
              <div className="p-4 bg-gradient-to-br from-[#2196F3]/10 to-[#1976D2]/10 rounded-xl border-2 border-[#2196F3]/30 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-[#2196F3] mb-1">Pro Recruiter Plan</h5>
                    <p className="text-sm text-gray-600">Full access to all features</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-[#2196F3]">$3,000</p>
                    <p className="text-xs text-gray-500">/month</p>
                  </div>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-[#2196F3]/20">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Access 12,000+ verified international athletes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>AI-powered athlete matching & scouting</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>SportsRadar verified statistics & metrics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 bg-[#2196F3] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Direct messaging & integrated Zoom calls</span>
                  </div>
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="mb-4">
                <h5 className="text-sm text-gray-700 mb-3">Available Add-ons</h5>
                <div className="p-4 bg-gradient-to-br from-[#00BCD4]/10 to-[#2196F3]/10 rounded-xl border-2 border-[#00BCD4]/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#00BCD4] to-[#2196F3] rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h6 className="text-[#00BCD4] mb-1">AI Team Fit Analysis</h6>
                        <p className="text-xs text-gray-600">Advanced compatibility scoring for your team</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl text-[#00BCD4]">$125</p>
                      <p className="text-xs text-gray-500">one-time</p>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Add AI Team Fit Analysis
                  </Button>
                </div>
              </div>

              {/* Billing Information */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Next billing date</span>
                  <span className="text-sm text-[#2196F3]">December 9, 2025</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Payment method</span>
                  <span className="text-sm text-[#2196F3]">•••• 4242</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="rounded-xl border-[#2196F3] text-[#2196F3] hover:bg-[#2196F3]/5">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Plan
                  </Button>
                  <Button variant="outline" className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Download className="w-4 h-4 mr-2" />
                    Billing History
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="grid grid-cols-5 h-16">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center ${activeTab === 'dashboard' ? 'text-[#2196F3]' : 'text-gray-400'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center justify-center ${activeTab === 'discover' ? 'text-[#2196F3]' : 'text-gray-400'}`}
            >
              <Search className="w-5 h-5" />
              <span className="text-xs">Discover</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex flex-col items-center justify-center relative ${activeTab === 'saved' ? 'text-[#2196F3]' : 'text-gray-400'}`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs">Saved</span>
              {savedAthletes.length > 0 && (
                <div className="absolute top-1 right-4 bg-[#2196F3] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{savedAthletes.length}</div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex flex-col items-center justify-center relative ${activeTab === 'messages' ? 'text-[#2196F3]' : 'text-gray-400'}`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Messages</span>
              <div className="absolute top-1 right-4 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center ${activeTab === 'profile' ? 'text-[#2196F3]' : 'text-gray-400'}`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Athlete Profile Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAthlete(null)}>
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64">
              <img src={selectedAthlete.video} alt={selectedAthlete.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedAthlete(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <X className="w-6 h-6" />
              </button>
              <Badge className="absolute top-4 left-4 bg-[#FF5722] text-white">
                GPA {selectedAthlete.gpa}
              </Badge>
            </div>

            <div className="p-6 space-y-6">
              {/* Header - Name, Photos, Position, Country */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="w-16 h-16 mr-4">
                      <AvatarImage src={selectedAthlete.avatar} />
                      <AvatarFallback>{selectedAthlete.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-[#2196F3] flex items-center gap-2">
                        {selectedAthlete.name}
                        {selectedAthlete.aiVerified && selectedAthlete.arVerified && (
                          <CheckCircle2 className="w-5 h-5 text-[#00BCD4]" />
                        )}
                      </h3>
                      <p className="text-gray-600">{selectedAthlete.sport} • {selectedAthlete.position}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          🌎 {selectedAthlete.country}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Class of {selectedAthlete.yearOfGraduation}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                {selectedAthlete.bio && (
                  <Card className="p-4 bg-gradient-to-br from-[#2196F3]/5 to-[#00BCD4]/5 border-[#2196F3]/20">
                    <h4 className="text-[#2196F3] mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Bio
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedAthlete.bio}</p>
                  </Card>
                )}

                {/* Photo Gallery */}
                {selectedAthlete.photos && selectedAthlete.photos.length > 0 && (
                  <div>
                    <h4 className="text-[#2196F3] mb-3 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Photos & Media
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAthlete.photos.map((photo: string, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#2196F3]/20 hover:border-[#00BCD4] transition-colors cursor-pointer">
                          <img src={photo} alt={`${selectedAthlete.name} photo ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube Videos Section */}
                {selectedAthlete.youtubeVideos && selectedAthlete.youtubeVideos.length > 0 && (
                  <div>
                    <h4 className="text-[#2196F3] mb-3 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Highlight Videos
                    </h4>
                    <div className="space-y-4">
                      {selectedAthlete.youtubeVideos.map((video: any, idx: number) => (
                        <Card key={idx} className="overflow-hidden border-2 border-[#2196F3]/20 hover:border-[#00BCD4] transition-colors">
                          <div className="aspect-video">
                            <iframe
                              className="w-full h-full"
                              src={video.url}
                              title={video.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-[#2196F3]/5 to-[#00BCD4]/5">
                            <h5 className="text-[#2196F3] mb-1">{video.title}</h5>
                            <p className="text-sm text-gray-600">{video.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI/AR Verification Banner */}
              {selectedAthlete.aiVerified && selectedAthlete.arVerified && (
                <Card className="p-4 bg-gradient-to-r from-[#00BCD4]/10 via-[#2196F3]/10 to-[#00BCD4]/10 border-2 border-[#00BCD4]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#00BCD4] to-[#2196F3] p-2 rounded-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[#2196F3] flex items-center gap-2">
                          AI/AR Verified Measurements
                          <CheckCircle2 className="w-4 h-4 text-[#00BCD4]" />
                        </h4>
                        <p className="text-xs text-gray-600">
                          All physical measurements verified using computer vision and augmented reality technology
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white border-0">
                      <Eye className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </Card>
              )}

              {/* Physical Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center p-4 bg-gradient-to-br from-[#2196F3]/10 to-[#00BCD4]/10 rounded-xl relative border border-[#2196F3]/20">
                  <p className="text-2xl text-[#2196F3]">{selectedAthlete.height}</p>
                  <p className="text-xs text-gray-600">Height</p>
                  {selectedAthlete.arVerified && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white text-xs px-1.5 py-0.5 border-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#2196F3]/10 to-[#00BCD4]/10 rounded-xl relative border border-[#2196F3]/20">
                  <p className="text-2xl text-[#2196F3]">{selectedAthlete.weight}</p>
                  <p className="text-xs text-gray-600">Weight</p>
                  {selectedAthlete.arVerified && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white text-xs px-1.5 py-0.5 border-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#2196F3]/10 to-[#00BCD4]/10 rounded-xl relative border border-[#2196F3]/20">
                  <p className="text-2xl text-[#2196F3]">{selectedAthlete.wingspan}</p>
                  <p className="text-xs text-gray-600">Wingspan</p>
                  {selectedAthlete.arVerified && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white text-xs px-1.5 py-0.5 border-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#2196F3]/10 to-[#00BCD4]/10 rounded-xl border border-[#2196F3]/20">
                  <p className="text-2xl text-[#2196F3]">{selectedAthlete.dominantSide}</p>
                  <p className="text-xs text-gray-600">Dominant</p>
                </div>
              </div>

              {/* Academics Section */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00BCD4] to-[#2196F3] rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Academics
                  <CheckCircle2 className="w-5 h-5 text-[#00BCD4]" />
                </h4>
                <Card className="p-5 bg-gradient-to-br from-[#2196F3]/5 to-[#00BCD4]/5 border-2 border-[#2196F3]/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        High School
                      </p>
                      <p className="text-[#2196F3]">{selectedAthlete.school}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        Grade Level
                        <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                      </p>
                      <p className="text-[#2196F3]">{selectedAthlete.gradeLevel || selectedAthlete.yearOfGraduation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        GPA (AI-Converted)
                        <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                      </p>
                      <p className="text-[#2196F3]">{selectedAthlete.gpa}</p>
                      <p className="text-xs text-gray-400 mt-1">From international transcript</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        Credits Completed
                        <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                      </p>
                      <p className="text-[#2196F3] text-sm">{selectedAthlete.credits || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        Test Scores
                        <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                      </p>
                      <p className="text-[#2196F3] text-sm">{selectedAthlete.testScores}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        NCAA Eligibility Status
                        <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                      </p>
                      <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white mt-1 border-0">
                        <Shield className="w-3 h-3 mr-1" />
                        {selectedAthlete.eligibilityStatus}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Highlight Videos & Combine Videos */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00BCD4] to-[#2196F3] rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  Highlight & Combine Videos
                  <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white text-xs border-0">
                    {selectedAthlete.videoCount} Videos
                  </Badge>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-[#2196F3]/5 to-[#00BCD4]/5 border-2 border-[#2196F3]/20 hover:border-[#00BCD4] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#00BCD4] to-[#2196F3] rounded-lg flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-[#2196F3]">Highlight Reels</p>
                        <p className="text-xs text-gray-500">{selectedAthlete.videoCount - 2} videos</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Game highlights, skills showcase, tournament performances</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-[#2196F3]/5 to-[#00BCD4]/5 border-2 border-[#2196F3]/20 hover:border-[#00BCD4] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2196F3] to-[#00BCD4] rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-[#2196F3]">Combine Videos</p>
                        <p className="text-xs text-gray-500">2 videos</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Speed testing, agility drills, strength measurements</p>
                  </Card>
                </div>
              </div>

              {/* Combine Measurements */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00BCD4] to-[#2196F3] rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  Combine Measurements
                  <CheckCircle2 className="w-5 h-5 text-[#00BCD4]" />
                </h4>
                <Card className="p-4 bg-gradient-to-br from-[#2196F3]/5 to-[#00BCD4]/5 border-2 border-[#2196F3]/20">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xl text-[#2196F3]">{selectedAthlete.verticalJump}</p>
                      <p className="text-xs text-gray-600">Vertical Jump</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xl text-[#2196F3]">{selectedAthlete.fortyYard}</p>
                      <p className="text-xs text-gray-600">40-Yard Dash</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xl text-[#2196F3]">{selectedAthlete.shuttleRun}</p>
                      <p className="text-xs text-gray-600">Shuttle Run</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xl text-[#2196F3]">{selectedAthlete.threeCone}</p>
                      <p className="text-xs text-gray-600">3-Cone Drill</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xl text-[#2196F3]">{selectedAthlete.benchPress}</p>
                      <p className="text-xs text-gray-600">Bench Press</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xl text-[#2196F3]">{selectedAthlete.standingJump}</p>
                      <p className="text-xs text-gray-600">Standing Jump</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg text-[#2196F3]">{selectedAthlete.speed}</p>
                      <p className="text-xs text-gray-600">Speed</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg text-[#2196F3]">{selectedAthlete.agility}</p>
                      <p className="text-xs text-gray-600">Agility</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg text-[#2196F3]">{selectedAthlete.strength}</p>
                      <p className="text-xs text-gray-600">Strength</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg text-[#2196F3]">{selectedAthlete.flexibility}</p>
                      <p className="text-xs text-gray-600">Flexibility</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Match Rate */}
              <div className="pt-4 border-t">
                <Card className="p-4 bg-gradient-to-br from-[#00BCD4]/10 to-[#2196F3]/10 border-2 border-[#00BCD4] text-center">
                  <p className="text-3xl text-[#2196F3] mb-1">{selectedAthlete.matchRate}%</p>
                  <p className="text-xs text-gray-600">AI Match Rate</p>
                  <p className="text-xs text-gray-500 mt-1">Based on your program criteria</p>
                </Card>
              </div>

              {/* Performance Stats */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#FF5722] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Season Performance
                </h4>
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-orange-50 border-0">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Games Played</p>
                    <p className="text-[#2196F3]">{selectedAthlete.gamesPlayed} games</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Key Statistics</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedAthlete.seasonStats}</p>
                  </div>
                </Card>
              </div>

              {/* SportsRadar Verified Stats */}
              {selectedAthlete.sportsRadarId && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[#2196F3] flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#2196F3] to-[#00BCD4] rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      SportsRadar Verified Stats
                      <CheckCircle2 className="w-5 h-5 text-[#00BCD4]" />
                    </h4>
                    <Badge className="bg-gradient-to-r from-[#2196F3] to-[#00BCD4] text-white text-xs border-0">
                      <Shield className="w-3 h-3 mr-1" />
                      API Verified
                    </Badge>
                  </div>
                  <Card className="p-4 bg-gradient-to-br from-[#00BCD4]/10 to-[#2196F3]/10 border-2 border-[#00BCD4]">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gradient-to-r from-[#2196F3] to-[#00BCD4] text-white text-xs border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        SportsRadar Verified
                      </Badge>
                      <span className="text-xs text-gray-600">Statistics verified by SportsRadar API real-time data</span>
                    </div>
                    {selectedAthlete.sportsRadarStats && (
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(selectedAthlete.sportsRadarStats).map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-white rounded-lg">
                            <p className="text-xl text-[#2196F3]">{value}</p>
                            <p className="text-xs text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* AI Recruiting Profile */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00BCD4] to-[#2196F3] rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  AI-Generated Recruiting Profile
                  <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white text-xs border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Score: {selectedAthlete.aiScore}
                  </Badge>
                </h4>
                <Card className="p-5 bg-gradient-to-br from-[#00BCD4]/10 via-[#2196F3]/10 to-[#00BCD4]/10 border-2 border-[#00BCD4]">
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm text-[#2196F3] mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        AI Insights & Analysis
                      </h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedAthlete.aiInsights}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#2196F3]/20">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Projected Level</p>
                        <p className="text-sm text-[#2196F3]">{selectedAthlete.projection}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Playing Style Comparison</p>
                        <p className="text-sm text-[#2196F3]">{selectedAthlete.comparablePlayer}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* AI/AR Technology Explanation */}
              {selectedAthlete.aiVerified && selectedAthlete.arVerified && (
                <div className="pt-4 border-t">
                  <h4 className="text-[#2196F3] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#00BCD4] to-[#2196F3] rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    AI/AR Verification Technology
                  </h4>
                  <Card className="p-5 bg-gradient-to-br from-[#00BCD4]/10 via-[#2196F3]/10 to-[#00BCD4]/10 border-2 border-[#00BCD4]">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] p-1.5 rounded">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <h5 className="text-sm text-[#2196F3] flex items-center gap-1">
                            Computer Vision Analysis
                            <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                          </h5>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed pl-8">
                          Our AI analyzes uploaded videos frame-by-frame to verify athletic movements, calculate speed metrics, and assess technique. Machine learning models trained on thousands of athlete videos ensure accurate performance evaluation.
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-gradient-to-r from-[#2196F3] to-[#00BCD4] p-1.5 rounded">
                            <Scan className="w-4 h-4 text-white" />
                          </div>
                          <h5 className="text-sm text-[#2196F3] flex items-center gap-1">
                            AR Body Measurement
                            <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                          </h5>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed pl-8">
                          Athletes use our mobile app with AR technology to capture precise body measurements including height, wingspan, arm length, and standing reach. The system uses reference markers and spatial mapping to ensure ±0.5" accuracy.
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] p-1.5 rounded">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <h5 className="text-sm text-[#2196F3] flex items-center gap-1">
                            Verification Guarantee
                            <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                          </h5>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed pl-8">
                          All measurements tagged with the "AR Verified" badge have been captured using our proprietary technology and cross-referenced with video analysis. Coaches can trust these measurements are accurate within 1% margin of error.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Achievements */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#FF5722] rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  Championships & Awards
                </h4>
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-orange-50 border-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedAthlete.achievements}</p>
                </Card>
              </div>

              {/* Documents */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-3">Academic Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <span className="text-sm">Academic Transcript</span>
                    <Button variant="ghost" size="sm" className="text-[#2196F3]">View</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <span className="text-sm">Recommendation Letter</span>
                    <Button variant="ghost" size="sm" className="text-[#2196F3]">View</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <span className="text-sm">NCAA Clearinghouse</span>
                    <Button variant="ghost" size="sm" className="text-[#2196F3]">View</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <span className="text-sm">Medical Records</span>
                    <Button variant="ghost" size="sm" className="text-[#2196F3]">View</Button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-4 border-t">
                <h4 className="text-[#2196F3] mb-3">Contact Information</h4>
                <Card className="p-4 bg-gray-50 border-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="text-[#2196F3]">{selectedAthlete.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">School:</span>
                      <span className="text-[#2196F3]">{selectedAthlete.school}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Videos Uploaded:</span>
                      <span className="text-[#2196F3]">{selectedAthlete.videoCount} highlights</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button className="flex-1 bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl h-12">
                  <Heart className="w-5 h-5 mr-2" />
                  Match
                </Button>
                <Button className="flex-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-12">
                  <Send className="w-5 h-5 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}