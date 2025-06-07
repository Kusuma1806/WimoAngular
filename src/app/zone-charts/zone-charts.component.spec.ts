import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneChartsComponent } from './zone-charts.component';

describe('ZoneChartsComponent', () => {
  let component: ZoneChartsComponent;
  let fixture: ComponentFixture<ZoneChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneChartsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoneChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
