import { useState, useEffect } from "react";
import { ArrowLeft, Megaphone, Calendar, User, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import type { Announcement } from "@shared/api";

interface AnnouncementsListProps {
  userId: number;
  userRole: string;
  onBack?: () => void;
}

export function AnnouncementsList({ userId, userRole, onBack }: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/announcements?userId=${userId}&userRole=${userRole}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark as viewed
  const markAsViewed = async (announcementId: number) => {
    try {
      await fetch(`/api/announcements/${announcementId}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === announcementId ? { ...a, is_viewed: true } : a
        )
      );
    } catch (error) {
      console.error("Error marking announcement as viewed:", error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High Priority</Badge>;
      case "normal":
        return <Badge variant="secondary">Normal</Badge>;
      default:
        return <Badge variant="outline">Low Priority</Badge>;
    }
  };

  // Get border color
  const getBorderColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "normal":
        return "border-l-blue-500";
      default:
        return "border-l-gray-300";
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [userId, userRole]);

  // Separate active and expired announcements
  const now = new Date();
  const activeAnnouncements = announcements.filter(
    a => !a.end_date || new Date(a.end_date) >= now
  );
  const expiredAnnouncements = announcements.filter(
    a => a.end_date && new Date(a.end_date) < now
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Megaphone className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Announcements</h1>
              <p className="text-gray-600">Stay updated with resort news and updates</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Active Announcements */}
            {activeAnnouncements.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Active Announcements</h2>
                <div className="space-y-4">
                  {activeAnnouncements.map((announcement) => (
                    <Card
                      key={announcement.id}
                      className={cn(
                        "border-l-4 transition-all cursor-pointer hover:shadow-md",
                        getBorderColor(announcement.priority),
                        !announcement.is_viewed && "bg-blue-50/30"
                      )}
                      onClick={() => {
                        setSelectedId(
                          selectedId === announcement.id ? null : announcement.id
                        );
                        if (!announcement.is_viewed) {
                          markAsViewed(announcement.id);
                        }
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">
                                {announcement.title}
                              </CardTitle>
                              {!announcement.is_viewed && (
                                <Badge variant="outline" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{announcement.created_by_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(announcement.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{announcement.views_count} views</span>
                              </div>
                            </div>
                          </div>
                          {getPriorityBadge(announcement.priority)}
                        </div>
                      </CardHeader>
                      {selectedId === announcement.id && (
                        <CardContent>
                          <Separator className="mb-4" />
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {announcement.content}
                            </p>
                          </div>
                          {announcement.end_date && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm text-gray-600">
                                Valid until: {formatDate(announcement.end_date)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Expired Announcements */}
            {expiredAnnouncements.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-600">
                  Past Announcements
                </h2>
                <div className="space-y-4 opacity-70">
                  {expiredAnnouncements.map((announcement) => (
                    <Card
                      key={announcement.id}
                      className="border-l-4 border-l-gray-300 cursor-pointer hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setSelectedId(
                          selectedId === announcement.id ? null : announcement.id
                        );
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-700">
                              {announcement.title}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(announcement.created_at)}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Expired
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      {selectedId === announcement.id && (
                        <CardContent>
                          <Separator className="mb-4" />
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {announcement.content}
                            </p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No announcements */}
            {announcements.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Megaphone className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No Announcements
                  </h3>
                  <p className="text-gray-500 text-center">
                    There are no announcements at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
