"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  FileText,
  Flame,
  GraduationCap,
  Languages,
  LayoutDashboard,
  Loader2,
  LogIn,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Trophy,
  Upload,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSettingsStore } from "@/lib/store/settings";
import { getCountryFlag } from "@/lib/typing/leaderboard";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api-config";

type AdminTab =
  | "dashboard"
  | "users"
  | "tests"
  | "words"
  | "courses"
  | "languages"
  | "challenges"
  | "settings"
  | "inbox";

export default function AdminPage() {
  const { user, mongoUser, loading: authLoading, refreshMongoUser } = useAuth();
  const setPreset = useSettingsStore((s) => s.setPreset);
  const currentPreset = useSettingsStore((s) => s.presetId);

  // Admin token stored in localStorage from admin.env login
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Read admin token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("typing_master_admin_token");
      if (saved) setAdminToken(saved);
    }
  }, []);

  // Admin Login credentials form state (empty & private)
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [promoting, setPromoting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-dismiss notification after 3s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password");
      }
      localStorage.setItem("typing_master_admin_token", data.token);
      setAdminToken(data.token);
      showNotification("success", "Welcome, Administrator!");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("typing_master_admin_token");
    setAdminToken(null);
    showNotification("success", "Signed out of Admin Portal");
  };

  // Helper to fetch with admin auth token (either admin.env session or Firebase admin)
  const adminFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let tokenToUse = adminToken;
      if (!tokenToUse && user) {
        tokenToUse = await user.getIdToken();
      }
      if (!tokenToUse) throw new Error("Not authenticated");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenToUse}`,
        ...options.headers,
      };
      const res = await fetch(`${API_URL}${url}`, { ...options, headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("typing_master_admin_token");
          setAdminToken(null);
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    [adminToken, user],
  );

  // Self-promotion helper for development
  const handlePromoteMe = async () => {
    if (!user) return;
    setPromoting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/users/promote-me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Promotion failed");
      }
      await refreshMongoUser();
      showNotification("success", "You have been granted Administrator privileges! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Promotion failed");
    } finally {
      setPromoting(false);
    }
  };

  /* ========================================================================= */
  /* TAB 1: DASHBOARD STATE & FETCH */
  /* ========================================================================= */
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const d = await adminFetch("/api/admin/dashboard");
      setDashboardData(d);
    } catch (err) {
      showNotification("error", "Failed to load dashboard metrics");
    } finally {
      setDashboardLoading(false);
    }
  }, [adminFetch]);

  /* ========================================================================= */
  /* TAB 2: USERS STATE & FETCH */
  /* ========================================================================= */
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [usersPage, setUsersPage] = useState<number>(1);
  const [usersSearch, setUsersSearch] = useState<string>("");
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>("all");
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(usersPage),
        limit: "15",
        search: usersSearch,
        role: usersRoleFilter,
      });
      const d = await adminFetch(`/api/admin/users?${params.toString()}`);
      setUsersList(d.users || []);
      setUsersTotal(d.pagination?.total || 0);
    } catch (err) {
      showNotification("error", "Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  }, [adminFetch, usersPage, usersSearch, usersRoleFilter]);

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      await adminFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      showNotification("success", `User role updated to ${nextRole}`);
      fetchUsers();
    } catch (err) {
      showNotification("error", "Failed to change user role");
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    const nextBanned = !currentBanned;
    try {
      await adminFetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ isBanned: nextBanned }),
      });
      showNotification("success", `User ${nextBanned ? "banned" : "unbanned"} successfully`);
      fetchUsers();
    } catch (err) {
      showNotification("error", "Failed to update ban status");
    }
  };

  /* ========================================================================= */
  /* TAB 3: TESTS STATE & FETCH */
  /* ========================================================================= */
  const [testsList, setTestsList] = useState<any[]>([]);
  const [testsTotal, setTestsTotal] = useState<number>(0);
  const [testsPage, setTestsPage] = useState<number>(1);
  const [testsSearch, setTestsSearch] = useState<string>("");
  const [testsModeFilter, setTestsModeFilter] = useState<string>("all");
  const [testsLoading, setTestsLoading] = useState<boolean>(false);

  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(testsPage),
        limit: "15",
        search: testsSearch,
        mode: testsModeFilter,
      });
      const d = await adminFetch(`/api/admin/tests?${params.toString()}`);
      setTestsList(d.results || []);
      setTestsTotal(d.pagination?.total || 0);
    } catch (err) {
      showNotification("error", "Failed to fetch test results");
    } finally {
      setTestsLoading(false);
    }
  }, [adminFetch, testsPage, testsSearch, testsModeFilter]);

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test result?")) return;
    try {
      await adminFetch(`/api/admin/tests/${testId}`, { method: "DELETE" });
      showNotification("success", "Test result deleted");
      fetchTests();
    } catch (err) {
      showNotification("error", "Failed to delete test");
    }
  };

  /* ========================================================================= */
  /* TAB 4: WORDS & QUOTES STATE & MODALS */
  /* ========================================================================= */
  const [wordsSubTab, setWordsSubTab] = useState<"words" | "quotes">("words");
  const [wordsList, setWordsList] = useState<any[]>([]);
  const [wordsTotal, setWordsTotal] = useState<number>(0);
  const [wordsPage, setWordsPage] = useState<number>(1);
  const [wordsLangFilter, setWordsLangFilter] = useState<string>("all");
  const [wordsSearch, setWordsSearch] = useState<string>("");
  const [wordsLoading, setWordsLoading] = useState<boolean>(false);

  // Quotes state
  const [quotesList, setQuotesList] = useState<any[]>([]);
  const [quotesTotal, setQuotesTotal] = useState<number>(0);
  const [quotesPage, setQuotesPage] = useState<number>(1);
  const [quotesSearch, setQuotesSearch] = useState<string>("");

  // Modals for words/quotes
  const [showAddWordModal, setShowAddWordModal] = useState<boolean>(false);
  const [showBulkWordModal, setShowBulkWordModal] = useState<boolean>(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState<boolean>(false);

  const [newWordText, setNewWordText] = useState<string>("");
  const [newWordLang, setNewWordLang] = useState<string>("english");
  const [newWordDifficulty, setNewWordDifficulty] = useState<string>("medium");
  const [bulkWordsInput, setBulkWordsInput] = useState<string>("");

  const [newQuoteText, setNewQuoteText] = useState<string>("");
  const [newQuoteSource, setNewQuoteSource] = useState<string>("");
  const [newQuoteLang, setNewQuoteLang] = useState<string>("english");
  const [newQuoteLength, setNewQuoteLength] = useState<string>("medium");

  const fetchWords = useCallback(async () => {
    setWordsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(wordsPage),
        limit: "30",
        language: wordsLangFilter,
        search: wordsSearch,
      });
      const d = await adminFetch(`/api/admin/words?${params.toString()}`);
      setWordsList(d.words || []);
      setWordsTotal(d.pagination?.total || 0);
    } catch (err) {
      showNotification("error", "Failed to fetch words");
    } finally {
      setWordsLoading(false);
    }
  }, [adminFetch, wordsPage, wordsLangFilter, wordsSearch]);

  const fetchQuotes = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(quotesPage),
        limit: "15",
        search: quotesSearch,
      });
      const d = await adminFetch(`/api/admin/quotes?${params.toString()}`);
      setQuotesList(d.quotes || []);
      setQuotesTotal(d.pagination?.total || 0);
    } catch (err) {
      showNotification("error", "Failed to fetch quotes");
    }
  }, [adminFetch, quotesPage, quotesSearch]);

  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordText.trim()) return;
    try {
      await adminFetch("/api/admin/words", {
        method: "POST",
        body: JSON.stringify({
          language: newWordLang,
          text: newWordText.trim(),
          difficulty: newWordDifficulty,
        }),
      });
      showNotification("success", "Word added successfully");
      setShowAddWordModal(false);
      setNewWordText("");
      fetchWords();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to add word");
    }
  };

  const handleBulkImportWords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkWordsInput.trim()) return;
    try {
      const res = await adminFetch("/api/admin/words/bulk", {
        method: "POST",
        body: JSON.stringify({
          language: newWordLang,
          words: bulkWordsInput,
          difficulty: newWordDifficulty,
        }),
      });
      showNotification("success", res.message || "Words imported successfully");
      setShowBulkWordModal(false);
      setBulkWordsInput("");
      fetchWords();
    } catch (err) {
      showNotification("error", "Bulk import failed");
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("Delete this word?")) return;
    try {
      await adminFetch(`/api/admin/words/${id}`, { method: "DELETE" });
      showNotification("success", "Word deleted");
      fetchWords();
    } catch (err) {
      showNotification("error", "Failed to delete word");
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;
    try {
      await adminFetch("/api/admin/quotes", {
        method: "POST",
        body: JSON.stringify({
          language: newQuoteLang,
          text: newQuoteText.trim(),
          source: newQuoteSource.trim(),
          length: newQuoteLength,
        }),
      });
      showNotification("success", "Quote added successfully");
      setShowAddQuoteModal(false);
      setNewQuoteText("");
      setNewQuoteSource("");
      fetchQuotes();
    } catch (err) {
      showNotification("error", "Failed to add quote");
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    try {
      await adminFetch(`/api/admin/quotes/${id}`, { method: "DELETE" });
      showNotification("success", "Quote deleted");
      fetchQuotes();
    } catch (err) {
      showNotification("error", "Failed to delete quote");
    }
  };

  /* ========================================================================= */
  /* TAB 5: COURSES & LESSONS STATE */
  /* ========================================================================= */
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);

  // New course form
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    language: "english",
    difficulty: "beginner",
    order: 0,
    published: true,
  });

  // New lesson form
  const [lessonForm, setLessonForm] = useState({
    title: "",
    instructions: "",
    content: "",
    targetWpm: 15,
    targetAccuracy: 90,
    order: 0,
    type: "lesson",
  });

  const fetchCourses = useCallback(async () => {
    try {
      const d = await adminFetch("/api/admin/courses");
      setCoursesList(d.courses || []);
    } catch (err) {
      showNotification("error", "Failed to load courses");
    }
  }, [adminFetch]);

  const fetchCourseLessons = useCallback(
    async (courseId: string) => {
      try {
        const d = await adminFetch(`/api/admin/courses/${courseId}/lessons`);
        setCourseLessons(d.lessons || []);
      } catch (err) {
        showNotification("error", "Failed to load lessons");
      }
    },
    [adminFetch],
  );

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify(courseForm),
      });
      showNotification("success", "Course created successfully");
      setShowCourseModal(false);
      setCourseForm({ title: "", slug: "", description: "", language: "english", difficulty: "beginner", order: 0, published: true });
      fetchCourses();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to create course");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure? This will delete the course and all its lessons.")) return;
    try {
      await adminFetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
      showNotification("success", "Course deleted");
      if (selectedCourse?._id === courseId) {
        setSelectedCourse(null);
        setCourseLessons([]);
      }
      fetchCourses();
    } catch (err) {
      showNotification("error", "Failed to delete course");
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await adminFetch(`/api/admin/courses/${selectedCourse._id}/lessons`, {
        method: "POST",
        body: JSON.stringify(lessonForm),
      });
      showNotification("success", "Lesson created successfully");
      setShowLessonModal(false);
      setLessonForm({ title: "", instructions: "", content: "", targetWpm: 15, targetAccuracy: 90, order: 0, type: "lesson" });
      fetchCourseLessons(selectedCourse._id);
    } catch (err) {
      showNotification("error", "Failed to create lesson");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await adminFetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
      showNotification("success", "Lesson deleted");
      if (selectedCourse) fetchCourseLessons(selectedCourse._id);
    } catch (err) {
      showNotification("error", "Failed to delete lesson");
    }
  };

  /* ========================================================================= */
  /* TAB 6: LANGUAGES & LAYOUTS STATE */
  /* ========================================================================= */
  const [languagesData, setLanguagesData] = useState<{ languages: any[]; layouts: any[] }>({
    languages: [],
    layouts: [],
  });

  const fetchLanguages = useCallback(async () => {
    try {
      const d = await adminFetch("/api/admin/languages");
      setLanguagesData({ languages: d.languages || [], layouts: d.layouts || [] });
    } catch (err) {
      showNotification("error", "Failed to load languages");
    }
  }, [adminFetch]);

  const handleToggleLanguage = (code: string) => {
    setLanguagesData((prev) => ({
      ...prev,
      languages: prev.languages.map((l) => (l.code === code ? { ...l, enabled: !l.enabled } : l)),
    }));
  };

  const handleToggleLayout = (code: string) => {
    setLanguagesData((prev) => ({
      ...prev,
      layouts: prev.layouts.map((l) => (l.code === code ? { ...l, enabled: !l.enabled } : l)),
    }));
  };

  const handleSaveLanguages = async () => {
    try {
      await adminFetch("/api/admin/languages", {
        method: "PUT",
        body: JSON.stringify(languagesData),
      });
      showNotification("success", "Languages and layouts updated successfully");
    } catch (err) {
      showNotification("error", "Failed to update languages");
    }
  };

  /* ========================================================================= */
  /* TAB 7: CHALLENGES STATE & MODAL */
  /* ========================================================================= */
  const [challengesList, setChallengesList] = useState<any[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    type: "daily",
    text: "",
    duration: 60,
    wordCount: 30,
    targetWpm: 0,
    targetAccuracy: 0,
    xpReward: 100,
    active: true,
  });

  const fetchChallenges = useCallback(async () => {
    try {
      const d = await adminFetch("/api/admin/challenges");
      setChallengesList(d.challenges || []);
    } catch (err) {
      showNotification("error", "Failed to load challenges");
    }
  }, [adminFetch]);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/challenges", {
        method: "POST",
        body: JSON.stringify(challengeForm),
      });
      showNotification("success", "Challenge created successfully");
      setShowChallengeModal(false);
      setChallengeForm({
        title: "",
        description: "",
        type: "daily",
        text: "",
        duration: 60,
        wordCount: 30,
        targetWpm: 0,
        targetAccuracy: 0,
        xpReward: 100,
        active: true,
      });
      fetchChallenges();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to create challenge");
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Delete this challenge?")) return;
    try {
      await adminFetch(`/api/admin/challenges/${id}`, { method: "DELETE" });
      showNotification("success", "Challenge deleted");
      fetchChallenges();
    } catch (err) {
      showNotification("error", "Failed to delete challenge");
    }
  };

  /* ========================================================================= */
  /* TAB 8: WEBSITE SETTINGS STATE */
  /* ========================================================================= */
  const [settingsForm, setSettingsForm] = useState({
    siteName: "Typing Master",
    logoUrl: "/icon.svg",
    defaultTheme: "default",
  maintenanceMode: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      const d = await adminFetch("/api/admin/settings");
      if (d.setting) {
        setSettingsForm({
          siteName: d.setting.siteName || "Typing Master",
          logoUrl: d.setting.logoUrl || "/icon.svg",
          defaultTheme: d.setting.defaultTheme || "default",
          maintenanceMode: Boolean(d.setting.maintenanceMode),
        });
      }
    } catch (err) {
      showNotification("error", "Failed to load settings");
    }
  }, [adminFetch]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settingsForm),
      });
      setPreset(settingsForm.defaultTheme);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tm:maintenance_updated", {
            detail: { maintenanceMode: settingsForm.maintenanceMode },
          })
        );
      }
      showNotification("success", "Website settings and theme updated successfully");
    } catch (err) {
      showNotification("error", "Failed to update settings");
    }
  };

  const handleToggleMaintenanceDirectly = async (newVal: boolean) => {
    try {
      const updated = { ...settingsForm, maintenanceMode: newVal };
      setSettingsForm(updated);
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ maintenanceMode: newVal }),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tm:maintenance_updated", {
            detail: { maintenanceMode: newVal },
          })
        );
      }
      showNotification(
        "success",
        newVal ? "Maintenance Mode enabled — visitors are now blocked" : "Maintenance Mode disabled — site is now live"
      );
    } catch {
      showNotification("error", "Failed to update maintenance mode");
    }
  };

  /* ========================================================================= */
  /* TAB 9: CONTACT INBOX STATE */
  /* ========================================================================= */
  interface ContactMessageItem {
    _id: string;
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
    status: "unread" | "read" | "resolved" | "archived";
    adminNote?: string;
    ip?: string;
    userAgent?: string;
    createdAt: string;
  }

  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [contactTotal, setContactTotal] = useState(0);
  const [contactUnread, setContactUnread] = useState(0);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFilterStatus, setContactFilterStatus] = useState("all");
  const [contactFilterCat, setContactFilterCat] = useState("all");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);

  const fetchContactMessages = useCallback(async () => {
    try {
      setContactLoading(true);
      const params = new URLSearchParams({
        status: contactFilterStatus,
        category: contactFilterCat,
        search: contactSearch,
      });
      const d = await adminFetch(`/api/contact?${params.toString()}`);
      setContactMessages(d.messages || []);
      setContactTotal(d.pagination?.total || 0);
      setContactUnread(d.unreadCount || 0);
    } catch {
      showNotification("error", "Failed to load contact messages");
    } finally {
      setContactLoading(false);
    }
  }, [adminFetch, contactFilterStatus, contactFilterCat, contactSearch]);

  const handleUpdateMessageStatus = async (id: string, status: string, adminNote?: string) => {
    try {
      await adminFetch(`/api/contact/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, adminNote }),
      });
      showNotification("success", `Message status updated to ${status}`);
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({
          ...selectedMessage,
          status: status as any,
          adminNote: adminNote !== undefined ? adminNote : selectedMessage.adminNote,
        });
      }
      fetchContactMessages();
    } catch {
      showNotification("error", "Failed to update message status");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this message?")) return;
    try {
      await adminFetch(`/api/contact/${id}`, { method: "DELETE" });
      showNotification("success", "Message deleted successfully");
      if (selectedMessage && selectedMessage._id === id) setSelectedMessage(null);
      fetchContactMessages();
    } catch {
      showNotification("error", "Failed to delete message");
    }
  };

  // Trigger tab data fetch on tab switch
  const isSuperAdmin = Boolean(adminToken || mongoUser?.role === "admin");

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchSettings();
    fetchContactMessages();
  }, [isSuperAdmin, fetchSettings, fetchContactMessages]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (activeTab === "dashboard") fetchDashboard();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "tests") fetchTests();
    if (activeTab === "words") {
      fetchWords();
      fetchQuotes();
    }
    if (activeTab === "courses") fetchCourses();
    if (activeTab === "languages") fetchLanguages();
    if (activeTab === "challenges") fetchChallenges();
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "inbox") fetchContactMessages();
  }, [
    activeTab,
    isSuperAdmin,
    fetchDashboard,
    fetchUsers,
    fetchTests,
    fetchWords,
    fetchQuotes,
    fetchCourses,
    fetchLanguages,
    fetchChallenges,
    fetchSettings,
    fetchContactMessages,
  ]);

  /* ========================================================================= */
  /* ACCESS CONTROL & ADMIN LOGIN */
  /* ========================================================================= */
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-main" />
        <p className="font-mono text-xs text-subtext">Verifying security credentials...</p>
      </div>
    );
  }

  // If not logged in as Admin, show the dedicated Admin Login Form
  if (!isSuperAdmin) {
    return (
      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <AmbientBackground />
        <div className="max-w-md w-full rounded-3xl border border-border bg-surface p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-main/40 bg-main/10 text-main shadow-lg shadow-main/10">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-text">Admin Portal Login</h1>
            <p className="text-xs text-subtext">
              Restricted area. Please enter your administrative credentials.
            </p>
          </div>

          {loginError && (
            <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-center text-xs font-semibold text-error">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-subtext block mb-1">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-sm text-text focus:border-main focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-subtext block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-surface-2 pl-3.5 pr-10 py-2.5 font-mono text-sm text-text focus:border-main focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext hover:text-text cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginLoading}
              variant="primary"
              className="w-full gap-2 shadow-lg shadow-main/15"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Log In to Admin Dashboard</span>
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-subtext hover:text-text transition-colors">
              ← Return to Typing Master Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* MAIN ADMIN PORTAL LAYOUT */
  /* ========================================================================= */
  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <AmbientBackground />

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4",
            notification.type === "success"
              ? "border border-success/40 bg-surface text-success shadow-success/10"
              : "border border-error/40 bg-surface text-error shadow-error/10",
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span className="text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Portal Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-main/40 bg-main/10 shadow-lg shadow-main/5 text-main">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
                  Admin Control Center
                </h1>
                <span className="rounded bg-main/20 px-2 py-0.5 font-mono text-[11px] font-black text-main uppercase">
                  SUPERUSER
                </span>
              </div>
              <p className="text-xs text-subtext">
                Manage platform users, typing tests, content databases, curriculum, challenges, and site settings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {settingsForm.maintenanceMode ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-bold text-amber-300">Maintenance Active</span>
                <button
                  type="button"
                  onClick={() => handleToggleMaintenanceDirectly(false)}
                  className="ml-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Turn Off
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Site Online</span>
              </div>
            )}
            <ThemeToggle className="rounded-xl border border-border bg-surface shadow-sm h-9 w-9" />
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 font-mono text-xs">
              <span className="text-subtext">Admin:</span>
              <span className="font-bold text-main truncate max-w-[150px]">
                {adminToken ? "admin" : mongoUser?.name || user?.email || "admin"}
              </span>
            </div>
            {adminToken && (
              <button
                onClick={handleAdminLogout}
                className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-subtext hover:border-error hover:text-error transition-colors"
              >
                Log Out
              </button>
            )}
          </div>
        </div>

        {/* Sidebar + Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-border bg-surface p-2 shadow-xl flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 scrollbar-none">
              {[
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { id: "users", label: "Users", icon: Users },
                { id: "tests", label: "Test Results", icon: FileText },
                { id: "words", label: "Words & Quotes", icon: Database },
                { id: "courses", label: "Courses & Lessons", icon: GraduationCap },
                { id: "languages", label: "Languages & Layouts", icon: Languages },
                { id: "challenges", label: "Challenges", icon: Trophy },
                { id: "inbox", label: "User Messages", icon: Mail, badge: contactUnread },
                { id: "settings", label: "Site Settings", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as AdminTab)}
                    className={cn(
                      "flex shrink-0 lg:shrink w-auto lg:w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all whitespace-nowrap text-left",
                      isActive
                        ? "bg-main text-bg shadow-md font-bold"
                        : "text-subtext hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-white font-mono">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* ================================================================= */}
            {/* VIEW 1: DASHBOARD */}
            {/* ================================================================= */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-border bg-surface p-5 shadow-lg">
                    <div className="flex items-center justify-between text-subtext">
                      <span className="text-xs font-bold uppercase">Total Users</span>
                      <Users className="h-4 w-4 text-main" />
                    </div>
                    <div className="mt-3 font-mono text-2xl font-black text-text sm:text-3xl">
                      {dashboardData?.metrics?.totalUsers ?? "--"}
                    </div>
                    <p className="mt-1 text-[11px] text-subtext">Registered typists</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-5 shadow-lg">
                    <div className="flex items-center justify-between text-subtext">
                      <span className="text-xs font-bold uppercase">Tests Today</span>
                      <Flame className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="mt-3 font-mono text-2xl font-black text-text sm:text-3xl">
                      {dashboardData?.metrics?.testsToday ?? "--"}
                    </div>
                    <p className="mt-1 text-[11px] text-subtext">Since 00:00 UTC</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-5 shadow-lg">
                    <div className="flex items-center justify-between text-subtext">
                      <span className="text-xs font-bold uppercase">Total Tests</span>
                      <FileText className="h-4 w-4 text-main" />
                    </div>
                    <div className="mt-3 font-mono text-2xl font-black text-text sm:text-3xl">
                      {dashboardData?.metrics?.totalTests ?? "--"}
                    </div>
                    <p className="mt-1 text-[11px] text-subtext">All-time completions</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-5 shadow-lg">
                    <div className="flex items-center justify-between text-subtext">
                      <span className="text-xs font-bold uppercase">Average Speed</span>
                      <Zap className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="mt-3 font-mono text-2xl font-black text-main sm:text-3xl">
                      {dashboardData?.metrics?.avgWpm ? `${dashboardData.metrics.avgWpm} WPM` : "--"}
                    </div>
                    <p className="mt-1 text-[11px] text-subtext">
                      {dashboardData?.metrics?.avgAccuracy}% accuracy
                    </p>
                  </div>
                </div>

                {/* 7-Day Activity Chart Card */}
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-text">Typing Activity (Past 7 Days)</h3>
                      <p className="text-xs text-subtext">Daily test completions and average speed</p>
                    </div>
                    <button
                      onClick={fetchDashboard}
                      className="cursor-pointer rounded-lg border border-border p-1.5 text-subtext hover:bg-surface-2 hover:text-text transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {dashboardLoading ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-main" />
                    </div>
                  ) : dashboardData?.chartData?.length ? (
                    <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48">
                      {dashboardData.chartData.map((d: any) => {
                        const maxCount = Math.max(...dashboardData.chartData.map((x: any) => x.count), 1);
                        const heightPct = Math.max(15, Math.round((d.count / maxCount) * 100));

                        return (
                          <div key={d.date} className="flex flex-col items-center gap-2 h-full justify-end">
                            <span className="font-mono text-[10px] text-main font-bold">{d.count}</span>
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-main/30 to-main transition-all duration-300"
                            />
                            <span className="font-mono text-[10px] text-subtext truncate max-w-full">
                              {d.date.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-36 items-center justify-center text-xs text-subtext">
                      No activity recorded for this period yet.
                    </div>
                  )}
                </div>

                {/* Recent Users List */}
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
                  <h3 className="font-bold text-text">Recent Typists</h3>
                  <div className="divide-y divide-border/60">
                    {dashboardData?.recentUsers?.map((u: any) => (
                      <div key={u._id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 font-mono text-xs font-bold text-text">
                            {u.name ? u.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-text">{u.name}</span>
                              <span className="rounded bg-surface-2 px-1.5 py-0.2 font-mono text-[10px] text-subtext uppercase">
                                {u.role}
                              </span>
                            </div>
                            <span className="text-xs text-subtext">{u.email}</span>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          <span className="text-main font-bold">Lv. {u.level || 1}</span>
                          <div className="text-[10px] text-subtext">{getCountryFlag(u.country)} {u.country || "N/A"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 2: USER MANAGEMENT */}
            {/* ================================================================= */}
            {activeTab === "users" && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text">User Management</h2>
                    <p className="text-xs text-subtext">Manage typist accounts, permissions, and ban status.</p>
                  </div>

                  {/* Search & Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtext" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={usersSearch}
                        onChange={(e) => {
                          setUsersSearch(e.target.value);
                          setUsersPage(1);
                        }}
                        className="rounded-lg border border-border bg-surface-2 pl-8 pr-3 py-1.5 text-xs text-text focus:border-main focus:outline-none"
                      />
                    </div>

                    <select
                      value={usersRoleFilter}
                      onChange={(e) => {
                        setUsersRoleFilter(e.target.value);
                        setUsersPage(1);
                      }}
                      className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-main focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">Users</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wider text-subtext">
                        <th className="py-3 pl-4 pr-3">Typist</th>
                        <th className="px-3 py-3">Country</th>
                        <th className="px-3 py-3">Level / XP</th>
                        <th className="px-3 py-3">Role</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {usersList.map((u) => (
                        <tr key={u._id} className="hover:bg-surface-2/30 transition-colors">
                          <td className="py-3 pl-4 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs font-bold text-main">
                                {u.name ? u.name[0].toUpperCase() : "U"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-text truncate max-w-[150px]">
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-subtext truncate max-w-[150px]">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 font-mono">
                            {getCountryFlag(u.country)} {u.country || "--"}
                          </td>

                          <td className="px-3 py-3 font-mono">
                            <span className="font-bold text-main">Lv. {u.level || 1}</span>
                            <span className="text-[10px] text-subtext block">{u.xp || 0} XP</span>
                          </td>

                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleToggleUserRole(u._id, u.role)}
                              title="Click to toggle role"
                              className={cn(
                                "cursor-pointer rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase transition-colors",
                                u.role === "admin"
                                  ? "bg-main text-bg"
                                  : "bg-surface-2 text-subtext hover:text-text",
                              )}
                            >
                              {u.role}
                            </button>
                          </td>

                          <td className="px-3 py-3">
                            {u.isBanned ? (
                              <span className="rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-bold text-error">
                                Banned
                              </span>
                            ) : (
                              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-3 pl-3 pr-4 text-right">
                            <button
                              onClick={() => handleToggleBan(u._id, u.isBanned)}
                              className={cn(
                                "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                                u.isBanned
                                  ? "border-success/40 bg-success/10 text-success hover:bg-success hover:text-bg"
                                  : "border-error/40 bg-error/10 text-error hover:bg-error hover:text-white",
                              )}
                            >
                              {u.isBanned ? "Unban" : "Ban"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Users Pagination */}
                <div className="flex items-center justify-between text-xs text-subtext">
                  <span>Total Users: {usersTotal}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={usersPage <= 1}
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      className="cursor-pointer rounded border border-border p-1 hover:bg-surface-2 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span>Page {usersPage}</span>
                    <button
                      disabled={usersList.length < 15}
                      onClick={() => setUsersPage((p) => p + 1)}
                      className="cursor-pointer rounded border border-border p-1 hover:bg-surface-2 disabled:opacity-40"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 3: TEST MANAGEMENT */}
            {/* ================================================================= */}
            {activeTab === "tests" && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text">Test Results Management</h2>
                    <p className="text-xs text-subtext">Inspect completed tests and purge invalid scores.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search typist..."
                      value={testsSearch}
                      onChange={(e) => {
                        setTestsSearch(e.target.value);
                        setTestsPage(1);
                      }}
                      className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text focus:border-main focus:outline-none"
                    />
                    <select
                      value={testsModeFilter}
                      onChange={(e) => {
                        setTestsModeFilter(e.target.value);
                        setTestsPage(1);
                      }}
                      className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-main focus:outline-none"
                    >
                      <option value="all">All Modes</option>
                      <option value="time">Time</option>
                      <option value="words">Words</option>
                      <option value="quote">Quote</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wider text-subtext">
                        <th className="py-3 pl-4 pr-3">Typist</th>
                        <th className="px-3 py-3">Mode</th>
                        <th className="px-3 py-3 text-right">WPM</th>
                        <th className="px-3 py-3 text-right">Accuracy</th>
                        <th className="px-3 py-3">Language</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="py-3 pl-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {testsList.map((t) => (
                        <tr key={t._id} className="hover:bg-surface-2/30 transition-colors">
                          <td className="py-3 pl-4 pr-3">
                            <span className="font-semibold text-text">{t.user?.name || "Anonymous"}</span>
                          </td>
                          <td className="px-3 py-3 font-mono capitalize">
                            {t.mode} {t.duration ? `${t.duration}s` : `${t.wordCount || 0}w`}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-main">
                            {t.wpm}
                          </td>
                          <td className="px-3 py-3 text-right font-mono">
                            {t.accuracy}%
                          </td>
                          <td className="px-3 py-3 capitalize text-subtext">
                            {t.language}
                          </td>
                          <td className="px-3 py-3 text-subtext">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 pl-3 pr-4 text-right">
                            <button
                              onClick={() => handleDeleteTest(t._id)}
                              className="cursor-pointer text-error/80 hover:text-error transition-colors p-1"
                              title="Delete result"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs text-subtext">
                  <span>Total Records: {testsTotal}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={testsPage <= 1}
                      onClick={() => setTestsPage((p) => Math.max(1, p - 1))}
                      className="cursor-pointer rounded border border-border p-1 hover:bg-surface-2 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span>Page {testsPage}</span>
                    <button
                      disabled={testsList.length < 15}
                      onClick={() => setTestsPage((p) => p + 1)}
                      className="cursor-pointer rounded border border-border p-1 hover:bg-surface-2 disabled:opacity-40"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 4: WORDS & QUOTES DATABASE */}
            {/* ================================================================= */}
            {activeTab === "words" && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWordsSubTab("words")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                        wordsSubTab === "words" ? "bg-main text-bg" : "bg-surface-2 text-subtext",
                      )}
                    >
                      Words Database ({wordsTotal})
                    </button>
                    <button
                      onClick={() => setWordsSubTab("quotes")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                        wordsSubTab === "quotes" ? "bg-main text-bg" : "bg-surface-2 text-subtext",
                      )}
                    >
                      Quotes Database ({quotesTotal})
                    </button>
                  </div>

                  {wordsSubTab === "words" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowBulkWordModal(true)}
                        className="gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Bulk Import</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setShowAddWordModal(true)}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Word</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowAddQuoteModal(true)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Quote</span>
                    </Button>
                  )}
                </div>

                {/* SubTab Content: Words */}
                {wordsSubTab === "words" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Search word..."
                        value={wordsSearch}
                        onChange={(e) => {
                          setWordsSearch(e.target.value);
                          setWordsPage(1);
                        }}
                        className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text focus:border-main focus:outline-none"
                      />
                      <select
                        value={wordsLangFilter}
                        onChange={(e) => {
                          setWordsLangFilter(e.target.value);
                          setWordsPage(1);
                        }}
                        className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-main focus:outline-none"
                      >
                        <option value="all">All Languages</option>
                        <option value="english">English</option>
                        <option value="bangla">Bangla</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {wordsList.map((w) => (
                        <div
                          key={w._id}
                          className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-text">{w.text}</span>
                            <span className="block text-[10px] text-subtext capitalize">{w.language}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteWord(w._id)}
                            className="text-subtext hover:text-error transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-subtext pt-2">
                      <span>Total Words: {wordsTotal}</span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={wordsPage <= 1}
                          onClick={() => setWordsPage((p) => Math.max(1, p - 1))}
                          className="cursor-pointer rounded border border-border p-1 hover:bg-surface-2 disabled:opacity-40"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span>Page {wordsPage}</span>
                        <button
                          disabled={wordsList.length < 30}
                          onClick={() => setWordsPage((p) => p + 1)}
                          className="cursor-pointer rounded border border-border p-1 hover:bg-surface-2 disabled:opacity-40"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab Content: Quotes */}
                {wordsSubTab === "quotes" && (
                  <div className="space-y-4">
                    <div className="divide-y divide-border/60">
                      {quotesList.map((q) => (
                        <div key={q._id} className="py-3 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-mono text-sm text-text">&ldquo;{q.text}&rdquo;</p>
                            <div className="flex items-center gap-2 text-xs text-subtext">
                              <span>— {q.source || "Unknown"}</span>
                              <span>•</span>
                              <span className="capitalize">{q.language}</span>
                              <span>•</span>
                              <span className="capitalize">{q.length}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteQuote(q._id)}
                            className="text-subtext hover:text-error transition-colors cursor-pointer p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 5: COURSE & LESSON MANAGEMENT */}
            {/* ================================================================= */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Courses Curriculum</h2>
                      <p className="text-xs text-subtext">Manage structured touch typing courses and lessons.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowCourseModal(true)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Course</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {coursesList.map((c) => {
                      const isSelected = selectedCourse?._id === c._id;
                      return (
                        <div
                          key={c._id}
                          onClick={() => {
                            setSelectedCourse(c);
                            fetchCourseLessons(c._id);
                          }}
                          className={cn(
                            "cursor-pointer rounded-xl border p-4 transition-all",
                            isSelected
                              ? "border-main bg-main/10 shadow-md shadow-main/5"
                              : "border-border bg-surface-2/40 hover:border-main/40",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase text-main">
                              {c.difficulty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(c._id);
                              }}
                              className="text-subtext hover:text-error transition-colors p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <h3 className="mt-2 font-bold text-text">{c.title}</h3>
                          <p className="mt-1 text-xs text-subtext line-clamp-2">{c.description}</p>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-subtext">
                            <span className="capitalize">{c.language}</span>
                            <span className="font-mono">{c.lessonCount || 0} Lessons</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lessons for Selected Course */}
                {selectedCourse && (
                  <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="font-bold text-text">
                          Lessons for: <span className="text-main">{selectedCourse.title}</span>
                        </h3>
                        <p className="text-xs text-subtext">Add or reorder lessons in this course.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setShowLessonModal(true)}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Lesson</span>
                      </Button>
                    </div>

                    <div className="divide-y divide-border/60">
                      {courseLessons.map((l) => (
                        <div key={l._id} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-main font-bold">#{l.order}</span>
                              <span className="font-semibold text-text text-sm">{l.title}</span>
                              <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[10px] text-subtext uppercase">
                                {l.type}
                              </span>
                            </div>
                            <p className="font-mono text-xs text-subtext truncate max-w-lg">
                              Content: {l.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-subtext">
                              {l.targetWpm} WPM / {l.targetAccuracy}%
                            </span>
                            <button
                              onClick={() => handleDeleteLesson(l._id)}
                              className="text-subtext hover:text-error transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 6: LANGUAGE & LAYOUT MANAGEMENT */}
            {/* ================================================================= */}
            {activeTab === "languages" && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-text">Language & Layout Settings</h2>
                  <p className="text-xs text-subtext">Enable or disable specific languages and keyboard layouts globally.</p>
                </div>

                {/* Languages Toggle List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-subtext">Supported Languages</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {languagesData.languages.map((l) => (
                      <div
                        key={l.code}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-4"
                      >
                        <div>
                          <div className="font-bold text-text">{l.name}</div>
                          <div className="font-mono text-xs text-subtext">Code: {l.code}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={l.enabled}
                          onChange={() => handleToggleLanguage(l.code)}
                          className="h-4 w-4 accent-main cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layouts Toggle List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-subtext">Supported Keyboard Layouts</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {languagesData.layouts.map((l) => (
                      <div
                        key={l.code}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-4"
                      >
                        <div>
                          <div className="font-bold text-text">{l.name}</div>
                          <div className="font-mono text-xs text-subtext">Lang: {l.language}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={l.enabled}
                          onChange={() => handleToggleLayout(l.code)}
                          className="h-4 w-4 accent-main cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button onClick={handleSaveLanguages} variant="primary">
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 7: CHALLENGE MANAGEMENT */}
            {/* ================================================================= */}
            {activeTab === "challenges" && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text">Challenge Arena Management</h2>
                    <p className="text-xs text-subtext">Create, schedule, and configure daily and weekly challenges.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setShowChallengeModal(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Challenge</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {challengesList.map((ch) => (
                    <div
                      key={ch._id}
                      className="rounded-2xl border border-border bg-surface-2/40 p-5 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-main/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-main">
                          {ch.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              ch.active ? "bg-success" : "bg-zinc-600",
                            )}
                          />
                          <button
                            onClick={() => handleDeleteChallenge(ch._id)}
                            className="text-subtext hover:text-error transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-text">{ch.title}</h3>
                      <p className="text-xs text-subtext line-clamp-2">{ch.description}</p>
                      <p className="font-mono text-xs text-subtext bg-surface p-2 rounded-lg line-clamp-2">
                        &ldquo;{ch.text}&rdquo;
                      </p>

                      <div className="flex items-center justify-between text-xs text-subtext font-mono pt-2 border-t border-border/60">
                        <span>Reward: +{ch.xpReward} XP</span>
                        <span>{ch.attemptCount || 0} Attempts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 8: WEBSITE SETTINGS */}
            {/* ================================================================= */}
            {activeTab === "settings" && (
              <form onSubmit={handleSaveSettings} className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-text">Global Website Settings</h2>
                  <p className="text-xs text-subtext">Configure brand attributes, default theme, and maintenance mode.</p>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs font-semibold text-subtext block mb-1">Site Title</label>
                    <input
                      type="text"
                      value={settingsForm.siteName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-text focus:border-main focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-subtext block mb-1">Logo URL / Icon Path</label>
                    <input
                      type="text"
                      value={settingsForm.logoUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-text focus:border-main focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-subtext">Platform Theme Preset</label>
                      <span className="font-mono text-[10px] text-main font-bold">Live Preview Active</span>
                    </div>
                    <select
                      value={settingsForm.defaultTheme}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettingsForm({ ...settingsForm, defaultTheme: val });
                        setPreset(val);
                      }}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-text focus:border-main focus:outline-none"
                    >
                      <option value="default">Monkeytype Classic (Dark Yellow)</option>
                      <option value="serika">Serika Dark</option>
                      <option value="matrix">Matrix Green</option>
                      <option value="dracula">Dracula</option>
                      <option value="nord">Nord</option>
                      <option value="gruvbox">Gruvbox</option>
                      <option value="carbon">Carbon</option>
                      <option value="cyberpunk">Cyberpunk</option>
                      <option value="ocean">Ocean</option>
                      <option value="solarized">Solarized</option>
                      <option value="metro">Metro</option>
                    </select>
                    <p className="mt-1 text-[11px] text-subtext">
                      Selecting a preset instantly applies it live across the admin panel and the entire site.
                    </p>
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border p-4 transition-colors space-y-3",
                      settingsForm.maintenanceMode
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-border bg-surface-2"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-text">
                          <Wrench className="h-4 w-4 text-main" />
                          <span>Platform Maintenance Mode</span>
                          {settingsForm.maintenanceMode && (
                            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-subtext mt-1">
                          When active, public visitors see a friendly maintenance screen. Normal typing tests, drills, and competitions are paused.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.maintenanceMode}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSettingsForm({ ...settingsForm, maintenanceMode: val });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 border border-border"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                      <span className="text-subtext">
                        {settingsForm.maintenanceMode
                          ? "⚠️ Site is blocked for public users. Admins retain full access."
                          : "✅ Site is open to everyone."}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleMaintenanceDirectly(!settingsForm.maintenanceMode)}
                        className="px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono font-semibold hover:border-main transition-colors cursor-pointer text-text"
                      >
                        {settingsForm.maintenanceMode ? "Deactivate Now" : "Activate Maintenance"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button type="submit" variant="primary">
                    Save Website Settings
                  </Button>
                </div>
              </form>
            )}

            {/* ================================================================= */}
            {/* VIEW 9: CONTACT INBOX */}
            {/* ================================================================= */}
            {activeTab === "inbox" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-text flex items-center gap-2">
                      <Mail className="h-5 w-5 text-main" />
                      <span>User Messages & Contact Inbox</span>
                    </h2>
                    <p className="text-xs text-subtext">
                      Inquiries, bug reports, and suggestions submitted through the /contact page ({contactTotal} total, {contactUnread} unread)
                    </p>
                  </div>
                  <Button
                    onClick={fetchContactMessages}
                    variant="ghost"
                    className="gap-2 text-subtext hover:text-text cursor-pointer"
                  >
                    <RefreshCw className={cn("h-4 w-4", contactLoading && "animate-spin")} />
                    <span>Refresh Inbox</span>
                  </Button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtext" />
                    <input
                      type="text"
                      placeholder="Search messages by name, email, subject..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-text placeholder:text-subtext/50 focus:border-main focus:outline-none"
                    />
                  </div>

                  <select
                    value={contactFilterStatus}
                    onChange={(e) => setContactFilterStatus(e.target.value)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-main focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>

                  <select
                    value={contactFilterCat}
                    onChange={(e) => setContactFilterCat(e.target.value)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-main focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="bug">Bug Reports</option>
                    <option value="feature">Feature Requests</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Messages Table */}
                <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-surface-2 text-[11px] font-mono text-subtext uppercase">
                      <tr>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Sender</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Subject & Preview</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {contactLoading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-subtext">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1 text-main" />
                            Loading messages...
                          </td>
                        </tr>
                      ) : contactMessages.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-subtext">
                            No messages found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        contactMessages.map((msg) => (
                          <tr
                            key={msg._id}
                            className={cn(
                              "hover:bg-surface-2/60 transition-colors cursor-pointer",
                              msg.status === "unread" && "bg-main/5 font-medium"
                            )}
                            onClick={() => setSelectedMessage(msg)}
                          >
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase",
                                  msg.status === "unread" && "bg-amber-500/20 text-amber-300",
                                  msg.status === "read" && "bg-blue-500/20 text-blue-300",
                                  msg.status === "resolved" && "bg-emerald-500/20 text-emerald-300",
                                  msg.status === "archived" && "bg-surface-2 text-subtext"
                                )}
                              >
                                {msg.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-text">{msg.name}</div>
                              <div className="text-[11px] text-subtext font-mono">{msg.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-text uppercase">
                                {msg.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <div className="font-semibold text-text truncate">{msg.subject}</div>
                              <div className="text-[11px] text-subtext truncate">{msg.message}</div>
                            </td>
                            <td className="px-4 py-3 text-subtext font-mono text-[11px] whitespace-nowrap">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {msg.status === "unread" && (
                                  <button
                                    onClick={() => handleUpdateMessageStatus(msg._id, "read")}
                                    className="px-2 py-1 rounded bg-surface-2 hover:bg-main hover:text-bg text-[10px] font-mono transition-colors cursor-pointer"
                                    title="Mark as Read"
                                  >
                                    Read
                                  </button>
                                )}
                                {msg.status !== "resolved" && (
                                  <button
                                    onClick={() => handleUpdateMessageStatus(msg._id, "resolved")}
                                    className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-[10px] font-mono transition-colors cursor-pointer"
                                    title="Mark as Resolved"
                                  >
                                    Resolve
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className="p-1 rounded text-subtext hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                                  title="Delete Message"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD SINGLE WORD */}
      {/* ===================================================================== */}
      {showAddWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text">Add New Word</h3>
              <button onClick={() => setShowAddWordModal(false)} className="text-subtext hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWord} className="space-y-4">
              <div>
                <label className="text-xs text-subtext block mb-1">Word</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. keyboard"
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-main focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Language</label>
                  <select
                    value={newWordLang}
                    onChange={(e) => setNewWordLang(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="english">English</option>
                    <option value="bangla">Bangla</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Difficulty</label>
                  <select
                    value={newWordDifficulty}
                    onChange={(e) => setNewWordDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" onClick={() => setShowAddWordModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Add Word</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: BULK IMPORT WORDS */}
      {/* ===================================================================== */}
      {showBulkWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text">Bulk Import Words</h3>
              <button onClick={() => setShowBulkWordModal(false)} className="text-subtext hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBulkImportWords} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Language</label>
                  <select
                    value={newWordLang}
                    onChange={(e) => setNewWordLang(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="english">English</option>
                    <option value="bangla">Bangla</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Difficulty</label>
                  <select
                    value={newWordDifficulty}
                    onChange={(e) => setNewWordDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-subtext block mb-1">Paste Words (separated by commas or newlines)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="word1, word2, word3..."
                  value={bulkWordsInput}
                  onChange={(e) => setBulkWordsInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs text-text focus:border-main focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" onClick={() => setShowBulkWordModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Import All</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: ADD QUOTE */}
      {/* ===================================================================== */}
      {showAddQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text">Add New Quote</h3>
              <button onClick={() => setShowAddQuoteModal(false)} className="text-subtext hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div>
                <label className="text-xs text-subtext block mb-1">Quote Text</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type or paste the quote passage..."
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-text focus:border-main focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Source / Author</label>
                  <input
                    type="text"
                    placeholder="e.g. Einstein"
                    value={newQuoteSource}
                    onChange={(e) => setNewQuoteSource(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Language</label>
                  <select
                    value={newQuoteLang}
                    onChange={(e) => setNewQuoteLang(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="english">English</option>
                    <option value="bangla">Bangla</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Length</label>
                  <select
                    value={newQuoteLength}
                    onChange={(e) => setNewQuoteLength(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" onClick={() => setShowAddQuoteModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Add Quote</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: CREATE COURSE */}
      {/* ===================================================================== */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text">Create Touch Typing Course</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-subtext hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="text-xs text-subtext block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master the Home Row"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-") })}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                />
              </div>
              <div>
                <label className="text-xs text-subtext block mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={courseForm.slug}
                  onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Language</label>
                  <select
                    value={courseForm.language}
                    onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="english">English</option>
                    <option value="bangla">Bangla</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Difficulty</label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-subtext block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-2 p-3 text-xs text-text"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" onClick={() => setShowCourseModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Create Course</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: CREATE LESSON */}
      {/* ===================================================================== */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text">Add Lesson</h3>
              <button onClick={() => setShowLessonModal(false)} className="text-subtext hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="text-xs text-subtext block mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Key J and F Placement"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                />
              </div>
              <div>
                <label className="text-xs text-subtext block mb-1">Drill Content (Text to type)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jjj fff jf jf jf"
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text"
                />
              </div>
              <div>
                <label className="text-xs text-subtext block mb-1">Instructions for Typist</label>
                <textarea
                  rows={2}
                  placeholder="Place your right index finger on J and left on F..."
                  value={lessonForm.instructions}
                  onChange={(e) => setLessonForm({ ...lessonForm, instructions: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-2 p-3 text-xs text-text"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Target WPM</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={lessonForm.targetWpm}
                    onChange={(e) => setLessonForm({ ...lessonForm, targetWpm: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Target Acc (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={lessonForm.targetAccuracy}
                    onChange={(e) => setLessonForm({ ...lessonForm, targetAccuracy: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Order #</label>
                  <input
                    type="number"
                    min={0}
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm({ ...lessonForm, order: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" onClick={() => setShowLessonModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Lesson</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: CREATE CHALLENGE */}
      {/* ===================================================================== */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text">Create Challenge</h3>
              <button onClick={() => setShowChallengeModal(false)} className="text-subtext hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="text-xs text-subtext block mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Speed Trial #14"
                  value={challengeForm.title}
                  onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Type</label>
                  <select
                    value={challengeForm.type}
                    onChange={(e) => setChallengeForm({ ...challengeForm, type: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  >
                    <option value="daily">Daily Challenge</option>
                    <option value="weekly">Weekly Challenge</option>
                    <option value="speed">Speed Challenge</option>
                    <option value="accuracy">Accuracy Challenge</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">XP Reward</label>
                  <input
                    type="number"
                    min={10}
                    value={challengeForm.xpReward}
                    onChange={(e) => setChallengeForm({ ...challengeForm, xpReward: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-subtext block mb-1">Challenge Text Passage</label>
                <textarea
                  rows={4}
                  required
                  placeholder="The text that every player must type..."
                  value={challengeForm.text}
                  onChange={(e) => setChallengeForm({ ...challengeForm, text: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs text-text"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" onClick={() => setShowChallengeModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Publish Challenge</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: MESSAGE DETAILS */}
      {/* ===================================================================== */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-main uppercase">
                  {selectedMessage.category}
                </span>
                <h3 className="font-bold text-base text-text mt-1">{selectedMessage.subject}</h3>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="text-subtext hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-subtext font-mono border-b border-border/50 pb-2">
                <div>
                  From: <strong className="text-text">{selectedMessage.name}</strong> ({selectedMessage.email})
                </div>
                <div>{new Date(selectedMessage.createdAt).toLocaleString()}</div>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-4 text-text leading-relaxed whitespace-pre-wrap font-sans text-sm">
                {selectedMessage.message}
              </div>

              {selectedMessage.ip && (
                <div className="text-[11px] font-mono text-subtext">
                  IP: {selectedMessage.ip} | User-Agent: {selectedMessage.userAgent?.slice(0, 60)}...
                </div>
              )}

              {/* Admin Note Input */}
              <div className="pt-2">
                <label className="text-[11px] font-mono text-subtext block mb-1">Internal Admin Note</label>
                <input
                  type="text"
                  placeholder="e.g. Followed up with user on Discord/Email"
                  defaultValue={selectedMessage.adminNote || ""}
                  onBlur={(e) => handleUpdateMessageStatus(selectedMessage._id, selectedMessage.status, e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text focus:border-main focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateMessageStatus(selectedMessage._id, "unread")}
                  className={cn(
                    "px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors",
                    selectedMessage.status === "unread" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "border-border text-subtext hover:text-text"
                  )}
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateMessageStatus(selectedMessage._id, "read")}
                  className={cn(
                    "px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors",
                    selectedMessage.status === "read" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "border-border text-subtext hover:text-text"
                  )}
                >
                  Read
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateMessageStatus(selectedMessage._id, "resolved")}
                  className={cn(
                    "px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors",
                    selectedMessage.status === "resolved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "border-border text-subtext hover:text-text"
                  )}
                >
                  Resolved
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="px-3 py-1 rounded bg-main text-bg text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
