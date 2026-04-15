import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  InvestigatorProfile,
  LoginCredentials,
  RegisterData,
  DEFAULT_AVATAR_ICON,
  DEFAULT_AVATAR_COLOR,
} from '../models/investigator.models';

const SESSION_KEY = 'current_investigator';
const API_BASE_URL = 'http://localhost:3000/api';

interface ApiResponse {
  investigator: InvestigatorProfile;
}

interface ApiListResponse {
  investigators: InvestigatorProfile[];
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

  async register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    if (data.password !== data.confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    try {
      const response = await this.request<ApiResponse>('/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      this.setSession(response.investigator);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error, 'Registration failed.') };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request<ApiResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      this.setSession(response.investigator);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error, 'Login failed.') };
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentProfile$.next(null);
  }

  async updateProfile(
    updates: Partial<Pick<InvestigatorProfile, 'displayName' | 'avatarIcon' | 'avatarColor'>>
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.currentProfile$.value;
    if (!current) {
      return { success: false, error: 'Not logged in.' };
    }
    if (!current._id) {
      return { success: false, error: 'Session missing account id. Please log in again.' };
    }

    if (updates.displayName !== undefined && updates.displayName.trim().length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters.' };
    }

    try {
      const response = await this.request<ApiResponse>(`/profiles/${current._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      this.setSession(response.investigator);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error, 'Update failed.') };
    }
  }

  async searchInvestigators(query: string): Promise<InvestigatorProfile[]> {
    const current = this.currentProfile$.value;
    if (!query.trim() || !current) return [];

    try {
      const response = await this.request<ApiListResponse>(
        `/investigators/search?q=${encodeURIComponent(query)}&exclude=${encodeURIComponent(current.username)}`
      );

      return response.investigators.filter(
        (profile) => profile.username !== current.username && !current.friends.includes(profile.username)
      );
    } catch {
      return [];
    }
  }

  async addFriend(targetUsername: string): Promise<{ success: boolean; error?: string }> {
    const current = this.currentProfile$.value;
    if (!current) return { success: false, error: 'Not logged in.' };
    if (!current._id) {
      return { success: false, error: 'Session missing account id. Please log in again.' };
    }

    try {
      const response = await this.request<ApiResponse>('/friends', {
        method: 'POST',
        body: JSON.stringify({ userId: current._id, targetUsername }),
      });

      this.setSession(response.investigator);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error, 'Could not add friend.') };
    }
  }

  async removeFriend(targetUsername: string): Promise<{ success: boolean; error?: string }> {
    const current = this.currentProfile$.value;
    if (!current) return { success: false, error: 'Not logged in.' };
    if (!current._id) {
      return { success: false, error: 'Session missing account id. Please log in again.' };
    }

    try {
      const response = await this.request<ApiResponse>(
        `/friends/${encodeURIComponent(targetUsername)}?userId=${encodeURIComponent(current._id ?? '')}`,
        { method: 'DELETE' }
      );

      this.setSession(response.investigator);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error, 'Could not remove friend.') };
    }
  }

  async getFriendProfiles(): Promise<InvestigatorProfile[]> {
    const current = this.currentProfile$.value;
    if (!current) return [];
    if (!current._id) return [];

    try {
      const response = await this.request<ApiListResponse>(
        `/friends?userId=${encodeURIComponent(current._id ?? '')}`
      );

      return response.investigators;
    } catch {
      return [];
    }
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

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error ?? 'Request failed.');
    }

    return payload as T;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
