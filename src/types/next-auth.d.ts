import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      githubId: number;
      totalCommits: number;
      towerTier: number;
      accessToken: string;
      userRole: string;
      editionNumber: number | null;
    } & DefaultSession["user"];
  }
}
