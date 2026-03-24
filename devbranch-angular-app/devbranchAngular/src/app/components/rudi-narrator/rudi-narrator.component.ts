import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { StoryService } from '../../services/story.service';
import { StoryPrint } from '../../models/story.models';
import { Subscription, combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rudi-narrator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rudi-narrator.component.html',
  styleUrls: ['./rudi-narrator.component.css']
})
export class RudiNarratorComponent implements OnInit, OnDestroy {
  @Input() lines: string[] = [];
  private subscriptions = new Subscription();
  private internalLines: string[] = [];

  constructor(private storyService: StoryService) {}

  ngOnInit(): void {
    if (this.lines.length === 0) {
      const sceneSubscription = this.storyService.currentScriptedScene$.pipe(
        distinctUntilChanged()
      ).subscribe(sceneId => {
        if (sceneId) {
          this.addNarrationForScene(sceneId);
        }
      });

      const clueSubscription = this.storyService.collectedClues$.subscribe(clues => {
          const clueIds = Object.keys(clues).filter(id => clues[id]);
          this.addNarrationForClues(clueIds);
      });

      this.subscriptions.add(sceneSubscription);
      this.subscriptions.add(clueSubscription);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get displayLines(): string[] {
    return this.lines.length > 0 ? this.lines : this.internalLines;
  }

  private addNarrationForScene(sceneId: string): void {
    this.storyService.getStoryPrint().subscribe(print => {
      const sceneNarration = print[`${sceneId}_narration`];
      if (sceneNarration) {
        this.internalLines.push(...sceneNarration);
      }
    });
  }

  private addNarrationForClues(clueIds: string[]): void {
    this.storyService.getStoryPrint().subscribe(print => {
        clueIds.forEach(clueId => {
            const clueNarration = print[`${clueId}_narration`];
            if (clueNarration && !this.internalLines.includes(clueNarration)) {
                this.internalLines.push(clueNarration);
            }
        });
    });
  }
}
