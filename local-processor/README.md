# Local Video Processor for Testimony App

This script runs on your Mac and processes video clip extraction jobs from Firebase.

## How It Works

1. **Polls Firebase** every 30 seconds for pending jobs
2. **Downloads YouTube video** using ytdl-core (same as localhost:3000)
3. **Trims video** using FFmpeg
4. **Uploads to Firebase Storage**
5. **Updates clip** with the processed video URL

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd local-processor
npm install
```

### Step 2: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Open `.env` and fill in your Firebase credentials:

```env
# Get these from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
FIREBASE_PROJECT_ID=ah-testimony-library
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ah-testimony-library.iam.gserviceaccount.com

# Storage bucket (from Firebase Console > Storage)
FIREBASE_STORAGE_BUCKET=ah-testimony-library.firebasestorage.app

# Optional: Customize polling interval (default: 30 seconds)
POLL_INTERVAL_SECONDS=30

# Optional: Max concurrent jobs (default: 1)
MAX_CONCURRENT_JOBS=1
```

### Step 3: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ah-testimony-library**
3. Click the gear icon ⚙️ > **Project Settings**
4. Go to **Service Accounts** tab
5. Click **"Generate New Private Key"**
6. Download the JSON file
7. Open the JSON file and copy the values to your `.env` file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Running the Processor

### Run Once (For Testing):
```bash
npm start
```

### Run in Development Mode (Auto-restart on changes):
```bash
npm run dev
```

### Run in Background (Production):
```bash
# Using nohup (keeps running even if terminal closes)
nohup npm start > processor.log 2>&1 &

# To stop:
ps aux | grep processor.js
kill <PID>
```

### Run on Mac Startup (Recommended):

**Option 1: Create a Launch Agent**

1. Create file: `~/Library/LaunchAgents/com.testimony.processor.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.testimony.processor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/Desktop/AH Testimony Library Project/testimony-app/local-processor/processor.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/Desktop/AH Testimony Library Project/testimony-app/local-processor</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/Desktop/AH Testimony Library Project/testimony-app/local-processor/processor.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/Desktop/AH Testimony Library Project/testimony-app/local-processor/processor-error.log</string>
</dict>
</plist>
```

2. Replace `YOUR_USERNAME` with your Mac username
3. Load the agent:
```bash
launchctl load ~/Library/LaunchAgents/com.testimony.processor.plist
```

4. To stop:
```bash
launchctl unload ~/Library/LaunchAgents/com.testimony.processor.plist
```

**Option 2: Simple Background Script**

Just run this whenever you want to start processing:
```bash
cd ~/Desktop/AH\ Testimony\ Library\ Project/testimony-app/local-processor
nohup npm start > processor.log 2>&1 &
echo "Processor started! Check processor.log for output"
```

## Monitoring

### View Logs:
```bash
# Real-time logs
tail -f processor.log

# Last 50 lines
tail -50 processor.log

# Search for errors
grep "ERROR" processor.log
```

### Check if Running:
```bash
ps aux | grep processor.js
```

### Check Processing Status in Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Open the **jobs** collection
5. Check job status: `pending`, `processing`, `completed`, or `failed`

## What It Does

When a job is found:

```
🎬 Processing Job: abc123
📝 Title: Healing Testimony
🔗 URL: https://www.youtube.com/watch?v=...
⏱️  Time: 120s - 240s
════════════════════════════════════
  📥 Downloading video: xC2ytl7Hhas
  📊 Size: 150.23 MB, Quality: 720p
  ⏳ Progress: 50%
  ✅ Downloaded: 150.23 MB
  ✂️  Trimming: 120s to 240s (120s duration)
  🎬 FFmpeg started
  ⏳ Encoding: 75%
  ✅ Trimmed: 25.34 MB
  ☁️  Uploading to Firebase Storage...
  ✅ Uploaded: https://storage.googleapis.com/...
  🧹 Cleaned up temp files

✅ JOB COMPLETED SUCCESSFULLY
════════════════════════════════════
```

## Troubleshooting

### "Firebase Admin not initialized"
- Check your `.env` file has all required fields
- Make sure `FIREBASE_PRIVATE_KEY` includes the full key with BEGIN/END markers

### "ytdl-core failed"
- Make sure you're logged into YouTube in your browser
- Try a different video to see if it's video-specific

### "FFmpeg not found"
- FFmpeg should be installed automatically with `npm install`
- If not, install manually: `brew install ffmpeg`

### "Permission denied" on Firebase Storage
- Check your service account has Storage Admin permissions
- Go to Firebase Console > Storage > Rules and ensure write access

### Jobs not being picked up
- Check the `jobs` collection in Firestore exists
- Verify jobs have `status: "pending"`
- Check the logs for errors: `tail -f processor.log`

## Stopping the Processor

### If running in foreground:
Press `Ctrl+C` - it will gracefully finish current jobs before stopping

### If running in background:
```bash
# Find the process
ps aux | grep processor.js

# Kill it (replace PID with the actual process ID)
kill <PID>
```

## Performance

- **Processing time**: Depends on video length and your internet speed
- **Concurrent jobs**: Set `MAX_CONCURRENT_JOBS=1` to process one at a time
- **Bandwidth**: ~50-150MB per video download, ~10-50MB per clip upload

## Security

- Never commit `.env` file to git (it's in `.gitignore`)
- Keep your Firebase service account key secure
- Don't share your private key

## Questions?

Check the main project documentation or logs for more details.
