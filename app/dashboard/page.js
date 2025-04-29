'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { ArrowRightOnRectangleIcon, UserCircleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

// Dashboard component for managing user projects and profile
export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [chats, setChats] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [editProfile, setEditProfile] = useState({ full_name: "", email: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true after the component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch profile, projects, and chats when user is available
  useEffect(() => {
    if (!loading && !user) {
      setIsRedirecting(true);
      router.push("/login");
    } else if (user && isMounted) {
      const fetchProfileAndProjects = async () => {
        try {
          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) {
            setFetchError("Failed to load profile.");
            console.error("Profile fetch error:", profileError.message);
          } else if (profileData) {
            setProfile(profileData);
            setEditProfile({
              full_name: profileData.full_name || "",
              email: profileData.email,
            });
          } else {
            setProfile({ email: user.email, full_name: null });
            setEditProfile({ email: user.email, full_name: "" });
          }

          // Fetch projects
          const { data: projectsData, error: projectsError } = await supabase
            .from("projects")
            .select(
              "id, name, product_service, target_platform, primary_goal, product_description, product_features"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (projectsError) {
            setFetchError("Failed to load projects.");
            console.error("Projects fetch error:", projectsError.message);
          } else {
            setProjects(projectsData || []);
          }

          // Fetch latest AI chat messages per conversation
          const { data: chatsData, error: chatsError } = await supabase
            .from("chat_messages")
            .select("id, conversation_id, content, created_at, product_name, role")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3); // Limit to 3 conversations for display

          if (chatsError) {
            setFetchError("Failed to load AI chat history.");
            console.error("Chats fetch error:", chatsError.message);
          } else {
            // Group by conversation_id and take the latest message
            const uniqueChats = [];
            const seenConversations = new Set();
            for (const chat of chatsData) {
              if (!seenConversations.has(chat.conversation_id)) {
                seenConversations.add(chat.conversation_id);
                uniqueChats.push(chat);
              }
            }
            setChats(uniqueChats);
          }
        } catch (err) {
          setFetchError("Unexpected error loading data.");
          console.error("Unexpected error:", err.message);
        }
      };
      fetchProfileAndProjects();
    }
  }, [user, loading, router, isMounted]);

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editProfile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editProfile.email)) {
      toast.error("Please enter a valid email.");
      return;
    }

    const profilePromise = supabase
      .from("profiles")
      .update({
        full_name: editProfile.full_name.trim() || null,
        email: editProfile.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    toast.promise(profilePromise, {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: (err) => err.message || "Failed to update profile.",
    });

    try {
      const { error } = await profilePromise;
      if (error) {
        console.error("Profile update error:", error.message);
      } else {
        setProfile({
          full_name: editProfile.full_name.trim() || null,
          email: editProfile.email,
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Unexpected profile update error:", err.message);
    }
  };

  // Handle project deletion
  const handleDelete = async (projectId) => {
    const deletePromise = supabase.from("projects").delete().eq("id", projectId);

    toast.promise(deletePromise, {
      loading: "Deleting project...",
      success: "Project deleted successfully!",
      error: (err) => err.message || "Failed to delete project.",
    });

    try {
      const { error } = await deletePromise;
      if (error) {
        console.error("Delete error:", error.message);
      } else {
        setProjects(projects.filter((project) => project.id !== projectId));
      }
    } catch (err) {
      console.error("Unexpected delete error:", err.message);
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (chatId) => {
    const deletePromise = supabase.from("chat_messages").delete().eq("id", chatId);

    toast.promise(deletePromise, {
      loading: "Deleting chat message...",
      success: "Chat message deleted successfully!",
      error: (err) => err.message || "Failed to delete chat message.",
    });

    try {
      const { error } = await deletePromise;
      if (error) {
        console.error("Chat delete error:", error.message);
      } else {
        setChats(chats.filter((chat) => chat.id !== chatId));
      }
    } catch (err) {
      console.error("Unexpected chat delete error:", err.message);
    }
  };

  // Handle user sign-out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out.");
        console.error("Sign out error:", error.message);
      } else {
        toast.success("Signed out successfully!");
        router.push("/login");
      }
    } catch (err) {
      toast.error("Unexpected error signing out.");
      console.error("Unexpected sign out error:", err.message);
    }
  };

  const tabs = ["Dashboard", "Create Project", "Ai Design Suggestions", "Profile"];

  // Show a loading state during SSR or initial render
  if (loading || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F1EFEC]">
        <p className="text-base text-[#030303] font-extralight">Loading...</p>
      </div>
    );
  }

  // Show redirecting state if user is not authenticated
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F1EFEC]">
        <p className="text-base text-[#030303] font-extralight">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFEC] font-inter flex flex-col">
      {/* Header Section */}
      <header className="bg-[#123458] text-[#F1EFEC] py-3 px-4 sticky top-0 z-50 m-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/images/logoAV.png"
              alt="AdVision Logo"
              width={120}
              height={40}
              className="hover:opacity-80 transition-opacity duration-300"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <div className="relative group">
                <button
                  onClick={() => {
                    setActiveTab("Profile");
                  }}
                  className="text-[#F1EFEC] hover:text-[#FDFAF6] transition-colors"
                  aria-label="Your Profile"
                >
                  <UserCircleIcon className="w-5 h-5" />
                </button>
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight">
                  Your Profile
                </span>
              </div>
              <div className="relative group">
                <button
                  onClick={handleSignOut}
                  className="text-[#F1EFEC] hover:text-[#FDFAF6] transition-colors"
                  aria-label="Sign Out"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight">
                  Sign Out
                </span>
              </div>
            </div>
            <button
              className="md:hidden p-2 rounded-full hover:bg-[#1E4A7A]"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open actions menu"
            >
              <Bars3Icon className="w-6 h-6 text-[#F1EFEC]" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#FDFAF6] shadow-sm py-3 px-4 sticky top-[56px] z-40 m-0">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Tabs */}
          <div className="hidden md:flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative text-sm pb-2 transition-colors duration-300 ${
                  activeTab === tab
                    ? "text-[#123458] font-medium border-b-2 border-[#123458]"
                    : "text-[#030303] font-extralight hover:text-[#1E4A7A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Mobile Active Tab Display */}
          <div className="md:hidden">
            <span className="text-sm text-[#123458] font-medium">
              {activeTab}
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div className="fixed top-16 left-4 right-4 bg-[#FDFAF6] rounded-xl shadow-md p-6 z-50 md:hidden animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-[#123458]">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full hover:bg-[#F1EFEC]"
                aria-label="Close actions menu"
              >
                <XMarkIcon className="w-6 h-6 text-[#030303]" />
              </button>
            </div>
            <div className="space-y-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsMenuOpen(false);
                  }}
                  className={`block text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors font-extralight ${
                    activeTab === tab ? "font-medium" : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button
                onClick={async () => {
                  await handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors font-extralight"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Tab */}
          {activeTab === "Dashboard" && (
            <>
              {/* Welcome Banner */}
              <div className="mb-12">
                <h1 className="text-3xl sm:text-4xl font-medium text-[#123458] mb-2 animate-fade-in">
                  Welcome back, {profile?.full_name || profile?.email || "User"}!
                </h1>
                <p className="text-base sm:text-lg text-[#030303] font-extralight animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  Explore and manage your projects and AI chats below
                </p>
              </div>

              {/* Projects Section */}
              {fetchError && (
                <p className="text-[#FF3B30] text-sm mb-6 font-extralight animate-fade-in">{fetchError}</p>
              )}
              {projects.length === 0 ? (
                <p className="text-sm text-[#030303] font-extralight animate-fade-in">
                  No projects yet. Create your first project to get started!
                </p>
              ) : (
                <>
                  <h2 className="text-xl font-medium text-[#123458] mb-6 animate-fade-in">
                    My Projects
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    {projects.slice(0, 3).map((project, index) => (
                      <div
                        key={project.id}
                        className="bg-[#FDFAF6] bg-opacity-80 backdrop-blur-md rounded-xl p-6 shadow-md hover:scale-105 hover:bg-gradient-to-br hover:from-[#FDFAF6] hover:to-[#E5E3E0] transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <h3 className="text-lg font-medium text-[#123458] mb-2">
                          {project.name}
                        </h3>
                        <div className="text-sm text-[#030303] font-extralight space-y-2">
                          <p>
                            <span className="font-medium text-[#123458]">Product/Service:</span>{" "}
                            {project.product_service}
                          </p>
                          <p>
                            <span className="font-medium text-[#123458]">Target Platform:</span>{" "}
                            {project.target_platform}
                          </p>
                          <p>
                            <span className="font-medium text-[#123458]">Primary Goal:</span>{" "}
                            {project.primary_goal}
                          </p>
                          <p
                            className="line-clamp-2"
                            title={project.product_description}
                          >
                            <span className="font-medium text-[#123458]">Description:</span>{" "}
                            {project.product_description}
                          </p>
                          {project.product_features && (
                            <p
                              className="line-clamp-2"
                              title={project.product_features}
                            >
                              <span className="font-medium text-[#123458]">Features:</span>{" "}
                              {project.product_features}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3 mt-4">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                          >
                            View Workspace
                          </Link>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="bg-[#FF3B30] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* AI Chats Section */}
              {chats.length === 0 ? (
                <p className="text-sm text-[#030303] font-extralight animate-fade-in">
                  No AI chats yet. Start a conversation in the AI Design Suggestions tab!
                </p>
              ) : (
                <>
                  <h2 className="text-xl font-medium text-[#123458] mb-6 animate-fade-in">
                    My AI Chats
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {chats.map((chat, index) => (
                      <div
                        key={chat.id}
                        className="bg-[#FDFAF6] bg-opacity-80 backdrop-blur-md rounded-xl p-6 shadow-md hover:scale-105 hover:bg-gradient-to-br hover:from-[#FDFAF6] hover:to-[#E5E3E0] transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <h3 className="text-lg font-medium text-[#123458] mb-2">
                          {chat.product_name || "Untitled Chat"}
                        </h3>
                        <div className="text-sm text-[#030303] font-extralight space-y-2">
                          <p>
                            <span className="font-medium text-[#123458]">Created:</span>{" "}
                            {new Date(chat.created_at).toLocaleDateString()}
                          </p>
                          <p>
                            <span className="font-medium text-[#123458]">Role:</span>{" "}
                            {chat.role}
                          </p>
                          <p
                            className="line-clamp-3"
                            title={chat.content}
                          >
                            <span className="font-medium text-[#123458]">Snippet:</span>{" "}
                            {chat.content}
                          </p>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <Link
                            href="/dashboard/ai-design-suggestions"
                            className="bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                          >
                            View Chat
                          </Link>
                          <button
                            onClick={() => handleDeleteChat(chat.id)}
                            className="bg-[#FF3B30] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Create Project Tab */}
          {activeTab === "Create Project" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-medium text-[#123458] mb-6">
                Create New Project
              </h2>
              <p className="text-sm text-[#030303] font-extralight">
                This section will allow you to create a new project.
              </p>
              <Link
                href="/dashboard/create-project"
                className="inline-block mt-4 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
              >
                Go to Create Project
              </Link>
            </div>
          )}

          {/* AI Design Suggestions Tab */}
          {activeTab === "Ai Design Suggestions" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-medium text-[#123458] mb-6">
                AI Design Suggestions
              </h2>
              <p className="text-sm text-[#030303] font-extralight">
                This section will allow you to chat with the AI for design suggestions.
              </p>
              <Link
                href="/dashboard/ai-design-suggestions"
                className="inline-block mt-4 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
              >
                Go to AI Design Suggestions
              </Link>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "Profile" && (
            <div className="max-w-md mx-auto animate-fade-in">
              <h2 className="text-xl font-medium text-[#123458] mb-6">Your Profile</h2>
              {isEditing ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="full_name"
                      className="block text-sm font-extralight text-[#030303] mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      value={editProfile.full_name}
                      onChange={(e) =>
                        setEditProfile({ ...editProfile, full_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#123458] rounded-xl text-sm text-[#030303] font-extralight focus:outline-none focus:ring-2 focus:ring-[#123458] focus:border-transparent transition-all duration-300"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-extralight text-[#030303] mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={editProfile.email}
                      onChange={(e) =>
                        setEditProfile({ ...editProfile, email: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-[#123458] rounded-xl text-sm text-[#030303] font-extralight focus:outline-none focus:ring-2 focus:ring-[#123458] focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-[#34C759] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#2EB648] hover:scale-105 transition-all duration-300"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditProfile({
                          full_name: profile?.full_name || "",
                          email: profile?.email || "",
                        });
                      }}
                      className="flex-1 bg-[#F1EFEC] text-[#123458] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#E5E3E0] hover:scale-105 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm text-[#030303] font-extralight">
                    <p>
                      <span className="font-medium text-[#123458]">Name:</span>{" "}
                      {profile?.full_name || "Not set"}
                    </p>
                    <p>
                      <span className="font-medium text-[#123458]">Email:</span>{" "}
                      {profile?.email || "Not set"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-[#123458] text-[#F1EFEC] py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-extralight">AdVision | April 27, 2025 | v1.0</p>
        </div>
      </footer>
    </div>
  );
}