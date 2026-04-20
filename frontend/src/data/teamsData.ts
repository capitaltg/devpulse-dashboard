import { contributors, type Contributor } from './mockData';

export interface Team {
  id: string;
  name: string;
  description: string;
  icon: string;
  members: string[]; // usernames
  repos: string[];
}

export const teams: Team[] = [
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'Web applications, design system, and client-side tooling',
    icon: '🎨',
    members: ['alex-kim', 'pat-wilson', 'sarah-chen'],
    repos: ['web-dashboard', 'design-system'],
  },
  {
    id: 'backend',
    name: 'Backend',
    description: 'Core APIs, authentication, and server infrastructure',
    icon: '⚙️',
    members: ['sarah-chen', 'taylor-jones'],
    repos: ['platform-api', 'auth-service'],
  },
  {
    id: 'data-ml',
    name: 'Data & ML',
    description: 'Data pipelines, machine learning models, and analytics',
    icon: '📊',
    members: ['casey-zhang', 'morgan-davis', 'pat-wilson'],
    repos: ['data-pipeline', 'ml-models'],
  },
  {
    id: 'mobile',
    name: 'Mobile',
    description: 'Cross-platform mobile SDK and native integrations',
    icon: '📱',
    members: ['jordan-lee'],
    repos: ['mobile-sdk'],
  },
  {
    id: 'devops',
    name: 'DevOps',
    description: 'Infrastructure, CI/CD, and cloud deployments',
    icon: '🔧',
    members: ['riley-brown'],
    repos: ['infra-terraform'],
  },
];

export function getTeamMembers(team: Team): Contributor[] {
  return contributors.filter((c) => team.members.includes(c.username));
}

export function getTeamStats(team: Team) {
  const members = getTeamMembers(team);
  return {
    totalMembers: members.length,
    totalCommits30d: members.reduce((s, m) => s + m.commits30d, 0),
    totalPRsOpened: members.reduce((s, m) => s + m.prsOpened, 0),
    totalPRsMerged: members.reduce((s, m) => s + m.prsMerged, 0),
    totalIssuesClosed: members.reduce((s, m) => s + m.issuesClosed, 0),
    totalLinesAdded: members.reduce((s, m) => s + m.linesAdded, 0),
    totalLinesRemoved: members.reduce((s, m) => s + m.linesRemoved, 0),
  };
}
