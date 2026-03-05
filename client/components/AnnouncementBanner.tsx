import { useState, useEffect, useCallback, useRef } from "react";
import { X, AlertCircle, Info, AlertTriangle, Megaphone } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { Announcement } from "@shared/api";

interface AnnouncementBannerProps {
  userId: number;
  userRole: string;
}

export function AnnouncementBanner({ userId, userRole }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const dismissedRef = useRef<Set<number>>(new Set());

  // Keep ref in sync with state
  useEffect(() => {
    dismissedRef.current = dismissed;
  }, [dismissed]);

  // Fetch active announcements with useCallback
  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/announcements?userId=${userId}&userRole=${userRole}`
      );
      if (response.ok) {
        const data = await response.json();
        const activeAnnouncements = data.announcements.filter(
          (a: Announcement) => !dismissedRef.current.has(a.id)
        );
        setAnnouncements(activeAnnouncements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  }, [userId, userRole]);

  // Mark announcement as viewed with useCallback
  const markAsViewed = useCallback(async (announcementId: number) => {
    try {
      await fetch(`/api/announcements/${announcementId}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error("Error marking announcement as viewed:", error);
    }
  }, [userId]);

  // Dismiss announcement with useCallback
  const dismissAnnouncement = useCallback((announcementId: number) => {
    setDismissed(prev => new Set([...prev, announcementId]));
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    setCurrentIndex(prev => {
      const newLength = announcements.filter(a => a.id !== announcementId).length;
      return Math.min(prev, Math.max(0, newLength - 1));
    });
  }, [announcements]);

  // Get icon based on priority
  const getIcon = (priority: string, icon: string) => {
    if (icon === "alert") return AlertTriangle;
    if (icon === "info") return Info;
    if (icon === "megaphone") return Megaphone;
    
    switch (priority) {
      case "critical":
        return AlertCircle;
      case "high":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  // Auto-rotate announcements
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  // Initial fetch with longer polling interval
  useEffect(() => {
    fetchAnnouncements();
    
    // Refresh every 10 minutes instead of 5 (less aggressive)
    const interval = setInterval(fetchAnnouncements, 600000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  // Mark as viewed when displayed
  useEffect(() => {
    if (announcements.length > 0 && announcements[currentIndex]) {
      const current = announcements[currentIndex];
      if (!current.is_viewed) {
        markAsViewed(current.id);
      }
    }
  }, [currentIndex, announcements]);

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];
  const Icon = getIcon(currentAnnouncement.priority, currentAnnouncement.icon);

  // Get background color based on priority
  const getBgColor = () => {
    if (currentAnnouncement.banner_color !== "#3b82f6") {
      return { backgroundColor: currentAnnouncement.banner_color };
    }
    
    switch (currentAnnouncement.priority) {
      case "critical":
        return { backgroundColor: "#dc2626" };
      case "high":
        return { backgroundColor: "#ea580c" };
      case "normal":
        return { backgroundColor: "#3b82f6" };
      default:
        return { backgroundColor: "#6b7280" };
    }
  };

  return (
    <div
      className="relative text-white shadow-lg animate-in slide-in-from-top"
      style={getBgColor()}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-0.5">
              {currentAnnouncement.title}
            </h4>
            <p className="text-sm opacity-90 line-clamp-2">
              {currentAnnouncement.content}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {announcements.length > 1 && (
              <div className="flex gap-1">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === currentIndex
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => dismissAnnouncement(currentAnnouncement.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
