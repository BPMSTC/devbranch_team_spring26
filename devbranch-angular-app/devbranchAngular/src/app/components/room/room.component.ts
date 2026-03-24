import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';
import { switchMap, map, first, tap } from 'rxjs/operators';
import { StoryService } from '../../services/story.service';
import { Room, Clue, StoryPrint } from '../../models/story.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {
  gameMode$: Observable<'easy' | 'normal' | null>;
  currentRoom$: Observable<Room | undefined>;
  cluesInRoom$: Observable<Clue[]>;
  navigationOptions$: Observable<{
    roomId: string,
    roomName: string,
    isVisited: boolean,
    isBacktrack: boolean,
    isRecommended: boolean
  }[]>;
  storyPrint$: Observable<StoryPrint>;
  showAccusationButton$: Observable<boolean>;
  
  selectedClue: Clue | null = null;
  selectedClueProse: string | null = null;
  roomImageVisible = true;
  clueImageVisible = true;
  roomImageSrc: string | null = null;
  clueImageSrc: string | null = null;

  private visitedRooms = new Set<string>();
  private oneTimeClueScenes = new Set<string>();
  private lastRoomId: string | null = null;
  private roomHistoryIds: string[] = [];
  private readonly imageExtensions = ['webp', 'png', 'jpg', 'jpeg'];
  private roomImageExtIndex = 0;
  private clueImageExtIndex = 0;
  roomPathLabel = '';

  constructor(private storyService: StoryService, private router: Router) {
    console.log('[RoomComponent] Constructor called');
    this.gameMode$ = this.storyService.gameMode$;
    this.currentRoom$ = this.storyService.currentRoom$.pipe(
      tap(room => {
        console.log('[RoomComponent] Current room:', room?.id);

        // Always clear selected clue details when transitioning to a different room.
        if (room?.id && room.id !== this.lastRoomId) {
          this.selectedClue = null;
          this.selectedClueProse = null;
          this.roomImageVisible = true;
          this.clueImageVisible = true;
          this.roomImageExtIndex = 0;
          this.clueImageExtIndex = 0;
          this.clueImageSrc = null;
          this.roomImageSrc = this.buildRoomImagePath(room.id, this.roomImageExtIndex);

          this.roomHistoryIds.push(room.id);
          if (this.roomHistoryIds.length > 7) {
            this.roomHistoryIds.shift();
          }

          this.roomPathLabel = this.roomHistoryIds.join(' -> ');
          this.lastRoomId = room.id;
        }

        if (room && !this.visitedRooms.has(room.id)) {
          this.visitedRooms.add(room.id);
          console.log('[RoomComponent] First visit to room:', room.id);
          if (room.scripted_scene) {
            console.log('[RoomComponent] Triggering scripted scene:', room.scripted_scene);
            this.storyService.triggerScriptedScene(room.scripted_scene);
          }
        }
      })
    );

    this.cluesInRoom$ = this.currentRoom$.pipe(
      switchMap(room => {
        if (!room || !room.clues_present) {
          console.log('[RoomComponent] No clues in room');
          return of([]);
        }
        console.log('[RoomComponent] Fetching clues:', room.clues_present);
        const clueObservables = room.clues_present.map(clueId => 
          this.storyService.getClue(clueId).pipe(first())
        );
        return combineLatest(clueObservables).pipe(
          map(clues => clues.filter((clue): clue is Clue => !!clue))
        );
      })
    );

    this.navigationOptions$ = this.currentRoom$.pipe(
      switchMap(room => {
        if (!room || !room.navigation) {
          console.log('[RoomComponent] No navigation options');
          return of([]);
        }
        console.log('[RoomComponent] Fetching navigation:', room.navigation);
        const previousRoomId = this.getPreviousRoomId();

        const roomObservables = room.navigation.map(roomId =>
          this.storyService.getRoom(roomId).pipe(
            first(),
            map(navRoom => ({
              roomId: roomId,
              roomName: navRoom ? navRoom.name : 'Unknown',
              isVisited: this.visitedRooms.has(roomId),
              isBacktrack: previousRoomId === roomId,
              isRecommended: !this.visitedRooms.has(roomId) && previousRoomId !== roomId
            }))
          )
        );
        return combineLatest(roomObservables).pipe(
          map(options => options.sort((a, b) => {
            const score = (option: typeof a): number => {
              if (option.isRecommended) {
                return 0;
              }
              if (option.isBacktrack) {
                return 2;
              }
              return option.isVisited ? 1 : 0;
            };

            return score(a) - score(b);
          }))
        );
      })
    );

    this.storyPrint$ = this.storyService.getStoryPrint();
    this.showAccusationButton$ = this.storyService.checkEndingTrigger();
  }

  ngOnInit(): void {
    console.log('[RoomComponent] ngOnInit');
  }

  chooseMode(mode: 'easy' | 'normal'): void {
    console.log('[RoomComponent] Mode selected:', mode);
    this.storyService.startGame(mode);
  }

  onClueClicked(clue: Clue): void {
    console.log('[RoomComponent] Clue clicked:', clue.id);
    this.storyService.collectClue(clue.id);
    this.selectedClue = clue;
    this.clueImageVisible = true;
    this.clueImageExtIndex = 0;
    this.clueImageSrc = this.buildClueImagePath(clue.id, this.clueImageExtIndex);
    this.storyPrint$.pipe(first()).subscribe(print => {
        // This is a simplistic way to find related prose.
        // A more robust solution would be needed for a complex story.
        this.selectedClueProse = print[clue.id] || null;
    });

    if (clue.id === 'clue_workstation' && !this.oneTimeClueScenes.has('rudi_qnap_breakdown')) {
      this.oneTimeClueScenes.add('rudi_qnap_breakdown');
      this.storyService.triggerScriptedScene('rudi_qnap_breakdown');
    }
  }

  navigateTo(roomId: string): void {
    console.log('[RoomComponent] Navigating to:', roomId);
    this.selectedClue = null;
    this.selectedClueProse = null;
    this.storyService.navigateTo(roomId);
  }

  makeAccusation(): void {
    console.log('[RoomComponent] Making accusation');
    this.router.navigate(['/ending']);
  }

  private getPreviousRoomId(): string | null {
    if (this.roomHistoryIds.length < 2) {
      return null;
    }

    return this.roomHistoryIds[this.roomHistoryIds.length - 2];
  }

  getRoomImagePath(roomId: string): string {
    return this.roomImageSrc || this.buildRoomImagePath(roomId, this.roomImageExtIndex);
  }

  getSelectedClueImagePath(): string | null {
    if (!this.selectedClue || !this.lastRoomId || !this.clueImageVisible) {
      return null;
    }

    return this.clueImageSrc || this.buildClueImagePath(this.selectedClue.id, this.clueImageExtIndex);
  }

  onRoomImageError(): void {
    if (!this.lastRoomId) {
      this.roomImageVisible = false;
      return;
    }

    this.roomImageExtIndex++;
    if (this.roomImageExtIndex >= this.imageExtensions.length) {
      this.roomImageVisible = false;
      return;
    }

    this.roomImageSrc = this.buildRoomImagePath(this.lastRoomId, this.roomImageExtIndex);
  }

  onClueImageError(): void {
    if (!this.selectedClue) {
      this.clueImageVisible = false;
      return;
    }

    this.clueImageExtIndex++;
    if (this.clueImageExtIndex >= this.imageExtensions.length) {
      this.clueImageVisible = false;
      return;
    }

    this.clueImageSrc = this.buildClueImagePath(this.selectedClue.id, this.clueImageExtIndex);
  }

  private buildRoomImagePath(roomId: string, extIndex: number): string {
    return `story/enterpriseDatacenter/images/rooms/${roomId}/room.${this.imageExtensions[extIndex]}`;
  }

  private buildClueImagePath(clueId: string, extIndex: number): string {
    if (!this.lastRoomId) {
      return '';
    }

    return `story/enterpriseDatacenter/images/rooms/${this.lastRoomId}/clues/${clueId}.${this.imageExtensions[extIndex]}`;
  }
}
