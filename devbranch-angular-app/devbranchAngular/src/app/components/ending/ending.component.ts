import { Component, OnInit } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { StoryService } from '../../services/story.service';
import { Ending } from '../../models/story.models';
import { CommonModule } from '@angular/common';
import { RudiNarratorComponent } from '../rudi-narrator/rudi-narrator.component';

@Component({
  selector: 'app-ending',
  standalone: true,
  imports: [CommonModule, RudiNarratorComponent],
  templateUrl: './ending.component.html',
  styleUrls: ['./ending.component.css']
})
export class EndingComponent implements OnInit {
  ending$: Observable<Ending | undefined>;
  narrationLines: string[] = [];
  showCaseClosed = false;

  constructor(private storyService: StoryService) {
    this.ending$ = this.storyService.getStoryPlot().pipe(map(plot => plot.ending));
  }

  ngOnInit(): void {
    this.ending$.subscribe(ending => {
      if (ending) {
        interval(2000).pipe(
          take(ending.final_narration_by_rudi.length),
          map(i => ending.final_narration_by_rudi.slice(0, i + 1))
        ).subscribe({
            next: lines => this.narrationLines = lines,
            complete: () => {
                setTimeout(() => this.showCaseClosed = true, 2000);
            }
        })
      }
    });
  }
}
