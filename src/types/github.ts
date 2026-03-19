export interface GitHubContributionsResponse {
  data: {
    user: {
      createdAt: string;
      contributionsCollection: {
        totalCommitContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: {
              contributionCount: number;
              date: string;
            }[];
          }[];
        };
      };
    };
  };
}

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  created_at: string;
  public_repos: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
}

export interface YearlyCommitData {
  year: number;
  total: number;
  dailyContributions: { date: string; count: number }[];
}
