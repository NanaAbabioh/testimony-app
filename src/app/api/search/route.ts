import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }

    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    console.log(`🔍 Searching for: "${query}"`);

    // Get all clips from the database
    const clipsSnapshot = await adminDb.collection('clips').get();
    
    if (clipsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        testimonies: [],
        totalResults: 0,
        query: query
      });
    }

    // Semantic keyword mapping for intelligent search
    const semanticKeywords = {
      'car': ['vehicle', 'automobile', 'mercedes', 'benz', 'bmw', 'toyota', 'honda', 'nissan', 'ford', 'jeep', 'truck', 'suv', 'sedan', 'auto'],
      'money': ['financial', 'finance', 'cash', 'funds', 'income', 'salary', 'wealth', 'prosperity', 'breakthrough', 'business', 'job', 'career', 'promotion'],
      'house': ['home', 'housing', 'apartment', 'building', 'property', 'real estate', 'mortgage', 'rent', 'accommodation'],
      'job': ['work', 'employment', 'career', 'occupation', 'position', 'role', 'profession', 'business', 'income', 'salary'],
      'sick': ['illness', 'disease', 'health', 'healing', 'medical', 'hospital', 'doctor', 'pain', 'condition', 'recovery'],
      'child': ['baby', 'pregnancy', 'birth', 'conception', 'fertility', 'barren', 'childless', 'family', 'children', 'kids'],
      'school': ['education', 'university', 'college', 'academic', 'studies', 'degree', 'graduation', 'exam', 'learning', 'scholarship'],
      'travel': ['visa', 'immigration', 'passport', 'journey', 'trip', 'flight', 'abroad', 'foreign', 'country', 'relocation'],
      'marriage': ['wedding', 'spouse', 'husband', 'wife', 'relationship', 'partner', 'engagement', 'love', 'union'],
      'business': ['company', 'enterprise', 'startup', 'venture', 'investment', 'profit', 'success', 'growth', 'contract']
    };

    // Expand search terms with semantic matches
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const expandedTerms = [...searchTerms];
    
    for (const term of searchTerms) {
      if (semanticKeywords[term]) {
        expandedTerms.push(...semanticKeywords[term]);
      }
    }

    const matchingTestimonies = [];
    const allClipData = [];

    // First pass: collect all clips for potential suggestions
    for (const doc of clipsSnapshot.docs) {
      const clipData = doc.data();
      allClipData.push({ id: doc.id, data: clipData });
    }

    // Search through all clips with intelligent semantic matching
    for (const { id, data: clipData } of allClipData) {
      const searchableText = [
        clipData.title || '',
        clipData.titleShort || '',
        clipData.category || '',
        clipData.fullText || '',
        clipData.summary || '',
        clipData.summaryShort || ''
      ].join(' ').toLowerCase();

      // Exact match scoring (highest weight)
      let exactScore = 0;
      let semanticScore = 0;
      let fuzzyScore = 0;

      // Check original search terms first (highest priority)
      for (const term of searchTerms) {
        if (searchableText.includes(term)) {
          exactScore += term.length * 3; // Higher weight for exact matches
        }
        
        // Fuzzy matching for partial words
        const words = searchableText.split(/\s+/);
        for (const word of words) {
          if (word.includes(term) || term.includes(word)) {
            fuzzyScore += Math.min(term.length, word.length) * 1.5;
          }
        }
      }

      // Check semantic matches (medium priority)
      for (const term of searchTerms) {
        if (semanticKeywords[term]) {
          for (const semantic of semanticKeywords[term]) {
            if (searchableText.includes(semantic)) {
              semanticScore += semantic.length * 2; // Medium weight for semantic matches
            }
          }
        }
      }

      const totalScore = exactScore + semanticScore + fuzzyScore;
      
      if (totalScore > 0) {
        // Get video information
        let videoData = null;
        try {
          const videoDoc = await adminDb.collection('videos').doc(clipData.sourceVideoId).get();
          if (videoDoc.exists) {
            videoData = videoDoc.data();
          }
        } catch (error) {
          console.warn(`Could not fetch video data for ${clipData.sourceVideoId}:`, error);
        }

        matchingTestimonies.push({
          id: id,
          videoId: clipData.sourceVideoId,
          startSec: clipData.startTimeSeconds,
          endSec: clipData.endTimeSeconds,
          serviceDate: clipData.serviceDate || "",
          savedCount: clipData.savedCount || 0,
          titleShort: clipData.titleShort || clipData.title || "",
          summaryShort: clipData.summaryShort || "",
          thumbUrl: clipData.thumbUrl || `https://i.ytimg.com/vi/${clipData.sourceVideoId}/hqdefault.jpg`,
          episode: clipData.episode || "", // Include episode field for sorting
          
          // Legacy fields for backward compatibility
          title: clipData.title,
          category: clipData.category,
          fullText: clipData.fullText,
          summary: clipData.summary,
          startTime: clipData.startTimeSeconds,
          endTime: clipData.endTimeSeconds,
          sourceVideo: {
            id: clipData.sourceVideoId,
            title: videoData?.title || 'Unknown Video',
            url: `https://www.youtube.com/watch?v=${clipData.sourceVideoId}`,
            episode: clipData.episode || "" // Include episode in sourceVideo too
          },
          _score: totalScore // Add score for sorting
        });
      }
    }

    // Sort by relevance score first, then by episode number (latest episodes first)
    matchingTestimonies.sort((a, b) => {
      // Primary sort: relevance score (highest first)
      if (a._score !== b._score) {
        return b._score - a._score;
      }
      
      // Secondary sort: episode number (extract numeric part for proper sorting)
      const getEpisodeNumber = (ep: string) => {
        if (!ep) return 0;
        const match = ep.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      
      const aEpisode = getEpisodeNumber(a.sourceVideo?.episode || a.episode || '');
      const bEpisode = getEpisodeNumber(b.sourceVideo?.episode || b.episode || '');
      
      if (aEpisode !== bEpisode) {
        return bEpisode - aEpisode; // Latest episode first
      }
      
      // Tertiary sort: alphabetical by title
      return a.title.localeCompare(b.title);
    });

    // If no results found, generate suggestions
    let suggestions = [];
    if (matchingTestimonies.length === 0 && searchTerms.length > 0) {
      // Get unique categories for suggestions
      const categories = [...new Set(allClipData.map(clip => clip.data.category).filter(Boolean))];
      
      // Find similar categories or common terms
      const searchLower = query.toLowerCase();
      const suggestedCategories = [];
      const commonTerms = ['healing', 'financial', 'breakthrough', 'deliverance', 'family', 'career', 'academic', 'business'];
      
      // Category-based suggestions
      for (const category of categories) {
        if (category.toLowerCase().includes(searchLower) || searchLower.includes(category.toLowerCase())) {
          suggestedCategories.push(category);
        }
      }
      
      // Common term suggestions
      for (const term of commonTerms) {
        if (term.includes(searchLower) || searchLower.includes(term)) {
          if (!suggestedCategories.some(cat => cat.toLowerCase().includes(term))) {
            suggestedCategories.push(term.charAt(0).toUpperCase() + term.slice(1));
          }
        }
      }
      
      suggestions = suggestedCategories.slice(0, 5); // Limit to 5 suggestions
    }

    console.log(`✅ Found ${matchingTestimonies.length} matching testimonies`);
    if (suggestions.length > 0) {
      console.log(`💡 Generated ${suggestions.length} suggestions: ${suggestions.join(', ')}`);
    }

    // Remove score from response
    const cleanedTestimonies = matchingTestimonies.map(({ _score, ...testimony }) => testimony);

    return NextResponse.json({
      success: true,
      testimonies: cleanedTestimonies,
      totalResults: cleanedTestimonies.length,
      query: query,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    });

  } catch (error) {
    console.error('Error searching testimonies:', error);
    return NextResponse.json(
      { error: 'Failed to search testimonies' },
      { status: 500 }
    );
  }
}