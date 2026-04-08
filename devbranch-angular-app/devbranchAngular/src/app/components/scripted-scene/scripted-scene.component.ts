import { Component, OnInit, HostListener } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap, map, first } from 'rxjs/operators';
import { StoryService } from '../../services/story.service';
import { ScriptedScene, StoryPrint } from '../../models/story.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scripted-scene',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripted-scene.component.html',
  styleUrls: ['./scripted-scene.component.css']
})
export class ScriptedSceneComponent implements OnInit {
  currentScene$: Observable<ScriptedScene | null>;
  storyPrint$: Observable<StoryPrint>;
  activeScene: ScriptedScene | null = null;
  sceneImageVisible = true;
  sceneImageSrc: string | null = null;
  private sceneImageExtIndex = 0;
  private readonly imageExtensions = ['webp', 'png', 'jpg', 'jpeg'];

  currentBeatIndex = 0;
  currentBeat: any = null;
  private dialogTouchStartX: number | null = null;
  private dialogTouchDeltaX = 0;

  constructor(public storyService: StoryService) {
    this.storyPrint$ = this.storyService.getStoryPrint();
    this.currentScene$ = this.storyService.currentScriptedScene$.pipe(
      switchMap(sceneId => {
        if (!sceneId) {
          return of(null);
        }
        return this.storyService.getStoryPlot().pipe(
          map(plot => plot.scripted_scenes[sceneId] || null)
        );
      })
    );
  }

  ngOnInit(): void {
    this.currentScene$.subscribe(scene => {
      this.activeScene = scene;
      this.sceneImageVisible = true;
      this.sceneImageExtIndex = 0;
      this.sceneImageSrc = scene ? this.buildSceneImagePath(scene, this.sceneImageExtIndex) : null;
      if (scene) {
        this.currentBeatIndex = 0;
        this.updateCurrentBeat(scene);
      } else {
        this.currentBeat = null;
      }
    });
  }

  nextBeat(): void {
    this.currentScene$.pipe(first()).subscribe(scene => {
      if (scene && this.currentBeatIndex < scene.beats.length - 1) {
        this.currentBeatIndex++;
        this.updateCurrentBeat(scene);
      } else {
        this.endScene();
      }
    });
  }

  previousBeat(): void {
    this.currentScene$.pipe(first()).subscribe(scene => {
      if (scene && this.currentBeatIndex > 0) {
        this.currentBeatIndex--;
        this.updateCurrentBeat(scene);
      }
    });
  }

  replayDialog(): void {
    this.currentScene$.pipe(first()).subscribe(scene => {
      if (scene) {
        this.currentBeatIndex = 0;
        this.updateCurrentBeat(scene);
      }
    });
  }

  skipScene(): void {
    this.endScene();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.currentBeat) {
      this.skipScene();
    }
  }

  @HostListener('document:keydown.arrowright')
  @HostListener('document:keydown.enter')
  @HostListener('document:keydown.space')
  onNextKey(): void {
    if (this.currentBeat) {
      this.nextBeat();
    }
  }

  @HostListener('document:keydown.arrowleft')
  onPreviousKey(): void {
    if (this.currentBeat) {
      this.previousBeat();
    }
  }

  @HostListener('document:keydown.r')
  onReplayKey(): void {
    if (this.currentBeat) {
      this.replayDialog();
    }
  }

  onDialogTouchStart(event: TouchEvent): void {
    this.dialogTouchStartX = event.changedTouches[0]?.clientX ?? null;
    this.dialogTouchDeltaX = 0;
  }

  onDialogTouchMove(event: TouchEvent): void {
    if (this.dialogTouchStartX === null) {
      return;
    }

    const currentX = event.changedTouches[0]?.clientX ?? this.dialogTouchStartX;
    this.dialogTouchDeltaX = currentX - this.dialogTouchStartX;
  }

  onDialogTouchEnd(): void {
    const minSwipeDistance = 40;

    if (this.dialogTouchDeltaX <= -minSwipeDistance) {
      this.nextBeat();
    } else if (this.dialogTouchDeltaX >= minSwipeDistance) {
      this.previousBeat();
    }

    this.dialogTouchStartX = null;
    this.dialogTouchDeltaX = 0;
  }

  getCurrentBeatText(): string {
    if (!this.currentBeat) {
      return '';
    }

    if (typeof this.currentBeat === 'string') {
      return this.currentBeat;
    }

    return this.currentBeat.line || '';
  }

  isRudiSpeaking(): boolean {
    const beatText = this.getCurrentBeatText().toLowerCase();
    if (!beatText) {
      return false;
    }

    if (beatText.includes("bad rudi says") || beatText.includes("bad rudi's voice")) {
      return true;
    }

    if ((this.activeScene?.id || '').startsWith('rudi_')) {
      return beatText.includes('he says');
    }

    return false;
  }

  getCurrentBeatCharacterId(): string | null {
    if (!this.currentBeat || typeof this.currentBeat === 'string') {
      return null;
    }

    return this.currentBeat.character || null;
  }

  getSceneImagePath(): string | null {
    if (!this.activeScene || !this.sceneImageVisible) {
      return null;
    }

    return this.sceneImageSrc || this.buildSceneImagePath(this.activeScene, this.sceneImageExtIndex);
  }

  onSceneImageError(): void {
    if (!this.activeScene) {
      this.sceneImageVisible = false;
      return;
    }

    this.sceneImageExtIndex++;
    if (this.sceneImageExtIndex >= this.imageExtensions.length) {
      this.sceneImageVisible = false;
      return;
    }

    this.sceneImageSrc = this.buildSceneImagePath(this.activeScene, this.sceneImageExtIndex);
  }

  private buildSceneImagePath(scene: ScriptedScene, extIndex: number): string {
    return `story/enterpriseDatacenter/images/rooms/${scene.location}/scenes/${scene.id}.${this.imageExtensions[extIndex]}`;
  }

  private updateCurrentBeat(scene: ScriptedScene): void {
    this.currentBeat = scene.beats[this.currentBeatIndex];
  }

  private endScene(): void {
    this.storyService.triggerScriptedScene(null);
    this.currentBeat = null;
  }
}
