import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api-config";

export interface RacePlayer {
  id: string;
  userId?: string | null;
  name: string;
  avatar: string;
  country: string;
  level: number;
  isHost: boolean;
  isReady: boolean;
  progress: number;
  wpm: number;
  accuracy: number;
  charsTyped: number;
  finished: boolean;
  rank?: number | null;
  finishTime?: number;
}

export interface RaceResult {
  playerId: string;
  userId?: string | null;
  name: string;
  avatar: string;
  country: string;
  rank: number;
  wpm: number;
  accuracy: number;
  timeSeconds: number;
  xpReward: number;
}

export interface RaceRoom {
  id: string;
  name: string;
  isPrivate: boolean;
  hostId: string;
  status: "waiting" | "countdown" | "racing" | "finished";
  language: "english" | "bangla";
  wordCount: number;
  text: string;
  countdown: number;
  startedAt: number | null;
  players: RacePlayer[];
  rankings: RaceResult[];
}

let socketInstance: Socket | null = null;

export function getCompetitionSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(API_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
}
