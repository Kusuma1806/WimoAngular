import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token'); // ✅ Get the stored token
  // ✅ Skip authentication for login & registration
  if (req.url.includes('/auth/new') || req.url.includes('/auth/authenticate')) {
    return next(req);
  }

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req); // ✅ Continue without modifying the request if no token exists
};
