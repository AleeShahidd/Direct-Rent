// app/api/image/route.ts
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(
  request: NextRequest
) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY; // keep secret (no NEXT_PUBLIC)
    if (!accessKey) {
      return NextResponse.json({ error: "Unsplash API key not configured" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || "uk house";
    
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        query
      )}&collections=3356627,220381&client_id=${accessKey}`
    );

    if (!response.ok) {
      throw new Error("Unsplash request failed");
    }

    const data = await response.json();
    return NextResponse.json({ url: data.urls.regular });
  } catch (error) {
    console.error("House image API error:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
