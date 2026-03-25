import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ClueLogComponent } from './components/clue-log/clue-log.component';
import { ScriptedSceneComponent } from './components/scripted-scene/scripted-scene.component';
import { RudiNarratorComponent } from './components/rudi-narrator/rudi-narrator.component';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ClueLogComponent, ScriptedSceneComponent, RudiNarratorComponent, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'devbranchAngular';
}

