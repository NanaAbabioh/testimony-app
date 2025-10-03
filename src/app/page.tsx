'use client';

import Link from 'next/link';
import CategoryGrid from './components/CategoryGrid';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Enhanced Gradient Background with smooth transition */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, #1a1a2e 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, #16213e 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, #0f3460 0%, transparent 50%),
              linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)
            `
          }}
        />
        {/* Smooth transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-gray-50"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute top-10 left-10 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-white/25 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-32 left-32 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-40 right-40 w-1 h-1 bg-white/25 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-60 left-60 w-2 h-2 bg-white/30 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-40 right-60 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-200"></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Welcome to the Alpha Hour<br />
              <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">Testimony Library</span>
            </h1>
            
            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-xl md:text-2xl text-white/90 mb-2 font-light italic leading-relaxed">
                "We will not hide these truths from our children;
              </p>
              <p className="text-xl md:text-2xl text-white/90 mb-4 font-light italic leading-relaxed">
                we will tell the next generation about the glorious deeds of the Lord,<br />
                about his power and his mighty wonders"
              </p>
              <p className="text-lg text-white/80">— Psalms 78:4, NLT</p>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  // Find the categories section with "What testimony are you believing God for?"
                  const categoriesSection = document.getElementById('categories-section');
                  if (categoriesSection) {
                    // Account for fixed header height (approx 80px)
                    const headerOffset = 80;
                    const elementPosition = categoriesSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    // Use native smooth scroll for better performance
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white px-10 py-4 rounded-lg font-semibold text-lg uppercase tracking-wide hover:shadow-2xl hover:scale-105 transition-all transform shadow-lg"
              >
                Explore Testimonies
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Testimonies Section */}
      <section id="discover-testimonies-section" className="relative py-20 overflow-hidden" style={{
        backgroundImage: `url('/hallelujah-bg.svg')`,
        backgroundColor: '#ffffff'
      }}>
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-[#1a1a2e] via-[#0f3460] to-[#16213e] bg-clip-text text-transparent drop-shadow-lg">
              Discover Testimonies
            </h2>
            
            <div className="space-y-2">
              <p className="text-xl md:text-2xl text-gray-700 font-light italic">
                "Come and listen, all you who fear God,
              </p>
              <p className="text-xl md:text-2xl text-gray-700 font-light italic mb-4">
                and I will tell you what he did for me."
              </p>
              <p className="text-lg text-gray-600">— Psalms 66:16, NLT</p>
            </div>
          </div>
        </div>
        
      </section>

      {/* Category Grid */}
      <CategoryGrid />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 text-center md:text-left">
            <div>
              <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-purple-900 font-bold text-lg">AH</span>
                </div>
                <div>
                  <span className="text-white font-bold text-xl">ALPHA HOUR</span>
                  <span className="block text-gray-400 text-sm">Testimony Library</span>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Everyday with God, is Everyday in Victory!
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-6 text-white">Connect With Us</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Join our community and experience God's goodness daily.
              </p>
              <div className="flex gap-4 justify-center md:justify-start">
                {/* Facebook */}
                <a 
                  href="https://facebook.com/Pastoragyemangelvis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all group"
                  title="Follow us on Facebook"
                >
                  <svg className="w-6 h-6 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                    <path d="M15.874 13.343v-2.25c0-.949.465-1.874 1.956-1.874h1.547V5.266s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v1.673H7.078v3.47h3.047v8.385a11.994 11.994 0 003.796 0v-8.385h2.796l.532-3.47h-3.328z" fill="white"/>
                  </svg>
                </a>
                
                {/* X (Twitter) */}
                <a 
                  href="https://x.com/REAgyemang" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all group"
                  title="Follow us on X"
                >
                  <svg className="w-6 h-6 fill-white group-hover:fill-black transition-colors" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                
                {/* WhatsApp */}
                <a 
                  href="https://www.whatsapp.com/channel/0029VaC8KCc6WaKsOD8IH83j" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all group"
                  title="Connect on WhatsApp"
                >
                  <svg className="w-6 h-6 fill-[#25D366] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
                
                {/* Instagram */}
                <a 
                  href="https://instagram.com/rev_elvis_agyemang" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all group"
                  title="Follow us on Instagram"
                >
                  <svg className="w-6 h-6 fill-[#E4405F] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                
                {/* Telegram */}
                <a 
                  href="https://t.me/PastorElvisAgyemang" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all group"
                  title="Join us on Telegram"
                >
                  <svg className="w-6 h-6 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="12" fill="#0088cc"/>
                    <path d="M16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="white"/>
                  </svg>
                </a>
                
                {/* YouTube */}
                <a 
                  href="https://youtube.com/@PastorElvisAgyemang" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all group"
                  title="Subscribe to our YouTube channel"
                >
                  <svg className="w-6 h-6 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
                    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
                  </svg>
                </a>
                
                {/* TikTok */}
                <a 
                  href="https://tiktok.com/@psagyemangelvisofficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all group"
                  title="Follow us on TikTok"
                >
                  <svg className="w-6 h-6 fill-white group-hover:fill-black transition-colors" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 Alpha Hour Testimony Library.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}