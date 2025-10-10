// Google Analytics tracking utilities

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_path: url,
    });
  }
};

// Track custom events
interface EventParams {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const event = ({ action, category, label, value }: EventParams) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Predefined event tracking functions for common actions
export const trackTestimonyView = (testimonyId: string, title: string) => {
  event({
    action: 'view_testimony',
    category: 'Engagement',
    label: title,
  });
};

export const trackTestimonyPlay = (testimonyId: string, title: string) => {
  event({
    action: 'play_testimony',
    category: 'Engagement',
    label: title,
  });
};

export const trackTestimonySave = (testimonyId: string, title: string) => {
  event({
    action: 'save_testimony',
    category: 'Engagement',
    label: title,
  });
};

export const trackCategoryView = (categoryName: string) => {
  event({
    action: 'view_category',
    category: 'Navigation',
    label: categoryName,
  });
};

export const trackSearch = (searchQuery: string) => {
  event({
    action: 'search',
    category: 'Engagement',
    label: searchQuery,
  });
};

export const trackShare = (platform: string, testimonyTitle: string) => {
  event({
    action: 'share',
    category: 'Social',
    label: `${platform} - ${testimonyTitle}`,
  });
};
