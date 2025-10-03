# AssemblyAI Setup Instructions

## Overview
AssemblyAI has been integrated to provide professional-grade speech-to-text transcription with accurate timestamps, replacing the unreliable YouTube transcript extraction.

## Required Steps

### 1. Get AssemblyAI API Key
1. Go to [AssemblyAI Console](https://www.assemblyai.com/app)
2. Sign up for a free account or log in
3. Navigate to your dashboard
4. Copy your API key from the "API Keys" section

### 2. Add API Key to Environment Variables
1. Open your `.env.local` file in the project root
2. Add this line:
   ```
   ASSEMBLYAI_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual AssemblyAI API key
4. Save the file

### 3. Restart the Development Server
```bash
npm run dev
```

## How It Works

### Automatic Processing
- When you process a YouTube video, the system will automatically:
  1. Download the audio from YouTube
  2. Upload it to AssemblyAI for transcription
  3. Receive back professional-quality transcription with accurate timestamps
  4. Clean up temporary files

### Benefits Over YouTube Transcripts
- ✅ **Reliable**: Works with any YouTube video, even without captions
- ✅ **Accurate**: Professional-grade speech recognition
- ✅ **Precise Timing**: Word-level timestamps for exact clip boundaries
- ✅ **Consistent**: No dependency on YouTube's caption availability

## Testing

### Test with a Video
1. Make sure your API key is set in `.env.local`
2. Go to the admin page: `http://localhost:3000/admin`
3. Enter any YouTube URL (Alpha Hour episodes work well)
4. Click "Process Video"
5. The system will now use AssemblyAI instead of unreliable YouTube captions

### Expected Behavior
- You should see: "🎯 Using AssemblyAI for professional transcription..."
- Processing will take 1-3 minutes depending on video length
- You'll get accurate testimonies with proper timing

## Pricing
- AssemblyAI offers a free tier with generous limits
- Current pricing: ~$0.37 per hour of audio
- For Alpha Hour episodes (~1 hour each), cost is under $0.40 per video

## Troubleshooting

### Error: "ASSEMBLYAI_API_KEY environment variable is required"
- Make sure you added the API key to `.env.local`
- Restart your development server after adding the key

### Error: "Failed to download audio"
- Some YouTube videos may be restricted
- Try with a different Alpha Hour episode
- Ensure the video is public and not age-restricted

### Error: "AssemblyAI transcription failed"
- Check your API key is valid
- Verify you have credits in your AssemblyAI account
- Check the video isn't corrupted or extremely long

## Fallback Behavior
If AssemblyAI is not configured (no API key), the system will fall back to the previous YouTube caption extraction method and show helpful error messages guiding you to set up AssemblyAI.