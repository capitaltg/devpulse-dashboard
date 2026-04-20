export interface PullRequest {
  id: number;
  number: number;
  title: string;
  repo: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  branch: string;
  baseBranch: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  closedAt?: string;
  reviewers: string[];
  labels: string[];
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  reviewComments: number;
  checksStatus: 'passing' | 'failing' | 'pending';
  description: string;
  commits: { sha: string; message: string; author: string; timestamp: string }[];
  timeline: { type: string; actor: string; timestamp: string; detail: string }[];
}

export const pullRequests: PullRequest[] = [
  {
    id: 1, number: 482, title: 'Add rate limiting middleware', repo: 'platform-api', author: 'sarah-chen',
    status: 'merged', branch: 'feat/rate-limit', baseBranch: 'main',
    createdAt: '2 days ago', updatedAt: '23 min ago', mergedAt: '23 min ago',
    reviewers: ['taylor-jones', 'alex-kim'], labels: ['feature', 'backend'],
    additions: 342, deletions: 18, changedFiles: 8, comments: 4, reviewComments: 6,
    checksStatus: 'passing',
    description: 'Implements token-bucket rate limiting for all public API endpoints. Configurable per-route limits via environment variables. Includes Redis-backed distributed counter for multi-instance deployments.',
    commits: [
      { sha: 'a1b2c3d', message: 'feat: add rate limit middleware skeleton', author: 'sarah-chen', timestamp: '2 days ago' },
      { sha: 'e4f5g6h', message: 'feat: implement token bucket algorithm', author: 'sarah-chen', timestamp: '1 day ago' },
      { sha: 'i7j8k9l', message: 'feat: add Redis distributed counter', author: 'sarah-chen', timestamp: '1 day ago' },
      { sha: 'm0n1o2p', message: 'fix: handle edge case for burst traffic', author: 'sarah-chen', timestamp: '6 hours ago' },
    ],
    timeline: [
      { type: 'created', actor: 'sarah-chen', timestamp: '2 days ago', detail: 'opened this pull request' },
      { type: 'review_requested', actor: 'sarah-chen', timestamp: '2 days ago', detail: 'requested review from taylor-jones' },
      { type: 'commented', actor: 'taylor-jones', timestamp: '1 day ago', detail: 'Looks good overall, a few nits on the Redis config.' },
      { type: 'review', actor: 'taylor-jones', timestamp: '1 day ago', detail: 'approved with comments' },
      { type: 'review', actor: 'alex-kim', timestamp: '3 hours ago', detail: 'approved' },
      { type: 'merged', actor: 'sarah-chen', timestamp: '23 min ago', detail: 'merged into main' },
    ],
  },
  {
    id: 2, number: 481, title: 'Add Snowflake connector for data ingestion', repo: 'data-pipeline', author: 'casey-zhang',
    status: 'open', branch: 'feat/snowflake', baseBranch: 'main',
    createdAt: '4 hours ago', updatedAt: '1 hour ago',
    reviewers: ['morgan-davis'], labels: ['feature', 'data'],
    additions: 567, deletions: 23, changedFiles: 12, comments: 2, reviewComments: 3,
    checksStatus: 'failing',
    description: 'Adds native Snowflake connector to replace the existing JDBC-based approach. Includes connection pooling, retry logic, and schema auto-detection.',
    commits: [
      { sha: 'q3r4s5t', message: 'feat: scaffold Snowflake connector', author: 'casey-zhang', timestamp: '4 hours ago' },
      { sha: 'u6v7w8x', message: 'feat: add connection pooling', author: 'casey-zhang', timestamp: '3 hours ago' },
      { sha: 'y9z0a1b', message: 'wip: schema auto-detection', author: 'casey-zhang', timestamp: '1 hour ago' },
    ],
    timeline: [
      { type: 'created', actor: 'casey-zhang', timestamp: '4 hours ago', detail: 'opened this pull request' },
      { type: 'review_requested', actor: 'casey-zhang', timestamp: '4 hours ago', detail: 'requested review from morgan-davis' },
      { type: 'commented', actor: 'morgan-davis', timestamp: '2 hours ago', detail: 'Can we add retry backoff? Also the schema detection looks incomplete.' },
      { type: 'review', actor: 'morgan-davis', timestamp: '2 hours ago', detail: 'changes requested' },
    ],
  },
  {
    id: 3, number: 480, title: 'Upgrade to Terraform 1.6', repo: 'infra-terraform', author: 'riley-brown',
    status: 'merged', branch: 'chore/tf-1.6', baseBranch: 'main',
    createdAt: '1 day ago', updatedAt: '8 hours ago', mergedAt: '8 hours ago',
    reviewers: ['sarah-chen'], labels: ['chore', 'infrastructure'],
    additions: 89, deletions: 72, changedFiles: 15, comments: 1, reviewComments: 0,
    checksStatus: 'passing',
    description: 'Upgrades all Terraform modules to 1.6 and updates provider constraints. No breaking changes expected.',
    commits: [
      { sha: 'c2d3e4f', message: 'chore: bump terraform to 1.6', author: 'riley-brown', timestamp: '1 day ago' },
      { sha: 'g5h6i7j', message: 'chore: update provider constraints', author: 'riley-brown', timestamp: '10 hours ago' },
    ],
    timeline: [
      { type: 'created', actor: 'riley-brown', timestamp: '1 day ago', detail: 'opened this pull request' },
      { type: 'review', actor: 'sarah-chen', timestamp: '10 hours ago', detail: 'approved' },
      { type: 'merged', actor: 'riley-brown', timestamp: '8 hours ago', detail: 'merged into main' },
    ],
  },
  {
    id: 4, number: 479, title: 'Fix chart rendering on large datasets', repo: 'web-dashboard', author: 'pat-wilson',
    status: 'open', branch: 'fix/chart-perf', baseBranch: 'main',
    createdAt: '3 hours ago', updatedAt: '2 hours ago',
    reviewers: ['alex-kim'], labels: ['bug', 'performance'],
    additions: 124, deletions: 47, changedFiles: 4, comments: 3, reviewComments: 1,
    checksStatus: 'passing',
    description: 'Fixes performance regression in chart components when rendering >10k data points. Switches to canvas-based rendering and adds virtualization for tooltip overlays.',
    commits: [
      { sha: 'k8l9m0n', message: 'fix: switch to canvas renderer for large datasets', author: 'pat-wilson', timestamp: '3 hours ago' },
      { sha: 'o1p2q3r', message: 'fix: add tooltip virtualization', author: 'pat-wilson', timestamp: '2 hours ago' },
    ],
    timeline: [
      { type: 'created', actor: 'pat-wilson', timestamp: '3 hours ago', detail: 'opened this pull request' },
      { type: 'review_requested', actor: 'pat-wilson', timestamp: '3 hours ago', detail: 'requested review from alex-kim' },
      { type: 'commented', actor: 'alex-kim', timestamp: '2 hours ago', detail: 'Nice improvement! Can we benchmark this?' },
    ],
  },
  {
    id: 5, number: 478, title: 'Implement MFA for admin users', repo: 'auth-service', author: 'taylor-jones',
    status: 'open', branch: 'feature/mfa', baseBranch: 'main',
    createdAt: '5 hours ago', updatedAt: '5 hours ago',
    reviewers: ['sarah-chen'], labels: ['feature', 'security'],
    additions: 891, deletions: 34, changedFiles: 18, comments: 0, reviewComments: 0,
    checksStatus: 'pending',
    description: 'Adds TOTP-based multi-factor authentication for admin-level accounts. Includes QR code setup flow, backup codes, and recovery endpoints.',
    commits: [
      { sha: 's4t5u6v', message: 'feat: add TOTP generation and validation', author: 'taylor-jones', timestamp: '5 hours ago' },
      { sha: 'w7x8y9z', message: 'feat: add QR code setup flow', author: 'taylor-jones', timestamp: '5 hours ago' },
      { sha: 'a0b1c2d', message: 'feat: backup codes and recovery', author: 'taylor-jones', timestamp: '5 hours ago' },
    ],
    timeline: [
      { type: 'created', actor: 'taylor-jones', timestamp: '5 hours ago', detail: 'opened this pull request' },
      { type: 'review_requested', actor: 'taylor-jones', timestamp: '5 hours ago', detail: 'requested review from sarah-chen' },
    ],
  },
  {
    id: 6, number: 477, title: 'Add dark mode to design system', repo: 'design-system', author: 'alex-kim',
    status: 'merged', branch: 'feat/dark-mode', baseBranch: 'main',
    createdAt: '3 days ago', updatedAt: '1 day ago', mergedAt: '1 day ago',
    reviewers: ['pat-wilson', 'sarah-chen'], labels: ['feature', 'design'],
    additions: 1245, deletions: 312, changedFiles: 34, comments: 8, reviewComments: 12,
    checksStatus: 'passing',
    description: 'Full dark mode implementation across all components. Uses CSS custom properties for theming. Adds a ThemeProvider context and toggle component.',
    commits: [
      { sha: 'e3f4g5h', message: 'feat: add CSS custom properties for themes', author: 'alex-kim', timestamp: '3 days ago' },
      { sha: 'i6j7k8l', message: 'feat: implement ThemeProvider', author: 'alex-kim', timestamp: '2 days ago' },
      { sha: 'm9n0o1p', message: 'feat: update all components for dark mode', author: 'alex-kim', timestamp: '2 days ago' },
      { sha: 'q2r3s4t', message: 'fix: contrast issues in badges and alerts', author: 'alex-kim', timestamp: '1 day ago' },
    ],
    timeline: [
      { type: 'created', actor: 'alex-kim', timestamp: '3 days ago', detail: 'opened this pull request' },
      { type: 'review', actor: 'pat-wilson', timestamp: '2 days ago', detail: 'changes requested' },
      { type: 'commented', actor: 'pat-wilson', timestamp: '2 days ago', detail: 'Badge contrast is too low in dark mode.' },
      { type: 'review', actor: 'sarah-chen', timestamp: '2 days ago', detail: 'approved with suggestions' },
      { type: 'review', actor: 'pat-wilson', timestamp: '1 day ago', detail: 'approved' },
      { type: 'merged', actor: 'alex-kim', timestamp: '1 day ago', detail: 'merged into main' },
    ],
  },
  {
    id: 7, number: 476, title: 'Mobile SDK v2.4 release prep', repo: 'mobile-sdk', author: 'jordan-lee',
    status: 'merged', branch: 'release/2.4', baseBranch: 'main',
    createdAt: '2 days ago', updatedAt: '3 hours ago', mergedAt: '3 hours ago',
    reviewers: ['sarah-chen'], labels: ['release'],
    additions: 56, deletions: 12, changedFiles: 5, comments: 1, reviewComments: 0,
    checksStatus: 'passing',
    description: 'Bumps version to 2.4.0, updates changelog, and finalizes release notes.',
    commits: [
      { sha: 'u5v6w7x', message: 'chore: bump version to 2.4.0', author: 'jordan-lee', timestamp: '2 days ago' },
      { sha: 'y8z9a0b', message: 'docs: update changelog', author: 'jordan-lee', timestamp: '4 hours ago' },
    ],
    timeline: [
      { type: 'created', actor: 'jordan-lee', timestamp: '2 days ago', detail: 'opened this pull request' },
      { type: 'review', actor: 'sarah-chen', timestamp: '4 hours ago', detail: 'approved' },
      { type: 'merged', actor: 'jordan-lee', timestamp: '3 hours ago', detail: 'merged into main' },
    ],
  },
  {
    id: 8, number: 475, title: 'BERT v2 experiment: fine-tuning pipeline', repo: 'ml-models', author: 'morgan-davis',
    status: 'open', branch: 'experiment/bert-v2', baseBranch: 'main',
    createdAt: '10 hours ago', updatedAt: '10 hours ago',
    reviewers: ['casey-zhang'], labels: ['experiment', 'ml'],
    additions: 1432, deletions: 87, changedFiles: 22, comments: 0, reviewComments: 0,
    checksStatus: 'pending',
    description: 'Sets up fine-tuning pipeline for BERT v2 with custom dataset loaders, training loops, and evaluation metrics. Experiment branch — not intended for main merge yet.',
    commits: [
      { sha: 'c1d2e3f', message: 'feat: add dataset loaders for BERT v2', author: 'morgan-davis', timestamp: '10 hours ago' },
      { sha: 'g4h5i6j', message: 'feat: training loop with mixed precision', author: 'morgan-davis', timestamp: '10 hours ago' },
      { sha: 'k7l8m9n', message: 'feat: evaluation metrics and reporting', author: 'morgan-davis', timestamp: '10 hours ago' },
    ],
    timeline: [
      { type: 'created', actor: 'morgan-davis', timestamp: '10 hours ago', detail: 'opened this pull request' },
      { type: 'review_requested', actor: 'morgan-davis', timestamp: '10 hours ago', detail: 'requested review from casey-zhang' },
    ],
  },
  {
    id: 9, number: 474, title: 'Fix connection pool memory leak', repo: 'platform-api', author: 'sarah-chen',
    status: 'closed', branch: 'fix/pool-leak', baseBranch: 'main',
    createdAt: '1 day ago', updatedAt: '6 hours ago', closedAt: '6 hours ago',
    reviewers: ['taylor-jones'], labels: ['bug'],
    additions: 28, deletions: 15, changedFiles: 2, comments: 2, reviewComments: 1,
    checksStatus: 'passing',
    description: 'Fixes memory leak caused by unreleased connections in the pool. Superseded by #482 which includes a broader fix.',
    commits: [
      { sha: 'o0p1q2r', message: 'fix: release connections on timeout', author: 'sarah-chen', timestamp: '1 day ago' },
    ],
    timeline: [
      { type: 'created', actor: 'sarah-chen', timestamp: '1 day ago', detail: 'opened this pull request' },
      { type: 'commented', actor: 'taylor-jones', timestamp: '8 hours ago', detail: 'This is addressed more broadly in #482.' },
      { type: 'closed', actor: 'sarah-chen', timestamp: '6 hours ago', detail: 'closed in favor of #482' },
    ],
  },
  {
    id: 10, number: 473, title: 'Refactor button component variants', repo: 'design-system', author: 'alex-kim',
    status: 'merged', branch: 'refactor/button-variants', baseBranch: 'main',
    createdAt: '4 days ago', updatedAt: '3 days ago', mergedAt: '3 days ago',
    reviewers: ['pat-wilson'], labels: ['refactor', 'design'],
    additions: 198, deletions: 245, changedFiles: 7, comments: 3, reviewComments: 4,
    checksStatus: 'passing',
    description: 'Refactors button component to use CVA for variant management. Reduces code duplication and improves type safety.',
    commits: [
      { sha: 's3t4u5v', message: 'refactor: migrate button to CVA', author: 'alex-kim', timestamp: '4 days ago' },
      { sha: 'w6x7y8z', message: 'refactor: update all button usages', author: 'alex-kim', timestamp: '3 days ago' },
    ],
    timeline: [
      { type: 'created', actor: 'alex-kim', timestamp: '4 days ago', detail: 'opened this pull request' },
      { type: 'review', actor: 'pat-wilson', timestamp: '3 days ago', detail: 'approved' },
      { type: 'merged', actor: 'alex-kim', timestamp: '3 days ago', detail: 'merged into main' },
    ],
  },
];
