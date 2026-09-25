import { calculateFinancialLine } from '../src/modules/finance/finance.service';

describe('Financial calculations', () => {
  it('calculates discount, VAT base and total', () => {
    expect(calculateFinancialLine({ label: 'Acte', quantity: 2, unitPriceHt: 100, discountRate: 10, vatRate: 20 })).toEqual({ discountValue: 20, baseHt: 180, vatBase: 180, vatAmount: 36, totalTtc: 216 });
  });
});
