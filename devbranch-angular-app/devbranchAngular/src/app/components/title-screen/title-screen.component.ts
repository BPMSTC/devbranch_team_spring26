import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StoryService } from '../../services/story.service';
import { StoryPlot } from '../../models/story.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-title-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './title-screen.component.html',
  styleUrls: ['./title-screen.component.css']
})
export class TitleScreenComponent implements OnInit {
  storyPlot$: Observable<StoryPlot>;
  storyPrint: string = '';
  showSpoiler: boolean = false;

  constructor(
    private storyService: StoryService,
    private router: Router,
    private http: HttpClient
  ) {
    this.storyPlot$ = this.storyService.getStoryPlot();
  }

  ngOnInit(): void {
    this.loadStoryPrint();
  }

  loadStoryPrint(): void {
    this.http.get('story/enterpriseDatacenter/storyPrint1.json', {
      responseType: 'text'
    }).subscribe({
      next: (data) => {
        this.storyPrint = data;
        console.log('[TitleScreenComponent] Story print loaded');
      },
      error: (err) => {
        console.error('[TitleScreenComponent] Failed to load story print:', err);
        this.storyPrint = 'Story print unavailable';
      }
    });
  }

  toggleSpoiler(): void {
    this.showSpoiler = !this.showSpoiler;
  }

  goToGame(): void {
    console.log('[TitleScreenComponent] Navigating to /investigate');
    this.router.navigate(['/investigate']);
  }
}
