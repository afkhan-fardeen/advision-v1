'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../context/AuthContext";
import {
  generateAdCopies,
  generateKeywords,
  generateAudienceSuggestions,
} from "../../../../lib/openrouter";
import { generateReport } from "../../../../lib/reportGenerator";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  SparklesIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";
import { Vibrant } from "node-vibrant/browser";
import DOMPurify from "dompurify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Image from "next/image";

export default function ProjectWorkspace() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [adCopies, setAdCopies] = useState([]);
  const [generatedAdCopies, setGeneratedAdCopies] = useState([]);
  const [readabilityScores, setReadabilityScores] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [generatedKeywords, setGeneratedKeywords] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [generatedAudiences, setGeneratedAudiences] = useState([]);
  const [brandStyles, setBrandStyles] = useState([]);
  const [generatedBrandStyles, setGeneratedBrandStyles] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProjectOverviewOpen, setIsProjectOverviewOpen] = useState(false);
  const [tone, setTone] = useState("Professional");
  const [selectedAdCopyId, setSelectedAdCopyId] = useState(null);
  const [readabilityResults, setReadabilityResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingAdCopyId, setRegeneratingAdCopyId] = useState(null);
  const [regenerateTone, setRegenerateTone] = useState("Professional");
  const [openAccordionItems, setOpenAccordionItems] = useState([]);
  const [openReadabilityAccordionItems, setOpenReadabilityAccordionItems] = useState([]);
  const [openKeywordAccordionItems, setOpenKeywordAccordionItems] = useState([]);
  const [openAudienceAccordionItems, setOpenAudienceAccordionItems] = useState([]);
  const [openBrandStyleAccordionItems, setOpenBrandStyleAccordionItems] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [brandName, setBrandName] = useState("");
  const [brandFont, setBrandFont] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [activeSavedDataTab, setActiveSavedDataTab] = useState("Ad Copies");
  const [latestResult, setLatestResult] = useState(null);
  const reportRef = useRef(null);
  const logoInputRef = useRef(null);

  // Initialize DOMPurify only on the client side
  const [purify, setPurify] = useState(null);

  useEffect(() => {
    // Ensure DOMPurify is initialized only in the browser
    if (typeof window !== "undefined") {
      setPurify(DOMPurify(window));
    }
  }, []);

  // Track previous id and user to prevent unnecessary re-fetching
  const prevIdRef = useRef(null);
  const prevUserRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user && id && (id !== prevIdRef.current || user.id !== prevUserRef.current?.id)) {
      prevIdRef.current = id;
      prevUserRef.current = user;

      const fetchProjectAndData = async () => {
        try {
          const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .select(
              "id, name, product_service, target_platform, primary_goal, product_description, product_features"
            )
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (projectError) {
            setFetchError("Failed to load project. Please try again.");
            console.error("Project fetch error:", projectError.message);
            return;
          }

          if (!projectData) {
            setFetchError("Project not found.");
            return;
          }

          setProject(projectData);

          const { data: adCopiesData, error: adCopiesError } = await supabase
            .from("ad_copies")
            .select(
              "id, content, tone, created_at, readability_scores(id, flesch_reading_ease, flesch_grade_level, gunning_fog, flesch_reading_ease_label, flesch_grade_level_label, gunning_fog_label, created_at)"
            )
            .eq("project_id", id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (adCopiesError) {
            console.error("Ad copies fetch error:", adCopiesError.message);
          } else {
            setAdCopies(adCopiesData || []);
            const scores = adCopiesData
              .filter((ad) => ad.readability_scores.length > 0)
              .map((ad) => ({
                ...ad.readability_scores[0],
                ad_copy_id: ad.id,
                content: ad.content,
                tone: ad.tone,
              }));
            setReadabilityScores(scores);
          }

          const { data: keywordsData, error: keywordsError } = await supabase
            .from("keywords")
            .select(
              "id, keyword, search_volume, competition, intent, suggestions, created_at"
            )
            .eq("project_id", id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (keywordsError) {
            console.error("Keywords fetch error:", keywordsError.message);
          } else {
            setKeywords(keywordsData || []);
          }

          const { data: audiencesData, error: audiencesError } = await supabase
            .from("audiences")
            .select(
              "id, name, age_range, gender, interests, platforms, purchase_intent, created_at"
            )
            .eq("project_id", id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (audiencesError) {
            console.error("Audiences fetch error:", audiencesError.message);
          } else {
            setAudiences(audiencesData || []);
          }

          const { data: brandStylesData, error: brandStylesError } = await supabase
            .from("brand_styles")
            .select("id, brand_name, colors, font, created_at")
            .eq("project_id", id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (brandStylesError) {
            console.error("Brand styles fetch error:", brandStylesError.message);
          } else {
            setBrandStyles(brandStylesData || []);
          }
        } catch (err) {
          setFetchError("Unexpected error loading project. Please try again.");
          console.error("Unexpected error:", err.message);
        }
      };

      fetchProjectAndData();
    }
  }, [user, loading, id, router]);

  const calculateReadability = (text) => {
    if (!text || typeof text !== "string") return { flesch_reading_ease: 0, flesch_grade_level: 0, gunning_fog: 0 };

    const sentences = text.match(/[.!?]+/g)?.length || 1;
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    const syllables = text
      .split(/\s+/)
      .reduce((count, word) => count + countSyllables(word), 0);

    const fleschReadingEase = Math.max(
      0,
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    );

    const fleschGradeLevel =
      0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;

    const complexWords = text
      .split(/\s+/)
      .filter((word) => countSyllables(word) >= 3).length;
    const gunningFog = 0.4 * (words / sentences + 100 * (complexWords / words));

    return {
      flesch_reading_ease: parseFloat(fleschReadingEase.toFixed(1)),
      flesch_grade_level: parseFloat(fleschGradeLevel.toFixed(1)),
      gunning_fog: parseFloat(gunningFog.toFixed(1)),
    };
  };

  const countSyllables = (word) => {
    if (!word || typeof word !== "string") return 1;

    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const syllableCount = word.match(/[aeiouy]{1,2}/g)?.length || 1;
    return syllableCount;
  };

  const getReadabilityExplanation = (scores) => ({
    flesch_reading_ease: {
      score: scores.flesch_reading_ease,
      label:
        scores.flesch_reading_ease >= 60
          ? "Good"
          : scores.flesch_reading_ease >= 30
          ? "Fair"
          : "Bad",
      color:
        scores.flesch_reading_ease >= 60
          ? "#34C759"
          : scores.flesch_reading_ease >= 30
          ? "#FF9500"
          : "#FF3B30",
      explanation: `Scores 0–100 (higher = easier). ${
        scores.flesch_reading_ease >= 60
          ? "Good: Easy to read (middle school level)."
          : scores.flesch_reading_ease >= 30
          ? "Fair: Moderately difficult (high school level)."
          : "Bad: Difficult to read (college level)."
      } Based on sentence length and syllable count.`,
    },
    flesch_grade_level: {
      score: scores.flesch_grade_level,
      label:
        scores.flesch_grade_level <= 8
          ? "Good"
          : scores.flesch_grade_level <= 12
          ? "Fair"
          : "Bad",
      color:
        scores.flesch_grade_level <= 8
          ? "#34C759"
          : scores.flesch_grade_level <= 12
          ? "#FF9500"
          : "#FF3B30",
      explanation: `U.S. grade level needed to understand. ${
        scores.flesch_grade_level <= 8
          ? "Good: Suitable for middle school or below."
          : scores.flesch_grade_level <= 12
          ? "Fair: Suitable for high school."
          : "Bad: Suitable for college or above."
      } Calculated from sentence and word complexity.`,
    },
    gunning_fog: {
      score: scores.gunning_fog,
      label:
        scores.gunning_fog <= 8
          ? "Good"
          : scores.gunning_fog <= 12
          ? "Fair"
          : "Bad",
      color:
        scores.gunning_fog <= 8
          ? "#34C759"
          : scores.gunning_fog <= 12
          ? "#FF9500"
          : "#FF3B30",
      explanation: `Years of education needed. ${
        scores.gunning_fog <= 8
          ? "Good: Easy to read (middle school level)."
          : scores.gunning_fog <= 12
          ? "Fair: Moderate difficulty (high school level)."
          : "Bad: Difficult to read (college level)."
      } Based on sentence length and complex words.`,
    },
  });

  const getIntentColor = (intent) => {
    if (!intent) return "#8E8E93";
    switch (intent.toLowerCase()) {
      case "transactional":
        return "#34C759";
      case "informational":
        return "#007AFF";
      case "brand-related":
        return "#5856D6";
      default:
        return "#8E8E93";
    }
  };

  const handleGenerateAdCopies = async () => {
    if (!project) {
      toast.error("Project data is not loaded yet.");
      return;
    }

    setIsGenerating(true);
    try {
      const newAdCopies = await generateAdCopies(project, tone);
      if (!newAdCopies || newAdCopies.length === 0) {
        throw new Error("No ad copies generated. Please try again.");
      }
      const formattedAdCopies = newAdCopies.map((content) => ({
        id: uuidv4(),
        content,
        tone,
      }));
      setGeneratedAdCopies(formattedAdCopies);
      setLatestResult({ type: "Ad Copy", data: formattedAdCopies });
      toast.success("Ad copies generated successfully!");
    } catch (err) {
      toast.error(
        err.message.includes("API key")
          ? err.message
          : "Failed to generate ad copies. Please try again."
      );
      console.error("Generate ad copies error:", err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAdCopy = async (generatedAdCopy) => {
    if (!generatedAdCopy || !generatedAdCopy.content) {
      toast.error("Invalid ad copy data.");
      return;
    }

    try {
      const { error } = await supabase
        .from("ad_copies")
        .insert({
          project_id: project.id,
          user_id: user.id,
          content: generatedAdCopy.content,
          tone: generatedAdCopy.tone,
        })
        .select();

      if (error) {
        console.error("Ad copy save error:", error.message);
        toast.error("Failed to save ad copy.");
        return;
      }

      const { data: savedAdCopies } = await supabase
        .from("ad_copies")
        .select(
          "id, content, tone, created_at, readability_scores(id, flesch_reading_ease, flesch_grade_level, gunning_fog, flesch_reading_ease_label, flesch_grade_level_label, gunning_fog_label, created_at)"
        )
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setAdCopies(savedAdCopies || []);
      setGeneratedAdCopies(
        generatedAdCopies.filter((ad) => ad.id !== generatedAdCopy.id)
      );
      toast.success("Ad copy saved successfully!");
    } catch (err) {
      toast.error("Unexpected error saving ad copy.");
      console.error("Save ad copy error:", err.message);
    }
  };

  const handleDeleteAdCopy = async (adCopyId) => {
    if (!adCopyId) return;

    const deletePromise = supabase
      .from("ad_copies")
      .delete()
      .eq("id", adCopyId)
      .eq("user_id", user.id);

    toast.promise(
      deletePromise,
      {
        loading: "Deleting ad copy...",
        success: "Ad copy deleted successfully!",
        error: (err) => err.message || "Failed to delete ad copy.",
      },
      { style: { minWidth: "200px" } }
    );

    try {
      const { error } = await deletePromise;
      if (error) {
        console.error("Delete ad copy error:", error.message);
        return;
      }

      setAdCopies(adCopies.filter((ad) => ad.id !== adCopyId));
      setReadabilityScores(
        readabilityScores.filter((score) => score.ad_copy_id !== adCopyId)
      );
    } catch (err) {
      console.error("Unexpected delete ad copy error:", err.message);
    }
  };

  const handleDeleteReadabilityScores = async (scoreId) => {
    if (!scoreId) return;

    const score = readabilityScores.find((s) => s.id === scoreId);
    if (!score) return;

    const deletePromise = supabase
      .from("readability_scores")
      .delete()
      .eq("id", scoreId)
      .eq("ad_copy_id", score.ad_copy_id);

    toast.promise(
      deletePromise,
      {
        loading: "Deleting readability scores...",
        success: "Readability scores deleted successfully!",
        error: (err) => err.message || "Failed to delete readability scores.",
      },
      { style: { minWidth: "200px" } }
    );

    try {
      const { error } = await deletePromise;
      if (error) {
        console.error("Delete readability scores error:", error.message);
        return;
      }

      setReadabilityScores(readabilityScores.filter((s) => s.id !== scoreId));
    } catch (err) {
      console.error("Unexpected delete readability scores error:", err.message);
    }
  };

  const handleGenerateKeywords = async () => {
    if (!project) {
      toast.error("Project data is not loaded yet.");
      return;
    }

    if (adCopies.length === 0) {
      toast.error("Please save at least one ad copy to generate keywords.");
      return;
    }

    setIsGenerating(true);
    try {
      const adCopiesText = adCopies.map((ad) => ad.content);
      const newKeywords = await generateKeywords(project, adCopiesText);
      if (!newKeywords || newKeywords.length === 0) {
        throw new Error("No keywords generated. Please try again.");
      }
      setGeneratedKeywords(newKeywords);
      setLatestResult({ type: "Keyword", data: newKeywords });
      toast.success("Keywords generated successfully!");
    } catch (err) {
      toast.error(
        err.message.includes("API key")
          ? err.message
          : "Failed to generate keywords. Please try again."
      );
      console.error("Generate keywords error:", err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveKeyword = async (keyword) => {
    if (!keyword || !keyword.keyword) {
      toast.error("Invalid keyword data.");
      return;
    }

    try {
      const { error } = await supabase
        .from("keywords")
        .insert({
          project_id: project.id,
          user_id: user.id,
          keyword: keyword.keyword,
          search_volume: keyword.search_volume,
          competition: keyword.competition,
          intent: keyword.intent,
          suggestions: keyword.suggestions,
        })
        .select();

      if (error) {
        console.error("Keyword save error:", error.message);
        toast.error("Failed to save keyword.");
        return;
      }

      const { data: savedKeywords } = await supabase
        .from("keywords")
        .select(
          "id, keyword, search_volume, competition, intent, suggestions, created_at"
        )
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setKeywords(savedKeywords || []);
      setGeneratedKeywords(
        generatedKeywords.filter((kw) => kw.id !== keyword.id)
      );
      toast.success("Keyword saved successfully!");
    } catch (err) {
      toast.error("Unexpected error saving keyword.");
      console.error("Save keyword error:", err.message);
    }
  };

  const handleDeleteKeyword = async (keywordId) => {
    if (!keywordId) return;

    const deletePromise = supabase
      .from("keywords")
      .delete()
      .eq("id", keywordId)
      .eq("user_id", user.id);

    toast.promise(
      deletePromise,
      {
        loading: "Deleting keyword...",
        success: "Keyword deleted successfully!",
        error: (err) => err.message || "Failed to delete keyword.",
      },
      { style: { minWidth: "200px" } }
    );

    try {
      const { error } = await deletePromise;
      if (error) {
        console.error("Delete keyword error:", error.message);
        return;
      }

      setKeywords(keywords.filter((kw) => kw.id !== keywordId));
    } catch (err) {
      console.error("Unexpected delete keyword error:", err.message);
    }
  };

  const handleGenerateAudienceSuggestions = async () => {
    if (!project) {
      toast.error("Project data is not loaded yet.");
      return;
    }

    if (adCopies.length === 0) {
      toast.error("Please save at least one ad copy to generate audiences.");
      return;
    }

    setIsGenerating(true);
    try {
      const adCopiesText = adCopies.map((ad) => ad.content);
      const newAudiences = await generateAudienceSuggestions(project, adCopiesText);
      if (!newAudiences || newAudiences.length === 0) {
        throw new Error("No audiences generated. Please try again.");
      }
      setGeneratedAudiences(newAudiences);
      setLatestResult({ type: "Audience", data: newAudiences });
      toast.success("Audiences generated successfully!");
    } catch (err) {
      toast.error(
        err.message.includes("API key")
          ? err.message
          : "Failed to generate audiences. Please try again."
      );
      console.error("Generate audiences error:", err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAudience = async (audience) => {
    if (!audience || !audience.name) {
      toast.error("Invalid audience data.");
      return;
    }

    try {
      const { error } = await supabase
        .from("audiences")
        .insert({
          project_id: project.id,
          user_id: user.id,
          name: audience.name,
          age_range: audience.age_range,
          gender: audience.gender,
          interests: audience.interests,
          platforms: audience.platforms,
          purchase_intent: audience.purchase_intent,
        })
        .select();

      if (error) {
        console.error("Audience save error:", error.message);
        toast.error("Failed to save audience.");
        return;
      }

      const { data: savedAudiences } = await supabase
        .from("audiences")
        .select(
          "id, name, age_range, gender, interests, platforms, purchase_intent, created_at"
        )
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setAudiences(savedAudiences || []);
      setGeneratedAudiences(
        generatedAudiences.filter((aud) => aud.id !== audience.id)
      );
      toast.success("Audience saved successfully!");
    } catch (err) {
      toast.error("Unexpected error saving audience.");
      console.error("Save audience error:", err.message);
    }
  };

  const handleDeleteAudience = async (audienceId) => {
    if (!audienceId) return;

    const deletePromise = supabase
      .from("audiences")
      .delete()
      .eq("id", audienceId)
      .eq("user_id", user.id);

    toast.promise(
      deletePromise,
      {
        loading: "Deleting audience...",
        success: "Audience deleted successfully!",
        error: (err) => err.message || "Failed to delete audience.",
      },
      { style: { minWidth: "200px" } }
    );

    try {
      const { error } = await deletePromise;
      if (error) {
        console.error("Delete audience error:", error.message);
        return;
      }

      setAudiences(audiences.filter((aud) => aud.id !== audienceId));
    } catch (err) {
      console.error("Unexpected delete audience error:", err.message);
    }
  };

  const handleExtractStyles = async () => {
    if (!logoFile) {
      toast.error("Please upload a logo image.");
      return;
    }
    if (!brandName.trim()) {
      toast.error("Please enter a brand name.");
      return;
    }
    if (logoFile.size > 5 * 1024 * 1024) {
      toast.error("Logo file must be less than 5MB.");
      return;
    }
    if (!["image/png", "image/jpeg"].includes(logoFile.type)) {
      toast.error("Logo must be a PNG or JPG image.");
      return;
    }
    if (!purify) {
      toast.error("DOMPurify is not initialized yet. Please try again.");
      return;
    }

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = e.target.result;

        img.onload = async () => {
          try {
            const palette = await Vibrant.from(img).getPalette();
            const colors = [
              palette.Vibrant?.hex,
              palette.Muted?.hex,
              palette.DarkVibrant?.hex,
              palette.DarkMuted?.hex,
              palette.LightVibrant?.hex,
            ]
              .filter((color) => !!color)
              .slice(0, 5);

            if (colors.length === 0) {
              toast.error("Failed to extract colors from the image.");
              return;
            }

            const newStyle = {
              id: uuidv4(),
              brand_name: purify.sanitize(brandName.trim()),
              colors,
              font: brandFont.trim() ? purify.sanitize(brandFont.trim()) : null,
            };

            setGeneratedBrandStyles([newStyle]);
            setLatestResult({ type: "Brand Style", data: [newStyle] });
            toast.success("Styles extracted successfully!");
          } catch (err) {
            console.error("Color extraction error:", err.message);
            toast.error("Failed to extract colors. Please try again.");
          } finally {
            setIsExtracting(false);
          }
        };

        img.onerror = () => {
          toast.error("Invalid image file.");
          setIsExtracting(false);
        };
      };

      reader.onerror = () => {
        toast.error("Error reading image file.");
        setIsExtracting(false);
      };

      reader.readAsDataURL(logoFile);
    } catch (err) {
      console.error("Unexpected extraction error:", err.message);
      toast.error("Unexpected error extracting styles. Please try again.");
      setIsExtracting(false);
    }
  };

  const handleSaveBrandStyle = async (style) => {
    if (!style || !style.brand_name) {
      toast.error("Invalid brand style data.");
      return;
    }

    try {
      const { error } = await supabase
        .from("brand_styles")
        .insert({
          project_id: project.id,
          user_id: user.id,
          brand_name: style.brand_name,
          colors: style.colors,
          font: style.font,
        })
        .select();

      if (error) {
        console.error("Brand style save error:", error.message);
        toast.error("Failed to save brand style.");
        return;
      }

      const { data: savedStyles } = await supabase
        .from("brand_styles")
        .select("id, brand_name, colors, font, created_at")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBrandStyles(savedStyles || []);
      setGeneratedBrandStyles([]);
      setLogoFile(null);
      setBrandName("");
      setBrandFont("");
      if (logoInputRef.current) logoInputRef.current.value = "";
      toast.success("Brand style saved successfully!");
    } catch (err) {
      console.error("Unexpected save brand style error:", err.message);
      toast.error("Unexpected error saving brand style.");
    }
  };

  const handleDeleteBrandStyle = async (styleId) => {
    if (!styleId) return;

    const deletePromise = supabase
      .from("brand_styles")
      .delete()
      .eq("id", styleId)
      .eq("user_id", user.id);

    toast.promise(
      deletePromise,
      {
        loading: "Deleting brand style...",
        success: "Brand style deleted successfully!",
        error: (err) => err.message || "Failed to delete brand style.",
      },
      { style: { minWidth: "200px" } }
    );

    try {
      const { error } = await deletePromise;
      if (error) {
        console.error("Brand style delete error:", error.message);
        return;
      }

      setBrandStyles(brandStyles.filter((style) => style.id !== styleId));
    } catch (err) {
      console.error("Unexpected delete brand style error:", err.message);
    }
  };

  const handleRegenerateAdCopy = async (adCopyId) => {
    if (!project) {
      toast.error("Project data is not loaded yet.");
      return;
    }

    if (!adCopyId) return;

    setIsGenerating(true);
    try {
      const newAdCopies = await generateAdCopies(project, regenerateTone);
      if (!newAdCopies || newAdCopies.length === 0) {
        throw new Error("No ad copies generated. Please try again.");
      }
      const newContent = newAdCopies[0];
      const updatedAdCopy = { 
        id: adCopyId, 
        content: newContent, 
        tone: regenerateTone 
      };
      setGeneratedAdCopies(
        generatedAdCopies.map((ad) =>
          ad.id === adCopyId
            ? updatedAdCopy
            : ad
        )
      );
      setLatestResult({ type: "Ad Copy", data: [updatedAdCopy] });
      toast.success("Ad copy regenerated successfully!");
    } catch (err) {
      toast.error(
        err.message.includes("API key")
          ? err.message
          : "Failed to regenerate ad copy. Please try again."
      );
      console.error("Regenerate ad copy error:", err.message);
    } finally {
      setIsGenerating(false);
      setRegeneratingAdCopyId(null);
      setRegenerateTone("Professional");
    }
  };

  const handleCheckReadability = () => {
    if (!selectedAdCopyId) {
      toast.error("Please select an ad copy to analyze.");
      return;
    }

    const adCopy = adCopies.find((ad) => ad.id === selectedAdCopyId);
    if (!adCopy) {
      toast.error("Selected ad copy not found.");
      return;
    }

    const scores = calculateReadability(adCopy.content);
    const explanation = getReadabilityExplanation(scores);
    setReadabilityResults({ adCopy, scores, explanation });
    setLatestResult({ type: "Readability", data: { scores, explanation, adCopy } });
  };

  const handleSaveReadabilityScores = async () => {
    if (!readabilityResults) {
      toast.error("No readability results to save.");
      return;
    }

    try {
      const { error } = await supabase
        .from("readability_scores")
        .insert({
          ad_copy_id: readabilityResults.adCopy.id,
          flesch_reading_ease: readabilityResults.scores.flesch_reading_ease,
          flesch_grade_level: readabilityResults.scores.flesch_grade_level,
          gunning_fog: readabilityResults.scores.gunning_fog,
          flesch_reading_ease_label:
            readabilityResults.explanation.flesch_reading_ease.label,
          flesch_grade_level_label:
            readabilityResults.explanation.flesch_grade_level.label,
          gunning_fog_label: readabilityResults.explanation.gunning_fog.label,
        })
        .select();

      if (error) {
        console.error("Readability scores save error:", error.message);
        toast.error("Failed to save readability scores.");
        return;
      }

      const { data: savedScores } = await supabase
        .from("readability_scores")
        .select(
          "id, ad_copy_id, flesch_reading_ease, flesch_grade_level, gunning_fog, flesch_reading_ease_label, flesch_grade_level_label, gunning_fog_label, created_at"
        )
        .eq("ad_copy_id", readabilityResults.adCopy.id);

      const updatedScores = savedScores.map((score) => ({
        ...score,
        content: readabilityResults.adCopy.content,
        tone: readabilityResults.adCopy.tone,
      }));
      setReadabilityScores([...readabilityScores, ...updatedScores]);
      toast.success("Readability scores saved successfully!");
      setReadabilityResults(null);
    } catch (err) {
      toast.error("Unexpected error saving readability scores.");
      console.error("Save readability scores error:", err.message);
    }
  };

  const handleGenerateReport = async () => {
    if (!project) {
      toast.error("Project data is not loaded yet.");
      return;
    }

    setIsGenerating(true);
    try {
      const reportHtml = await generateReport(project.id, user.id);
      if (!reportHtml) {
        throw new Error("No report content generated.");
      }
      setReportContent(reportHtml);
      setLatestResult({ type: "Report", data: reportHtml });
      toast.success("Report generated successfully!");
    } catch (err) {
      toast.error("Failed to generate report. Please try again.");
      console.error("Report generation error:", err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportContent || !reportRef.current) {
      toast.error("No report content to download.");
      return;
    }

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`AdVision_Report_${project.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download PDF. Please try again.");
      console.error("PDF download error:", err.message);
    }
  };

  const toggleAccordionItem = (itemId, type = "adCopy") => {
    const setOpenItems = {
      adCopy: setOpenAccordionItems,
      readability: setOpenReadabilityAccordionItems,
      keyword: setOpenKeywordAccordionItems,
      audience: setOpenAudienceAccordionItems,
      brandStyle: setOpenBrandStyleAccordionItems,
    }[type];
    const openItems = {
      adCopy: openAccordionItems,
      readability: openReadabilityAccordionItems,
      keyword: openKeywordAccordionItems,
      audience: openAudienceAccordionItems,
      brandStyle: openBrandStyleAccordionItems,
    }[type];

    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId].slice(-2)
    );
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out.");
        console.error("Sign out error:", error.message);
        return;
      }
      toast.success("Signed out successfully!");
      router.push("/login");
    } catch (err) {
      toast.error("Unexpected error signing out.");
      console.error("Unexpected sign out error:", err.message);
    }
  };

  const tabs = ["Dashboard", "Create Project", "Ai Design Suggestions", "Profile"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F1EFEC]">
        <p className="text-base text-[#030303] font-extralight">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const features = [
    {
      name: "Ad Copy Generator",
      tagline: "Create catchy ads in seconds!",
      description: "This tool writes ad texts for you based on your project details. You can choose the tone (like professional or friendly) to match your brand. Use these ads for social media, websites, or campaigns to attract customers easily.",
      icon: DocumentTextIcon,
    },
    {
      name: "Readability Analysis",
      tagline: "Make your ads easy to read!",
      description: "Check if your ad texts are easy to understand. This tool scores your ad copy and tells you if it's simple enough for your audience. It helps ensure your message is clear and engaging for everyone.",
      icon: EyeIcon,
      disabled: adCopies.length === 0,
      disabledMessage: "You need to save at least one ad copy first to use this feature.",
    },
    {
      name: "Keyword Research",
      tagline: "Find the best words for your ads!",
      description: "Discover popular words (keywords) that people search for online. These keywords can help your ads show up in search results, making it easier for customers to find your product or service.",
      icon: MagnifyingGlassIcon,
      disabled: adCopies.length === 0,
      disabledMessage: "You need to save at least one ad copy first to use this feature.",
    },
    {
      name: "Audience Insights",
      tagline: "Know who to target!",
      description: "Learn about the people most likely to buy your product. This tool suggests details like their age, interests, and favorite platforms, so you can create ads that speak directly to them.",
      icon: UserGroupIcon,
      disabled: adCopies.length === 0,
      disabledMessage: "You need to save at least one ad copy first to use this feature.",
    },
    {
      name: "Style Extractor",
      tagline: "Match your brand’s look!",
      description: "Upload your logo to extract colors and styles that match your brand. Use these colors and fonts in your ads to keep everything looking consistent and professional.",
      icon: SparklesIcon,
    },
    {
      name: "Campaign Report",
      tagline: "Get a full summary of your work!",
      description: "Create a detailed report of your project, including all your ad copies, keywords, and audiences. Download it as a PDF to share with your team or keep as a record.",
      icon: DocumentChartBarIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F1EFEC] flex flex-col">
      {/* Main Header (Top Bar) - Adjusted for mobile */}
      <header className="bg-[#123458] text-[#F1EFEC] py-3 px-4 sticky top-0 z-50">
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
          </Link>          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard?tab=Profile")}
                className="text-[#F1EFEC] hover:text-[#FDFAF6] transition-colors"
                aria-label="Your Profile"
              >
                <UserCircleIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="text-[#F1EFEC] hover:text-[#FDFAF6] transition-colors"
                aria-label="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              className="sm:hidden p-2 rounded-full hover:bg-[#1E4A7A]"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open actions menu"
            >
              <Bars3Icon className="w-6 h-6 text-[#F1EFEC]" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs - Adjusted for mobile */}
      <nav className="bg-[#FDFAF6] shadow-sm py-3 px-4 sticky top-[56px] z-40">
        <div className="max-w-7xl mx-auto">
          <div className="hidden sm:flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "Dashboard") router.push("/dashboard");
                  else if (tab === "Create Project") router.push("/dashboard/create-project");
                  else if (tab === "Ai Design Suggestions") router.push("/dashboard/ai-design-suggestions");
                  else if (tab === "Profile") router.push("/dashboard?tab=Profile");
                }}
                className="relative text-sm pb-2 transition-colors duration-300 text-[#030303] font-extralight hover:text-[#1E4A7A] whitespace-nowrap"
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="sm:hidden">
            <span className="text-sm text-[#123458] font-medium truncate">
              Project Workspace
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Adjusted spacing */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-16 left-4 right-4 bg-[#FDFAF6] rounded-xl shadow-md p-4 z-50 sm:hidden animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium text-[#123458]">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-full hover:bg-[#F1EFEC]"
                aria-label="Close actions menu"
              >
                <XMarkIcon className="w-5 h-5 text-[#030303]" />
              </button>
            </div>
            <div className="space-y-3">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (tab === "Dashboard") router.push("/dashboard");
                    else if (tab === "Create Project") router.push("/dashboard/create-project");
                    else if (tab === "Ai Design Suggestions") router.push("/dashboard/ai-design-suggestions");
                    else if (tab === "Profile") router.push("/dashboard?tab=Profile");
                  }}
                  className="block text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors font-extralight truncate"
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
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <main className="flex-grow px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Project Header with Designer Link - Adjusted for mobile */}
          <div className="bg-[#FDFAF6] bg-opacity-80 backdrop-blur-md rounded-xl shadow-md mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center px-4 sm:px-6 py-4 gap-3">
              <h1 className="text-xl sm:text-2xl font-medium text-[#123458] truncate">
                {project ? `${project.name} Workspace` : "Project Workspace"}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsProjectOverviewOpen(!isProjectOverviewOpen)}
                  className="flex items-center gap-2 text-sm text-[#123458] hover:text-[#1E4A7A] font-extralight"
                  aria-expanded={isProjectOverviewOpen}
                  aria-controls="project-overview"
                >
                  <span>{isProjectOverviewOpen ? "Hide Overview" : "Show Overview"}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 transform transition-transform duration-300 ${
                      isProjectOverviewOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <Link
                  href="/dashboard/ai-design-suggestions"
                  className="text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors font-extralight"
                >
                  Ai Design Suggestions
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors font-extralight"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
            {isProjectOverviewOpen && (
              <div
                id="project-overview"
                className="px-4 sm:px-6 pb-4 border-t border-[#123458] border-opacity-10"
              >
                {project ? (
                  <div className="space-y-4 text-sm text-[#030303] font-extralight">
                    <div>
                      <span className="font-medium text-[#123458]">Name:</span>
                      <p className="mt-1">{project.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#123458]">Product/Service:</span>
                      <p className="mt-1">{project.product_service}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#123458]">Target Platform:</span>
                      <p className="mt-1">{project.target_platform}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#123458]">Primary Goal:</span>
                      <p className="mt-1">{project.primary_goal}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#123458]">Description:</span>
                      <p className="mt-1">{project.product_description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#123458]">Features:</span>
                      {project.product_features ? (
                        <ul className="mt-2 list-disc list-inside">
                          {project.product_features
                            .split("\n")
                            .filter((f) => f.trim())
                            .map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[#8E8E93]">No features provided.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[#FF3B30] font-extralight">{fetchError || "Loading project..."}</p>
                )}
              </div>
            )}
          </div>

          {/* Split-Screen Layout - Adjusted for mobile */}
          <div className="flex flex-col lg:flex-row gap-6">
            {fetchError && (
              <p className="text-[#FF3B30] text-sm mb-6 font-extralight">{fetchError}</p>
            )}
            {project ? (
              <>
                {/* Left Half: Feature Selector - Adjusted for mobile */}
                <div className="lg:w-1/3 w-full">
                  <div className="bg-[#FDFAF6] bg-opacity-80 backdrop-blur-md rounded-xl shadow-md p-4 sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-base sm:text-lg font-medium text-[#123458] truncate">Choose a Feature</h2>
                      <div className="relative group">
                        <InformationCircleIcon
                          className="w-4 sm:w-5 h-4 sm:h-5 text-[#123458]"
                          aria-describedby="feature-tooltip"
                        />
                        <span
                          id="feature-tooltip"
                          className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 scale-95 group-hover:scale-100 group-focus:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight z-10"
                        >
                          Pick a tool to start creating or analyzing your ads.
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {features.map((feature) => (
                        <div key={feature.name}>
                          <button
                            onClick={() => {
                              setActiveFeature(feature.name);
                              setGeneratedAdCopies([]);
                              setGeneratedKeywords([]);
                              setGeneratedAudiences([]);
                              setGeneratedBrandStyles([]);
                              setReadabilityResults(null);
                              setSelectedAdCopyId(null);
                              setRegeneratingAdCopyId(null);
                              setRegenerateTone("Professional");
                              setLogoFile(null);
                              setBrandName("");
                              setBrandFont("");
                              if (logoInputRef.current) logoInputRef.current.value = "";
                            }}
                            className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 text-left ${
                              activeFeature === feature.name
                                ? "bg-[#123458] text-[#F1EFEC]"
                                : "bg-[#123458] bg-opacity-10 text-[#123458] hover:bg-opacity-20"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={feature.disabled || isGenerating || isExtracting}
                            aria-label={`Select ${feature.name}`}
                          >
                            <div className="flex items-center gap-2">
                              <feature.icon className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{feature.name}</p>
                                <p className="text-xs font-extralight truncate">{feature.tagline}</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Half: Feature Interaction and Results/Saved Data - Adjusted for mobile */}
                <div className="lg:w-2/3 w-full flex flex-col gap-6">
                  {/* Feature Interaction Panel */}
                  <div className="bg-[#FDFAF6] bg-opacity-80 backdrop-blur-md rounded-xl shadow-md p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-base sm:text-lg font-medium text-[#123458] truncate">
                        {activeFeature ? `Use ${activeFeature}` : "Select a Feature to Start"}
                      </h2>
                      <div className="relative group">
                        <InformationCircleIcon
                          className="w-4 sm:w-5 h-4 sm:h-5 text-[#123458]"
                          aria-describedby="interaction-tooltip"
                        />
                        <span
                          id="interaction-tooltip"
                          className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 scale-95 group-hover:scale-100 group-focus:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight"
                        >
                          Fill in the details here to create or analyze your ad content.
                        </span>
                      </div>
                    </div>
                    {activeFeature ? (
                      <>
                        {activeFeature === "Ad Copy Generator" && (
                          <div className="space-y-4">
                            <p className="text-sm text-[#030303] font-extralight">
                              Choose a tone and click &quot;Generate&quot; to create ad texts for your project. You&quot;ll get ready-to-use ads for your campaigns!
                            </p>
                            <div>
                              <label
                                htmlFor="tone"
                                className="block text-sm font-extralight text-[#030303] mb-2"
                              >
                                Select Tone
                              </label>
                              <select
                                id="tone"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm font-extralight text-[#030303]"
                                disabled={isGenerating}
                              >
                                {[
                                  "Professional",
                                  "Casual",
                                  "Persuasive",
                                  "Friendly",
                                  "Inspirational",
                                  "Urgent",
                                  "Humorous",
                                ].map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={handleGenerateAdCopies}
                              className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isGenerating}
                              aria-label="Generate ad copies"
                            >
                              {isGenerating ? "Generating..." : "Generate Ad Copies"}
                            </button>
                            {generatedAdCopies.length > 0 && (
                              <div className="space-y-4">
                                {generatedAdCopies.map((ad) => (
                                  <div key={ad.id} className="bg-[#F1EFEC] rounded-xl p-4">
                                    <p className="text-sm text-[#030303] mb-2 font-extralight">{ad.content}</p>
                                    <div className="text-xs text-[#030303] mb-2 font-extralight">
                                      <span className="font-medium text-[#123458]">Tone:</span> {ad.tone}
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        onClick={() => handleSaveAdCopy(ad)}
                                        className="px-4 py-2 bg-[#34C759] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#2EB648] hover:scale-105 transition-all duration-300"
                                        disabled={isGenerating}
                                        aria-label="Save ad copy"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRegeneratingAdCopyId(ad.id);
                                          setRegenerateTone(ad.tone);
                                        }}
                                        className="px-4 py-2 bg-[#123458] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
                                        disabled={isGenerating}
                                        aria-label="Regenerate ad copy"
                                      >
                                        Regenerate
                                      </button>
                                    </div>
                                    {regeneratingAdCopyId === ad.id && (
                                      <div className="mt-4 space-y-4">
                                        <div>
                                          <label
                                            htmlFor="regenerate-tone"
                                            className="block text-sm font-extralight text-[#030303] mb-2"
                                          >
                                            Regenerate Tone
                                          </label>
                                          <select
                                            id="regenerate-tone"
                                            value={regenerateTone}
                                            onChange={(e) => setRegenerateTone(e.target.value)}
                                            className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm font-extralight text-[#030303]"
                                            disabled={isGenerating}
                                          >
                                            {[
                                              "Professional",
                                              "Casual",
                                              "Persuasive",
                                              "Friendly",
                                              "Inspirational",
                                              "Urgent",
                                              "Humorous",
                                            ].map((t) => (
                                              <option key={t} value={t}>
                                                {t}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <button
                                          onClick={() => handleRegenerateAdCopy(ad.id)}
                                          className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={isGenerating}
                                          aria-label="Confirm regenerate ad copy"
                                        >
                                          {isGenerating ? "Regenerating..." : "Confirm Regenerate"}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {activeFeature === "Readability Analysis" && (
                          <div className="space-y-4">
                            <p className="text-sm text-[#030303] font-extralight">
                              Select an ad copy to check how easy it is to read. You’ll get scores showing if your ad is simple enough for your audience.
                            </p>
                            <div>
                              <label
                                htmlFor="ad-copy-select"
                                className="block text-sm font-extralight text-[#030303] mb-2"
                              >
                                Select Ad Copy
                              </label>
                              <select
                                id="ad-copy-select"
                                value={selectedAdCopyId || ""}
                                onChange={(e) => setSelectedAdCopyId(e.target.value)}
                                className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm font-extralight text-[#030303]"
                                disabled={isGenerating}
                              >
                                <option value="" disabled>
                                  Select an ad copy
                                </option>
                                {adCopies.map((ad) => (
                                  <option key={ad.id} value={ad.id}>
                                    {ad.content.slice(0, 50)}...
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={handleCheckReadability}
                              className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!selectedAdCopyId || isGenerating}
                              aria-label="Analyze readability"
                            >
                              Analyze Readability
                            </button>
                            {readabilityResults && (
                              <div className="space-y-4">
                                <div className="bg-[#F1EFEC] rounded-xl p-4">
                                  <p className="text-sm text-[#030303] mb-2 font-extralight">
                                    {readabilityResults.adCopy.content}
                                  </p>
                                  <div className="text-xs text-[#030303] space-y-2 font-extralight">
                                    <div>
                                      <span className="font-medium text-[#123458]">Flesch Reading Ease:</span>{" "}
                                      {readabilityResults.scores.flesch_reading_ease} (
                                      <span
                                        style={{
                                          color: readabilityResults.explanation.flesch_reading_ease.color,
                                        }}
                                      >
                                        {readabilityResults.explanation.flesch_reading_ease.label}
                                      </span>
                                      )
                                      <p className="text-[#8E8E93]">
                                        {readabilityResults.explanation.flesch_reading_ease.explanation}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-[#123458]">Flesch Grade Level:</span>{" "}
                                      {readabilityResults.scores.flesch_grade_level} (
                                      <span
                                        style={{
                                          color: readabilityResults.explanation.flesch_grade_level.color,
                                        }}
                                      >
                                        {readabilityResults.explanation.flesch_grade_level.label}
                                      </span>
                                      )
                                      <p className="text-[#8E8E93]">
                                        {readabilityResults.explanation.flesch_grade_level.explanation}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-[#123458]">Gunning Fog:</span>{" "}
                                      {readabilityResults.scores.gunning_fog} (
                                      <span
                                        style={{
                                          color: readabilityResults.explanation.gunning_fog.color,
                                        }}
                                      >
                                        {readabilityResults.explanation.gunning_fog.label}
                                      </span>
                                      )
                                      <p className="text-[#8E8E93]">
                                        {readabilityResults.explanation.gunning_fog.explanation}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-[#123458]">Tone:</span>{" "}
                                      {readabilityResults.adCopy.tone}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={handleSaveReadabilityScores}
                                  className="w-full bg-[#34C759] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#2EB648] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isGenerating}
                                  aria-label="Save readability scores"
                                >
                                  Save Scores
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {activeFeature === "Keyword Research" && (
                          <div className="space-y-4">
                            <p className="text-sm text-[#030303] font-extralight">
                              Click &quot;Generate Keywords&quot; to find popular search terms for your ads. These keywords can help more people find your ads online.
                            </p>
                            <button
                              onClick={handleGenerateKeywords}
                              className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isGenerating}
                              aria-label="Generate keywords"
                            >
                              {isGenerating ? "Generating..." : "Generate Keywords"}
                            </button>
                            {generatedKeywords.length > 0 && (
                              <div className="space-y-4">
                                {generatedKeywords.map((keyword) => (
                                  <div key={keyword.id} className="bg-[#F1EFEC] rounded-xl p-4">
                                    <div className="text-sm text-[#030303] space-y-2 font-extralight">
                                      <div>
                                        <span className="font-medium text-[#123458]">Keyword:</span>{" "}
                                        {keyword.keyword}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Search Volume:</span>{" "}
                                        {keyword.search_volume}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Competition:</span>{" "}
                                        {keyword.competition}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Intent:</span>{" "}
                                        <span style={{ color: getIntentColor(keyword.intent) }}>
                                          {keyword.intent}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Suggestions:</span>{" "}
                                        {keyword.suggestions.length > 0
                                          ? keyword.suggestions.join(", ")
                                          : "None"}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleSaveKeyword(keyword)}
                                      className="mt-4 px-4 py-2 bg-[#34C759] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#2EB648] hover:scale-105 transition-all duration-300"
                                      disabled={isGenerating}
                                      aria-label="Save keyword"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {activeFeature === "Audience Insights" && (
                          <div className="space-y-4">
                            <p className="text-sm text-[#030303] font-extralight">
                              Click &quot;Generate Audiences&quot; to learn about the people who might buy your product. You’ll get details like their age and interests.
                            </p>
                            <button
                              onClick={handleGenerateAudienceSuggestions}
                              className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isGenerating}
                              aria-label="Generate audiences"
                            >
                              {isGenerating ? "Generating..." : "Generate Audiences"}
                            </button>
                            {generatedAudiences.length > 0 && (
                              <div className="space-y-4">
                                {generatedAudiences.map((audience) => (
                                  <div key={audience.id} className="bg-[#F1EFEC] rounded-xl p-4">
                                    <div className="text-sm text-[#030303] space-y-2 font-extralight">
                                      <div>
                                        <span className="font-medium text-[#123458]">Name:</span>{" "}
                                        {audience.name}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Age Range:</span>{" "}
                                        {audience.age_range}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Gender:</span>{" "}
                                        {audience.gender}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Interests:</span>{" "}
                                        {audience.interests}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Platforms:</span>{" "}
                                        {audience.platforms}
                                      </div>
                                      {audience.purchase_intent && (
                                        <div>
                                          <span className="font-medium text-[#123458]">Purchase Intent:</span>{" "}
                                          {audience.purchase_intent}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleSaveAudience(audience)}
                                      className="mt-4 px-4 py-2 bg-[#34C759] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#2EB648] hover:scale-105 transition-all duration-300"
                                      disabled={isGenerating}
                                      aria-label="Save audience"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {activeFeature === "Style Extractor" && (
                          <div className="space-y-4">
                            <p className="text-sm text-[#030303] font-extralight">
                              Upload your logo to extract colors and styles that match your brand. This helps you keep your ads looking consistent with your brand’s look.
                            </p>
                            <div>
                              <label
                                htmlFor="logo-upload"
                                className="block text-sm font-extralight text-[#030303] mb-2"
                              >
                                Upload Logo
                              </label>
                              <input
                                id="logo-upload"
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={(e) => setLogoFile(e.target.files[0])}
                                className="w-full px-4 py-2 border border-[#123458] rounded-xl text-sm font-extralight text-[#030303] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-[#123458] file:text-[#F1EFEC] hover:file:bg-[#1E4A7A]"
                                disabled={isExtracting}
                                ref={logoInputRef}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="brand-name"
                                className="block text-sm font-extralight text-[#030303] mb-2"
                              >
                                Brand Name
                              </label>
                              <input
                                id="brand-name"
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm font-extralight text-[#030303]"
                                disabled={isExtracting}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="brand-font"
                                className="block text-sm font-extralight text-[#030303] mb-2"
                              >
                                Brand Font (Optional)
                              </label>
                              <input
                                id="brand-font"
                                type="text"
                                value={brandFont}
                                onChange={(e) => setBrandFont(e.target.value)}
                                className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm font-extralight text-[#030303]"
                                disabled={isExtracting}
                              />
                            </div>
                            <button
                              onClick={handleExtractStyles}
                              className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isExtracting}
                              aria-label="Extract styles"
                            >
                              {isExtracting ? "Extracting..." : "Extract Styles"}
                            </button>
                            {generatedBrandStyles.length > 0 && (
                              <div className="space-y-4">
                                {generatedBrandStyles.map((style) => (
                                  <div key={style.id} className="bg-[#F1EFEC] rounded-xl p-4">
                                    <div className="text-sm text-[#030303] space-y-2 font-extralight">
                                      <div>
                                        <span className="font-medium text-[#123458]">Brand Name:</span>{" "}
                                        {style.brand_name}
                                      </div>
                                      <div>
                                        <span className="font-medium text-[#123458]">Colors:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {style.colors.map((color, index) => (
                                            <div
                                              key={index}
                                              className="w-6 h-6 rounded-full border border-[#123458] border-opacity-20"
                                              style={{ backgroundColor: color }}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      {style.font && (
                                        <div>
                                          <span className="font-medium text-[#123458]">Font:</span>{" "}
                                          {style.font}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleSaveBrandStyle(style)}
                                      className="mt-4 px-4 py-2 bg-[#34C759] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#2EB648] hover:scale-105 transition-all duration-300"
                                      disabled={isExtracting}
                                      aria-label="Save brand style"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {activeFeature === "Campaign Report" && (
                          <div className="space-y-4">
                            <p className="text-sm text-[#030303] font-extralight">
                              Click &quot;Generate Report&quot; to create a summary of your project, including all your ads, keywords, and audiences. You can download it as a PDF to share with your team.
                            </p>
                            <button
                              onClick={() => setIsReportModalOpen(true)}
                              className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isGenerating}
                              aria-label="Generate report"
                            >
                              {isGenerating ? "Generating..." : "Generate Report"}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-[#030303] font-extralight">
                        Choose a feature from the left to get started with creating or analyzing your ads.
                      </p>
                    )}
                  </div>

                  {/* Results and Saved Data */}
                  <div className="flex flex-col gap-6">
                    {/* Live Results */}
                    <div className="bg-[#F1EFEC] rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-base sm:text-lg font-medium text-[#123458] sticky top-0 bg-[#F1EFEC] z-10 py-2 truncate">
                          Latest Results
                        </h2>
                        <div className="relative group">
                          <InformationCircleIcon
                            className="w-4 sm:w-5 h-4 sm:h-5 text-[#123458]"
                            aria-describedby="results-tooltip"
                          />
                          <span
                            id="results-tooltip"
                            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 scale-95 group-hover:scale-100 group-focus:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight"
                          >
                            See the most recent output from the feature you used here.
                          </span>
                        </div>
                      </div>
                      {latestResult ? (
                        <div className="bg-[#FDFAF6] bg-opacity-80 backdrop-blur-md rounded-xl p-4">
                          {latestResult.type === "Ad Copy" && (
                            <div className="space-y-2 text-sm text-[#030303] font-extralight">
                              <p className="font-medium text-[#123458]">Ad Copies:</p>
                              {latestResult.data.map((ad) => (
                                <div key={ad.id} className="border-t border-[#123458] border-opacity-10 pt-2">
                                  <p>{ad.content}</p>
                                  <p className="text-xs">
                                    <span className="font-medium text-[#123458]">Tone:</span> {ad.tone}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          {latestResult.type === "Readability" && (
                            <div className="space-y-2 text-sm text-[#030303] font-extralight">
                              <p className="font-medium text-[#123458]">Readability Analysis:</p>
                              <p>{latestResult.data.adCopy.content}</p>
                              <div className="text-xs space-y-1">
                                <p>
                                  <span className="font-medium text-[#123458]">Flesch Reading Ease:</span>{" "}
                                  {latestResult.data.scores.flesch_reading_ease} (
                                  <span style={{ color: latestResult.data.explanation.flesch_reading_ease.color }}>
                                    {latestResult.data.explanation.flesch_reading_ease.label}
                                  </span>
                                  )
                                </p>
                                <p>
                                  <span className="font-medium text-[#123458]">Flesch Grade Level:</span>{" "}
                                  {latestResult.data.scores.flesch_grade_level} (
                                  <span style={{ color: latestResult.data.explanation.flesch_grade_level.color }}>
                                    {latestResult.data.explanation.flesch_grade_level.label}
                                  </span>
                                  )
                                </p>
                                <p>
                                  <span className="font-medium text-[#123458]">Gunning Fog:</span>{" "}
                                  {latestResult.data.scores.gunning_fog} (
                                  <span style={{ color: latestResult.data.explanation.gunning_fog.color }}>
                                    {latestResult.data.explanation.gunning_fog.label}
                                  </span>
                                  )
                                </p>
                                <p>
                                  <span className="font-medium text-[#123458]">Tone:</span>{" "}
                                  {latestResult.data.adCopy.tone}
                                </p>
                              </div>
                            </div>
                          )}
                          {latestResult.type === "Keyword" && (
                            <div className="space-y-2 text-sm text-[#030303] font-extralight">
                              <p className="font-medium text-[#123458]">Keywords:</p>
                              {latestResult.data.map((keyword) => (
                                <div key={keyword.id} className="border-t border-[#123458] border-opacity-10 pt-2">
                                  <p>
                                    <span className="font-medium text-[#123458]">Keyword:</span>{" "}
                                    {keyword.keyword}
                                  </p>
                                  <p className="text-xs">
                                    <span className="font-medium text-[#123458]">Search Volume:</span>{" "}
                                    {keyword.search_volume}
                                  </p>
                                  <p className="text-xs">
                                    <span className="font-medium text-[#123458]">Competition:</span>{" "}
                                    {keyword.competition}
                                  </p>
                                  <p className="text-xs">
                                    <span className="font-medium text-[#123458]">Intent:</span>{" "}
                                    <span style={{ color: getIntentColor(keyword.intent) }}>
                                      {keyword.intent}
                                    </span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          {latestResult.type === "Audience" && (
                            <div className="space-y-2 text-sm text-[#030303] font-extralight">
                              <p className="font-medium text-[#123458]">Audiences:</p>
                              {latestResult.data.map((audience) => (
                                <div key={audience.id} className="border-t border-[#123458] border-opacity-10 pt-2">
                                  <p>
                                    <span className="font-medium text-[#123458]">Name:</span>{" "}
                                    {audience.name}
                                  </p>
                                  <p className="text-xs">
                                    <span className="font-medium text-[#123458]">Age Range:</span>{" "}
                                    {audience.age_range}
                                  </p>
                                  <p className="text-xs">
                                    <span className="font-medium text-[#123458]">Gender:</span>{" "}
                                    {audience.gender}
                                  </p>
                                  <p className="text-xs">
                                    <span className="font-medium text-[#123458]">Interests:</span>{" "}
                                    {audience.interests}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          {latestResult.type === "Brand Style" && (
                            <div className="space-y-2 text-sm text-[#030303] font-extralight">
                              <p className="font-medium text-[#123458]">Brand Style:</p>
                              {latestResult.data.map((style) => (
                                <div key={style.id} className="border-t border-[#123458] border-opacity-10 pt-2">
                                  <p>
                                    <span className="font-medium text-[#123458]">Brand Name:</span>{" "}
                                    {style.brand_name}
                                  </p>
                                  <div className="text-xs">
                                    <span className="font-medium text-[#123458]">Colors:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {style.colors.map((color, index) => (
                                        <div
                                          key={index}
                                          className="w-6 h-6 rounded-full border border-[#123458] border-opacity-20"
                                          style={{ backgroundColor: color }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  {style.font && (
                                    <p className="text-xs">
                                      <span className="font-medium text-[#123458]">Font:</span>{" "}
                                      {style.font}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {latestResult.type === "Report" && (
                            <div
                              className="text-sm text-[#030303] font-extralight"
                              dangerouslySetInnerHTML={{ __html: latestResult.data }}
                            />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[#030303] font-extralight">
                          Use a feature above to see your results here.
                        </p>
                      )}
                    </div>

                    {/* Saved Data */}
                    {(adCopies.length > 0 ||
                      readabilityScores.length > 0 ||
                      keywords.length > 0 ||
                      audiences.length > 0 ||
                      brandStyles.length > 0) && (
                      <div className="bg-[#F1EFEC] rounded-xl p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <h2 className="text-base sm:text-lg font-medium text-[#123458] sticky top-0 bg-[#F1EFEC] z-10 py-2 truncate">
                            Saved Data
                          </h2>
                          <div className="relative group">
                            <InformationCircleIcon
                              className="w-4 sm:w-5 h-4 sm:h-5 text-[#123458]"
                              aria-describedby="saved-data-tooltip"
                            />
                            <span
                              id="saved-data-tooltip"
                              className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 scale-95 group-hover:scale-100 group-focus:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight"
                            >
                              View and manage all the ad content, keywords, and styles you’ve saved.
                            </span>
                          </div>
                        </div>
                        <div className="flex border-b border-[#123458] border-opacity-10 mb-6 overflow-x-auto">
                          {[
                            { name: "Ad Copies", count: adCopies.length },
                            { name: "Readability", count: readabilityScores.length },
                            { name: "Keywords", count: keywords.length },
                            { name: "Audiences", count: audiences.length },
                            { name: "Brand Styles", count: brandStyles.length },
                          ].map((tab) => (
                            tab.count > 0 && (
                              <button
                                key={tab.name}
                                onClick={() => setActiveSavedDataTab(tab.name)}
                                className={`px-4 py-2 text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                                  activeSavedDataTab === tab.name
                                    ? "text-[#123458] border-b-2 border-[#123458]"
                                    : "text-[#030303] hover:text-[#1E4A7A]"
                                }`}
                              >
                                {tab.name} ({tab.count})
                              </button>
                            )
                          ))}
                        </div>
                        <div className="max-h-[40vh] overflow-y-auto">
                          {/* Ad Copies */}
                          {activeSavedDataTab === "Ad Copies" && adCopies.length > 0 && (
                            <div className="space-y-4">
                              {adCopies.map((ad) => (
                                <div
                                  key={ad.id}
                                  className="bg-[#FDFAF6] rounded-xl p-4"
                                >
                                  <button
                                    onClick={() => toggleAccordionItem(ad.id, "adCopy")}
                                    className="w-full text-left flex justify-between items-center"
                                    aria-expanded={openAccordionItems.includes(ad.id)}
                                    aria-controls={`ad-copy-${ad.id}`}
                                  >
                                    <span className="text-sm text-[#030303] truncate max-w-[90%] font-extralight">
                                      {ad.content.slice(0, 50)}...
                                    </span>
                                    <XMarkIcon
                                      className={`w-4 sm:w-5 h-4 sm:h-5 text-[#123458] transform transition-transform duration-300 ${
                                        openAccordionItems.includes(ad.id) ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                  {openAccordionItems.includes(ad.id) && (
                                    <div
                                      id={`ad-copy-${ad.id}`}
                                      className="mt-4"
                                    >
                                      <p className="text-sm text-[#030303] mb-4 font-extralight">{ad.content}</p>
                                      <div className="text-xs text-[#030303] mb-4 font-extralight">
                                        <span className="font-medium text-[#123458]">Tone:</span> {ad.tone}
                                        <br />
                                        <span className="font-medium text-[#123458]">Generated:</span>{" "}
                                        {new Date(ad.created_at).toLocaleString()}
                                      </div>
                                      <button
                                        onClick={() => handleDeleteAdCopy(ad.id)}
                                        className="px-4 py-2 bg-[#FF3B30] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                                        disabled={isGenerating}
                                        aria-label="Delete ad copy"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Readability Analysis */}
                          {activeSavedDataTab === "Readability" && readabilityScores.length > 0 && (
                            <div className="space-y-4">
                              {readabilityScores.map((score) => {
                                const explanation = getReadabilityExplanation({
                                  flesch_reading_ease: score.flesch_reading_ease,
                                  flesch_grade_level: score.flesch_grade_level,
                                  gunning_fog: score.gunning_fog,
                                });
                                return (
                                  <div
                                    key={score.id}
                                    className="bg-[#FDFAF6] rounded-xl p-4"
                                  >
                                    <button
                                      onClick={() => toggleAccordionItem(score.ad_copy_id, "readability")}
                                      className="w-full text-left flex justify-between items-center"
                                      aria-expanded={openReadabilityAccordionItems.includes(score.ad_copy_id)}
                                      aria-controls={`readability-${score.id}`}
                                    >
                                      <span className="text-sm text-[#030303] truncate max-w-[90%] font-extralight">
                                        {score.content.slice(0, 50)}...
                                      </span>
                                      <XMarkIcon
                                        className={`w-4 sm:w-5 h-4 sm:h-5 text-[#123458] transform transition-transform duration-300 ${
                                          openReadabilityAccordionItems.includes(score.ad_copy_id) ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>
                                    {openReadabilityAccordionItems.includes(score.ad_copy_id) && (
                                      <div
                                        id={`readability-${score.id}`}
                                        className="mt-4"
                                      >
                                        <p className="text-sm text-[#030303] mb-4 font-extralight">{score.content}</p>
                                        <div className="text-xs text-[#030303] mb-4 space-y-2 font-extralight">
                                          <div>
                                            <span className="font-medium text-[#123458]">Flesch Reading Ease:</span>{" "}
                                            {score.flesch_reading_ease} (
                                            <span style={{ color: explanation.flesch_reading_ease.color }}>
                                              {explanation.flesch_reading_ease.label}
                                            </span>
                                            )
                                            <p className="text-[#8E8E93]">
                                              {explanation.flesch_reading_ease.explanation}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-[#123458]">Flesch Grade Level:</span>{" "}
                                            {score.flesch_grade_level} (
                                            <span style={{ color: explanation.flesch_grade_level.color }}>
                                              {explanation.flesch_grade_level.label}
                                            </span>
                                            )
                                            <p className="text-[#8E8E93]">
                                              {explanation.flesch_grade_level.explanation}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-[#123458]">Gunning Fog:</span>{" "}
                                            {score.gunning_fog} (
                                            <span style={{ color: explanation.gunning_fog.color }}>
                                              {explanation.gunning_fog.label}
                                            </span>
                                            )
                                            <p className="text-[#8E8E93]">
                                              {explanation.gunning_fog.explanation}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-[#123458]">Tone:</span> {score.tone}
                                          </div>
                                          <div>
                                            <span className="font-medium text-[#123458]">Analyzed:</span>{" "}
                                            {new Date(score.created_at).toLocaleString()}
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteReadabilityScores(score.id)}
                                          className="px-4 py-2 bg-[#FF3B30] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                                          disabled={isGenerating}
                                          aria-label="Delete readability scores"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Keywords */}
                          {activeSavedDataTab === "Keywords" && keywords.length > 0 && (
                            <div className="space-y-4">
                              {keywords.map((keyword) => (
                                <div
                                  key={keyword.id}
                                  className="bg-[#FDFAF6] rounded-xl p-4"
                                >
                                  <button
                                    onClick={() => toggleAccordionItem(keyword.id, "keyword")}
                                    className="w-full text-left flex justify-between items-center"
                                    aria-expanded={openKeywordAccordionItems.includes(keyword.id)}
                                    aria-controls={`keyword-${keyword.id}`}
                                  >
                                    <span className="text-sm text-[#030303] truncate max-w-[90%] font-extralight">
                                      {keyword.keyword}
                                    </span>
                                    <XMarkIcon
                                      className={`w-4 sm:w-5 h-4 sm:h-5 text-[#123458] transform transition-transform duration-300 ${
                                        openKeywordAccordionItems.includes(keyword.id) ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                  {openKeywordAccordionItems.includes(keyword.id) && (
                                    <div
                                      id={`keyword-${keyword.id}`}
                                      className="mt-4"
                                    >
                                      <div className="text-xs text-[#030303] mb-4 space-y-2 font-extralight">
                                        <div>
                                          <span className="font-medium text-[#123458]">Keyword:</span> {keyword.keyword}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Search Volume:</span>{" "}
                                          {keyword.search_volume}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Competition:</span>{" "}
                                          {keyword.competition}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Intent:</span>{" "}
                                          <span style={{ color: getIntentColor(keyword.intent) }}>
                                            {keyword.intent}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Suggestions:</span>{" "}
                                          {keyword.suggestions.length > 0
                                            ? keyword.suggestions.join(", ")
                                            : "None"}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Generated:</span>{" "}
                                          {new Date(keyword.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteKeyword(keyword.id)}
                                        className="px-4 py-2 bg-[#FF3B30] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                                        disabled={isGenerating}
                                        aria-label="Delete keyword"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Audiences */}
                          {activeSavedDataTab === "Audiences" && audiences.length > 0 && (
                            <div className="space-y-4">
                              {audiences.map((audience) => (
                                <div
                                  key={audience.id}
                                  className="bg-[#FDFAF6] rounded-xl p-4"
                                >
                                  <button
                                    onClick={() => toggleAccordionItem(audience.id, "audience")}
                                    className="w-full text-left flex justify-between items-center"
                                    aria-expanded={openAudienceAccordionItems.includes(audience.id)}
                                    aria-controls={`audience-${audience.id}`}
                                  >
                                    <span className="text-sm text-[#030303] truncate max-w-[90%] font-extralight">
                                      {audience.name}
                                    </span>
                                    <XMarkIcon
                                      className={`w-4 sm:w-5 h-4 sm:h-5 text-[#123458] transform transition-transform duration-300 ${
                                        openAudienceAccordionItems.includes(audience.id) ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                  {openAudienceAccordionItems.includes(audience.id) && (
                                    <div
                                      id={`audience-${audience.id}`}
                                      className="mt-4"
                                    >
                                      <div className="text-xs text-[#030303] mb-4 space-y-2 font-extralight">
                                        <div>
                                          <span className="font-medium text-[#123458]">Name:</span> {audience.name}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Age Range:</span>{" "}
                                          {audience.age_range}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Gender:</span> {audience.gender}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Interests:</span> {audience.interests}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Platforms:</span> {audience.platforms}
                                        </div>
                                        {audience.purchase_intent && (
                                          <div>
                                            <span className="font-medium text-[#123458]">Purchase Intent:</span>{" "}
                                            {audience.purchase_intent}
                                          </div>
                                        )}
                                        <div>
                                          <span className="font-medium text-[#123458]">Generated:</span>{" "}
                                          {new Date(audience.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteAudience(audience.id)}
                                        className="px-4 py-2 bg-[#FF3B30] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                                        disabled={isGenerating}
                                        aria-label="Delete audience"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Brand Styles */}
                          {activeSavedDataTab === "Brand Styles" && brandStyles.length > 0 && (
                            <div className="space-y-4">
                              {brandStyles.map((style) => (
                                <div
                                  key={style.id}
                                  className="bg-[#FDFAF6] rounded-xl p-4"
                                >
                                  <button
                                    onClick={() => toggleAccordionItem(style.id, "brandStyle")}
                                    className="w-full text-left flex justify-between items-center"
                                    aria-expanded={openBrandStyleAccordionItems.includes(style.id)}
                                    aria-controls={`brand-style-${style.id}`}
                                  >
                                    <span className="text-sm text-[#030303] truncate max-w-[90%] font-extralight">
                                      {style.brand_name}
                                    </span>
                                    <XMarkIcon
                                      className={`w-4 sm:w-5 h-4 sm:h-5 text-[#123458] transform transition-transform duration-300 ${
                                        openBrandStyleAccordionItems.includes(style.id) ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                  {openBrandStyleAccordionItems.includes(style.id) && (
                                    <div
                                      id={`brand-style-${style.id}`}
                                      className="mt-4"
                                    >
                                      <div className="text-xs text-[#030303] mb-4 space-y-2 font-extralight">
                                        <div>
                                          <span className="font-medium text-[#123458]">Brand Name:</span>{" "}
                                          {style.brand_name}
                                        </div>
                                        <div>
                                          <span className="font-medium text-[#123458]">Colors:</span>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {style.colors.map((color, index) => (
                                              <div
                                                key={index}
                                                className="w-6 h-6 rounded-full border border-[#123458] border-opacity-20"
                                                style={{ backgroundColor: color }}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                        {style.font && (
                                          <div>
                                            <span className="font-medium text-[#123458]">Font:</span> {style.font}
                                          </div>
                                        )}
                                        <div>
                                          <span className="font-medium text-[#123458]">Extracted:</span>{" "}
                                          {new Date(style.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteBrandStyle(style.id)}
                                        className="px-4 py-2 bg-[#FF3B30] text-[#F1EFEC] text-xs font-medium rounded-xl hover:bg-[#E53A2F] hover:scale-105 transition-all duration-300"
                                        disabled={isGenerating}
                                        aria-label="Delete brand style"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[#030303] font-extralight">Loading project...</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Adjusted for mobile */}
      <footer className="bg-[#123458] text-[#F1EFEC] py-4 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-extralight truncate">AdVision | April 27, 2025 | v1.0</p>
        </div>
      </footer>

      {/* Report Modal - Adjusted for mobile */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FDFAF6] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-medium text-[#123458] truncate">Campaign Report</h2>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  setReportContent(null);
                  setActiveFeature(null);
                }}
                className="p-1 sm:p-2 rounded-full hover:bg-[#F1EFEC]"
                aria-label="Close report modal"
              >
                <XMarkIcon className="w-5 sm:w-6 h-5 sm:h-6 text-[#123458]" />
              </button>
            </div>
            <p className="text-sm text-[#030303] font-extralight mb-4">
              Click &quot;Generate Report&quot; to create a PDF summary of your project, including all your ads, keywords, and audiences. You can download it to share or save.
            </p>
            <button
              onClick={handleGenerateReport}
              className="w-full bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4 sm:mb-6"
              disabled={isGenerating}
              aria-label="Generate report"
            >
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>
            {reportContent && (
              <div className="space-y-4">
                <div
                  ref={reportRef}
                  className="bg-[#F1EFEC] rounded-xl p-4 text-sm text-[#030303] font-extralight"
                  dangerouslySetInnerHTML={{ __html: reportContent }}
                />
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-[#34C759] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-2 hover:bg-[#2EB648] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isGenerating}
                  aria-label="Download report as PDF"
                >
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}