import { useEffect, useState } from 'react';

interface SiteSettings {
  // Branding
  site_name: string;
  site_tagline: string;
  site_logo_url: string;
  site_favicon_url: string;
  hero_image_url: string;
  
  // Colors
  primary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  background_color: string;
  text_primary_color: string;
  text_secondary_color: string;
  
  // Typography
  font_family_heading: string;
  font_family_body: string;
  font_size_base: string;
  
  // Content
  welcome_message: string;
  contact_email: string;
  contact_phone: string;
  footer_text: string;
  
  // Layout
  show_announcements: string;
  show_recommendations: string;
  show_map: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/site-settings');
      const data = await response.json();
      
      if (data.success) {
        const settingsMap = data.settingsMap;
        setSettings(settingsMap);
        applySettings(settingsMap);
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySettings = (settingsMap: any) => {
    const root = document.documentElement;
    
    // Apply color CSS variables
    if (settingsMap.primary_color) {
      root.style.setProperty('--primary', settingsMap.primary_color);
    }
    if (settingsMap.accent_color) {
      root.style.setProperty('--accent', settingsMap.accent_color);
    }
    if (settingsMap.background_color) {
      root.style.setProperty('--background', settingsMap.background_color);
    }
    if (settingsMap.text_primary_color) {
      root.style.setProperty('--text-primary', settingsMap.text_primary_color);
    }
    if (settingsMap.text_secondary_color) {
      root.style.setProperty('--text-secondary', settingsMap.text_secondary_color);
    }

    // Apply typography
    if (settingsMap.font_family_heading) {
      root.style.setProperty('--font-heading', settingsMap.font_family_heading);
    }
    if (settingsMap.font_family_body) {
      root.style.setProperty('--font-body', settingsMap.font_family_body);
    }
    if (settingsMap.font_size_base) {
      root.style.setProperty('--font-size-base', `${settingsMap.font_size_base}px`);
    }

    // Update document title
    if (settingsMap.site_name) {
      document.title = settingsMap.site_name;
    }

    // Update favicon if provided
    if (settingsMap.site_favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settingsMap.site_favicon_url;
    }
  };

  const refreshSettings = () => {
    fetchSettings();
  };

  return { settings, loading, refreshSettings };
}

export default useSiteSettings;
