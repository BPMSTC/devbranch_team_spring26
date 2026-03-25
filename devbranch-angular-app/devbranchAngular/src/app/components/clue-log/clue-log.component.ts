import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';
import { StoryService } from '../../services/story.service';
import { Clue } from '../../models/story.models';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clue-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clue-log.component.html',
  styleUrls: ['./clue-log.component.css']
})
export class ClueLogComponent implements OnInit {
  collectedCluesDetails$: Observable<Clue[]>;

  constructor(private storyService: StoryService, private router: Router) {
    this.collectedCluesDetails$ = this.storyService.collectedClues$.pipe(
      switchMap(collectedClues => {
        const clueIds = Object.keys(collectedClues).filter(id => collectedClues[id]);
        if (clueIds.length === 0) {
          return of([]);
        }
        const clueObservables = clueIds.map(id => this.storyService.getClue(id));
        return combineLatest(clueObservables).pipe(
          map(clues => clues.filter((clue): clue is Clue => !!clue))
        );
      })
    );
  }

  ngOnInit(): void {}

  openClueScene(clue: Clue): void {
    this.storyService.getStoryPlot().pipe(first()).subscribe(plot => {
      const roomId = Object.keys(plot.rooms || {}).find(id =>
        (plot.rooms[id]?.clues_present || []).includes(clue.id)
      );

      if (roomId) {
        this.storyService.navigateTo(roomId);
      }

      this.storyService.setFocusedClue(clue.id);
      this.router.navigate(['/investigate']);
    });
  }
}
