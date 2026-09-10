import { Routes } from '@angular/router';
import { SalonMenu } from './components/salon-menu/salon-menu';
import { BookingPage } from './components/booking-page/booking-page';
import { BookingSuccess } from './components/booking-success/booking-success';
import { BookingManagement } from './components/booking-management/booking-management';
import { AboutPage } from './components/about-page/about-page';

export const routes: Routes = [
  { path: '', component: SalonMenu },
  { path: 'booking', component: BookingPage },
  { path: 'booking/success', component: BookingSuccess },
  { path: 'owner', component: BookingManagement },
  { path: 'about', component: AboutPage },
];