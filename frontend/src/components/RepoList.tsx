import { Link, useNavigate } from 'react-router-dom';
import { Star, GitFork, AlertCircle, GitPullRequest, Lock, Globe, GitCommit, ExternalLink } from 'lucide-react';
import type { Repository } from '@/data/mockData';
import { useApp, useOrgPath } from '@/contexts/AppContext';

function LanguageDot({ language }: { language: string }) {
  const colors: Record<string, string> = {
    TypeScript: 'bg-navy-500',
    React: 'bg-navy-400',
    Go: 'bg-cyan-500',
    Python: 'bg-dashboard-success',
    Kotlin: 'bg-purple-500',
    HCL: 'bg-dashboard-warning',
  };
  return <span className={`inline-block w-3 h-3 rounded-full ${colors[language] || 'bg-muted-foreground'}`} />;
}

export function RepoList({ repos, showViewAll = false }: { repos: Repository[]; showViewAll?: boolean }) {
  const { activeOrg } = useApp();
  const orgPath = useOrgPath();
  const navigate = useNavigate();

  return (
    <div className="dashboard-section">
      {showViewAll && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Repositories</h2>
          <Link to={orgPath('repos')} className="text-sm text-primary hover:underline">View all →</Link>
        </div>
      )}
      <div className="divide-y divide-border">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="py-4 first:pt-0 last:pb-0 hover:bg-accent/30 -mx-6 px-6 transition-colors cursor-pointer"
            onClick={() => navigate(orgPath(`repos/${repo.name}`))}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={orgPath(`repos/${repo.name}`)} className="text-base font-semibold text-primary truncate hover:underline">
                    {repo.name}
                  </Link>
                  {repo.visibility === 'private' ? (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <a
                    href={`https://github.com/${activeOrg?.login ?? ''}/${repo.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground truncate">{repo.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><LanguageDot language={repo.language} /> {repo.language}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {repo.stars}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" /> {repo.forks}</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {repo.openIssues}</span>
                  <span className="flex items-center gap-1"><GitPullRequest className="w-3.5 h-3.5" /> {repo.openPRs} PRs</span>
                  <span className="flex items-center gap-1"><GitCommit className="w-3.5 h-3.5" /> {repo.commits30d} commits</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">{repo.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
