import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function GET() {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized - returning empty stats');
      return NextResponse.json({
        success: true,
        stats: {
          totalVideos: 0,
          totalTestimonies: 0,
          totalCategories: 0,
          categoryBreakdown: {},
          recentVideos: []
        }
      });
    }

    // Get counts for all collections
    const [videosSnapshot, clipsSnapshot, categoriesSnapshot] = await Promise.all([
      adminDb.collection('videos').get(),
      adminDb.collection('clips').get(),
      adminDb.collection('categories').get()
    ]);

    // Get category breakdown - use category name from clips directly
    const categoryBreakdown: { [key: string]: number } = {};
    
    // Create a map of category IDs to names
    const categoryIdToName: { [key: string]: string } = {};
    categoriesSnapshot.docs.forEach(doc => {
      const categoryData = doc.data();
      categoryIdToName[doc.id] = categoryData.name;
    });
    
    // Count clips by category name
    const clipsByCategory: { [key: string]: number } = {};
    clipsSnapshot.docs.forEach(doc => {
      const clipData = doc.data();
      // Use categoryId to look up the category name
      const categoryName = clipData.categoryId 
        ? (categoryIdToName[clipData.categoryId] || 'Other')
        : 'Other';
      clipsByCategory[categoryName] = (clipsByCategory[categoryName] || 0) + 1;
    });
    
    // If no clips found, get categories and set them to 0
    if (Object.keys(clipsByCategory).length === 0) {
      categoriesSnapshot.docs.forEach(doc => {
        const categoryData = doc.data();
        clipsByCategory[categoryData.name] = 0;
      });
    }
    
    // Set the breakdown
    Object.assign(categoryBreakdown, clipsByCategory);

    // Get recent activity (last 5 videos)
    const recentVideos = [];
    const recentVideosSnapshot = await adminDb.collection('videos')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    for (const doc of recentVideosSnapshot.docs) {
      const videoData = doc.data();
      const clipsCount = await adminDb.collection('clips')
        .where('sourceVideoId', '==', doc.id)
        .get();
      
      recentVideos.push({
        id: doc.id,
        title: videoData.title,
        createdAt: videoData.createdAt,
        testimonyCount: clipsCount.size
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalVideos: videosSnapshot.size,
        totalTestimonies: clipsSnapshot.size,
        totalCategories: categoriesSnapshot.size,
        categoryBreakdown: categoryBreakdown,
        recentVideos: recentVideos
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({
      success: true,
      stats: {
        totalVideos: 0,
        totalTestimonies: 0,
        totalCategories: 0,
        categoryBreakdown: {},
        recentVideos: []
      }
    });
  }
}