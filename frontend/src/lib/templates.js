/**
 * templates.js
 * The three ways a Sheaf document can be set, plus the accent inks it can be
 * printed in, plus the empty and demo documents.
 */

export const TEMPLATES = [
  {
    id: 'quarto',
    name: 'Quarto',
    tagline: 'Single column, generous leading',
    description:
      'One measure down the page with wide margins. The safest thing to put in front of an applicant tracking system, and the easiest to read on a phone.',
    bestFor: 'Applications through a job board or ATS',
    columns: 1,
  },
  {
    id: 'folio',
    name: 'Folio',
    tagline: 'Sidebar for the scannable facts',
    description:
      'Contact details, skills, and education sit in a narrow rail so the main column belongs entirely to your experience.',
    bestFor: 'Direct applications and recruiter inboxes',
    columns: 2,
  },
  {
    id: 'broadside',
    name: 'Broadside',
    tagline: 'A masthead, then the record',
    description:
      'Opens with your name set large across the full measure, like a title page. Best when the name on the page already means something to the reader.',
    bestFor: 'Senior roles, portfolios, speaker bios',
    columns: 1,
  },
];

export const ACCENTS = [
  { id: 'brass', name: 'Brass', hex: '#C9821F' },
  { id: 'verdigris', name: 'Verdigris', hex: '#217A6E' },
  { id: 'ink', name: 'Ink', hex: '#10141C' },
  { id: 'rust', name: 'Rust', hex: '#C4562F' },
  { id: 'indigo', name: 'Indigo', hex: '#374A8C' },
  { id: 'plum', name: 'Plum', hex: '#7A3B5E' },
];

export const DENSITIES = [
  { id: 'airy', name: 'Airy', note: 'More white space, fewer lines per page' },
  { id: 'regular', name: 'Regular', note: 'The default measure' },
  { id: 'tight', name: 'Tight', note: 'Fits more on one sheet' },
];

export const emptyExperience = () => ({
  id: crypto.randomUUID?.() ?? String(Math.random()),
  role: '',
  company: '',
  location: '',
  start: '',
  end: '',
  current: false,
  bullets: [''],
});

export const emptyEducation = () => ({
  id: crypto.randomUUID?.() ?? String(Math.random()),
  degree: '',
  school: '',
  location: '',
  start: '',
  end: '',
  note: '',
});

export const emptyProject = () => ({
  id: crypto.randomUUID?.() ?? String(Math.random()),
  name: '',
  link: '',
  stack: '',
  bullets: [''],
});

export const blankResume = (title = 'Untitled document') => ({
  title,
  kind: 'resume',
  basics: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    summary: '',
  },
  experience: [emptyExperience()],
  education: [emptyEducation()],
  skills: [],
  projects: [emptyProject()],
  design: { template: 'folio', accent: 'brass', density: 'regular', showPhoto: false },
});

/** Pre-filled document offered on the empty dashboard, so nobody starts cold. */
export const sampleResume = () => ({
  ...blankResume('Frontend engineer — sample'),
  basics: {
    fullName: 'Ayesha Rahman',
    headline: 'Frontend engineer',
    email: 'ayesha@example.com',
    phone: '+92 300 0000000',
    location: 'Islamabad, PK',
    website: 'ayesha.dev',
    github: 'ayesharahman',
    linkedin: 'ayesharahman',
    summary:
      'Frontend engineer who cares about the parts of an interface people notice only when they are wrong: focus order, empty states, and how fast the first screen paints.',
  },
  experience: [
    {
      id: 'x1',
      role: 'Frontend engineer',
      company: 'Northline',
      location: 'Remote',
      start: '2024',
      end: '',
      current: true,
      bullets: [
        'Cut first contentful paint from 3.1s to 1.2s by splitting the vendor bundle and deferring the analytics script.',
        'Rebuilt the checkout form as a controlled multi-step flow, which lifted completion from 61% to 78%.',
        'Set up the component library and its documentation, now used by 4 product teams.',
      ],
    },
    {
      id: 'x2',
      role: 'Junior developer',
      company: 'Parcel Studio',
      location: 'Islamabad, PK',
      start: '2022',
      end: '2024',
      current: false,
      bullets: [
        'Shipped 12 client marketing sites on a shared Next.js base, averaging 9 days from brief to launch.',
        'Introduced visual regression tests that caught 30+ layout breaks before they reached a client.',
      ],
    },
  ],
  education: [
    {
      id: 'e1',
      degree: 'BS Computer Science',
      school: 'NUST',
      location: 'Islamabad, PK',
      start: '2018',
      end: '2022',
      note: 'Final year project: an offline-first field survey app used by 200 enumerators.',
    },
  ],
  skills: [
    'React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js',
    'PostgreSQL', 'Playwright', 'Figma', 'Accessibility (WCAG 2.2)',
  ],
  projects: [
    {
      id: 'p1',
      name: 'Ledgerline',
      link: 'github.com/example/ledgerline',
      stack: 'React, IndexedDB, Vite',
      bullets: [
        'Offline expense tracker that reconciles on reconnect without a server round trip per edit.',
        'Holds 40k records in IndexedDB and still filters in under 16ms.',
      ],
    },
  ],
  design: { template: 'folio', accent: 'brass', density: 'regular', showPhoto: false },
});
