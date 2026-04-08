export type InvestigatorRank =
  | 'Rookie'
  | 'Detective'
  | 'Senior Detective'
  | 'Lead Investigator';

export interface InvestigatorProfile {
  _id?: string; // MongoDB ObjectId placeholder
  username: string;
  email: string;
  displayName: string;
  avatarIcon: string;   // emoji key from AVATAR_ICONS
  avatarColor: string;  // hex from AVATAR_COLORS
  createdAt: string;    // ISO date string
  casesCompleted: string[];
  investigatorRank: InvestigatorRank;
  friends: string[];    // array of usernames
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

export type AuthMode = 'login' | 'register';

// ── Avatar options ─────────────────────────────────────────────────────────
export const AVATAR_ICONS: string[] = [
  '🔍', '🕵️', '📋', '🔦', '💼',
  '📁', '🔎', '⚖️', '🧩', '📌',
  '🗝️', '🖊️', '📷', '🧬', '🔬',
];

export const AVATAR_COLORS: string[] = [
  '#5c2d2d', '#2d3a5c', '#1e4d2d', '#4a3a1e',
  '#3a1e4d', '#1e3d4d', '#4d3a2d', '#2d4a3a',
];

export const DEFAULT_AVATAR_ICON = '🔍';
export const DEFAULT_AVATAR_COLOR = '#2d3a5c';
