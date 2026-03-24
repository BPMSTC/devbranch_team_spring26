import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StoryService } from '../../services/story.service';
import { Clue } from '../../models/story.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clue-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clue-log.component.html',
  styleUrls: ['./clue-log.component.css']
})
export class ClueLogComponent implements OnInit {
  collectedCluesDetails$: Observable<Clue[]>;

  constructor(private storyService: StoryService) {
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
}
