import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, concatMap, of, throwError } from 'rxjs';
import {
  SalonApiService,
  type Customer,
  type CreateCustomerPayload,
  type SalonService,
  type TakenSlot
} from '../../services/salon-api.service';
import { serviceEmoji } from '../../utils/service-emoji';

interface DaySlot {
  date: Date;
  num: number;
  dayTh: string;
  isPast: boolean;
}

interface TimeOption {
  time: string;
  unavailable: boolean;
  past: boolean;
}

const OPEN_HOUR_START = 9;
const OPEN_HOUR_END = 20;
const MAX_AHEAD_MONTHS = 3;

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_FULL_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
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
  selector: 'app-booking-page',
  standalone: true,
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.scss'
})
export class BookingPage {
  private readonly router = inject(Router);
  private readonly api = inject(SalonApiService);

  services = signal<SalonService[]>([]);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  selectedService = signal<SalonService | null>(null);
  selectedDate = signal<Date>(this.today());
  currentMonth = signal<Date>(new Date());
  bookedSlots = signal<TakenSlot[]>([]);
  slotsLoading = signal(false);
  slotsError = signal<string | null>(null);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  selectedTime = signal<string>(this.firstAvailableTime(new Date()));
  name = signal('');
  phone = signal('');

  isServiceOpen = signal(false);
  failedImages = signal<Set<number>>(new Set());

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      this.loadBookedSlots(date);
    });
    this.loadServices();
  }

  days = computed<DaySlot[]>(() => this.buildDaySlots(this.currentMonth()));

  isPrevDisabled = computed(
    (): boolean =>
      this.currentMonth().getFullYear() === this.today().getFullYear() &&
      this.currentMonth().getMonth() === this.today().getMonth()
  );

  isNextDisabled = computed((): boolean => {
    const month = this.currentMonth();
    const now = new Date();
    const limit = new Date(now.getFullYear(), now.getMonth() + MAX_AHEAD_MONTHS, 1);
    return month >= limit;
  });

  monthLabel = computed((): string => {
    const month = this.currentMonth();
    return `${THAI_MONTHS[month.getMonth()]} ${month.getFullYear() + 543}`;
  });

  times = computed<TimeOption[]>(() => {
    const now = new Date();
    const isToday = this.isSameDate(this.selectedDate(), now);
    const slots: TimeOption[] = [];
    for (let h = OPEN_HOUR_START; h <= OPEN_HOUR_END; h++) {
      for (const m of [0, 30]) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        slots.push({
          time,
          unavailable: this.isSlotBooked(time),
          past: isToday && this.isTimeBeforeNow(time, now)
        });
      }
    }
    return slots;
  });

  private loadServices(): void {
    this.api.getServices().subscribe({
      next: services => {
        this.services.set(services);
        this.isLoading.set(false);
        if (services.length > 0) {
          this.selectedService.set(services[0]);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('ไม่สามารถโหลดรายการบริการได้ กรุณาลองใหม่ภายหลัง');
      }
    });
  }

  private loadBookedSlots(date: Date): void {
    this.slotsLoading.set(true);
    this.slotsError.set(null);
    this.api.getAvailability(this.formatDateParam(date)).subscribe({
      next: availability => {
        this.bookedSlots.set(availability.taken);
        this.slotsLoading.set(false);
        const current = this.selectedTime();
        if (this.isSlotBooked(current)) {
          const next = this.firstAvailableTime(date);
          if (next !== current) {
            this.selectedTime.set(next);
          }
        }
      },
      error: () => {
        this.slotsLoading.set(false);
        this.slotsError.set('ไม่สามารถโหลดช่วงเวลาที่จองได้');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleServiceMenu(): void {
    this.isServiceOpen.update(v => !v);
  }

  selectService(service: SalonService): void {
    this.selectedService.set(service);
    this.isServiceOpen.set(false);
  }

  isDateSelected(date: Date): boolean {
    return this.isSameDate(date, this.selectedDate());
  }

  isDateDisabled(date: Date): boolean {
    const today = this.today();
    if (this.isSameMonth(date, today)) {
      return date < today;
    }
    return false;
  }

  selectDate(date: Date): void {
    if (this.isDateDisabled(date)) {
      return;
    }
    this.selectedDate.set(date);
    this.selectedTime.set(this.firstAvailableTime(date));
    this.submitError.set(null);
  }

  prevMonth(): void {
    if (this.isPrevDisabled()) {
      return;
    }
    const month = this.currentMonth();
    this.currentMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    this.resetSelectionForMonth();
  }

  nextMonth(): void {
    if (this.isNextDisabled()) {
      return;
    }
    const month = this.currentMonth();
    this.currentMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    this.resetSelectionForMonth();
  }

  selectTime(time: TimeOption): void {
    if (time.unavailable || time.past) {
      return;
    }
    this.selectedTime.set(time.time);
    this.submitError.set(null);
  }

  emojiFor(index: number): string {
    return serviceEmoji(index);
  }

  emojiForService(service: SalonService): string {
    return serviceEmoji(this.services().indexOf(service));
  }

  markImageFailed(id: number): void {
    this.failedImages.update(failed => {
      failed.add(id);
      return new Set(failed);
    });
  }

  imageFailed(id: number): boolean {
    return this.failedImages().has(id);
  }

  priceLabel(service: SalonService): string {
    const min = service.minPrice.toLocaleString('th-TH');
    if (service.minPrice === service.maxPrice) {
      return min;
    }
    return `${min} - ${service.maxPrice.toLocaleString('th-TH')}`;
  }

  confirmBooking(): void {
    const service = this.selectedService();
    const date = this.selectedDate();
    const time = this.selectedTime();
    const name = this.name().trim();
    const phone = this.phone().trim();

    if (!name) {
      this.submitError.set('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!phone) {
      this.submitError.set('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!service || !time || this.isSlotBooked(time)) {
      this.submitError.set('กรุณาเลือกบริการและช่วงเวลาที่ว่างก่อนยืนยันการจอง');
      return;
    }

    this.submitError.set(null);
    this.isSubmitting.set(true);

    this.findOrCreateCustomer({ name, phoneNumber: phone })
      .pipe(
        concatMap(customer =>
          this.api.createBooking({
            customerId: customer.id,
            serviceId: service.id,
            bookingDate: this.formatDateParam(date),
            startTime: `${time}:00`
          })
        )
      )
      .subscribe({
        next: booking => {
          this.isSubmitting.set(false);
          this.loadBookedSlots(date);
          this.router.navigate(['/booking/success'], {
            state: {
              bookingId: booking.id,
              bookingCode: booking.bookingCode,
              service: {
                nameTh: service.nameTh,
                nameEn: service.nameEn
              },
              dateLabel: this.formatThaiFullDate(date),
              time,
              name,
              phone
            }
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          const message = err?.error?.message as string | undefined;
          if (message) {
            this.submitError.set(message);
          } else {
            this.submitError.set('ไม่สามารถยืนยันการจองได้ กรุณาลองใหม่ภายหลัง');
          }
          this.loadBookedSlots(date);
        }
      });
  }

  // Helpers
  private findOrCreateCustomer(payload: CreateCustomerPayload): Observable<Customer> {
    return this.api.getCustomers().pipe(
      concatMap(customers => {
        const existing = this.findCustomerByPhone(customers, payload.phoneNumber);
        if (existing) {
          return of(existing);
        }
        return this.api.createCustomer(payload).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 400) {
              return this.api.getCustomers().pipe(
                concatMap(cs => {
                  const match = this.findCustomerByPhone(cs, payload.phoneNumber);
                  return match ? of(match) : throwError(() => err);
                })
              );
            }
            return throwError(() => err);
          })
        );
      })
    );
  }

  private findCustomerByPhone(customers: Customer[], phone: string): Customer | undefined {
    const normalized = phone.replace(/\D/g, '');
    return customers.find(c => c.phoneNumber.replace(/\D/g, '') === normalized);
  }

  private isSlotBooked(time: string): boolean {
    const duration = this.selectedService()?.durationMinutes ?? 30;
    const start = this.toMinutes(time);
    const end = start + duration;
    return this.bookedSlots().some(slot => {
      const bs = this.toMinutes(slot.startTime.slice(0, 5));
      const be = this.toMinutes(slot.endTime.slice(0, 5));
      return start < be && end > bs;
    });
  }

  private today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private buildDaySlots(month: Date): DaySlot[] {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = this.today();
    const slots: DaySlot[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIndex, d);
      slots.push({
        date,
        num: d,
        dayTh: THAI_DAYS[date.getDay()],
        isPast: this.isSameMonth(date, today) && date < today
      });
    }
    return slots;
  }

  private firstAvailableTime(date: Date): string {
    const now = new Date();
    const isToday = this.isSameDate(date, now);
    for (let h = OPEN_HOUR_START; h <= OPEN_HOUR_END; h++) {
      for (const m of [0, 30]) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        if (this.isSlotBooked(time)) {
          continue;
        }
        if (isToday && this.isTimeBeforeNow(time, now)) {
          continue;
        }
        return time;
      }
    }
    return '20:00';
  }

  private resetSelectionForMonth(): void {
    const month = this.currentMonth();
    const today = this.today();
    let firstEnabled: Date;
    if (
      month.getFullYear() === today.getFullYear() &&
      month.getMonth() === today.getMonth()
    ) {
      firstEnabled = today;
    } else {
      firstEnabled = new Date(month.getFullYear(), month.getMonth(), 1);
    }
    this.selectedDate.set(firstEnabled);
    this.selectedTime.set(this.firstAvailableTime(firstEnabled));
  }

  private isSameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private isSameMonth(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth()
    );
  }

  private isTimeBeforeNow(time: string, now: Date): boolean {
    const [hh, mm] = time.split(':').map(Number);
    return hh < now.getHours() || (hh === now.getHours() && mm <= now.getMinutes());
  }

  private toMinutes(time: string): number {
    const [hh, mm] = time.split(':').map(Number);
    return hh * 60 + mm;
  }

  private formatDateParam(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatThaiFullDate(date: Date): string {
    return `${THAI_FULL_DAYS[date.getDay()]}ที่ ${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
  }
}