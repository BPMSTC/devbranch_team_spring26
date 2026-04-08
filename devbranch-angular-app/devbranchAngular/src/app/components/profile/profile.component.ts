import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  InvestigatorProfile,
  AVATAR_ICONS,
  AVATAR_COLORS,
} from '../../models/investigator.models';

type ProfileTab = 'edit' | 'friends';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  profile: InvestigatorProfile | null = null;
  friendProfiles: InvestigatorProfile[] = [];

  activeTab: ProfileTab = 'edit';

  // Edit profile form
  editForm: FormGroup;
  editSuccess = '';
  editError = '';

  // Avatar picker state
  selectedIcon: string = '';
  selectedColor: string = '';
  readonly avatarIcons = AVATAR_ICONS;
  readonly avatarColors = AVATAR_COLORS;

  // Friend search
  searchQuery = '';
  searchResults: InvestigatorProfile[] = [];
  friendError = '';
  friendSuccess = '';
  hasSearched = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    });
  }

  ngOnInit(): void {
    const p = this.authService.getProfileSnapshot();
    if (!p) {
      this.router.navigate(['/login']);
      return;
    }
    this.profile = p;
    this.editForm.patchValue({ displayName: p.displayName });
    this.selectedIcon = p.avatarIcon;
    this.selectedColor = p.avatarColor;
    this.refreshFriends();
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    this.editSuccess = '';
    this.editError = '';
    this.friendError = '';
    this.friendSuccess = '';
    this.searchResults = [];
    this.searchQuery = '';
    this.hasSearched = false;
  }

  // ── Edit profile ──────────────────────────────────────────────────────────

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  saveProfile(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.editError = '';
    this.editSuccess = '';

    const result = this.authService.updateProfile({
      displayName: this.editForm.value.displayName.trim(),
      avatarIcon: this.selectedIcon,
      avatarColor: this.selectedColor,
    });

    if (result.success) {
      this.profile = this.authService.getProfileSnapshot();
      this.editSuccess = 'Profile updated.';
    } else {
      this.editError = result.error ?? 'Update failed.';
    }
  }

  // ── Friends ───────────────────────────────────────────────────────────────

  onSearch(): void {
    this.friendError = '';
    this.friendSuccess = '';
    this.hasSearched = true;
    this.searchResults = this.authService.searchInvestigators(this.searchQuery);
  }

  addFriend(username: string): void {
    this.friendError = '';
    this.friendSuccess = '';

    const result = this.authService.addFriend(username);
    if (result.success) {
      this.profile = this.authService.getProfileSnapshot();
      this.friendSuccess = `${username} added as a colleague.`;
      this.searchResults = this.searchResults.filter((r) => r.username !== username);
      this.refreshFriends();
    } else {
      this.friendError = result.error ?? 'Could not add friend.';
    }
  }

  removeFriend(username: string): void {
    this.authService.removeFriend(username);
    this.profile = this.authService.getProfileSnapshot();
    this.friendProfiles = this.friendProfiles.filter((f) => f.username !== username);
    this.friendSuccess = `${username} removed from colleagues.`;
  }

  private refreshFriends(): void {
    this.friendProfiles = this.authService.getFriendProfiles();
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  get memberSince(): string {
    if (!this.profile?.createdAt) return '';
    return new Date(this.profile.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  get df() { return this.editForm.controls; }
}
