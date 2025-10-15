import { NextRequest, NextResponse } from 'next/server';

const CLIPDROP_API_KEY = 'fc8ed4d1a8d10efff5afbafaf04421a833f6d6072354051ca388476ec27e2785288bc0bec91f572e2249b188f9b257ec';
const CLIPDROP_API_URL = 'https://clipdrop-api.co/remove-text/v1';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Create FormData for Clipdrop API
    const clipdropFormData = new FormData();
    clipdropFormData.append('image_file', imageFile);

    console.log('Sending request to Clipdrop API for text removal...');

    const response = await fetch(CLIPDROP_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_API_KEY,
      },
      body: clipdropFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clipdrop API error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      } else if (response.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      } else if (response.status === 413) {
        return NextResponse.json({ error: 'Image file too large. Maximum size is 10MB.' }, { status: 413 });
      }
      
      return NextResponse.json({ 
        error: `Text removal failed: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    // Get the processed image from Clipdrop
    const processedImageBlob = await response.blob();
    
    // Convert to base64 for frontend
    const arrayBuffer = await processedImageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log('Text removal successful');

    return NextResponse.json({ 
      success: true, 
      processedImage: dataUrl,
      message: 'Text removed successfully using Clipdrop AI'
    });

  } catch (error) {
    console.error('Text removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove text. Please try again.' },
      { status: 500 }
    );
  }
}