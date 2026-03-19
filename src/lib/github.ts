import { YearlyCommitData } from "@/types/github";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

async function graphqlRequest(
  token: string,
  query: string,
  variables: Record<string, unknown> = {}
) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL error: ${response.status} ${text}`);
  }

  return response.json();
}

export async function fetchUserCreatedAt(token: string, username: string): Promise<string> {
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }

  const data = await response.json();
  return data.created_at;
}

export async function fetchYearlyContributions(
  token: string,
  username: string,
  year: number
): Promise<YearlyCommitData> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const data = await graphqlRequest(token, query, { username, from, to });
  const collection = data.data.user.contributionsCollection;

  const dailyContributions: { date: string; count: number }[] = [];
  for (const week of collection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      dailyContributions.push({
        date: day.date,
        count: day.contributionCount,
      });
    }
  }

  return {
    year,
    total: collection.totalCommitContributions + collection.restrictedContributionsCount,
    dailyContributions,
  };
}

export async function fetchAllContributions(
  token: string,
  username: string
): Promise<{
  totalCommits: number;
  yearlyCommits: Record<string, number>;
  longestStreak: number;
  currentStreak: number;
  firstCommitDate: string | null;
}> {
  const createdAt = await fetchUserCreatedAt(token, username);
  const startYear = new Date(createdAt).getFullYear();
  const currentYear = new Date().getFullYear();

  const yearlyData: YearlyCommitData[] = [];

  // Fetch all years (sequential to respect rate limits)
  for (let year = startYear; year <= currentYear; year++) {
    const data = await fetchYearlyContributions(token, username, year);
    yearlyData.push(data);
  }

  // Aggregate
  let totalCommits = 0;
  const yearlyCommits: Record<string, number> = {};
  const allDays: { date: string; count: number }[] = [];

  for (const yearData of yearlyData) {
    totalCommits += yearData.total;
    yearlyCommits[yearData.year.toString()] = yearData.total;
    allDays.push(...yearData.dailyContributions);
  }

  // Sort days chronologically
  allDays.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate streaks
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  let firstCommitDate: string | null = null;

  for (const day of allDays) {
    if (day.count > 0) {
      tempStreak++;
      if (!firstCommitDate) firstCommitDate = day.date;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: count backwards from today
  const today = new Date().toISOString().split("T")[0];
  for (let i = allDays.length - 1; i >= 0; i--) {
    if (allDays[i].date > today) continue;
    if (allDays[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    totalCommits,
    yearlyCommits,
    longestStreak,
    currentStreak,
    firstCommitDate,
  };
}

export async function fetchUserRepoCount(token: string): Promise<number> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) return 0;
  const data = await response.json();
  return data.public_repos + (data.total_private_repos || 0);
}

export async function fetchLanguageStats(
  token: string
): Promise<Record<string, number>> {
  const languages: Record<string, number> = {};

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) break;
    const repos = await response.json();

    if (repos.length === 0) {
      hasMore = false;
      break;
    }

    for (const repo of repos) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    }

    page++;
    if (repos.length < 100) hasMore = false;
  }

  return languages;
}
