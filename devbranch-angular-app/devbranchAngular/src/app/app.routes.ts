import { Routes } from '@angular/router';
import { TitleScreenComponent } from './components/title-screen/title-screen.component';
import { RoomComponent } from './components/room/room.component';
import { EndingComponent } from './components/ending/ending.component';
import { AboutComponent } from './components/about/about.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
    { path: '', component: TitleScreenComponent },
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'investigate', component: RoomComponent },
    { path: 'ending', component: EndingComponent },
    { path: 'about', component: AboutComponent },
    { path: '**', redirectTo: '' }
];
