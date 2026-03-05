import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnnouncementsList } from "@/components/AnnouncementsList";

export default function Announcements() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            navigate("/");
          }
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AnnouncementsList 
      userId={user.id} 
      userRole={user.role}
      onBack={() => navigate("/")}
    />
  );
}
