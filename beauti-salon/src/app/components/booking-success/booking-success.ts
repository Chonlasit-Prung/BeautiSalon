import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { SalonApiService, type BookingStatus } from '../../services/salon-api.service';

interface BookingData {
  bookingId?: number;
  bookingCode?: string;
  service?: { nameTh: string; nameEn: string; price?: string; icon?: string };
  dateLabel?: string;
  time?: string;
  name?: string;
  phone?: string;
}

const POLL_INTERVAL_MS = 3000;

@Component({
  selector: 'app-booking-success',
  standalone: true,
  templateUrl: './booking-success.html',
  styleUrl: './booking-success.scss'
})
export class BookingSuccess implements OnDestroy {
  private readonly router = inject(Router);
  private readonly api = inject(SalonApiService);

  booking = signal<BookingData>({});
  status = signal<BookingStatus>('Pending');
  isPolling = signal(false);

  private pollSub: Subscription | null = null;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state ?? {}) as BookingData;
    this.booking.set(state);
    this.startPolling();
  }

  private startPolling(): void {
    const bookingId = this.booking().bookingId;
    if (!bookingId) {
      return;
    }

    this.isPolling.set(true);
    this.pollSub = interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.api.getBookingById(bookingId))
      )
      .subscribe({
        next: booking => {
          this.booking.update(b => ({ ...b, bookingCode: booking.bookingCode }));
          this.status.set(booking.status);
          if (booking.status !== 'Pending') {
            this.stopPolling();
          }
        },
        error: () => {
          this.stopPolling();
        }
      });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this.isPolling.set(false);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}