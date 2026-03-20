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

  let query = supabase
    .from("messages")
    .select(`
      id,
      content,
      type,
      metadata,
      file_url,
      file_name,
      created_at,
      channel,
      user_id,
      users!inner(id, username, display_name, avatar_url, total_commits, tower_tier)
    `)
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (after) {
    query = query.gt("created_at", after);
  }

  const { data, error } = await query;

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

  const isAdmin = process.env.NEXT_PUBLIC_IS_ADMIN === "true";

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
