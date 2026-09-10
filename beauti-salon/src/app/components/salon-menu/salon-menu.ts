import { Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { type ElementRef } from '@angular/core';
import { SalonApiService, type SalonService } from '../../services/salon-api.service';
import { serviceEmoji } from '../../utils/service-emoji';

@Component({
  selector: 'app-salon-menu',
  standalone: true,
  templateUrl: './salon-menu.html',
  styleUrl: './salon-menu.scss'
})
export class SalonMenu {
  private readonly router = inject(Router);
  private readonly api = inject(SalonApiService);

  readonly menuPoster = viewChild<ElementRef<HTMLDivElement>>('menuPoster');

  isMenuOpen = signal(false);
  services = signal<SalonService[]>([]);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  isSaving = signal(false);
  saveError = signal<string | null>(null);
  failedImages = signal<Set<number>>(new Set());

  constructor() {
    this.loadServices();
  }

  menuItems = [
    { label: 'จองคิว', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h5v5H7v-5z', route: '/booking' },
    { label: 'จัดการการจอง', icon: 'M3 5h18v2H3V5zm0 6h12v2H3v-2zm0 6h10v2H3v-2zm15-4h2v4h4v2h-4v4h-2v-4h-4v-2h4v-4z', route: '/owner' },
    { label: 'เกี่ยวกับเรา', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z', route: '/about' }
  ];

  visibleMenuItems = this.menuItems;

  private loadServices(): void {
    this.api.getServices().subscribe({
      next: services => {
        this.services.set(services);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('ไม่สามารถโหลดข้อมูลบริการได้ กรุณาลองใหม่ภายหลัง');
      }
    });
  }

  emojiFor(index: number): string {
    return serviceEmoji(index);
  }

  priceLabel(service: SalonService): string {
    const min = service.minPrice.toLocaleString('th-TH');
    if (service.minPrice === service.maxPrice) {
      return min;
    }
    return `${min} - ${service.maxPrice.toLocaleString('th-TH')}`;
  }

  async saveMenuAsImage(): Promise<void> {
    if (this.isSaving() || this.services().length === 0) {
      return;
    }
    this.saveError.set(null);
    this.isSaving.set(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const poster = this.menuPoster()?.nativeElement;
      if (!poster) {
        throw new Error('poster not found');
      }
      const canvas = await html2canvas(poster, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        useCORS: true
      });
      const date = new Date();
      const stamp = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const link = document.createElement('a');
      link.download = `เมนูบริการ-${stamp}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
    } catch {
      this.saveError.set('ไม่สามารถสร้างภาพเมนูได้ กรุณาลองใหม่ภายหลัง');
    } finally {
      this.isSaving.set(false);
    }
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

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  navigateTo(route: string): void {
    this.closeMenu();
    if (route) {
      this.router.navigate([route]);
    }
  }
}