import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      console.log("[AUTH] signIn callback triggered", {
        provider: account?.provider,
        username: (profile as { login?: string })?.login,
        hasAccessToken: !!account?.access_token,
      });
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as {
          id: number;
          login: string;
          name: string | null;
          avatar_url: string;
          bio: string | null;
          email: string | null;
        };

        // Upsert user in Supabase
        const { error } = await supabase.from("users").upsert(
          {
            github_id: githubProfile.id,
            username: githubProfile.login,
            display_name: githubProfile.name,
            avatar_url: githubProfile.avatar_url,
            email: githubProfile.email,
            bio: githubProfile.bio,
            access_token: account.access_token,
          },
          { onConflict: "github_id" }
        );

        if (error) {
          console.error("[AUTH] Supabase upsert error:", error);
        } else {
          console.log("[AUTH] Supabase upsert success for:", githubProfile.login);
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      console.log("[AUTH] jwt callback", {
        hasAccount: !!account,
        hasProfile: !!profile,
        tokenUsername: token.username,
      });
      if (account && profile) {
        const githubProfile = profile as { id: number; login: string };
        token.username = githubProfile.login;
        token.githubId = githubProfile.id;
        token.accessToken = account.access_token;

        // Fetch user data from Supabase
        const { data: user } = await supabase
          .from("users")
          .select("id, total_commits, tower_tier")
          .eq("github_id", githubProfile.id)
          .single();

        if (user) {
          token.dbId = user.id;
          token.totalCommits = user.total_commits;
          token.towerTier = user.tower_tier;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.dbId as string,
        username: token.username as string,
        githubId: token.githubId as number,
        totalCommits: (token.totalCommits as number) ?? 0,
        towerTier: (token.towerTier as number) ?? 0,
        accessToken: token.accessToken as string,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
