import { canTransitionPrescription } from '../src/modules/prescriptions/prescriptions.service';

describe('Prescription workflow', () => {
  it('allows draft to signed and signed to dispensed', () => {
    expect(canTransitionPrescription('DRAFT', 'SIGNED')).toBe(true);
    expect(canTransitionPrescription('SIGNED', 'DISPENSED')).toBe(true);
  });

  it('does not allow editing a dispensed prescription', () => {
    expect(canTransitionPrescription('DISPENSED', 'SIGNED')).toBe(false);
    expect(canTransitionPrescription('CANCELLED', 'SIGNED')).toBe(false);
  });
});
