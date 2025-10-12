import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/requireAdmin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to convert time string to seconds
function timeToSeconds(timeStr: string): number {
  // Remove any whitespace
  timeStr = timeStr.trim();
  
  // If it's already a number (seconds), return it
  if (/^\d+$/.test(timeStr)) {
    return parseInt(timeStr);
  }
  
  // Handle MM:SS or HH:MM:SS format
  const parts = timeStr.split(':').map(p => parseInt(p));
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  throw new Error(`Invalid time format: ${timeStr}`);
}

// Helper to extract video ID from YouTube URL
function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  throw new Error(`Could not extract video ID from URL: ${url}`);
}

interface ClipData {
  episode: string;
  youtubeLink: string;
  startTime: string;
  endTime: string;
  language: string;
  category?: string;
  clipTitle?: string;
  briefDescription: string;
  needsAI?: boolean;
}

// Configuration for batch processing
const BATCH_SIZE = 10; // Process 10 clips at a time for AI
const AI_DELAY_MS = 1000; // 1 second delay between AI batches
const MAX_CLIPS_PER_REQUEST = 100; // Maximum clips per import request

export async function POST(request: NextRequest) {
  try {
    // Verify admin token using the same system as other endpoints
    const authHeader = request.headers.get('authorization');
    const admin = await requireAdmin(authHeader || undefined);
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clips } = await request.json();
    
    // Fetch actual categories from database
    const categoriesSnapshot = await db!.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));
    
    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json({ error: 'No clips provided' }, { status: 400 });
    }

    if (clips.length > MAX_CLIPS_PER_REQUEST) {
      return NextResponse.json({ 
        error: `Too many clips. Maximum ${MAX_CLIPS_PER_REQUEST} clips per import. You provided ${clips.length}.` 
      }, { status: 400 });
    }

    // Process clips that need AI assistance (English clips without category/title)
    const clipsNeedingAI = clips.filter((c: ClipData) => c.needsAI);
    const processedClips: ClipData[] = [];
    const categoryList = categories.map((c: any) => c.name).join(', ');
    
    console.log(`Processing ${clips.length} clips (${clipsNeedingAI.length} need AI)`);

    // Process clips in batches to avoid rate limiting
    for (let i = 0; i < clips.length; i += BATCH_SIZE) {
      const batch = clips.slice(i, Math.min(i + BATCH_SIZE, clips.length));
      const batchPromises = [];
      
      for (const clip of batch) {
        // Check if we need AI for title generation (when clipTitle is missing)
        const needsAITitle = !clip.clipTitle && clip.briefDescription;
        
        if (needsAITitle) {
          // Process with AI for title generation only
          const aiPromise = openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are an expert AI assistant that creates compelling titles for church testimonies.
                
                INSTRUCTIONS:
                1. TITLE CREATION: Create a concise, meaningful title that captures the essence of the testimony
                2. For multi-topic testimonies, use format "Main Topic | Secondary Topic" (e.g., "Cancer Healing | Job Promotion")
                3. Keep titles descriptive but concise (4-10 words maximum)
                4. Use active, positive language
                5. Focus on the outcome or breakthrough mentioned
                
                EXAMPLES:
                - "Healed of cancer and got job promotion" → "Cancer Healing | Job Promotion"
                - "Delivered from addiction after 10 years" → "Freedom from 10-Year Addiction"
                - "Marriage restoration after separation" → "Marriage Restored After Separation"
                - "Got visa approval for USA" → "USA Visa Approval"
                - "Graduated with honors and got scholarship" → "Graduation with Honors | Scholarship"
                
                Respond with ONLY the title text (no JSON, no quotes, just the title):`
              },
              {
                role: "user",
                content: `Generate a title for this testimony: ${clip.briefDescription}`
              }
            ],
            temperature: 0.2,
            max_tokens: 150,
          }).then(completion => {
            const aiResponse = completion.choices[0].message.content;
            const generatedTitle = aiResponse?.trim() || clip.briefDescription.slice(0, 50);
            
            return { 
              ...clip, 
              clipTitle: generatedTitle
            };
          }).catch(error => {
            console.error('AI processing error:', error);
            return { ...clip, clipTitle: clip.briefDescription.slice(0, 50) };
          });
          
          batchPromises.push(aiPromise);
        } else {
          // No AI needed, use clip as is (category and title already provided)
          batchPromises.push(Promise.resolve(clip));
        }
      }
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      processedClips.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < clips.length && clipsNeedingAI.length > 0) {
        await new Promise(resolve => setTimeout(resolve, AI_DELAY_MS));
      }
    }

    // Now save all clips to Firestore
    const batch = db.batch();
    const savedClips = [];
    const errors = [];

    for (const clip of processedClips) {
      try {
        const videoId = extractVideoId(clip.youtubeLink);
        const startTimeSeconds = timeToSeconds(clip.startTime);
        const endTimeSeconds = timeToSeconds(clip.endTime);
        
        // Find category ID - first try exact match, then fuzzy match
        let categoryDoc = categories.find((c: any) => 
          c.name.toLowerCase() === clip.category?.toLowerCase()
        );
        
        // If not found, try to create the category ID from the name
        if (!categoryDoc && clip.category) {
          // Log for debugging
          console.log(`Category "${clip.category}" not found in:`, categories.map(c => c.name));
          
          const categoryId = clip.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          // Check if this category ID exists in the database
          const catRef = await db!.collection('categories').doc(categoryId).get();
          if (catRef.exists) {
            categoryDoc = { id: categoryId, name: catRef.data()?.name || clip.category };
          } else {
            // Create a fallback category
            categoryDoc = { id: categoryId, name: clip.category };
          }
        }
        
        if (!categoryDoc) {
          errors.push({
            episode: clip.episode,
            error: `Category not found: ${clip.category}`
          });
          continue;
        }

        // Check if video exists, if not create it
        const videoRef = db!.collection('videos').doc(videoId);
        const videoDoc = await videoRef.get();
        
        if (!videoDoc.exists) {
          // Create video document
          batch.set(videoRef, {
            id: videoId,
            title: `Episode ${clip.episode}`,
            url: clip.youtubeLink,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            createdAt: new Date().toISOString(),
            uploadDate: new Date().toISOString(),
            status: 'live'
          });
        }

        // Create clip document first (without processed video)
        const clipRef = db!.collection('clips').doc();
        const clipData = {
          sourceVideoId: videoId,
          categoryId: categoryDoc.id,
          title: clip.clipTitle || 'Untitled Testimony',
          startTimeSeconds,
          endTimeSeconds,
          fullText: clip.briefDescription,
          language: clip.language,
          episode: clip.episode,
          processedClipUrl: '', // Will be filled by local processor
          processingStatus: 'pending', // Track processing status
          createdAt: new Date().toISOString(),
          createdBy: 'csv-import'
        };

        // Create a processing job for the local processor
        const jobRef = db!.collection('jobs').doc();
        const jobData = {
          clipId: clipRef.id,
          youtubeUrl: clip.youtubeLink,
          startTimeSeconds,
          endTimeSeconds,
          videoId,
          clipTitle: clip.clipTitle || 'Untitled Testimony',
          status: 'pending', // pending, processing, completed, failed
          createdAt: new Date().toISOString(),
          createdBy: 'admin',
          priority: 1, // Higher number = higher priority
        };

        batch.set(jobRef, jobData);
        console.log(`📋 Created processing job for clip: ${clip.clipTitle || 'Untitled'} (Job ID: ${jobRef.id})`);
        
        batch.set(clipRef, clipData);
        savedClips.push({
          ...clipData,
          id: clipRef.id
        });
        
      } catch (error: any) {
        errors.push({
          episode: clip.episode,
          error: error.message || 'Processing error'
        });
      }
    }

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      imported: savedClips.length,
      errors: errors.length,
      message: `Created ${savedClips.length} clips. Video processing jobs queued for local processor.`,
      details: {
        savedClips: savedClips.length,
        errors: errors.slice(0, 5), // Show first 5 errors for debugging
        aiProcessed: clipsNeedingAI.length,
        total: clips.length,
        jobsCreated: savedClips.length,
        note: 'Videos will be processed by local Mac processor. Check job status in admin panel.',
        errorSample: errors.length > 0 ? errors[0] : null
      }
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}