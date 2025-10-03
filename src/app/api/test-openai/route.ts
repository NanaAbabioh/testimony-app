import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  console.log('Testing OpenAI API access...');
  
  const results = {
    whisper: { available: false, error: null as string | null },
    gpt: { available: false, error: null as string | null },
    apiKeyPresent: !!process.env.OPENAI_API_KEY
  };

  // Test GPT access
  try {
    console.log('Testing GPT-3.5-turbo access...');
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello! Please respond with just "GPT test successful".' }],
      max_tokens: 10,
      temperature: 0
    });
    
    results.gpt.available = true;
    console.log('GPT test successful:', gptResponse.choices[0].message.content);
  } catch (error: any) {
    results.gpt.error = error.message || 'Unknown error';
    console.error('GPT test failed:', error);
  }

  // Test Whisper access (we'll create a small test audio file)
  try {
    console.log('Testing Whisper access...');
    
    // Create a minimal test audio file (silent MP3)
    const silentAudioBuffer = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    // Note: This will likely fail because Whisper needs a real audio file
    // But the error message will tell us if we have access to the Whisper API
    const whisperResponse = await openai.audio.transcriptions.create({
      file: new File([silentAudioBuffer], 'test.mp3', { type: 'audio/mpeg' }),
      model: 'whisper-1',
    });
    
    results.whisper.available = true;
    console.log('Whisper test successful');
  } catch (error: any) {
    // Check if the error is about file format (means API access works)
    // vs quota/permission errors
    if (error.message.includes('file') || error.message.includes('format') || 
        error.message.includes('audio') || error.message.includes('duration')) {
      results.whisper.available = true;
      results.whisper.error = 'API accessible (test file format issue - this is expected)';
    } else {
      results.whisper.available = false;
      results.whisper.error = error.message || 'Unknown error';
    }
    console.log('Whisper test result:', error.message);
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results: results,
    recommendations: {
      nextSteps: results.gpt.available && results.whisper.available 
        ? 'Both APIs are accessible! You can process real videos.'
        : 'Check the errors above and ensure you have sufficient OpenAI credits.',
      troubleshooting: !results.apiKeyPresent 
        ? 'No API key found in environment variables'
        : results.gpt.available 
          ? 'GPT works, check Whisper access/credits'
          : 'Check your OpenAI account billing and credits'
    }
  });
}