import { Routes } from '@angular/router';
import { TitleScreenComponent } from './components/title-screen/title-screen.component';
import { RoomComponent } from './components/room/room.component';
import { EndingComponent } from './components/ending/ending.component';

export const routes: Routes = [
    { path: '', component: TitleScreenComponent },
    { path: 'investigate', component: RoomComponent },
    { path: 'ending', component: EndingComponent },
    { path: '**', redirectTo: '' }
];

