'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import { generateDesignSuggestions } from "../../../lib/aichat";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { PaperAirplaneIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";

// Helper function to generate UUID (with fallback for browsers without crypto.randomUUID)
const generateUUID = () => {
  // Check if crypto.randomUUID is available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function AIDesignSuggestions() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [platform, setPlatform] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productFeatures, setProductFeatures] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [step, setStep] = useState("platform");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isMounted) {
      fetchConversations();
      fetchProjects();
      if (!conversationId) {
        startNewChat();
      }
    }
  }, [user, isMounted, conversationId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("conversation_id, created_at, product_name, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationsMap = new Map();
      data.forEach(({ conversation_id, created_at, product_name, content }) => {
        if (!conversationsMap.has(conversation_id)) {
          conversationsMap.set(conversation_id, {
            conversation_id,
            created_at,
            product_name: product_name || "Untitled",
            preview: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error.message);
      toast.error("Failed to load chat history.");
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          product_service,
          product_description,
          product_features,
          target_platform,
          primary_goal,
          audiences (
            name,
            age_range,
            gender,
            interests
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const projectsWithAudience = data.map((project) => ({
        ...project,
        target_audience: project.audiences.length > 0
          ? `${project.audiences[0].name} (${project.audiences[0].age_range}, ${project.audiences[0].gender}, ${project.audiences[0].interests})`
          : "General audience",
      }));

      setProjects(projectsWithAudience);
    } catch (error) {
      console.error("Error fetching projects:", error.message);
      toast.error("Failed to load projects.");
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at, product_name")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data.map((msg) => ({ ...msg, saved: true })) || []);
      setConversationId(conversationId);
      setStep("complete");
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("Error fetching messages:", error.message);
      toast.error("Failed to load messages.");
    }
  }, [user]);

  const startNewChat = useCallback(() => {
    const newConversationId = generateUUID();
    setConversationId(newConversationId);
    setMessages([]);
    setStep("platform");
    setPlatform("");
    setProductName("");
    setProductDescription("");
    setProductFeatures("");
    setTargetAudience("");
    setPrimaryGoal("");
    setSelectedProject(null);

    const welcomeMessage = {
      id: generateUUID(),
      conversation_id: newConversationId,
      user_id: user?.id,
      role: "assistant",
      content: "Please select a social media platform for your ad:",
      created_at: new Date().toISOString(),
      saved: false,
    };
    setMessages([welcomeMessage]);
  }, [user]);

  const deleteChat = useCallback(async (conversationId) => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Chat deleted successfully!");
      setConversations((prev) => prev.filter((conv) => conv.conversation_id !== conversationId));
      if (conversationId === conversationId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error.message);
      toast.error("Failed to delete chat.");
    }
  }, [user, startNewChat]);

  const saveChat = useCallback(async () => {
    if (!conversationId || messages.length === 0) {
      toast.error("No chat to save.");
      return;
    }

    try {
      const messagesToSave = messages.map((msg) => ({
        conversation_id: conversationId,
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        product_name: productName || null,
      }));

      const { error } = await supabase.from("chat_messages").insert(messagesToSave);
      if (error) throw error;

      toast.success("Chat saved successfully!");
      await fetchConversations();
      startNewChat();
    } catch (error) {
      console.error("Error saving chat:", error.message);
      toast.error("Failed to save chat.");
    }
  }, [conversationId, messages, user, productName, fetchConversations, startNewChat]);

  const handleButtonClick = useCallback(
    async (value, type) => {
      setIsGenerating(true);
      try {
        const userMessage = {
          id: generateUUID(),
          conversation_id: conversationId,
          user_id: user.id,
          role: "user",
          content: value,
          created_at: new Date().toISOString(),
          saved: false,
        };

        setMessages((prev) => [...prev, userMessage]);

        let aiResponseContent = "";
        let nextStep = step;

        if (type === "platform") {
          setPlatform(value);
          aiResponseContent = projects.length > 0
            ? "Would you like to use data from your projects?"
            : "What's the name of your product?";
          nextStep = projects.length > 0 ? "useProjectData" : "productName";
        } else if (type === "useProjectData") {
          if (value === "Yes") {
            aiResponseContent = "Please select a project:";
            nextStep = "selectProject";
          } else {
            aiResponseContent = "What's the name of your product?";
            nextStep = "productName";
          }
        } else if (type === "selectProject") {
          const project = projects.find((p) => p.id === value);
          if (project) {
            setSelectedProject(project);
            setProductName(project.product_service);
            setProductDescription(project.product_description);
            setProductFeatures(project.product_features);
            setTargetAudience(project.target_audience);
            setPrimaryGoal(project.primary_goal);
            setPlatform(project.target_platform);
            const userInput = `
              Product Name: ${project.product_service}
              Product Description: ${project.product_description}
              Product Features: ${project.product_features || "None provided"}
              Target Audience: ${project.target_audience}
              Primary Goal: ${project.primary_goal}
            `;
            aiResponseContent = await generateDesignSuggestions(userInput, project.target_platform, project.primary_goal);
            nextStep = "complete";
          }
        } else if (type === "primaryGoal") {
          setPrimaryGoal(value);
          const userInput = `
            Product Name: ${productName}
            Product Description: ${productDescription}
            Product Features: ${productFeatures || "None provided"}
            Target Audience: ${targetAudience}
            Primary Goal: ${value}
          `;
          aiResponseContent = await generateDesignSuggestions(userInput, platform, value);
          nextStep = "complete";
        }

        const aiMessage = {
          id: generateUUID(),
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content: aiResponseContent,
          created_at: new Date().toISOString(),
          saved: false,
        };

        setMessages((prev) => [...prev, aiMessage]);
        setStep(nextStep);
      } catch (error) {
        console.error("Error processing button click:", error.message);
        toast.error("Failed to process selection.");
      } finally {
        setIsGenerating(false);
      }
    },
    [
      conversationId,
      user,
      step,
      platform,
      productName,
      productDescription,
      productFeatures,
      targetAudience,
      projects,
    ]
  );

  const sendMessage = useCallback(
    async (messageContent) => {
      if (!messageContent?.trim()) {
        toast.error("Please enter a message.");
        return;
      }

      setIsGenerating(true);
      try {
        const userMessage = {
          id: generateUUID(),
          conversation_id: conversationId,
          user_id: user.id,
          role: "user",
          content: messageContent,
          created_at: new Date().toISOString(),
          saved: false,
        };

        setMessages((prev) => [...prev, userMessage]);
        setNewMessage("");

        let aiResponseContent = "";
        let nextStep = step;

        if (step === "productName") {
          setProductName(messageContent.trim());
          aiResponseContent = "Can you share a brief description of your product?";
          nextStep = "productDescription";
        } else if (step === "productDescription") {
          setProductDescription(messageContent.trim());
          aiResponseContent =
            "Could you share some key features of your product? If none, type 'none'.";
          nextStep = "productFeatures";
        } else if (step === "productFeatures") {
          const features = messageContent.trim().toLowerCase() === "none" ? "" : messageContent.trim();
          setProductFeatures(features);
          aiResponseContent =
            "Who’s your target audience? E.g., young professionals, parents, tech enthusiasts.";
          nextStep = "targetAudience";
        } else if (step === "targetAudience") {
          setTargetAudience(messageContent.trim());
          aiResponseContent = "Please select your primary goal:";
          nextStep = "primaryGoal";
        } else if (step === "complete") {
          const context = `
            Platform: ${platform}
            Product Name: ${productName}
            Product Description: ${productDescription}
            Product Features: ${productFeatures || "None provided"}
            Target Audience: ${targetAudience}
            Primary Goal: ${primaryGoal}
            User Question: ${messageContent}
          `;
          aiResponseContent = await generateDesignSuggestions(context, platform, primaryGoal);
          nextStep = "complete";
        }

        const aiMessage = {
          id: generateUUID(),
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content: aiResponseContent,
          created_at: new Date().toISOString(),
          saved: false,
        };

        setMessages((prev) => [...prev, aiMessage]);
        setStep(nextStep);
      } catch (error) {
        console.error("Error sending message:", error.message);
        toast.error("Failed to send message.");
      } finally {
        setIsGenerating(false);
      }
    },
    [conversationId, user, step, platform, productName, productDescription, productFeatures, targetAudience, primaryGoal]
  );

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully!");
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error.message);
      toast.error("Failed to sign out.");
    }
  };

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F1EFEC]">
        <p className="text-base text-[#030303] font-inter font-extralight">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F1EFEC] font-inter flex flex-col w-full min-w-full box-border">
      {/* Header */}
      <header className="bg-[#123458] text-[#F1EFEC] py-3 px-4 sm:px-6 sticky top-0 z-50 w-full">
        <div className="flex justify-between items-center w-full">
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
            <div className="relative group">
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full hover:bg-[#1E4A7A]"
                aria-label="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6 text-[#F1EFEC]" />
              </button>
              <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap">
                Sign Out
              </span>
            </div>
            <button
              className="lg:hidden p-2 rounded-full hover:bg-[#1E4A7A]"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-6 h-6 text-[#F1EFEC]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 py-12 w-full">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Left Sidebar - Chat History */}
          <aside
            className={`fixed top-[56px] left-0 h-[calc(100vh-56px)] w-3/4 sm:w-1/2 lg:w-1/4 bg-[#FDFAF6] shadow-md p-6 z-40 transform transition-transform duration-300 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 lg:static lg:h-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-[#123458]">Chat History</h3>
              <button
                className="lg:hidden p-2 rounded-full hover:bg-[#F1EFEC]"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="w-5 h-5 text-[#030303]" />
              </button>
            </div>
            <button
              onClick={startNewChat}
              className="w-full px-4 py-2 mb-4 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
            >
              New Chat
            </button>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className="flex items-center justify-between p-2 bg-[#FDFAF6] rounded-xl hover:bg-[#F1EFEC] transition-all duration-300"
                  >
                    <button
                      onClick={() => fetchMessages(conv.conversation_id)}
                      className="flex-1 text-left text-sm text-[#030303] font-extralight truncate"
                    >
                      <span className="font-medium text-[#123458]">
                        {conv.product_name} - {new Date(conv.created_at).toLocaleDateString()}
                      </span>
                      <span className="ml-2">{conv.preview}</span>
                    </button>
                    <button
                      onClick={() => deleteChat(conv.conversation_id)}
                      className="p-2 rounded-full hover:bg-[#FF3B30] hover:text-[#F1EFEC] transition-all duration-300"
                      aria-label="Delete chat"
                    >
                      <TrashIcon className="w-4 h-4 text-[#030303]" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#030303] font-extralight">No chat history available.</p>
              )}
            </div>
          </aside>

          {/* Chat Area */}
          <div className="flex-grow w-full lg:w-3/4 bg-[#FDFAF6] rounded-xl p-6 sm:p-8 shadow-md">
          <Link href="/dashboard" className="inline-block mb-4 text-sm text-[#123458] font-medium hover:underline">
    &larr; Back to Dashboard
  </Link>
            <h2 className="text-xl font-medium text-[#123458] mb-6">AI Design Suggestions</h2>
            <p className="text-sm text-[#030303] font-extralight mb-6">
              Chat with the AI to get tailored ad design suggestions!
            </p>

            {/* Chat Window */}
            <div className="flex flex-col min-h-[400px] max-h-[60vh] overflow-y-auto mb-6 bg-[#F1EFEC] rounded-xl p-4 border border-[#123458] border-opacity-10 w-full">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[90%] p-4 rounded-xl shadow-sm ${
                        msg.role === "user"
                          ? "bg-[#123458] text-[#F1EFEC]"
                          : "bg-[#FDFAF6] text-[#030303] border border-[#123458] border-opacity-10"
                      }`}
                    >
                      {msg.role === "assistant" && step === "complete" && msg.content.includes("**Color Scheme**") ? (
                        <div className="prose text-sm text-[#030303] font-extralight">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap font-extralight">{msg.content}</p>
                      )}
                      <p className="text-xs mt-1 opacity-75 font-extralight">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#030303] font-extralight">Start chatting to get design suggestions!</p>
              )}
              {isGenerating && (
                <div className="flex justify-start mb-4">
                  <div className="bg-[#FDFAF6] border border-[#123458] border-opacity-10 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#123458] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-[#030303] font-extralight">Generating design suggestion...</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Button Inputs for Specific Steps */}
              {step === "platform" && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Instagram", "Facebook", "Twitter", "LinkedIn", "Google Ads"].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleButtonClick(p, "platform")}
                      className="px-4 py-2 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                      disabled={isGenerating}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
              {step === "useProjectData" && (
                <div className="flex gap-2 mt-4">
                  {["Yes", "No"].map((v) => (
                    <button
                      key={v}
                      onClick={() => handleButtonClick(v, "useProjectData")}
                      className="px-4 py-2 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                      disabled={isGenerating}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {step === "selectProject" && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleButtonClick(p.id, "selectProject")}
                      className="px-4 py-2 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                      disabled={isGenerating}
                    >
                      {p.name} ({p.product_service})
                    </button>
                  ))}
                </div>
              )}
              {step === "primaryGoal" && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Brand Awareness", "Conversion", "Lead Generation", "Engagement"].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleButtonClick(g, "primaryGoal")}
                      className="px-4 py-2 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                      disabled={isGenerating}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
              {step === "complete" && (
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={saveChat}
                    className="px-4 py-2 bg-[#34C759] text-[#F1EFEC] text-sm font-medium rounded-xl hover:bg-[#2EB648] hover:scale-105 transition-all duration-300"
                  >
                    Save Chat
                  </button>
                  <button
                    onClick={startNewChat}
                    className="px-4 py-2 bg-[#FF3B30] text-[#F1EFEC] text-sm font-medium rounded-xl hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                  >
                    Reset Chat
                  </button>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area - Always Visible */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(newMessage);
              }}
              className="flex gap-3 items-center bg-[#FDFAF6] rounded-xl p-3 shadow-md border border-[#123458] border-opacity-10 w-full"
            >
              <div className="relative flex-grow group">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    step === "platform"
                      ? "Select a platform above or ask a question"
                      : step === "useProjectData"
                      ? "Choose to use project data or ask a question"
                      : step === "selectProject"
                      ? "Select a project above or ask a question"
                      : step === "productName"
                      ? "E.g., Eco-Friendly Bottle"
                      : step === "productDescription"
                      ? "Describe your product"
                      : step === "productFeatures"
                      ? "List features or 'none'"
                      : step === "targetAudience"
                      ? "E.g., young professionals"
                      : step === "primaryGoal"
                      ? "Select a goal above or ask a question"
                      : "Ask a follow-up question or provide more details"
                  }
                  className="w-full px-4 py-2 bg-transparent focus:outline-none text-sm text-[#030303] font-extralight placeholder-[#030303] placeholder-opacity-50"
                  disabled={isGenerating}
                />
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap">
                  {step === "platform"
                    ? "Select a platform to start or type a question."
                    : step === "useProjectData"
                    ? "Choose to use project data or type a question."
                    : step === "selectProject"
                    ? "Select a project to proceed or type a question."
                    : step === "productName"
                    ? "The name of your product or service."
                    : step === "productDescription"
                    ? "A brief overview of what your product does."
                    : step === "productFeatures"
                    ? "Key features or benefits of your product."
                    : step === "targetAudience"
                    ? "Who your ad is aimed at, e.g., age group, interests."
                    : step === "primaryGoal"
                    ? "Select a goal to proceed or type a question."
                    : "Ask anything to refine your design suggestion."}
                </span>
              </div>
              <button
                type="submit"
                className="bg-[#123458] text-[#F1EFEC] p-2 rounded-full hover:bg-[#1E4A7A] transition-all duration-300 disabled:opacity-50"
                disabled={isGenerating}
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Right Guide Sidebar */}
          <aside className="hidden lg:block w-1/4 bg-[#FDFAF6] rounded-xl p-6 shadow-md sticky top-[56px] max-h-[calc(100vh-56px)] overflow-y-auto">
            <h3 className="text-lg font-medium text-[#123458] mb-4">How to Use This Tool</h3>
            <ul className="text-sm text-[#030303] font-extralight space-y-2">
              <li>
                <span className="font-medium text-[#123458]">1. Select Platform:</span> Choose a platform (e.g., Instagram) using the buttons.
              </li>
              <li>
                <span className="font-medium text-[#123458]">2. Use Project Data:</span> Opt to use existing project data or enter details manually.
              </li>
              <li>
                <span className="font-medium text-[#123458]">3. Provide Details:</span> Enter product name, description, features, and audience if needed.
              </li>
              <li>
                <span className="font-medium text-[#123458]">4. Set Goal:</span> Select a primary goal (e.g., Brand Awareness).
              </li>
              <li>
                <span className="font-medium text-[#123458]">5. Get Suggestion:</span> Receive a tailored ad design suggestion.
              </li>
              <li>
                <span className="font-medium text-[#123458]">6. Save or Reset:</span> Save the chat to history or start a new one.
              </li>
              <li>
                <span className="font-medium text-[#123458]">7. Ask More:</span> Type follow-up questions to refine the suggestion.
              </li>
            </ul>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#123458] text-[#F1EFEC] py-6 px-4 sm:px-6 w-full">
        <div className="text-center">
          <p className="text-xs font-extralight">AdVision | April 29, 2025 | v1.0</p>
        </div>
      </footer>
    </div>
  );
}