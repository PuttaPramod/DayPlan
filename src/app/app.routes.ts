import { Routes } from '@angular/router';
import { Tasks } from './tasks/tasks';
import { Login } from './login/login.component';

export const routes: Routes = [
    { path: '', component: Tasks },
  { path: 'login', component: Login },
];
