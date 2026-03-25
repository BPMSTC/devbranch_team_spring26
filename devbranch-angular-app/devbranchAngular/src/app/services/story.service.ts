import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map, tap, shareReplay, catchError } from 'rxjs';
import { of } from 'rxjs';
import { StoryPlot, StoryPrint, Room, Clue } from '../models/story.models';

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private storyPlot$: Observable<StoryPlot>;
  private storyPrint$: Observable<StoryPrint>;

  private gameMode = new BehaviorSubject<'easy' | 'normal' | null>(null);
  private currentRoomId = new BehaviorSubject<string>('room_entrance');
  private collectedClues = new BehaviorSubject<Record<string, boolean>>({});
  private currentScriptedSceneId = new BehaviorSubject<string | null>(null);
  private focusedClueId = new BehaviorSubject<string | null>(null);

  gameMode$ = this.gameMode.asObservable();
  currentRoom$: Observable<Room | undefined>;
  collectedClues$ = this.collectedClues.asObservable();
  currentScriptedScene$ = this.currentScriptedSceneId.asObservable();
  focusedClue$ = this.focusedClueId.asObservable();

  constructor(private http: HttpClient) {
    this.storyPlot$ = this.http.get<StoryPlot>('story/enterpriseDatacenter/storyPlot1.json').pipe(
      tap(() => console.log('[StoryService] Story plot loaded')),
      catchError(err => {
        console.error('[StoryService] Failed to load story plot:', err);
        return of({} as StoryPlot);
      }),
      shareReplay(1)
    );
    
    this.storyPrint$ = this.http.get<StoryPrint>('story/enterpriseDatacenter/storyPrint1.json').pipe(
      tap(() => console.log('[StoryService] Story print loaded')),
      catchError(err => {
        console.error('[StoryService] Failed to load story print:', err);
        return of({} as StoryPrint);
      }),
      shareReplay(1)
    );

    this.currentRoom$ = combineLatest([this.storyPlot$, this.currentRoomId]).pipe(
      tap(([plot, roomId]) => console.log('[StoryService] Current room updated:', roomId, plot?.rooms?.[roomId])),
      map(([plot, roomId]) => plot?.rooms?.[roomId]),
      shareReplay(1)
    );
  }

  getStoryPlot(): Observable<StoryPlot> {
    return this.storyPlot$;
  }

  getStoryPrint(): Observable<StoryPrint> {
    return this.storyPrint$;
  }

  startGame(mode: 'easy' | 'normal'): void {
    this.gameMode.next(mode);
    this.currentScriptedSceneId.next(null);
    this.collectedClues.next({});
    this.currentRoomId.next('room_entrance');

    if (mode === 'easy') {
      this.collectClue('clue_vm109_logs');
      this.collectClue('clue_gx20');
    }
  }

  navigateTo(roomId: string): void {
    console.log('[StoryService] Navigating to room:', roomId);
    this.currentRoomId.next(roomId);
  }

  collectClue(clueId: string): void {
    const currentClues = this.collectedClues.getValue();
    if (!currentClues[clueId]) {
      this.collectedClues.next({ ...currentClues, [clueId]: true });
      console.log('[StoryService] Collected clue:', clueId);
    }
  }

  triggerScriptedScene(sceneId: string | null): void {
    console.log('[StoryService] Triggering scene:', sceneId);
    this.currentScriptedSceneId.next(sceneId);
  }

  setFocusedClue(clueId: string | null): void {
    this.focusedClueId.next(clueId);
  }

  checkEndingTrigger(): Observable<boolean> {
    return combineLatest([this.storyPlot$, this.collectedClues$]).pipe(
      map(([plot, clues]) => {
        const allClueIds = Object.keys(plot?.clues || {});
        if (allClueIds.length === 0) {
          return false;
        }

        return allClueIds.every(clueId => !!clues[clueId]);
      })
    );
  }

  getClue(clueId: string): Observable<Clue | undefined> {
    return this.storyPlot$.pipe(
      map(plot => plot?.clues?.[clueId])
    );
  }

  getRoom(roomId: string): Observable<Room | undefined> {
    return this.storyPlot$.pipe(
      map(plot => plot?.rooms?.[roomId])
    );
  }
}
