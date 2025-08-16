// app/api/image/route.ts
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps";

export async function GET(
  request: NextRequest
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'property';
    
    // For property images, using Pexels API
    if (mode === 'property') {
      const accessKey = process.env.NEXT_PUBLIC_PEXELS_ACCESS_KEY; // API key from env
      if (!accessKey) {
        return NextResponse.json({ error: "Pexels API key not configured" }, { status: 500 });
      }
      
      const query = searchParams.get('q') || "uk house";
      
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query
        )}&per_page=1`,
        {
          headers: {
            Authorization: `${accessKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Pexels request failed");
      }

      const data = await response.json();
      
      // Check if photos exist in the response
      if (data.photos && data.photos.length > 0 && data.photos[0].src && data.photos[0].src.large) {
        return NextResponse.json({ url: data.photos[0].src.large });
      } else {
        // Fallback if no images found
        return NextResponse.json({ url: '/placeholder-property.jpg' });
      }
    } 
    // For location images, use Google Maps Static API
    else if (mode === 'location') {
      const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
      if (!apiKey) {
        return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
      }

      // Get location parameters
      const latitude = searchParams.get('lat');
      const longitude = searchParams.get('lng');
      const address = searchParams.get('address');
      const zoom = searchParams.get('zoom') || '14';
      const size = searchParams.get('size') || '600x400';
      const mapType = searchParams.get('maptype') || 'roadmap';
      
      // Check if we have valid location data
      if ((!latitude || !longitude) && !address) {
        return NextResponse.json({ error: "Location parameters required (lat/lng or address)" }, { status: 400 });
      }
      
      let staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?`;
      
      // Add center parameter (either lat/lng or address)
      if (latitude && longitude) {
        staticMapUrl += `center=${latitude},${longitude}`;
      } else if (address) {
        staticMapUrl += `center=${encodeURIComponent(address)}`;
      }
      
      // Add other parameters
      staticMapUrl += `&zoom=${zoom}&size=${size}&maptype=${mapType}`;
      
      // Add marker if we have coordinates
      if (latitude && longitude) {
        staticMapUrl += `&markers=color:red|${latitude},${longitude}`;
      } else if (address) {
        staticMapUrl += `&markers=color:red|${encodeURIComponent(address)}`;
      }
      
      // Add API key
      staticMapUrl += `&key=${apiKey}`;
      
      return NextResponse.json({ url: staticMapUrl });
    } else {
      return NextResponse.json({ error: "Invalid mode parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("Image API error:", error);
    return NextResponse.json({ url: '/placeholder-property.jpg' });
  }
}
