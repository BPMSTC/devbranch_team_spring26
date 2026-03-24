import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.html',
  styleUrl: './app.css'
})
export class App {
  // Scenario Details
  title = 'The Study of Silence';
  intro = 'You stand before the heavy oak door of the late Mr. Blackwood\'s study. The butler, Jenkins, claims he was polishing silver in the kitchen, but something feels off. Can you find the truth?';

  // Game State
  gameStarted = false;
  currentRoomKey = 'study';
  hasFoundKeyClue = false;
  clueDetail: string | null = null;

  // Data
  rooms: any = {
    study: {
      name: 'The Study',
      description: 'A dimly lit room smelling of old paper and pipe tobacco. A large mahogany desk dominates the center. A fireplace is cold and dark.',
      clues: [
        { name: 'Mahogany Desk', detail: 'A half-written letter rests here. It mentions a "debt unpaid" to... J.', isKeyClue: true },
        { name: 'Fireplace', detail: 'Cold ash. Nothing of interest.', isKeyClue: false },
        { name: 'Bookshelf', detail: 'Dusty legal tomes. Boring.', isKeyClue: false }
      ]
    },
    hallway: {
      name: 'The Hallway',
      description: 'The long, dark hallway leading to the kitchen. Portraits of ancestors seem to watch you.',
      clues: []
    }
  };

  get currentRoom() {
    return this.rooms[this.currentRoomKey];
  }

  startGame() {
    this.gameStarted = true;
  }

  examineClue(clue: any) {
    this.clueDetail = clue.detail;
    if (clue.isKeyClue) {
      this.hasFoundKeyClue = true;
    }
  }

  closeClue() {
    this.clueDetail = null;
  }

  goToRoom(roomKey: string) {
    this.currentRoomKey = roomKey;
    this.clueDetail = null;
  }
}
