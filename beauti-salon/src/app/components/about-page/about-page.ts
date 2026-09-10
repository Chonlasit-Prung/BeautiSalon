import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-about-page',
  standalone: true,
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss'
})
export class AboutPage {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly mapEmbedUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://maps.google.com/maps?q=14.194932,100.598311&z=16&hl=th&output=embed'
    );
  readonly mapLinkUrl = 'https://www.google.com/maps?q=14.194932,100.598311';
  readonly phoneDisplay = '096-812-5571';
  readonly phoneHref = 'tel:0968125571';
  readonly facebookUrl = 'https://www.facebook.com/kitikorn.malingam?locale=th_TH';

  goBack(): void {
    this.router.navigate(['/']);
  }
}