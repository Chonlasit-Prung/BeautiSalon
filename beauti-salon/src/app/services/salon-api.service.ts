import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SalonService {
  id: number;
  nameTh: string;
  nameEn: string;
  description: string | null;
  minPrice: number;
  maxPrice: number;
  durationMinutes: number;
  imageUrl: string | null;
}

export interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Booking {
  id: number;
  bookingCode: string;
  customerId: number;
  customerName: string;
  customerPhoneNumber: string;
  serviceId: number;
  serviceName: string;
  serviceMinPrice: number;
  serviceMaxPrice: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  price: number | null;
}

export interface TakenSlot {
  startTime: string;
  endTime: string;
}

export interface BookingAvailability {
  date: string;
  taken: TakenSlot[];
}

export interface CreateCustomerPayload {
  name: string;
  phoneNumber: string;
  email?: string | null;
}

export interface CreateBookingPayload {
  customerId: number;
  serviceId: number;
  bookingDate: string;
  startTime: string;
}

export interface BookingQueryParams {
  date?: string;
  status?: BookingStatus;
  search?: string;
}

export interface OwnerLoginResponse {
  token: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class SalonApiService {
  private readonly http = inject(HttpClient);

  private api(path: string): string {
    return environment.apiUrl ? `${environment.apiUrl}${path}` : path;
  }

  getServices(): Observable<SalonService[]> {
    return this.http.get<SalonService[]>(this.api('/api/v1/services'));
  }

  getAvailability(date: string): Observable<BookingAvailability> {
    return this.http.get<BookingAvailability>(this.api('/api/v1/bookings/availability'), {
      params: { date }
    });
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(this.api(`/api/v1/bookings/${id}`));
  }

  getBookings(params: BookingQueryParams = {}): Observable<Booking[]> {
    let httpParams = new HttpParams();
    if (params.date) {
      httpParams = httpParams.set('date', params.date);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<Booking[]>(this.api('/api/v1/bookings'), { params: httpParams });
  }

  updateBookingStatus(id: number, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(this.api(`/api/v1/bookings/${id}/status`), { status });
  }

  updateBookingPrice(id: number, price: number): Observable<Booking> {
    return this.http.patch<Booking>(this.api(`/api/v1/bookings/${id}/price`), { price });
  }

  ownerLogin(pin: string): Observable<OwnerLoginResponse> {
    return this.http.post<OwnerLoginResponse>(this.api('/api/v1/auth/owner'), { pin });
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.api('/api/v1/customers'));
  }

  createCustomer(payload: CreateCustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.api('/api/v1/customers'), payload);
  }

  createBooking(payload: CreateBookingPayload): Observable<Booking> {
    return this.http.post<Booking>(this.api('/api/v1/bookings'), payload);
  }
}