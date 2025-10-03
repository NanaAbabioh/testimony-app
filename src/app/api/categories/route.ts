import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

// Function to get display names for categories (frontend only)
function getCategoryDisplayName(categoryName: string): string {
  const displayNameMap: Record<string, string> = {
    'Career & Financial Breakthrough': 'Career, Business & Financial Breakthrough',
    'Divine Intervention & Protection': 'Divine Intervention'
  };

  return displayNameMap[categoryName] || categoryName;
}

export async function GET() {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized - returning empty categories');
      // Return empty but successful response when database not available
      return NextResponse.json({
        success: true,
        categories: [],
        stats: {
          totalTestimonies: 0,
          totalCategories: 0,
          totalVideos: 0
        },
        message: 'Database not initialized. Set up Firebase credentials to see processed data.'
      });
    }

    // Get all categories
    const categoriesSnapshot = await adminDb.collection('categories').get();
    const categories = [];

    for (const doc of categoriesSnapshot.docs) {
      const categoryData = doc.data();
      
      // Count testimonies for this category
      const clipsSnapshot = await adminDb.collection('clips')
        .where('categoryId', '==', doc.id)
        .get();
      
      categories.push({
        id: doc.id,
        name: getCategoryDisplayName(categoryData.name),
        originalName: categoryData.name, // Keep original for backend compatibility
        description: categoryData.description,
        count: clipsSnapshot.size
      });
    }

    // Get total videos processed
    const videosSnapshot = await adminDb.collection('videos').get();
    const totalVideos = videosSnapshot.size;

    // Get total testimonies
    const totalClipsSnapshot = await adminDb.collection('clips').get();
    const totalTestimonies = totalClipsSnapshot.size;

    return NextResponse.json({
      success: true,
      categories: categories,
      stats: {
        totalTestimonies: totalTestimonies,
        totalCategories: categories.length,
        totalVideos: totalVideos
      }
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // Return empty but successful response on error
    return NextResponse.json({
      success: true,
      categories: [],
      stats: {
        totalTestimonies: 0,
        totalCategories: 0,
        totalVideos: 0
      },
      message: 'Error connecting to database. Please check Firebase configuration.'
    });
  }
}