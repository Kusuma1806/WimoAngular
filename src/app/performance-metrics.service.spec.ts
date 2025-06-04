import { TestBed } from '@angular/core/testing';

import { PerformanceMetricsService } from './performance-metrics.service';

describe('PerformanceMetricsService', () => {
  let service: PerformanceMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerformanceMetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
