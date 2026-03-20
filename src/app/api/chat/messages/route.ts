import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/chat/messages?channel=global&after=ISO_DATE&limit=50
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") || "global";
  const after = searchParams.get("after");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  // Try with role columns first, fall back without them if columns don't exist yet
  let data: Record<string, unknown>[] | null = null;
  let error: { message: string; code?: string } | null = null;

  const baseFields = `
    id,
    content,
    type,
    metadata,
    file_url,
    file_name,
    created_at,
    channel,
    user_id`;

  let query = supabase
    .from("messages")
    .select(`${baseFields},
      users!inner(id, username, display_name, avatar_url, total_commits, tower_tier, user_role, edition_number)
    `)
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (after) {
    query = query.gt("created_at", after);
  }

  const result = await query;
  data = result.data;
  error = result.error;

  // Fallback: if user_role column doesn't exist yet, query without it
  if (error && error.message?.includes("user_role")) {
    let fallbackQuery = supabase
      .from("messages")
      .select(`${baseFields},
        users!inner(id, username, display_name, avatar_url, total_commits, tower_tier)
      `)
      .eq("channel", channel)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (after) {
      fallbackQuery = fallbackQuery.gt("created_at", after);
    }

    const fallbackResult = await fallbackQuery;
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    console.error("[CHAT] Fetch messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  // Reverse to get chronological order and flatten user data
  const messages = (data || []).reverse().map((msg: Record<string, unknown>) => {
    const user = msg.users as Record<string, unknown> | null;
    return {
      id: msg.id,
      content: msg.content,
      type: msg.type,
      metadata: msg.metadata,
      fileUrl: msg.file_url,
      fileName: msg.file_name,
      createdAt: msg.created_at,
      channel: msg.channel,
      user: user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            totalCommits: user.total_commits || 0,
            towerTier: user.tower_tier || 0,
            userRole: user.user_role || "member",
            editionNumber: user.edition_number || null,
          }
        : null,
    };
  });

  return NextResponse.json({ messages });
}

// POST /api/chat/messages
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, type = "text", channel = "global", metadata = {}, fileUrl, fileName } = body;

  if (!content && !fileUrl) {
    return NextResponse.json({ error: "Content or file required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: session.user.id,
      channel,
      content: content || null,
      type,
      metadata,
      file_url: fileUrl || null,
      file_name: fileName || null,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[CHAT] Insert message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, createdAt: data.created_at });
}

// DELETE /api/chat/messages?id=UUID
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("id");

  if (!messageId) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  const isAdmin = process.env.NEXT_PUBLIC_IS_ADMIN === "true" || session.user.userRole === "master";

  // Fetch message to check ownership
  const { data: msg, error: fetchErr } = await supabase
    .from("messages")
    .select("user_id")
    .eq("id", messageId)
    .single();

  if (fetchErr || !msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Only allow delete if owner or admin
  if (msg.user_id !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error("[CHAT] Delete message error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
