# Quick Start Guide - Local Video Processor

## What This Does

Instead of processing videos on Railway (which YouTube blocks), videos are now processed on your Mac where everything works perfectly!

**Flow:**
1. You import clips via admin panel → Creates jobs in Firebase
2. Your Mac polls Firebase → Finds pending jobs
3. Your Mac processes videos → Uses your working localhost setup
4. Your Mac uploads clips → To Firebase Storage
5. Admin panel shows results → Clips are ready!

---

## Setup (One-Time, ~5 minutes)

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **ah-testimony-library**
3. Click ⚙️ > **Project Settings** > **Service Accounts** tab
4. Click **"Generate New Private Key"** → Download JSON file

### Step 2: Configure Environment

```bash
# Navigate to local-processor directory
cd ~/Desktop/AH\ Testimony\ Library\ Project/testimony-app/local-processor

# Run setup script
./setup.sh
```

This will:
- Create `.env` file from template
- Install dependencies
- Guide you through configuration

### Step 3: Edit .env File

Open `.env` and paste values from the downloaded JSON:

```env
FIREBASE_PROJECT_ID=ah-testimony-library
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual key...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ah-testimony-library.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=ah-testimony-library.firebasestorage.app
```

**Important:** Keep the quotes and `\n` characters in `FIREBASE_PRIVATE_KEY`!

---

## Running the Processor

### Option 1: Run While You Work (Simple)

```bash
cd ~/Desktop/AH\ Testimony\ Library\ Project/testimony-app/local-processor
npm start
```

Keep this terminal open. Press `Ctrl+C` when done.

### Option 2: Run in Background

```bash
cd ~/Desktop/AH\ Testimony\ Library\ Project/testimony-app/local-processor
nohup npm start > processor.log 2>&1 &
```

To stop later:
```bash
ps aux | grep processor.js
kill <PID>
```

### Option 3: Auto-Start on Mac Boot (Recommended)

See `README.md` section "Run on Mac Startup" for LaunchAgent setup.

---

## Usage Workflow

### When You Want to Process Videos:

1. **Start the processor** (if not already running):
   ```bash
   cd ~/Desktop/AH\ Testimony\ Library\ Project/testimony-app/local-processor
   npm start
   ```

2. **Go to admin panel**: https://alphahourtestimonylibrary.com/admin

3. **Import clips** as usual (CSV import or manual entry)

4. **Watch the processor terminal** - you'll see:
   ```
   📬 Found 7 pending job(s)
   🎬 Processing Job: abc123
   📝 Title: Healing Testimony
   📥 Downloading video...
   ✂️  Trimming...
   ☁️  Uploading...
   ✅ JOB COMPLETED SUCCESSFULLY
   ```

5. **Check admin panel** - clips now have processed videos!

6. **When done for the day**: Press `Ctrl+C` to stop

---

## What You'll See

### When Waiting for Jobs:
```
⏳ 14:32:15 - Waiting for jobs... (polling every 30s)
```

### When Processing:
```
🎬 Processing Job: job_12345
📝 Title: Financial Breakthrough Testimony
🔗 URL: https://www.youtube.com/watch?v=...
⏱️  Time: 120s - 300s
════════════════════════════════════
  📥 Downloading video: xC2ytl7Hhas
  📊 Size: 125.45 MB, Quality: 720p
  ⏳ Progress: 100%
  ✅ Downloaded: 125.45 MB
  ✂️  Trimming: 120s to 300s (180s duration)
  🎬 FFmpeg started
  ⏳ Encoding: 100%
  ✅ Trimmed: 30.12 MB
  ☁️  Uploading to Firebase Storage...
  ✅ Uploaded: https://storage.googleapis.com/...
  🧹 Cleaned up temp files

✅ JOB COMPLETED SUCCESSFULLY
════════════════════════════════════
```

---

## Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
cd ~/Desktop/AH\ Testimony\ Library\ Project/testimony-app/local-processor
npm install
```

### "Firebase Admin not initialized"
- Check `.env` file exists and has all fields filled
- Make sure `FIREBASE_PRIVATE_KEY` has the full key including BEGIN/END

### "ytdl-core failed"
- This should work since it works on localhost
- Try a different video to test

### Jobs not being picked up
- Check Firebase Console > Firestore > `jobs` collection
- Verify jobs exist with `status: "pending"`
- Check processor logs: `tail -f processor.log`

### How to check if it's running
```bash
ps aux | grep processor.js
```

---

## Tips

✅ **Do:**
- Keep your Mac plugged in while processing
- Keep a terminal window open to watch progress
- Process in batches (import 7 videos, let them process)
- Check logs if something seems stuck

❌ **Don't:**
- Close your Mac lid (it will sleep and stop processing)
- Turn off your Mac while jobs are processing
- Commit `.env` to git (it has your private key!)

---

## Daily Workflow Example

**Monday morning (processing week's videos):**

1. Open Terminal
2. `cd ~/Desktop/AH\ Testimony\ Library\ Project/testimony-app/local-processor`
3. `npm start`
4. Go to admin panel and import your 7 videos
5. Watch the processor work through them (~10-20 min per video)
6. When all done, press `Ctrl+C`
7. Close Terminal

**That's it!** Videos are processed and live on your site.

---

## Advanced: Batch Processing

If you're doing a week's worth at once (7 videos):

1. Import all 7 via admin panel
2. Start processor: `npm start`
3. Go make coffee ☕ (takes ~1-2 hours total)
4. Come back to all videos processed!

The processor handles them one at a time automatically.

---

## Need Help?

- Check `README.md` for detailed documentation
- View logs: `tail -f processor.log`
- Check Firebase Console > Firestore > `jobs` collection for job status

---

## Cost

**$0/month** - Completely free! Uses your Mac and home internet.

Only "cost" is keeping your Mac on while processing (~1-2 hours per week).

---

## Next Steps

1. Run the setup: `./setup.sh`
2. Configure `.env` with Firebase credentials
3. Test with one video: `npm start`
4. Once working, set up auto-start (optional)

You're all set! 🎉
