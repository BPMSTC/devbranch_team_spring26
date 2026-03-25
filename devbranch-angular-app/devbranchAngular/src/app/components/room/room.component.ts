import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, combineLatest, Subscription } from 'rxjs';
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
export class RoomComponent implements OnInit, OnDestroy {
  gameMode$: Observable<'easy' | 'normal' | null>;
  currentRoom$: Observable<Room | undefined>;
  cluesInRoom$: Observable<Clue[]>;
  clueEntries$: Observable<{ clue: Clue; isFound: boolean }[]>;
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
  private subscriptions = new Subscription();
  private latestCluesInRoom: Clue[] = [];
  private roomImageExtIndex = 0;
  private clueImageExtIndex = 0;

  galleryOpen = false;
  galleryIndex = 0;
  galleryItems: { id: string; label: string; kind: 'scene' | 'clue'; extIndex: number }[] = [];
  private galleryTouchStartX: number | null = null;
  private galleryTouchDeltaX = 0;

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
          this.galleryOpen = false;
          this.refreshGalleryItems(room.id);

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

    this.clueEntries$ = combineLatest([this.cluesInRoom$, this.storyService.collectedClues$]).pipe(
      map(([clues, collected]) => clues.map(clue => ({
        clue,
        isFound: !!collected[clue.id]
      })))
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

    const roomCluesSubscription = this.cluesInRoom$.subscribe(clues => {
      this.latestCluesInRoom = clues;
      if (this.lastRoomId) {
        this.refreshGalleryItems(this.lastRoomId);
      }
    });

    const focusedClueSubscription = combineLatest([
      this.currentRoom$,
      this.cluesInRoom$,
      this.storyService.focusedClue$
    ]).subscribe(([room, clues, focusedClueId]) => {
      if (!room || !focusedClueId) {
        return;
      }

      const focusedClue = clues.find(clue => clue.id === focusedClueId);
      if (focusedClue) {
        this.onClueClicked(focusedClue);
        this.storyService.setFocusedClue(null);
      }
    });

    this.subscriptions.add(roomCluesSubscription);
    this.subscriptions.add(focusedClueSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  openGalleryAtScene(roomId: string): void {
    this.refreshGalleryItems(roomId);
    this.galleryIndex = 0;
    this.galleryOpen = this.galleryItems.length > 0;
  }

  openGalleryForSelectedClue(): void {
    if (!this.selectedClue || !this.lastRoomId) {
      return;
    }

    this.refreshGalleryItems(this.lastRoomId);
    const clueItemIndex = this.galleryItems.findIndex(item => item.kind === 'clue' && item.id === this.selectedClue!.id);
    this.galleryIndex = clueItemIndex >= 0 ? clueItemIndex : 0;
    this.galleryOpen = this.galleryItems.length > 0;
  }

  closeGallery(): void {
    this.galleryOpen = false;
    this.galleryTouchStartX = null;
    this.galleryTouchDeltaX = 0;
  }

  showPreviousGalleryImage(): void {
    if (this.galleryItems.length === 0) {
      return;
    }

    this.galleryIndex = (this.galleryIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
  }

  showNextGalleryImage(): void {
    if (this.galleryItems.length === 0) {
      return;
    }

    this.galleryIndex = (this.galleryIndex + 1) % this.galleryItems.length;
  }

  getCurrentGalleryImagePath(): string | null {
    if (!this.galleryOpen || this.galleryItems.length === 0) {
      return null;
    }

    const item = this.galleryItems[this.galleryIndex];
    if (item.extIndex >= this.imageExtensions.length) {
      return null;
    }

    if (item.kind === 'scene') {
      return this.buildRoomImagePath(item.id, item.extIndex);
    }

    if (!this.lastRoomId) {
      return null;
    }

    return `story/enterpriseDatacenter/images/rooms/${this.lastRoomId}/clues/${item.id}.${this.imageExtensions[item.extIndex]}`;
  }

  onGalleryImageError(): void {
    if (this.galleryItems.length === 0) {
      return;
    }

    const currentItem = this.galleryItems[this.galleryIndex];
    currentItem.extIndex++;
  }

  onGalleryTouchStart(event: TouchEvent): void {
    this.galleryTouchStartX = event.changedTouches[0]?.clientX ?? null;
    this.galleryTouchDeltaX = 0;
  }

  onGalleryTouchMove(event: TouchEvent): void {
    if (this.galleryTouchStartX === null) {
      return;
    }

    const currentX = event.changedTouches[0]?.clientX ?? this.galleryTouchStartX;
    this.galleryTouchDeltaX = currentX - this.galleryTouchStartX;
  }

  onGalleryTouchEnd(): void {
    const minSwipeDistance = 40;
    if (this.galleryTouchDeltaX <= -minSwipeDistance) {
      this.showNextGalleryImage();
    } else if (this.galleryTouchDeltaX >= minSwipeDistance) {
      this.showPreviousGalleryImage();
    }

    this.galleryTouchStartX = null;
    this.galleryTouchDeltaX = 0;
  }

  getCurrentGalleryLabel(): string {
    if (this.galleryItems.length === 0) {
      return '';
    }

    return this.galleryItems[this.galleryIndex].label;
  }

  getCurrentGalleryKindLabel(): string {
    if (this.galleryItems.length === 0) {
      return '';
    }

    return this.galleryItems[this.galleryIndex].kind === 'scene' ? 'Scene Image' : 'Clue Image';
  }

  getGalleryCounterLabel(): string {
    if (this.galleryItems.length === 0) {
      return '';
    }

    return `${this.galleryIndex + 1} / ${this.galleryItems.length}`;
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

  private refreshGalleryItems(roomId: string): void {
    const sceneItem = {
      id: roomId,
      label: 'Room Scene',
      kind: 'scene' as const,
      extIndex: 0
    };

    const clueItems = this.latestCluesInRoom.map(clue => ({
      id: clue.id,
      label: clue.label,
      kind: 'clue' as const,
      extIndex: 0
    }));

    this.galleryItems = [sceneItem, ...clueItems];
    if (this.galleryItems.length === 0) {
      this.galleryIndex = 0;
      return;
    }

    if (this.galleryIndex >= this.galleryItems.length) {
      this.galleryIndex = this.galleryItems.length - 1;
    }
  }
}
