import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OwnerAuthService } from '../services/owner-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(OwnerAuthService);
  const token = auth.token();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};