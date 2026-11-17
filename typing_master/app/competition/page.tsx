"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Flame,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";
import {
  getCompetitionSocket,
  type RacePlayer,
  type RaceResult,
  type RaceRoom,
} from "@/lib/typing/competition";
import { getCountryFlag } from "@/lib/typing/leaderboard";
import { cn } from "@/lib/utils";

type CompetitionView = "lobby" | "waiting" | "countdown" | "racing" | "finished";

export default function CompetitionPage() {
  const { user, mongoUser } = useAuth();
  const socket = useMemo(() => getCompetitionSocket(), []);

  // UI state
  const [view, setView] = useState<CompetitionView>("lobby");
  const [room, setRoom] = useState<RaceRoom | null>(null);
  const [joinCode, setJoinCode] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isQuickMatching, setIsQuickMatching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // New room options
  const [createLanguage, setCreateLanguage] = useState<"english" | "bangla">("english");
  const [createIsPrivate, setCreateIsPrivate] = useState<boolean>(false);

  // Countdown & racing state
  const [countdown, setCountdown] = useState<number>(5);
  const [typedInput, setTypedInput] = useState<string>("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [localFinished, setLocalFinished] = useState<boolean>(false);
  const [myRank, setMyRank] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const progressThrottleRef = useRef<number>(0);

  // User payload helper for socket actions
  const userPayload = useMemo(
    () => ({
      id: mongoUser?._id || user?.uid || null,
      name: mongoUser?.name || user?.displayName || (user?.email ? user.email.split("@")[0] : "Typist"),
      photo: mongoUser?.photo || user?.photoURL || "",
      country: mongoUser?.country || "BD",
      level: mongoUser?.level || 1,
    }),
    [mongoUser, user],
  );

  // Initialize socket listeners
  useEffect(() => {
    socket.connect();

    socket.on("room:player_joined", ({ room: updatedRoom }: { room: RaceRoom }) => {
      setRoom(updatedRoom);
    });

    socket.on("room:player_left", ({ room: updatedRoom }: { room: RaceRoom }) => {
      setRoom(updatedRoom);
    });

    socket.on("room:player_ready_toggled", ({ room: updatedRoom }: { room: RaceRoom }) => {
      setRoom(updatedRoom);
    });

    socket.on("race:countdown_started", ({ countdown: cd, room: updatedRoom }: { countdown: number; room: RaceRoom }) => {
      setRoom(updatedRoom);
      setCountdown(cd);
      setView("countdown");
      setTypedInput("");
      setLocalFinished(false);
      setMyRank(null);
    });

    socket.on("race:countdown_tick", ({ countdown: cd }: { countdown: number }) => {
      setCountdown(cd);
    });

    socket.on("race:started", ({ startedAt, room: updatedRoom }: { startedAt: number; text: string; room: RaceRoom }) => {
      setRoom(updatedRoom);
      setStartTime(startedAt);
      setView("racing");
      setTypedInput("");
      setLocalFinished(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    });

    socket.on("race:progress_update", ({ playerId, progress, wpm, accuracy }: { playerId: string; progress: number; wpm: number; accuracy: number }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const updatedPlayers = prev.players.map((p) => {
          if (p.id === playerId) {
            return { ...p, progress, wpm, accuracy };
          }
          return p;
        });
        return { ...prev, players: updatedPlayers };
      });
    });

    socket.on("race:player_finished", ({ room: updatedRoom }: { result: RaceResult; room: RaceRoom }) => {
      setRoom(updatedRoom);
    });

    socket.on("race:over", ({ rankings, room: updatedRoom }: { rankings: RaceResult[]; room: RaceRoom }) => {
      setRoom(updatedRoom);
      setView("finished");
    });

    socket.on("race:rematch_ready", ({ room: updatedRoom }: { room: RaceRoom }) => {
      setRoom(updatedRoom);
      setView("waiting");
      setTypedInput("");
      setLocalFinished(false);
      setMyRank(null);
    });

    return () => {
      socket.off("room:player_joined");
      socket.off("room:player_left");
      socket.off("room:player_ready_toggled");
      socket.off("race:countdown_started");
      socket.off("race:countdown_tick");
      socket.off("race:started");
      socket.off("race:progress_update");
      socket.off("race:player_finished");
      socket.off("race:over");
      socket.off("race:rematch_ready");
    };
  }, [socket]);

  // Handle Quick Match
  const handleQuickMatch = useCallback(() => {
    setIsQuickMatching(true);
    setErrorMessage(null);
    socket.emit(
      "room:quick_match",
      { user: userPayload, language: createLanguage },
      (res: { success: boolean; room?: RaceRoom; error?: string }) => {
        setIsQuickMatching(false);
        if (res.success && res.room) {
          setRoom(res.room);
          setView("waiting");
        } else {
          setErrorMessage(res.error || "Failed to join quick match");
        }
      },
    );
  }, [socket, userPayload, createLanguage]);

  // Handle Create Room
  const handleCreateRoom = useCallback(() => {
    setIsCreating(true);
    setErrorMessage(null);
    socket.emit(
      "room:create",
      { isPrivate: createIsPrivate, language: createLanguage, user: userPayload },
      (res: { success: boolean; room?: RaceRoom; error?: string }) => {
        setIsCreating(false);
        if (res.success && res.room) {
          setRoom(res.room);
          setView("waiting");
        } else {
          setErrorMessage(res.error || "Failed to create room");
        }
      },
    );
  }, [socket, createIsPrivate, createLanguage, userPayload]);

  // Handle Join by Code
  const handleJoinByCode = useCallback(() => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setErrorMessage(null);
    socket.emit(
      "room:join",
      { roomId: joinCode.trim().toUpperCase(), user: userPayload },
      (res: { success: boolean; room?: RaceRoom; error?: string }) => {
        setIsJoining(false);
        if (res.success && res.room) {
          setRoom(res.room);
          setView("waiting");
          setJoinCode("");
        } else {
          setErrorMessage(res.error || "Failed to join room");
        }
      },
    );
  }, [socket, joinCode, userPayload]);

  // Toggle Ready
  const handleToggleReady = useCallback(() => {
    if (!room) return;
    socket.emit("room:toggle_ready", { roomId: room.id });
  }, [socket, room]);

  // Host Start Race
  const handleStartRace = useCallback(() => {
    if (!room) return;
    socket.emit("room:start_race", { roomId: room.id });
  }, [socket, room]);

  // Rematch
  const handleRematch = useCallback(() => {
    if (!room) return;
    socket.emit("race:rematch", { roomId: room.id });
  }, [socket, room]);

  // Leave Room
  const handleLeaveRoom = useCallback(() => {
    socket.emit("room:leave");
    setRoom(null);
    setView("lobby");
    setTypedInput("");
    setLocalFinished(false);
  }, [socket]);

  // Copy Room Code
  const handleCopyCode = useCallback(() => {
    if (!room) return;
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [room]);

  // Handle Typing Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (view !== "racing" || localFinished || !room) return;
    const val = e.target.value;
    const targetText = room.text;

    // Disallow typing beyond length
    if (val.length > targetText.length) return;

    setTypedInput(val);

    // Compute progress & stats
    const progress = Math.min(100, (val.length / targetText.length) * 100);
    const elapsedMinutes = startTime ? Math.max(0.01, (Date.now() - startTime) / 60000) : 0.01;
    const elapsedSeconds = startTime ? Math.max(1, (Date.now() - startTime) / 1000) : 1;

    // Accuracy
    let correctChars = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === targetText[i]) correctChars++;
    }
    const accuracy = val.length > 0 ? (correctChars / val.length) * 100 : 100;
    const wpm = Math.round((correctChars / 5) / elapsedMinutes);

    // Broadcast progress throttled (every ~80ms)
    const now = Date.now();
    if (now - progressThrottleRef.current > 80 || val.length === targetText.length) {
      progressThrottleRef.current = now;
      socket.emit("race:progress", {
        roomId: room.id,
        progress,
        wpm,
        accuracy,
        charsTyped: val.length,
      });
    }

    // Check if finished
    if (val === targetText) {
      setLocalFinished(true);
      socket.emit(
        "race:finish",
        {
          roomId: room.id,
          wpm,
          accuracy,
          timeSeconds: Math.round(elapsedSeconds * 10) / 10,
        },
        (res: { success: boolean; rank?: number }) => {
          if (res?.rank) setMyRank(res.rank);
        },
      );
    }
  };

  // Find current player
  const me = room?.players.find((p) => p.id === socket.id);
  const isHost = me?.isHost || false;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <AmbientBackground />

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-main/30 bg-main/10 shadow-lg shadow-main/5">
              <Swords className="h-6 w-6 text-main" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Live Competition
              </h1>
              <p className="text-sm text-subtext">
                Real-time multiplayer typing race. Same text, same clock — fastest fingers win.
              </p>
            </div>
          </div>

          {room && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-subtext hover:border-error hover:text-error transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Leave Race</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-center text-xs font-semibold text-error">
            {errorMessage}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: LOBBY (Matchmaking & Room Creation) */}
        {/* ========================================================================= */}
        {view === "lobby" && (
          <div className="space-y-6">
            {/* Quick Match Hero Card */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-main/30 bg-gradient-to-br from-main/15 via-surface to-surface p-6 shadow-2xl shadow-main/5 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-main/40 bg-main/15 px-3 py-1 font-mono text-xs font-bold text-main">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>INSTANT MATCHMAKING</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
                    Ready to Race Against Live Typists?
                  </h2>
                  <p className="max-w-xl text-sm text-subtext">
                    Jump straight into an open public racetrack with players from around the world.
                    Top 3 finishers receive podium XP and leaderboard dominance!
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handleQuickMatch}
                    disabled={isQuickMatching}
                    size="lg"
                    className="gap-3 shadow-xl shadow-main/20"
                  >
                    {isQuickMatching ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Finding Match...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 fill-current" />
                        <span>Quick Play</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Private Room Options Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Card 1: Create a Custom / Private Room */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-main">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text">Create Room</h3>
                      <p className="text-xs text-subtext">Host a private duel or challenge friends with a code.</p>
                    </div>
                  </div>

                  {/* Language switch */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-subtext">Race Language</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCreateLanguage("english")}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors cursor-pointer",
                          createLanguage === "english"
                            ? "border-main bg-main/10 text-main font-bold"
                            : "border-border bg-surface-2 text-subtext hover:text-text",
                        )}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setCreateLanguage("bangla")}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors cursor-pointer",
                          createLanguage === "bangla"
                            ? "border-main bg-main/10 text-main font-bold"
                            : "border-border bg-surface-2 text-subtext hover:text-text",
                        )}
                      >
                        বাংলা (Bangla)
                      </button>
                    </div>
                  </div>

                  {/* Room Privacy */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-3">
                    <div>
                      <div className="text-xs font-semibold text-text">Private Room</div>
                      <div className="text-[11px] text-subtext">Only racers with the 6-character code can join</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={createIsPrivate}
                      onChange={(e) => setCreateIsPrivate(e.target.checked)}
                      className="h-4 w-4 accent-main cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    onClick={handleCreateRoom}
                    disabled={isCreating}
                    className="w-full"
                    variant="secondary"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating Room...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 text-main" />
                        <span>Create Race Room</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Card 2: Join by Room Code */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-main">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text">Join with Code</h3>
                      <p className="text-xs text-subtext">Got an invite? Enter the 6-digit room code to join.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-subtext">Enter Room Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 7K2M9P"
                      maxLength={8}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
                      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-center text-lg font-bold tracking-widest text-text uppercase placeholder:text-subtext/40 focus:border-main focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    onClick={handleJoinByCode}
                    disabled={isJoining || !joinCode.trim()}
                    className="w-full"
                    variant="primary"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Join Race</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WAITING ROOM (Roster, Ready Up, Start) */}
        {/* ========================================================================= */}
        {view === "waiting" && room && (
          <div className="space-y-6">
            {/* Room Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-main">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text">{room.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-subtext">
                    <span className="capitalize">{room.language}</span>
                    <span>•</span>
                    <span>{room.players.length} Racers Connected</span>
                    <span>•</span>
                    <span>{room.isPrivate ? "Private Room" : "Public Match"}</span>
                  </div>
                </div>
              </div>

              {/* Room Code Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-subtext">Room Code:</span>
                <button
                  onClick={handleCopyCode}
                  title="Click to copy code"
                  className="flex items-center gap-2 rounded-xl border border-main/40 bg-main/10 px-3 py-1.5 font-mono text-sm font-bold text-main transition-colors hover:bg-main/20 cursor-pointer"
                >
                  <span>{room.id}</span>
                  {copiedCode ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Racers Grid */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-subtext">Racers Grid</h3>
                <span className="font-mono text-xs text-subtext">{room.players.length} / 8 slots filled</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {room.players.map((player) => {
                  const isCurrent = player.id === socket.id;
                  return (
                    <div
                      key={player.id}
                      className={cn(
                        "relative flex items-center justify-between rounded-xl border p-4 transition-all",
                        isCurrent
                          ? "border-main/50 bg-main/5 shadow-md shadow-main/5"
                          : "border-border bg-surface-2/40",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2">
                          {player.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={player.avatar} alt={player.name} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-subtext" />
                          )}
                          {player.isHost && (
                            <Crown className="absolute -top-1 -right-1 h-3.5 w-3.5 text-main" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-text truncate max-w-[120px]">
                              {player.name}
                            </span>
                            {isCurrent && (
                              <span className="rounded bg-main/20 px-1 text-[9px] font-bold text-main">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-subtext">
                            {getCountryFlag(player.country)} Lv. {player.level || 1}
                          </span>
                        </div>
                      </div>

                      {/* Ready pill */}
                      <div>
                        {player.isReady ? (
                          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Ready
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-subtext">
                            <Clock className="h-3.5 w-3.5" />
                            Waiting
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waiting Actions Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleToggleReady}
                  variant={me?.isReady ? "secondary" : "primary"}
                  size="md"
                  className="gap-2"
                >
                  {me?.isReady ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      <span>Cancel Ready</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Ready Up</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-subtext hidden sm:block">
                  {me?.isReady ? "Waiting for the host to initiate the race countdown." : "Click Ready Up when your hands are positioned."}
                </p>
              </div>

              {isHost && (
                <Button
                  onClick={handleStartRace}
                  variant="primary"
                  size="md"
                  className="gap-2 shadow-lg shadow-main/15"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Race</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: COUNTDOWN OVERLAY */}
        {/* ========================================================================= */}
        {view === "countdown" && room && (
          <div className="flex flex-col items-center justify-center space-y-6 rounded-3xl border-2 border-main/40 bg-surface/90 py-16 text-center shadow-2xl backdrop-blur-md">
            {/* Traffic Lights */}
            <div className="flex items-center gap-3">
              {[3, 2, 1].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all duration-300",
                    countdown <= step
                      ? "bg-main shadow-lg shadow-main/50 scale-110"
                      : "bg-surface-2 border border-border",
                  )}
                />
              ))}
            </div>

            <div className="font-mono text-7xl font-black text-main animate-pulse sm:text-9xl">
              {countdown > 0 ? countdown : "GO!"}
            </div>

            <p className="text-base font-bold text-text">Get Ready to Type!</p>

            {/* Preview of prompt text */}
            <div className="max-w-xl rounded-xl border border-border bg-surface-2/60 p-4 font-mono text-sm text-subtext/70 blur-[0.5px]">
              {room.text}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: LIVE RACING ARENA */}
        {/* ========================================================================= */}
        {view === "racing" && room && (
          <div className="space-y-6">
            {/* The Live Racetrack Progress Bars */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-subtext">Live Track</span>
                <span className="font-mono text-xs text-main font-semibold">Race in Progress</span>
              </div>

              <div className="space-y-3">
                {room.players.map((player) => {
                  const isCurrent = player.id === socket.id;
                  const progressVal = isCurrent
                    ? Math.min(100, Math.round((typedInput.length / room.text.length) * 100))
                    : player.progress;

                  return (
                    <div
                      key={player.id}
                      className={cn(
                        "relative rounded-xl border p-3 transition-all",
                        isCurrent ? "border-main/40 bg-main/5" : "border-border/60 bg-surface-2/30",
                      )}
                    >
                      {/* Player info header */}
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text truncate max-w-[140px]">
                            {player.name}
                          </span>
                          {isCurrent && (
                            <span className="rounded bg-main px-1 text-[9px] font-black text-bg">
                              YOU
                            </span>
                          )}
                          <span className="text-[11px] text-subtext">
                            {getCountryFlag(player.country)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-subtext">{player.accuracy || 100}% acc</span>
                          <span className="font-bold text-main">{player.wpm} WPM</span>
                          {player.finished && (
                            <span className="rounded bg-success/20 px-1.5 py-0.2 text-[10px] font-black text-success">
                              #{player.rank} FINISHED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Race Track Bar */}
                      <div className="relative h-4 w-full overflow-hidden rounded-full bg-surface-2">
                        {/* Progress fill */}
                        <div
                          className={cn(
                            "h-full transition-all duration-150 rounded-full",
                            isCurrent
                              ? "bg-gradient-to-r from-amber-500 to-main"
                              : "bg-gradient-to-r from-zinc-500 to-zinc-400",
                          )}
                          style={{ width: `${Math.max(2, progressVal)}%` }}
                        />

                        {/* Finish line flag */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px]">
                          🏁
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Race Typing Area */}
            <div className="rounded-2xl border-2 border-main/30 bg-surface p-6 shadow-2xl space-y-5">
              {/* Text to type with character coloring */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="cursor-text select-none font-mono text-xl sm:text-2xl leading-relaxed tracking-wide min-h-[100px] p-2 rounded-xl bg-surface-2/20"
              >
                {room.text.split("").map((char, idx) => {
                  const typedChar = typedInput[idx];
                  let colorClass = "text-subtext/40"; // untyped
                  if (typedChar !== undefined) {
                    if (typedChar === char) {
                      colorClass = "text-main font-semibold";
                    } else {
                      colorClass = "text-error bg-error/20 rounded underline";
                    }
                  }

                  const isCurrentCursor = idx === typedInput.length;

                  return (
                    <span key={idx} className={cn("relative transition-colors", colorClass)}>
                      {isCurrentCursor && (
                        <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-main animate-pulse" />
                      )}
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Hidden Real Input */}
              <input
                ref={inputRef}
                type="text"
                value={typedInput}
                onChange={handleInputChange}
                disabled={localFinished}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="opacity-0 absolute -z-10"
              />

              {/* Finished Banner for this user */}
              {localFinished && (
                <div className="flex items-center justify-between rounded-xl border border-success/40 bg-success/10 p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-success" />
                    <div>
                      <h4 className="font-bold text-text">You Finished the Race!</h4>
                      <p className="text-xs text-subtext">
                        {myRank ? `Place: #${myRank}` : "Recording finish place..."} • Waiting for other racers to cross the line
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: FINISHED / PODIUM VIEW */}
        {/* ========================================================================= */}
        {view === "finished" && room && (
          <div className="space-y-8">
            {/* Fanfare Banner */}
            <div className="rounded-3xl border-2 border-main/50 bg-gradient-to-b from-main/20 via-surface to-surface p-8 text-center shadow-2xl shadow-main/10">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-main animate-bounce" />
              <h2 className="text-3xl font-black text-text sm:text-4xl">Race Finished!</h2>
              <p className="mt-1 text-sm text-subtext">
                Here are the final standings and XP rewards earned from this battle.
              </p>

              {/* Rematch Controls */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {isHost && (
                  <Button onClick={handleRematch} variant="primary" size="lg" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    <span>Play Rematch</span>
                  </Button>
                )}
                <Button onClick={handleLeaveRoom} variant="secondary" size="lg" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Return to Lobby</span>
                </Button>
              </div>
            </div>

            {/* Podium Display (Top 3) */}
            {room.rankings.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
                {/* 2nd Place */}
                {room.rankings[1] && (
                  <div className="order-2 sm:order-1 flex flex-col items-center rounded-2xl border border-zinc-400/30 bg-surface p-5 text-center shadow-lg">
                    <div className="relative mb-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-400 bg-surface-2 shadow-md">
                        {room.rankings[1].avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={room.rankings[1].avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-zinc-400" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-zinc-400 px-2 py-0.5 text-[10px] font-black text-black shadow">
                        🥈 2nd
                      </div>
                    </div>
                    <h3 className="font-bold text-text truncate max-w-full">
                      {room.rankings[1].name}
                    </h3>
                    <div className="mt-1 font-mono text-2xl font-black text-zinc-300">
                      {room.rankings[1].wpm} <span className="text-xs font-normal text-subtext">WPM</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-subtext">
                      {room.rankings[1].accuracy}% acc • +{room.rankings[1].xpReward} XP
                    </div>
                  </div>
                )}

                {/* 1st Place (Champion) */}
                {room.rankings[0] && (
                  <div className="order-1 sm:order-2 flex flex-col items-center rounded-2xl border-2 border-main/60 bg-gradient-to-b from-main/20 via-surface to-surface p-6 text-center shadow-2xl sm:-translate-y-2">
                    <div className="relative mb-3">
                      <Crown className="absolute -top-6 left-1/2 h-7 w-7 -translate-x-1/2 text-main animate-bounce" />
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-3 border-main bg-surface-2 shadow-xl ring-4 ring-main/20">
                        {room.rankings[0].avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={room.rankings[0].avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-main" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-main px-2.5 py-0.5 text-xs font-black text-bg shadow-md">
                        🥇 Champion
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-text truncate max-w-full">
                      {room.rankings[0].name}
                    </h3>
                    <div className="mt-1 font-mono text-3xl font-black text-main">
                      {room.rankings[0].wpm} <span className="text-xs font-normal text-subtext">WPM</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-subtext">
                      {room.rankings[0].accuracy}% acc • +{room.rankings[0].xpReward} XP
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {room.rankings[2] && (
                  <div className="order-3 flex flex-col items-center rounded-2xl border border-amber-700/30 bg-surface p-5 text-center shadow-lg">
                    <div className="relative mb-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-amber-600 bg-surface-2 shadow-md">
                        {room.rankings[2].avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={room.rankings[2].avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-amber-600" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-700 px-2 py-0.5 text-[10px] font-black text-white shadow">
                        🥉 3rd
                      </div>
                    </div>
                    <h3 className="font-bold text-text truncate max-w-full">
                      {room.rankings[2].name}
                    </h3>
                    <div className="mt-1 font-mono text-2xl font-black text-amber-500">
                      {room.rankings[2].wpm} <span className="text-xs font-normal text-subtext">WPM</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-subtext">
                      {room.rankings[2].accuracy}% acc • +{room.rankings[2].xpReward} XP
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Results Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-2/50 text-[11px] font-semibold uppercase tracking-wider text-subtext">
                    <th className="py-3.5 pl-6 pr-3">Rank</th>
                    <th className="px-4 py-3.5">Racer</th>
                    <th className="px-4 py-3.5 text-right">WPM</th>
                    <th className="px-4 py-3.5 text-right">Accuracy</th>
                    <th className="px-4 py-3.5 text-right">Time</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">XP Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-sm">
                  {room.rankings.map((r) => {
                    const isCurrent = r.playerId === socket.id;
                    return (
                      <tr
                        key={r.playerId}
                        className={cn(
                          "transition-colors",
                          isCurrent && "bg-main/10 font-bold",
                        )}
                      >
                        <td className="py-4 pl-6 pr-3">
                          <span className="font-bold">#{r.rank}</span>
                        </td>
                        <td className="px-4 py-4 font-sans">
                          <div className="flex items-center gap-2">
                            <span>{getCountryFlag(r.country)}</span>
                            <span>{r.name}</span>
                            {isCurrent && (
                              <span className="rounded bg-main px-1 text-[9px] font-bold text-bg">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-main">{r.wpm}</td>
                        <td className="px-4 py-4 text-right">{r.accuracy}%</td>
                        <td className="px-4 py-4 text-right text-subtext">{r.timeSeconds}s</td>
                        <td className="py-4 pl-4 pr-6 text-right text-main font-bold">
                          +{r.xpReward} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
