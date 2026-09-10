import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval, switchMap } from 'rxjs';
import { OwnerAuthService } from '../../services/owner-auth.service';
import {
  SalonApiService,
  type Booking,
  type BookingStatus
} from '../../services/salon-api.service';

const POLL_INTERVAL_MS = 5000;

const STATUS_LABELS: Record<BookingStatus, string> = {
  Pending: 'รอการยืนยัน',
  Confirmed: 'ยืนยันแล้ว',
  Completed: 'เสร็จสิ้น',
  Cancelled: 'ยกเลิก'
};

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม'
];

@Component({
  selector: 'app-booking-management',
  standalone: true,
  templateUrl: './booking-management.html',
  styleUrl: './booking-management.scss'
})
export class BookingManagement implements OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(OwnerAuthService);
  private readonly api = inject(SalonApiService);

  readonly isAuthenticated = this.auth.isAuthenticated;

  pin = signal('');
  loginError = signal<string | null>(null);
  isLoggingIn = signal(false);

  bookings = signal<Booking[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);
  isUpdatingId = signal<number | null>(null);
  priceSavingId = signal<number | null>(null);
  editingPriceId = signal<number | null>(null);
  actionError = signal<string | null>(null);

  priceDrafts = signal<Record<number, string>>({});

  searchText = signal('');
  filterDate = signal('');
  filterStatus = signal<BookingStatus | ''>('');

  pendingFromPoll = signal<Booking[]>([]);
  pendingCount = computed(() => this.pendingFromPoll().length);

  private pollSub: Subscription | null = null;

  constructor() {
    if (this.isAuthenticated()) {
      this.loadBookings();
      this.startPolling();
    }
  }

  statusLabels(status: BookingStatus): string {
    return STATUS_LABELS[status];
  }

  login(): void {
    const pin = this.pin().trim();
    if (!pin) {
      this.loginError.set('กรุณากรอกรหัส');
      return;
    }
    this.loginError.set(null);
    this.isLoggingIn.set(true);
    this.auth.login(pin).subscribe({
      next: () => {
        this.isLoggingIn.set(false);
        this.loadBookings();
        this.startPolling();
      },
      error: err => {
        this.isLoggingIn.set(false);
        this.loginError.set((err?.error?.message as string | undefined) ?? 'รหัสไม่ถูกต้อง');
      }
    });
  }

  private startPolling(): void {
    if (this.pollSub) {
      return;
    }
    this.pollSub = interval(POLL_INTERVAL_MS)
      .pipe(switchMap(() => this.api.getBookings({ status: 'Pending' })))
      .subscribe({
        next: pendingBookings => {
          this.pendingFromPoll.set(pendingBookings);
          if (this.isUpdatingId() === null) {
            this.loadBookings(true);
          }
        },
        error: () => undefined
      });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  logout(): void {
    this.stopPolling();
    this.auth.logout();
    this.bookings.set([]);
    this.pendingFromPoll.set([]);
    this.priceDrafts.set({});
    this.editingPriceId.set(null);
    this.pin.set('');
    this.loginError.set(null);
    this.loadError.set(null);
    this.actionError.set(null);
  }

  applyFilters(): void {
    this.loadBookings();
  }

  clearFilters(): void {
    this.searchText.set('');
    this.filterDate.set('');
    this.filterStatus.set('');
    this.loadBookings();
  }

  loadBookings(silent = false): void {
    if (!silent) {
      this.isLoading.set(true);
      this.loadError.set(null);
      this.actionError.set(null);
    }

    const params: { date?: string; status?: BookingStatus; search?: string } = {};
    const date = this.filterDate();
    const status = this.filterStatus();
    const search = this.searchText().trim();

    if (date) {
      params.date = date;
    }
    if (status) {
      params.status = status;
    }
    if (search) {
      params.search = search;
    }

    this.api.getBookings(params).subscribe({
      next: bookings => {
        this.bookings.set(bookings);
        if (!silent) {
          this.isLoading.set(false);
        }
      },
      error: () => {
        if (!silent) {
          this.isLoading.set(false);
          this.loadError.set('ไม่สามารถโหลดรายการจองได้ กรุณาลองใหม่ภายหลัง');
        }
      }
    });
  }

  changeStatus(booking: Booking, status: BookingStatus): void {
    if (this.isUpdatingId() !== null || this.priceSavingId() !== null) {
      return;
    }
    this.actionError.set(null);
    this.isUpdatingId.set(booking.id);
    this.api.updateBookingStatus(booking.id, status).subscribe({
      next: updated => {
        this.isUpdatingId.set(null);
        this.bookings.update(list => list.map(b => (b.id === updated.id ? updated : b)));
      },
      error: err => {
        this.isUpdatingId.set(null);
        this.actionError.set((err?.error?.message as string | undefined) ?? 'ไม่สามารถเปลี่ยนสถานะได้');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatDate(bookingDate: string): string {
    const [y, m, d] = bookingDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
  }

  formatTime(time: string): string {
    return time.slice(0, 5);
  }

  setPriceDraft(bookingId: number, value: string): void {
    this.priceDrafts.update(drafts => ({ ...drafts, [bookingId]: value }));
  }

  priceInputValue(booking: Booking): string {
    const draft = this.priceDrafts()[booking.id];
    return draft !== undefined && draft !== '' ? draft : '';
  }

  priceHasDraft(bookingId: number): boolean {
    const draft = this.priceDrafts()[bookingId];
    return draft !== undefined && draft !== '';
  }

  isEditingPrice(bookingId: number): boolean {
    return this.editingPriceId() === bookingId;
  }

  editPrice(booking: Booking): void {
    this.actionError.set(null);
    this.editingPriceId.set(booking.id);
    if (booking.price !== null && booking.price !== undefined && !this.priceHasDraft(booking.id)) {
      this.setPriceDraft(booking.id, String(booking.price));
    }
  }

  savedPriceLabel(booking: Booking): string {
    return `${booking.price?.toLocaleString('th-TH')}฿`;
  }

  priceReferenceLabel(booking: Booking): string {
    const min = booking.serviceMinPrice.toLocaleString('th-TH');
    if (booking.serviceMinPrice === booking.serviceMaxPrice) {
      return `${min}฿`;
    }
    return `${min} - ${booking.serviceMaxPrice.toLocaleString('th-TH')}฿`;
  }

  savePrice(booking: Booking): void {
    if (this.isUpdatingId() !== null || this.priceSavingId() !== null) {
      return;
    }

    const raw =
      this.priceHasDraft(booking.id)
        ? this.priceDrafts()[booking.id]
        : booking.price !== null && booking.price !== undefined
          ? String(booking.price)
          : '';

    if (raw.trim() === '') {
      this.actionError.set('กรุณากรอกราคาที่เก็บจริง');
      return;
    }

    const price = Number(raw.replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) {
      this.actionError.set('ราคาต้องเป็นตัวเลขที่ไม่ติดลบ');
      return;
    }

    this.actionError.set(null);
    this.priceSavingId.set(booking.id);
    this.api.updateBookingPrice(booking.id, price).subscribe({
      next: updated => {
        this.priceSavingId.set(null);
        this.editingPriceId.set(null);
        this.bookings.update(list => list.map(b => (b.id === updated.id ? updated : b)));
        this.clearPriceDraft(booking.id);
      },
      error: err => {
        this.priceSavingId.set(null);
        this.actionError.set((err?.error?.message as string | undefined) ?? 'ไม่สามารถบันทึกราคาได้');
      }
    });
  }

  private clearPriceDraft(bookingId: number): void {
    this.priceDrafts.update(drafts => {
      if (!(bookingId in drafts)) {
        return drafts;
      }
      const { [bookingId]: _removed, ...rest } = drafts;
      return rest;
    });
  }
}