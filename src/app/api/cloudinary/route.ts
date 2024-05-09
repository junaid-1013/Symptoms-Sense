// src/app/api/cloudinary/route.ts

import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_KEY_SECRET,
});

export async function GET() {
  try {
    const resources = await cloudinary.v2.api.resources({
      max_results: 500, // Adjust this as needed
    });

    return NextResponse.json({ resources: resources.resources });
  } catch (error) {
    console.error('Error fetching Cloudinary resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}
