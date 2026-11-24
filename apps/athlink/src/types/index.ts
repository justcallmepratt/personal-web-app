// Athlete Profile Types
export interface AthleteProfile {
  name: string;
  email: string;
  sport: string;
  position: string;
  country: string;
  highSchool: string;
  profilePicture: string | null;
  height: string;
  weight: string;
  yearOfGraduation: string;
  phone: string;
  jerseyNumber: string;
  dominantSide: string;
  gamesPlayed: string;
}

// Video Types
export interface Video {
  id: string;
  thumbnail: string;
  title: string;
  views: string;
  date: string;
  duration?: string;
}

// Match/College Types
export interface CollegeMatch {
  id: string;
  logo: string;
  name: string;
  location: string;
  interest: 'High' | 'Medium' | 'Low';
  matchRate: string;
}

// Message Types
export interface Message {
  id: string;
  avatar: string;
  name: string;
  role: string;
  message: string;
  time: string;
  unread: boolean;
}

// Athlete Statistics
export interface AthleteStats {
  id: string;
  name: string;
  photo: string;
  sport: string;
  position: string;
  country: string;
  countryFlag: string;
  highSchool: string;
  height: string;
  weight: string;
  gpa: string;
  aiScore: number;
  matchRate: number;
  speed: number;
  agility: number;
  strength: number;
  yearOfGraduation: string;
  videosCount: string;
  followers: string;
  projection?: string;
  badges?: string[];
  bio?: string;
  photos?: string[];
  youtubeVideos?: any[];
  sportsRadarStats?: Record<string, any>;
}

// Scholarship Offer
export interface ScholarshipOffer {
  id: string;
  logo: string;
  school: string;
  division: string;
  amount: string;
  status: string;
  deadline: string;
}

// Training Program
export interface TrainingProgram {
  id: string;
  logo: string;
  program: string;
  coach: string;
  progress: number;
  nextSession: string;
}

// Campus Visit
export interface CampusVisit {
  id: string;
  logo: string;
  school: string;
  date: string;
  status: string;
  activities: string;
}

// NIL Opportunity
export interface NILOpportunity {
  id: string;
  logo: string;
  brand: string;
  type: string;
  value: string;
  status: string;
}

// Academic Progress
export interface AcademicProgress {
  gpa: string;
  satScore: string;
  actScore: string;
  classRank: string;
  courses: string[];
}

// Local Sponsor
export interface LocalSponsor {
  id: string;
  logo: string;
  business: string;
  type: string;
  offer: string;
  requirements: string[];
  location: string;
  distance: string;
}

// Summer Camp
export interface SummerCamp {
  id: string;
  logo: string;
  campName: string;
  university: string;
  date: string;
  location: string;
  cost: string;
  spots: string;
  benefits: string[];
  level: string;
}

// Recruiting Checklist Item
export interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  completed: boolean;
  dueDate: string;
}

// Tutorial/Resource
export interface Tutorial {
  id: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: string;
  views: string;
}

// Meeting
export interface Meeting {
  id: string;
  athleteName: string;
  athleteAvatar: string;
  sport: string;
  time: string;
  duration: string;
  type: string;
}

// Sponsor/Federation
export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  description: string;
  investment: string;
  athletes: string;
  sports: string[];
  focus?: string;
}

// Camp Event
export interface CampEvent {
  id: string;
  name: string;
  university: string;
  date: string;
  location: string;
  sport: string;
  cost: string;
  capacity: string;
  registered: string;
  benefits: string[];
}

// Contract
export interface Contract {
  id: string;
  athleteName: string;
  athletePhoto: string;
  sport: string;
  school: string;
  type: string;
  amount: string;
  startDate: string;
  endDate: string;
  status: string;
}

// NIL Deal
export interface NILDeal {
  id: string;
  athleteName: string;
  athletePhoto: string;
  brand: string;
  dealType: string;
  value: string;
  startDate: string;
  duration: string;
  status: string;
}
