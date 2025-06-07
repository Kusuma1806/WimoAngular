import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverallTransactionSummaryComponent } from './overall-transaction-summary.component';

describe('OverallTransactionSummaryComponent', () => {
  let component: OverallTransactionSummaryComponent;
  let fixture: ComponentFixture<OverallTransactionSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverallTransactionSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverallTransactionSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
