export interface WorkflowRun {
  id: number;
  name: string;
  repo: string;
  status: 'success' | 'failure' | 'in_progress' | 'cancelled';
  duration: string;
  durationMs: number;
  trigger: string;
  branch: string;
  timestamp: string;
}

export interface RepoWorkflowStats {
  totalRuns30d: number;
  successRate: number;
  avgDurationMs: number;
  failedRuns30d: number;
}

export interface Repository {
  id: number;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  lastUpdated: string;
  private: boolean;
  topics: string[];
  commits30d: number;
  contributors: number;
  linesAdded: number;
  linesRemoved: number;
  workflowStats: RepoWorkflowStats;
}

export interface ActivityEvent {
  id: number;
  type: 'push' | 'pr_opened' | 'pr_merged' | 'issue_opened' | 'issue_closed' | 'release';
  repo: string;
  actor: string;
  message: string;
  timestamp: string;
}

export interface OrgStats {
  totalRepos: number;
  totalContributors: number;
  totalCommits30d: number;
  openPRs: number;
  openIssues: number;
  mergedPRs7d: number;
  workflowRuns30d: number;
  workflowSuccessRate: number;
}

export const orgStats: OrgStats = {
  totalRepos: 47,
  totalContributors: 128,
  totalCommits30d: 1842,
  openPRs: 23,
  openIssues: 67,
  mergedPRs7d: 31,
  workflowRuns30d: 1927,
  workflowSuccessRate: 91.6,
};

export const repositories: Repository[] = [
  {
    id: 1, name: 'platform-api', description: 'Core platform REST API powering all services',
    language: 'TypeScript', stars: 342, forks: 89, openIssues: 12, openPRs: 4,
    lastUpdated: '2 hours ago', visibility: 'public', topics: ['api', 'rest', 'typescript'],
    commits30d: 156, contributors: 24, linesAdded: 8420, linesRemoved: 3210,
    workflowStats: { totalRuns30d: 312, successRate: 94.2, avgDurationMs: 186000, failedRuns30d: 18 },
  },
  {
    id: 2, name: 'web-dashboard', description: 'Internal analytics and monitoring dashboard',
    language: 'React', stars: 128, forks: 34, openIssues: 8, openPRs: 3,
    lastUpdated: '4 hours ago', visibility: 'private', topics: ['react', 'dashboard', 'analytics'],
    commits30d: 203, contributors: 16, linesAdded: 12300, linesRemoved: 5400,
    workflowStats: { totalRuns30d: 408, successRate: 91.7, avgDurationMs: 142000, failedRuns30d: 34 },
  },
  {
    id: 3, name: 'auth-service', description: 'Authentication and authorization microservice',
    language: 'Go', stars: 267, forks: 56, openIssues: 5, openPRs: 2,
    lastUpdated: '1 day ago', visibility: 'public', topics: ['auth', 'oauth', 'go'],
    commits30d: 78, contributors: 9, linesAdded: 3200, linesRemoved: 1100,
    workflowStats: { totalRuns30d: 156, successRate: 97.4, avgDurationMs: 94000, failedRuns30d: 4 },
  },
  {
    id: 4, name: 'data-pipeline', description: 'ETL pipeline for data warehouse ingestion',
    language: 'Python', stars: 89, forks: 21, openIssues: 15, openPRs: 6,
    lastUpdated: '6 hours ago', visibility: 'private', topics: ['python', 'etl', 'data'],
    commits30d: 134, contributors: 11, linesAdded: 6700, linesRemoved: 2800,
    workflowStats: { totalRuns30d: 267, successRate: 86.5, avgDurationMs: 324000, failedRuns30d: 36 },
  },
  {
    id: 5, name: 'mobile-sdk', description: 'Cross-platform mobile SDK for client integrations',
    language: 'Kotlin', stars: 456, forks: 112, openIssues: 22, openPRs: 5,
    lastUpdated: '3 hours ago', visibility: 'public', topics: ['mobile', 'sdk', 'kotlin'],
    commits30d: 98, contributors: 18, linesAdded: 5400, linesRemoved: 2100,
    workflowStats: { totalRuns30d: 196, successRate: 89.3, avgDurationMs: 278000, failedRuns30d: 21 },
  },
  {
    id: 6, name: 'infra-terraform', description: 'Infrastructure as code for cloud deployments',
    language: 'HCL', stars: 67, forks: 15, openIssues: 3, openPRs: 1,
    lastUpdated: '2 days ago', visibility: 'private', topics: ['terraform', 'infrastructure', 'aws'],
    commits30d: 42, contributors: 6, linesAdded: 1800, linesRemoved: 900,
    workflowStats: { totalRuns30d: 84, successRate: 96.4, avgDurationMs: 210000, failedRuns30d: 3 },
  },
  {
    id: 7, name: 'design-system', description: 'Shared component library and design tokens',
    language: 'TypeScript', stars: 198, forks: 43, openIssues: 7, openPRs: 3,
    lastUpdated: '1 hour ago', visibility: 'public', topics: ['design-system', 'components', 'react'],
    commits30d: 187, contributors: 14, linesAdded: 9800, linesRemoved: 4300,
    workflowStats: { totalRuns30d: 374, successRate: 92.8, avgDurationMs: 118000, failedRuns30d: 27 },
  },
  {
    id: 8, name: 'ml-models', description: 'Machine learning model training and serving',
    language: 'Python', stars: 312, forks: 78, openIssues: 9, openPRs: 4,
    lastUpdated: '12 hours ago', visibility: 'public', topics: ['ml', 'python', 'tensorflow'],
    commits30d: 65, contributors: 8, linesAdded: 4200, linesRemoved: 1600,
    workflowStats: { totalRuns30d: 130, successRate: 84.6, avgDurationMs: 542000, failedRuns30d: 20 },
  },
];

export const workflowRuns: WorkflowRun[] = [
  { id: 1, name: 'CI / Test', repo: 'platform-api', status: 'success', duration: '3m 6s', durationMs: 186000, trigger: 'push', branch: 'main', timestamp: '25 min ago' },
  { id: 2, name: 'CI / Build', repo: 'web-dashboard', status: 'failure', duration: '2m 22s', durationMs: 142000, trigger: 'pull_request', branch: 'feat/charts', timestamp: '1 hour ago' },
  { id: 3, name: 'CI / Lint + Test', repo: 'design-system', status: 'success', duration: '1m 58s', durationMs: 118000, trigger: 'push', branch: 'main', timestamp: '1 hour ago' },
  { id: 4, name: 'Deploy / Staging', repo: 'platform-api', status: 'success', duration: '4m 12s', durationMs: 252000, trigger: 'push', branch: 'main', timestamp: '2 hours ago' },
  { id: 5, name: 'CI / Test', repo: 'data-pipeline', status: 'failure', duration: '5m 24s', durationMs: 324000, trigger: 'pull_request', branch: 'feat/snowflake', timestamp: '4 hours ago' },
  { id: 6, name: 'CI / Build + Test', repo: 'mobile-sdk', status: 'success', duration: '4m 38s', durationMs: 278000, trigger: 'push', branch: 'release/2.4', timestamp: '3 hours ago' },
  { id: 7, name: 'CI / Test', repo: 'auth-service', status: 'success', duration: '1m 34s', durationMs: 94000, trigger: 'push', branch: 'feature/mfa', timestamp: '5 hours ago' },
  { id: 8, name: 'ML / Train', repo: 'ml-models', status: 'in_progress', duration: '9m 2s', durationMs: 542000, trigger: 'push', branch: 'experiment/bert-v2', timestamp: '10 hours ago' },
  { id: 9, name: 'Deploy / Prod', repo: 'infra-terraform', status: 'success', duration: '3m 30s', durationMs: 210000, trigger: 'push', branch: 'main', timestamp: '8 hours ago' },
  { id: 10, name: 'CI / Test', repo: 'platform-api', status: 'cancelled', duration: '1m 12s', durationMs: 72000, trigger: 'pull_request', branch: 'fix/pool-leak', timestamp: '6 hours ago' },
];

export const activityFeed: ActivityEvent[] = [
  { id: 1, type: 'pr_merged', repo: 'platform-api', actor: 'sarah-chen', message: 'Merged: Add rate limiting middleware', timestamp: '23 min ago' },
  { id: 2, type: 'push', repo: 'design-system', actor: 'alex-kim', message: 'Pushed 3 commits to main', timestamp: '1 hour ago' },
  { id: 3, type: 'release', repo: 'mobile-sdk', actor: 'jordan-lee', message: 'Released v2.4.0', timestamp: '2 hours ago' },
  { id: 4, type: 'issue_opened', repo: 'web-dashboard', actor: 'pat-wilson', message: 'Opened: Chart rendering slow on large datasets', timestamp: '3 hours ago' },
  { id: 5, type: 'pr_opened', repo: 'data-pipeline', actor: 'casey-zhang', message: 'Opened: Add Snowflake connector', timestamp: '4 hours ago' },
  { id: 6, type: 'push', repo: 'auth-service', actor: 'taylor-jones', message: 'Pushed 1 commit to feature/mfa', timestamp: '5 hours ago' },
  { id: 7, type: 'issue_closed', repo: 'platform-api', actor: 'sarah-chen', message: 'Closed: Memory leak in connection pool', timestamp: '6 hours ago' },
  { id: 8, type: 'pr_merged', repo: 'infra-terraform', actor: 'riley-brown', message: 'Merged: Upgrade to Terraform 1.6', timestamp: '8 hours ago' },
  { id: 9, type: 'push', repo: 'ml-models', actor: 'morgan-davis', message: 'Pushed 5 commits to experiment/bert-v2', timestamp: '10 hours ago' },
  { id: 10, type: 'release', repo: 'platform-api', actor: 'sarah-chen', message: 'Released v3.12.1', timestamp: '12 hours ago' },
];

export const languageDistribution = [
  { language: 'TypeScript', percentage: 38, color: 'hsl(217, 91%, 60%)' },
  { language: 'Python', percentage: 22, color: 'hsl(142, 71%, 45%)' },
  { language: 'Go', percentage: 15, color: 'hsl(190, 90%, 50%)' },
  { language: 'Kotlin', percentage: 12, color: 'hsl(275, 80%, 60%)' },
  { language: 'HCL', percentage: 8, color: 'hsl(38, 92%, 50%)' },
  { language: 'Other', percentage: 5, color: 'hsl(215, 16%, 47%)' },
];

export const commitActivity = [
  { week: 'W1', commits: 312 },
  { week: 'W2', commits: 428 },
  { week: 'W3', commits: 389 },
  { week: 'W4', commits: 502 },
  { week: 'W5', commits: 211 },
];

// Generate a 52-week commit heatmap (7 days x 52 weeks)
function generateHeatmapData(seed: number = 1): number[] {
  const data: number[] = [];
  for (let i = 0; i < 364; i++) {
    const rand = Math.sin(seed * i * 0.1) * 0.5 + 0.5;
    const dayOfWeek = i % 7;
    const weekendPenalty = dayOfWeek >= 5 ? 0.3 : 1;
    const val = Math.floor(rand * 12 * weekendPenalty);
    data.push(val);
  }
  return data;
}

export const orgCommitHeatmap = generateHeatmapData(1);

export const repoCommitHeatmaps: Record<string, number[]> = {
  'platform-api': generateHeatmapData(2),
  'web-dashboard': generateHeatmapData(3),
  'auth-service': generateHeatmapData(4),
  'data-pipeline': generateHeatmapData(5),
  'mobile-sdk': generateHeatmapData(6),
  'infra-terraform': generateHeatmapData(7),
  'design-system': generateHeatmapData(8),
  'ml-models': generateHeatmapData(9),
};

export const userCommitHeatmaps: Record<string, number[]> = {
  'sarah-chen': generateHeatmapData(10),
  'alex-kim': generateHeatmapData(11),
  'jordan-lee': generateHeatmapData(12),
  'pat-wilson': generateHeatmapData(13),
  'casey-zhang': generateHeatmapData(14),
  'taylor-jones': generateHeatmapData(15),
  'riley-brown': generateHeatmapData(16),
  'morgan-davis': generateHeatmapData(17),
};

export const weeklyActivity = [
  { week: 'W1', commits: 312, prsOpened: 28, prsMerged: 22, workflowRuns: 380 },
  { week: 'W2', commits: 428, prsOpened: 35, prsMerged: 31, workflowRuns: 456 },
  { week: 'W3', commits: 389, prsOpened: 31, prsMerged: 27, workflowRuns: 412 },
  { week: 'W4', commits: 502, prsOpened: 42, prsMerged: 38, workflowRuns: 520 },
  { week: 'W5', commits: 211, prsOpened: 19, prsMerged: 14, workflowRuns: 289 },
];

export const orgWorkflowBreakdown = [
  { name: 'Success', value: 1764, color: 'hsl(142, 71%, 45%)' },
  { name: 'Failed', value: 163, color: 'hsl(0, 84%, 60%)' },
  { name: 'Cancelled', value: 42, color: 'hsl(215, 16%, 47%)' },
  { name: 'In Progress', value: 8, color: 'hsl(38, 92%, 50%)' },
];

export const prCycleTime = [
  { week: 'W1', avgHours: 18.4, medianHours: 12.1 },
  { week: 'W2', avgHours: 15.2, medianHours: 10.8 },
  { week: 'W3', avgHours: 22.1, medianHours: 14.5 },
  { week: 'W4', avgHours: 13.6, medianHours: 9.2 },
  { week: 'W5', avgHours: 16.8, medianHours: 11.4 },
];

export const repoPRCycleTime: Record<string, { week: string; avgHours: number; medianHours: number }[]> = {
  'platform-api': [
    { week: 'W1', avgHours: 14.2, medianHours: 9.8 },
    { week: 'W2', avgHours: 11.5, medianHours: 8.2 },
    { week: 'W3', avgHours: 18.3, medianHours: 12.1 },
    { week: 'W4', avgHours: 10.1, medianHours: 7.4 },
    { week: 'W5', avgHours: 13.8, medianHours: 9.6 },
  ],
  'web-dashboard': [
    { week: 'W1', avgHours: 22.1, medianHours: 16.3 },
    { week: 'W2', avgHours: 19.4, medianHours: 14.1 },
    { week: 'W3', avgHours: 25.8, medianHours: 18.2 },
    { week: 'W4', avgHours: 17.2, medianHours: 12.5 },
    { week: 'W5', avgHours: 20.6, medianHours: 15.1 },
  ],
};

export interface Contributor {
  username: string;
  name: string;
  avatarUrl: string;
  role: string;
  repos: string[];
  commits30d: number;
  prsOpened: number;
  prsMerged: number;
  issuesClosed: number;
  reviewComments: number;
  linesAdded: number;
  linesRemoved: number;
  lastActive: string;
}

export const contributors: Contributor[] = [
  {
    username: 'sarah-chen', name: 'Sarah Chen', avatarUrl: '',
    role: 'Staff Engineer', repos: ['platform-api', 'auth-service', 'design-system'],
    commits30d: 142, prsOpened: 18, prsMerged: 15, issuesClosed: 9, reviewComments: 34,
    linesAdded: 8200, linesRemoved: 3100, lastActive: '23 min ago',
  },
  {
    username: 'alex-kim', name: 'Alex Kim', avatarUrl: '',
    role: 'Frontend Engineer', repos: ['design-system', 'web-dashboard'],
    commits30d: 98, prsOpened: 12, prsMerged: 10, issuesClosed: 6, reviewComments: 22,
    linesAdded: 5400, linesRemoved: 2200, lastActive: '1 hour ago',
  },
  {
    username: 'jordan-lee', name: 'Jordan Lee', avatarUrl: '',
    role: 'Mobile Lead', repos: ['mobile-sdk'],
    commits30d: 67, prsOpened: 8, prsMerged: 7, issuesClosed: 4, reviewComments: 15,
    linesAdded: 3800, linesRemoved: 1400, lastActive: '2 hours ago',
  },
  {
    username: 'pat-wilson', name: 'Pat Wilson', avatarUrl: '',
    role: 'Product Engineer', repos: ['web-dashboard', 'data-pipeline'],
    commits30d: 54, prsOpened: 9, prsMerged: 6, issuesClosed: 11, reviewComments: 28,
    linesAdded: 2900, linesRemoved: 1800, lastActive: '3 hours ago',
  },
  {
    username: 'casey-zhang', name: 'Casey Zhang', avatarUrl: '',
    role: 'Data Engineer', repos: ['data-pipeline', 'ml-models'],
    commits30d: 83, prsOpened: 11, prsMerged: 9, issuesClosed: 5, reviewComments: 19,
    linesAdded: 4600, linesRemoved: 1900, lastActive: '4 hours ago',
  },
  {
    username: 'taylor-jones', name: 'Taylor Jones', avatarUrl: '',
    role: 'Backend Engineer', repos: ['auth-service', 'platform-api'],
    commits30d: 71, prsOpened: 7, prsMerged: 6, issuesClosed: 3, reviewComments: 12,
    linesAdded: 3100, linesRemoved: 1200, lastActive: '5 hours ago',
  },
  {
    username: 'riley-brown', name: 'Riley Brown', avatarUrl: '',
    role: 'DevOps Engineer', repos: ['infra-terraform'],
    commits30d: 42, prsOpened: 5, prsMerged: 5, issuesClosed: 2, reviewComments: 8,
    linesAdded: 1800, linesRemoved: 900, lastActive: '8 hours ago',
  },
  {
    username: 'morgan-davis', name: 'Morgan Davis', avatarUrl: '',
    role: 'ML Engineer', repos: ['ml-models', 'data-pipeline'],
    commits30d: 59, prsOpened: 6, prsMerged: 5, issuesClosed: 3, reviewComments: 11,
    linesAdded: 3400, linesRemoved: 1100, lastActive: '10 hours ago',
  },
];
