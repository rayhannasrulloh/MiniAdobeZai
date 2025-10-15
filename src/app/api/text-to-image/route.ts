import { NextRequest, NextResponse } from 'next/server';

const CLIPDROP_API_KEY = 'fc8ed4d1a8d10efff5afbafaf04421a833f6d6072354051ca388476ec27e2785288bc0bec91f572e2249b188f9b257ec';
const CLIPDROP_API_URL = 'https://clipdrop-api.co/text-to-image/v1';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (prompt.length > 1000) {
      return NextResponse.json({ error: 'Prompt is too long. Maximum 1000 characters.' }, { status: 400 });
    }

    console.log(`Generating image for prompt: "${prompt.substring(0, 50)}..."`);

    const response = await fetch(CLIPDROP_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clipdrop API error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      } else if (response.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      } else if (response.status === 400) {
        return NextResponse.json({ error: 'Invalid prompt or request format' }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: `Text-to-image generation failed: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    // Get the generated image from Clipdrop
    const imageBlob = await response.blob();
    
    // Convert to base64 for frontend
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log('Image generation successful');

    return NextResponse.json({ 
      success: true, 
      image: dataUrl,
      prompt: prompt.trim(),
      message: 'Image generated successfully using Clipdrop AI'
    });

  } catch (error) {
    console.error('Text-to-image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}