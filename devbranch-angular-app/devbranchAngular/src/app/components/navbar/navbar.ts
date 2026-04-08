import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InvestigatorProfile } from '../../models/investigator.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  profile$: Observable<InvestigatorProfile | null>;

  constructor(private authService: AuthService) {
    this.profile$ = this.authService.getCurrentProfile();
  }

  logout(): void {
    this.authService.logout();
  }
}
