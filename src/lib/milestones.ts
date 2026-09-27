type Milestone = {
  minYears: number;
  status: string;
  badge: string;
  tier: string;
  title: string;
  summary: string;
  sayings: string[];
};

const GITVERSARY_MILESTONES: Milestone[] = [
  {
    minYears: 1,
    status: 'LGTM',
    badge: 'README Rookie',
    tier: 'rookie',
    title: 'Fresh Committer',
    summary:
      'A year of learning, building, experimenting, and discovering that there is always one more thing to commit.',
    sayings: [
      'Welcome to the rabbit hole.',
      '1 year. 47,392 tabs.',
      'Still asking what `git rebase` does.',
      'You pushed to main. Be honest.',
    ],
  },

  {
    minYears: 2,
    status: 'MERGED',
    badge: 'PR Survivor',
    tier: 'rising',
    title: 'PR Enthusiast',
    summary:
      '{YearsWords} years of pull requests, code reviews, questionable branches, and slowly developing strong opinions about how things should be done.',
    sayings: [
      "You've earned your first `it works on my machine`.",
      "You've started saying “let's open a PR.”",
      'Still not sure who approved that PR.',
      'You now have opinions about tabs vs spaces.',
    ],
  },

  {
    minYears: 3,
    status: 'SHIP IT',
    badge: 'Merge Conflict Survivor',
    tier: 'seasoned',
    title: 'Branch Wrangler',
    summary:
      '{YearsWords} years of turning ideas into code, code into pull requests, and pull requests into things that somehow made it to production.',
    sayings: [
      '{years} years of shipping and reverting.',
      'Commit history: increasingly suspicious.',
      'Your `TODO`s have grandchildren.',
      'You now know which button deploys to production.',
    ],
  },

  {
    minYears: 5,
    status: 'LGTM*',
    badge: 'Stack Overflow Alumni',
    tier: 'experienced',
    title: 'Senior Googler',
    summary:
      '{YearsWords} years of shipping, debugging, searching, learning, and developing the highly specialized skill of knowing exactly what to Google.',
    sayings: [
      'You now have strong opinions about CI.',
      'Half developer, half Stack Overflow archaeologist.',
      "You don't fear merge conflicts anymore. You fear the person who caused them.",
      '{years} years. Zero clean commit histories.',
    ],
  },

  {
    minYears: 7,
    status: 'git blame',
    badge: 'git blame Certified',
    tier: 'veteran',
    title: 'Repository Veteran',
    summary:
      '{YearsWords} years of commits and collaboration have given you something no documentation can fully capture: the ability to recognize a familiar bug before it introduces itself.',
    sayings: [
      "You've seen things. Mostly merge conflicts.",
      "You've seen this bug before.",
      'At this point, Git knows more about you than your therapist.',
      'You remember why this code exists. Probably.',
    ],
  },

  {
    minYears: 10,
    status: 'LEGACY',
    badge: 'Legacy Code Survivor',
    tier: 'elite',
    title: 'Ancient Committer',
    summary:
      'A decade of code, collaboration, shipping, breaking things, fixing them, and doing it all again. Your commit history is no longer just history.',
    sayings: [
      'You know where the bodies are buried.',
      'Your first commit is old enough to have a job.',
      "You've outlived three JavaScript frameworks.",
      "You don't write legacy code. You create history.",
    ],
  },

  {
    minYears: 12,
    status: 'ARCHIVED',
    badge: 'README Historian',
    tier: 'legendary',
    title: 'Historical Figure',
    summary:
      '{YearsWords} years of commits have transformed your GitHub history from a collection of projects into a surprisingly detailed record of software history.',
    sayings: [
      'Your GitHub account is now a historical artifact.',
      'Your commits have seniority.',
      'Some of your dependencies have retirement plans.',
      'Your oldest repo has entered the fossil record.',
    ],
  },

  {
    minYears: 15,
    status: 'APPROVED BY OCTOCAT',
    badge: 'Merge Conflict Veteran',
    tier: 'legendary',
    title: 'GitHub Elder',
    summary:
      '{YearsWords} years of building, debugging, shipping, and surviving enough technology cycles to remember when today’s best practices were tomorrow’s bad ideas.',
    sayings: [
      '{years} years. Please stop rebasing.',
      'You have commits older than some startups.',
      'Your GitHub account can legally drive.',
      'You remember when GitHub was the new kid.',
      "At this point, you don't use Git. Git uses you.",
      '`git blame` points directly at you.',
    ],
  },

  {
    minYears: 18,
    status: 'OG',
    badge: 'Octocat Approved',
    tier: 'mythic',
    title: 'GitHub OG',
    summary:
      '{YearsWords} years of commits, projects, pull requests, and platform evolution. You didn’t just use GitHub—you watched an entire era of software development grow around it.',
    sayings: [
      'You were here when GitHub was still the new kid.',
      '{years} years. That’s not a streak. That’s tenure.',
      'Your GitHub account is old enough to remember the early days.',
      "You've been committing longer than some developers have been coding.",
      'The Octocat remembers you.',
    ],
  },

  {
    minYears: 20,
    status: 'LEGENDARY',
    badge: 'Commit History: Legendary',
    tier: 'legendary',
    title: 'GitHub Ancient',
    summary:
      'Two decades of version control, collaboration, open source, and shipping software. At this point, your GitHub history deserves its own changelog.',
    sayings: [
      'You have commits older than some startups.',
      'Your first commit belongs in a museum.',
      'The commit history is now a family tree.',
      'GitHub should be asking you for advice.',
      'At this point, Git uses you.',
    ],
  },

  {
    minYears: 25,
    status: 'OCTOCAT BOWS',
    badge: 'git log Archaeologist',
    tier: 'mythical',
    title: 'Git Archaeologist',
    summary:
      '{YearsWords} years of software history compressed into one GitHub account. Your commit log is no longer a development tool—it is an archaeological site.',
    sayings: [
      'Please tell us what GitHub was like in the old days.',
      'Your commit history is now historical documentation.',
      'Some of your commits qualify as ancient history.',
      'At this point, `git log` is an autobiography.',
      "You've survived more frameworks than most developers have tried.",
    ],
  },

  {
    minYears: 30,
    status: 'ROOT ACCESS',
    badge: 'Repository Overlord',
    tier: 'transcendent',
    title: 'Git Deity',
    summary:
      '{YearsWords} years of building software, solving problems, and accumulating enough version-control experience that even merge conflicts know better than to challenge you.',
    sayings: [
      'You remember when GitHub was new.',
      "You don't push code. You bless repositories.",
      'The merge conflict resolves itself out of respect.',
      'GitHub has started asking you for permission.',
      'Your `git blame` history has historical significance.',
    ],
  },

  {
    minYears: 35,
    status: 'MYTHICAL',
    badge: 'Commit Log Mythology',
    tier: 'mythical',
    title: 'Commit Legend',
    summary:
      '{YearsWords} years of software history. Your commits have outlived frameworks, trends, and probably a few programming languages. At this point, the stories tell themselves.',
    sayings: [
      'Legend says your first commit is still running in production.',
      'You have achieved enlightenment through version control.',
      'The Octocat tells stories about you.',
      'Your GitHub account has become a natural landmark.',
      'Nobody knows what you committed. Nobody dares delete it.',
    ],
  },

  {
    minYears: 40,
    status: 'UNTOUCHABLE',
    badge: 'Root of All Repos',
    tier: 'immortal',
    title: 'The Maintainer',
    summary:
      '{YearsWords} years of software, commits, and keeping things running. There are no more milestones left to unlock—only repositories left to maintain.',
    sayings: [
      'You were here before the branch was invented.',
      "GitHub doesn't have a badge for this. Yet.",
      'Your `git blame` history belongs in a museum.',
      "At this point, you're technically part of Git infrastructure.",
      'Please stop. There are no more achievements.',
    ],
  },
];

function numberToWords(number: number): string {
  const ones = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];

  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  if (number < 20) return ones[number];

  if (number < 100) {
    const remainder = number % 10;

    return remainder
      ? `${tens[Math.floor(number / 10)]}-${ones[remainder]}`
      : tens[Math.floor(number / 10)];
  }

  return String(number);
}

function resolveTemplate(template: string, years: number): string {
  const yearsWords = numberToWords(years);

  return template
    .replaceAll('{years}', String(years))
    .replaceAll('{yearsWords}', yearsWords)
    .replaceAll('{YearsWords}', yearsWords.charAt(0).toUpperCase() + yearsWords.slice(1));
}

type GetMilestoneDataParams = {
  username: string;
  years: number;
};

type MilestoneData = Omit<Milestone, 'sayings' | 'minYears'> & {
  summary: string;
  saying: string;
};

export function getMilestoneData({
  username,
  years,
}: GetMilestoneDataParams): MilestoneData | null {
  const data = [...GITVERSARY_MILESTONES]
    .reverse()
    .find((milestone) => years >= milestone.minYears);

  if (!data) return null;

  const sayingIndex = getSayingIndex(username, data.sayings);

  return {
    ...data,
    sayings: undefined,
    minYears: undefined,

    summary: resolveTemplate(data.summary, years),
    saying: resolveTemplate(data.sayings[sayingIndex], years),
  };
}

function getSayingIndex(username: string, sayings: string[]): number {
  const hash = [...username].reduce((total, character) => total + character.charCodeAt(0), 0);

  return hash % sayings.length;
}
