// src/app/api/cloudinary/delete/route.ts

import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_KEY_SECRET,
});

export async function DELETE(request: Request) {
    try {
      const { public_id } = await request.json();
  
      if (!public_id) {
        return NextResponse.json({ error: 'public_id is required' }, { status: 400 });
      }
  
      // Delete the image from Cloudinary
      const result = await cloudinary.v2.uploader.destroy(public_id);
  
      return NextResponse.json({ result });
    } catch (error) {
      console.error('Error deleting Cloudinary image:', error);
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }
  }
