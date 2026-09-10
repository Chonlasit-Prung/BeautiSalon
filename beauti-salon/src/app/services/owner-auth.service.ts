import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SalonApiService } from './salon-api.service';

const STORAGE_KEY = 'salon_owner_token';

@Injectable({ providedIn: 'root' })
export class OwnerAuthService {
  private readonly api = inject(SalonApiService);

  readonly token = signal<string | null>(sessionStorage.getItem(STORAGE_KEY));
  readonly isAuthenticated = computed(() => this.token() !== null);

  login(pin: string): Observable<{ token: string; expiresAt: string }> {
    return this.api.ownerLogin(pin).pipe(
      tap(response => {
        sessionStorage.setItem(STORAGE_KEY, response.token);
        this.token.set(response.token);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.token.set(null);
  }
}