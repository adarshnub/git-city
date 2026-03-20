import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "bin";
  const uniqueName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Read file as buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(uniqueName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[CHAT] Upload error:", uploadError);
    // Try creating bucket if it doesn't exist
    if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
      await supabase.storage.createBucket("chat-attachments", {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      // Retry upload
      const { error: retryError } = await supabase.storage
        .from("chat-attachments")
        .upload(uniqueName, buffer, {
          contentType: file.type,
          upsert: false,
        });
      if (retryError) {
        console.error("[CHAT] Retry upload error:", retryError);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("chat-attachments")
    .getPublicUrl(uniqueName);

  return NextResponse.json({
    url: urlData.publicUrl,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
}
