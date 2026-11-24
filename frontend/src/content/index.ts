import type {
  Profile, Project, Experience, Certification, PlannedProject, Education, Leadership, Research,
} from '@/lib/types'

// Site content. Edit this file and push to update the site — no database or
// backend is involved. The site is public: publish only facts the owner has
// confirmed, and leave a field empty rather than guessing.
//
// - `email` is empty on purpose: no email address is published.
// - `cvUrl` is unused and stays empty: the "Download CV" button always points
//   at /resume.pdf, which is generated from this content (see lib/resume.ts).
//   Never add a hand-made PDF to public/.
// - `socials` holds LinkedIn only (owner decision, 2026-11-20).
// - Skills carry no `level`: the page lists them by area without ratings.

export const profile: Profile = {
  id: 1,
  name: 'Pratham Sachan',
  tagline: 'Backend Software Developer at Raymond James',
  bio:
    'Backend developer in Tampa, FL, working with Java, Spring Boot and Kafka at Raymond James since July 2024. ' +
    'I have a bachelor\'s in Computer Science with a minor in Business Management from the University of Massachusetts Amherst, ' +
    'where I co-founded the UMass F1 club and was its vice president.',
  email: '',
  location: 'Tampa, FL',
  avatarUrl: '',
  cvUrl: '',
  techStack: ['Java', 'Spring Boot', 'Kafka', 'Microsoft SQL Server', 'Splunk', 'Dynatrace'],
  socials: {
    linkedin: 'https://linkedin.com/in/prathamsachan',
  },
  skills: [
    { name: 'Java', category: 'Backend' },
    { name: 'Spring', category: 'Backend' },
    { name: 'Spring Boot', category: 'Backend' },
    { name: 'Kafka', category: 'Backend' },
    { name: 'Confluent Kafka', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'Microsoft SQL Server', category: 'Backend' },
    { name: 'Oracle SQL Developer', category: 'Backend' },
    { name: 'JavaScript', category: 'Frontend' },
    { name: 'CSS', category: 'Frontend' },
    { name: 'ReactJS', category: 'Frontend' },
    { name: 'Angular', category: 'Frontend' },
    { name: 'Flutter', category: 'Frontend' },
    { name: 'Splunk', category: 'DevOps' },
    { name: 'Dynatrace', category: 'DevOps' },
    { name: 'C', category: 'Other' },
    { name: 'Swift', category: 'Other' },
    { name: 'Strategic planning', category: 'Business & Leadership' },
    { name: 'Team leadership', category: 'Business & Leadership' },
    { name: 'Partnerships & networking', category: 'Business & Leadership' },
    { name: 'Public speaking & debate', category: 'Business & Leadership' },
    { name: 'Fundraising & community outreach', category: 'Business & Leadership' },
    { name: 'Business management', category: 'Business & Leadership' },
  ],
  updatedAt: '2026-11-20',
}

export const projects: Project[] = [
  {
    id: 1,
    title: 'justcallmepratt.dev',
    description:
      'This site: a static Next.js app on Vercel that renders from content kept in its repository.',
    longDescription:
      'The public pages are static and served from Vercel. A Spring Boot API backed by Postgres is in the same repository, and runs on Railway; the pages read their content from it and fall back to the content file in the repo if it is unavailable.',
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Spring Boot'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Spring Boot', 'Postgres'],
    demoUrl: '',
    repoUrl: 'https://github.com/justcallmepratt/personal-web-app',
    imageUrl: '',
    featured: true,
    sortOrder: 1,
    createdAt: '2026-05-02',
  },
  {
    id: 2,
    title: 'Kafka Producer & Consumer Demo',
    description:
      'A modular Spring Boot application demonstrating a Kafka producer and consumer with PostgreSQL persistence. The live demo sends a record through a real broker.',
    longDescription:
      'A Maven multi-module Spring Boot application: a producer publishes records to a Kafka topic, a consumer reads them back and stores them in PostgreSQL, and a REST API exposes them.',
    tags: ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL'],
    stack: ['Java 21', 'Spring Boot', 'Spring Kafka', 'PostgreSQL', 'Docker'],
    demoUrl: '/projects/kafka',
    repoUrl: 'https://github.com/justcallmepratt/Kafka-Producer-Consumer-Demo',
    imageUrl: '',
    featured: true,
    sortOrder: 2,
    createdAt: '2026-02-08',
  },
  {
    id: 3,
    title: 'MinuteBoard',
    description:
      'A social platform for the UMass community to share images and videos. Built February to May 2023.',
    longDescription:
      'A social platform for the UMass community to share images and videos, built with Flutter, Firebase, React and OpenAI.',
    tags: ['Flutter', 'Firebase', 'React', 'OpenAI'],
    stack: ['Flutter', 'Firebase', 'React', 'OpenAI'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true,
    sortOrder: 3,
    createdAt: '2023-02-01',
  },
  {
    id: 9,
    title: 'Athlink: International Athlete Recruiting',
    description:
      'A clickable prototype of a recruiting platform connecting international student athletes with college coaches, with separate athlete and recruiter apps. The live demo runs on sample data.',
    longDescription:
      'A React and TypeScript prototype with two sides: athletes onboard, build a profile and get an AI-style evaluation report; recruiters search, compare and shortlist athletes. It began as Rocket Portal, a Techstars Startup Weekend concept in November 2025.',
    tags: ['React', 'TypeScript', 'Product', 'Startup'],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui'],
    // Hosted from its own repo and Vercel project, not on this site.
    demoUrl: 'https://athllinkmvp-demo.vercel.app/',
    repoUrl: 'https://github.com/justcallmepratt/Athllinkmvp-DEMO',
    imageUrl: '',
    featured: false,
    sortOrder: 4,
    createdAt: '2026-05-01',
  },
  {
    id: 5,
    title: 'Basketball Activity Recognition',
    description:
      'Classifies basketball movements such as dribbling and dunking from a wrist-worn phone\'s accelerometer and gyroscope, using hand-built signal features and a decision-tree model. UMass CS 328 group project.',
    longDescription:
      'Uses sensor streams from the Sensor Logger app and signal features such as dominant frequency, variance, range and magnitude to train a decision-tree classifier, with a Python visualisation of the classified sections.',
    tags: ['Machine Learning', 'Python', 'Sensors', 'UMass'],
    stack: ['Python', 'Decision Tree', 'Jupyter'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: false,
    sortOrder: 5,
    createdAt: '2023-09-01',
  },
  {
    id: 6,
    title: 'MOLD: Leasing Made Easy',
    description:
      'A rental platform concept for college towns, created with Talish Garg in a UMass startup course: tenant and landlord profiles, plain-language lease summaries, maintenance requests and messaging, plus a pricing and launch plan.',
    longDescription:
      'Separate tenant and landlord profiles, plain-language lease breakdowns, maintenance reporting, direct messaging and document storage. The plan covers a college-town beachhead market, a $30-a-month price, a soft-launch MVP test and a pivot plan.',
    tags: ['Startup', 'Product', 'UMass'],
    stack: [],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: false,
    sortOrder: 6,
    createdAt: '2023-10-01',
  },
  {
    id: 7,
    title: 'Project eM: Atari Emulator Console',
    description:
      'An Atari 2600 console on a Raspberry Pi 4 with a custom Arduino controller: a 3D-printed joystick, hand-motion control from ultrasonic and IR sensors, and voice commands. Built with Danny Vicario at UMass.',
    longDescription:
      'Designed to run Atari 2600 games through RetroPie on a Raspberry Pi 4, with a 3D-printed joystick, ultrasonic and IR sensors for hand-motion control, and voice commands for buttons.',
    tags: ['Hardware', 'Raspberry Pi', 'Arduino', 'UMass'],
    stack: ['Raspberry Pi 4', 'RetroPie', 'Arduino'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: false,
    sortOrder: 7,
    createdAt: '2021-10-01',
  },
  {
    id: 4,
    title: 'Smart Course Selection App',
    description:
      'A prototype that guides high-school students through choosing courses, built on my AP Research paper "The Art and Science of Course Selection". May 2019 to February 2020.',
    longDescription:
      'A prototype application guiding high-school students through course selection, which grew out of my AP Research paper "The Art and Science of Course Selection".',
    tags: ['Prototype', 'Research', 'High School'],
    stack: [],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: false,
    sortOrder: 8,
    createdAt: '2019-05-01',
  },
  {
    id: 8,
    title: 'FIRST Robotics: Team 79 Krunch',
    description:
      'Three seasons designing, building and troubleshooting competition robots with East Lake High School\'s FIRST team, including a term as Spirit lead. Team Spirit award at the Orlando regional in 2018 and 2019.',
    longDescription:
      'Took part in brainstorming, design, prototyping, assembly and troubleshooting of the competition robot, and in the team\'s STEM outreach at local schools. Awarded a varsity letter in robotics in 2019.',
    tags: ['Robotics', 'Leadership', 'High School'],
    stack: [],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: false,
    sortOrder: 9,
    createdAt: '2017-08-01',
  },
]

// Ideas with no code yet, shown under "In the works" on /projects, below the
// real projects. Keep them out of `projects`: no links, no dates, never featured.
// When one ships, move it to `projects` and delete it here.
export const plannedProjects: PlannedProject[] = [
  {
    id: 1,
    name: 'Elgato Stream Deck plugin pack',
    goal: 'A set of Stream Deck plugins and profiles for common setups: office, gaming, streaming and development.',
  },
  {
    id: 3,
    name: 'Google Email Sorter',
    goal: 'Sorting Gmail with AI-suggested labels, with a dry-run review step and no deletion.',
  },
  {
    id: 4,
    name: 'Google Drive Sorter',
    goal: 'Organising Google Drive into a sensible folder structure, with preview and rollback.',
  },
  {
    id: 5,
    name: 'Google Bookmark Sorter',
    goal: 'Categorising and de-duplicating browser bookmarks and finding dead links.',
  },
  {
    id: 6,
    name: 'Deal Watch',
    goal: 'Scheduled agents that watch sale-season prices against a wish list and only alert on deals worth acting on.',
  },
  {
    id: 7,
    name: 'TV Cleanup',
    goal: 'Debloating a Google TV with the open-source CleanYourTV tool: no ads or telemetry, a plain launcher, and a one-command restore.',
  },
]

export const experience: Experience[] = [
  {
    id: 1,
    company: 'Raymond James',
    role: 'Backend Software Developer',
    location: 'Tampa, FL',
    startDate: '2024-07-01',
    endDate: null,
    current: true,
    description:
      'Application developer working with Spring Boot and Java (Amazon Corretto), Kafka and Confluent Kafka, SQL databases, and Splunk and Dynatrace.',
    highlights: [
      'Worked on a publish-subscribe Kafka service supporting a legacy database',
      'Worked with data-intensive applications',
    ],
    technologies: [
      'Java (Amazon Corretto)', 'Spring', 'Spring Boot', 'Kafka', 'Confluent Kafka',
      'Oracle SQL Developer', 'Microsoft SQL Server', 'Splunk', 'Dynatrace',
    ],
    sortOrder: 1,
  },
  {
    id: 2,
    company: 'Raymond James',
    role: 'Software Engineering Intern',
    location: 'Tampa, FL',
    startDate: '2023-06-01',
    // End date not confirmed by the owner: with `current: false` and no end
    // date the timeline shows the start month only.
    endDate: null,
    current: false,
    description:
      'Built an OpenAI GPT-4 based AngularJS application that applies codebase improvements suggested by a third-party code-quality API.',
    highlights: [],
    technologies: ['OpenAI GPT-4', 'AngularJS'],
    sortOrder: 2,
  },
  {
    id: 3,
    company: 'Blackstraw AI',
    role: 'Data Science Intern',
    location: 'Tampa, FL',
    startDate: '2021-06-01',
    endDate: '2021-08-01',
    current: false,
    description:
      'Built a Python machine-learning application using reinforcement learning and GAN models for resume shortlisting.',
    highlights: ['75% less shortlisting time and 60% better shortlisting accuracy'],
    technologies: ['Python', 'Reinforcement Learning', 'GANs'],
    sortOrder: 3,
  },
]

// Shown on /certifications. Only `name` and `issuer` are required; add `date`
// (ISO: '2023', '2023-05' or '2023-05-14'), `credentialId` and `url` when known.
export const certifications: Certification[] = [
  { id: 1, name: 'Microsoft Technology Associate', issuer: 'Microsoft', sortOrder: 1 },
  // Courses rather than certifications: on /certifications, not on the resume.
  { id: 2, name: 'Java Programming Masterclass', issuer: 'Udemy', resume: false, sortOrder: 2 },
  { id: 3, name: 'TensorFlow', issuer: 'Udemy', resume: false, sortOrder: 3 },
]

// Shown on /certifications and on the resume. Only `degree` and `institution`
// are required. `year` (ISO: '2024' or '2024-05') is left out until the owner
// confirms the graduation date; add `honours`, `url` and `imageUrl` when known.
export const education: Education[] = [
  {
    id: 1,
    degree: "Bachelor's in Computer Science",
    minor: 'Business Management',
    institution: 'University of Massachusetts Amherst',
    sortOrder: 1,
  },
]

// Shown on the resume only. Dates are ISO ('2023-01'); a role with a start
// date, no end date and no `current: true` shows its start month only.
export const leadership: Leadership[] = [
  {
    id: 1,
    role: 'Mentor for new post-college associates',
    organization: 'Raymond James',
    sortOrder: 1,
  },
]

// Research papers, shown on /research. Repo content only. Summaries come from
// the papers themselves. The PDFs are served from frontend/public/research.
export const research: Research[] = [
  {
    id: 1,
    title: 'How Generative AI Affects Customer Experience in Fintech',
    date: '2023-07',
    url: '/research/generative-ai-fintech-2023.pdf',
    summary:
      'A literature review of generative AI and large language models in financial services, with case studies of Capital One and American Express. It concludes that generative AI can make financial services more personal and cheaper to deliver, though most firms were still a year or two from using it.',
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'The Art and Science of Course Selection',
    context: 'AP Research, East Lake High School',
    date: '2020-05',
    url: '/research/course-selection-ap-research-2020.pdf',
    // High-school work: on /research, but not on the resume.
    resume: false,
    summary:
      'A mixed-methods survey of high-school students who had taken career and technical courses, asking what should guide course choices. 94% wanted help choosing courses but only 44% had used online tools; the paper concludes there is no one-size-fits-all rule, and students refine their choices with help from school staff, parents and peers.',
    sortOrder: 2,
  },
]
