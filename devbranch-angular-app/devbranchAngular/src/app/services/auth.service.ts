import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  InvestigatorProfile,
  LoginCredentials,
  RegisterData,
  DEFAULT_AVATAR_ICON,
  DEFAULT_AVATAR_COLOR,
} from '../models/investigator.models';

// Storage keys — swap these out when connecting to MongoDB
const PROFILES_KEY = 'investigator_profiles';
const SESSION_KEY = 'current_investigator';

interface StoredProfile extends InvestigatorProfile {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentProfile$ = new BehaviorSubject<InvestigatorProfile | null>(
    this.loadSession()
  );

  getCurrentProfile(): Observable<InvestigatorProfile | null> {
    return this.currentProfile$.asObservable();
  }

  getProfileSnapshot(): InvestigatorProfile | null {
    return this.currentProfile$.value;
  }

  isLoggedIn(): boolean {
    return this.currentProfile$.value !== null;
  }

  /**
   * Register a new investigator account.
   * TODO: Replace localStorage logic with POST /api/auth/register when MongoDB is ready.
   */
  register(data: RegisterData): { success: boolean; error?: string } {
    if (data.password !== data.confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    const profiles = this.loadProfiles();

    if (profiles.find((p) => p.username === data.username)) {
      return { success: false, error: 'Username already taken.' };
    }
    if (profiles.find((p) => p.email === data.email)) {
      return { success: false, error: 'Email already registered.' };
    }

    const newProfile: StoredProfile = {
      _id: crypto.randomUUID(),
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      password: data.password, // NOTE: hash on server in production
      avatarIcon: DEFAULT_AVATAR_ICON,
      avatarColor: DEFAULT_AVATAR_COLOR,
      createdAt: new Date().toISOString(),
      casesCompleted: [],
      investigatorRank: 'Rookie',
      friends: [],
    };

    profiles.push(newProfile);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    const { password, ...profileWithoutPassword } = newProfile;
    this.setSession(profileWithoutPassword);

    return { success: true };
  }

  /**
   * Log in with username and password.
   * TODO: Replace localStorage logic with POST /api/auth/login when MongoDB is ready.
   */
  login(credentials: LoginCredentials): { success: boolean; error?: string } {
    const profiles = this.loadProfiles();
    const match = profiles.find(
      (p) =>
        p.username === credentials.username &&
        p.password === credentials.password
    );

    if (!match) {
      return { success: false, error: 'Invalid username or password.' };
    }

    const { password, ...profileWithoutPassword } = match;
    this.setSession(profileWithoutPassword);

    return { success: true };
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentProfile$.next(null);
  }

  /**
   * Update mutable profile fields (displayName, avatarIcon, avatarColor).
   * TODO: Replace with PATCH /api/profile/:id when MongoDB is ready.
   */
  updateProfile(
    updates: Partial<Pick<InvestigatorProfile, 'displayName' | 'avatarIcon' | 'avatarColor'>>
  ): { success: boolean; error?: string } {
    const current = this.currentProfile$.value;
    if (!current) {
      return { success: false, error: 'Not logged in.' };
    }

    if (updates.displayName !== undefined && updates.displayName.trim().length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters.' };
    }

    const profiles = this.loadProfiles();
    const idx = profiles.findIndex((p) => p.username === current.username);
    if (idx === -1) {
      return { success: false, error: 'Profile not found.' };
    }

    profiles[idx] = { ...profiles[idx], ...updates };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    const { password, ...updated } = profiles[idx];
    this.setSession(updated);

    return { success: true };
  }

  /**
   * Search all registered investigators by username or display name.
   * Excludes the current user and existing friends.
   * TODO: Replace with GET /api/investigators/search?q= when MongoDB is ready.
   */
  searchInvestigators(query: string): InvestigatorProfile[] {
    const current = this.currentProfile$.value;
    if (!query.trim() || !current) return [];

    const q = query.toLowerCase();
    return this.loadProfiles()
      .filter(
        (p) =>
          p.username !== current.username &&
          !current.friends.includes(p.username) &&
          (p.username.toLowerCase().includes(q) ||
            p.displayName.toLowerCase().includes(q))
      )
      .map(({ password, ...profile }) => profile);
  }

  /**
   * Add an investigator as a friend by username.
   * TODO: Replace with POST /api/friends when MongoDB is ready.
   */
  addFriend(targetUsername: string): { success: boolean; error?: string } {
    const current = this.currentProfile$.value;
    if (!current) return { success: false, error: 'Not logged in.' };

    const profiles = this.loadProfiles();
    const target = profiles.find((p) => p.username === targetUsername);
    if (!target) return { success: false, error: 'Investigator not found.' };
    if (current.friends.includes(targetUsername)) {
      return { success: false, error: 'Already friends.' };
    }

    const idx = profiles.findIndex((p) => p.username === current.username);
    profiles[idx].friends = [...(profiles[idx].friends ?? []), targetUsername];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    const { password, ...updated } = profiles[idx];
    this.setSession(updated);

    return { success: true };
  }

  /**
   * Remove a friend by username.
   * TODO: Replace with DELETE /api/friends/:username when MongoDB is ready.
   */
  removeFriend(targetUsername: string): void {
    const current = this.currentProfile$.value;
    if (!current) return;

    const profiles = this.loadProfiles();
    const idx = profiles.findIndex((p) => p.username === current.username);
    if (idx === -1) return;

    profiles[idx].friends = profiles[idx].friends.filter(
      (f) => f !== targetUsername
    );
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    const { password, ...updated } = profiles[idx];
    this.setSession(updated);
  }

  /**
   * Get full profile objects for all current friends.
   * TODO: Replace with GET /api/friends when MongoDB is ready.
   */
  getFriendProfiles(): InvestigatorProfile[] {
    const current = this.currentProfile$.value;
    if (!current) return [];

    const friendUsernames = new Set(current.friends ?? []);
    return this.loadProfiles()
      .filter((p) => friendUsernames.has(p.username))
      .map(({ password, ...profile }) => profile);
  }

  private loadProfiles(): StoredProfile[] {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private loadSession(): InvestigatorProfile | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as InvestigatorProfile;
    // Back-fill defaults for profiles created before avatar/friends fields were added
    return {
      ...profile,
      avatarIcon: profile.avatarIcon ?? DEFAULT_AVATAR_ICON,
      avatarColor: profile.avatarColor ?? DEFAULT_AVATAR_COLOR,
      friends: profile.friends ?? [],
    };
  }

  private setSession(profile: InvestigatorProfile): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    this.currentProfile$.next(profile);
  }
}
