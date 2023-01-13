import { Transform } from 'class-transformer';

export type FinvasiaOriginalOrderType = 'MKT';

export function TransformOrderType() {
  return Transform(({ value }) => {
    switch (value.toUpperCase()) {
      case 'M':
        return 'MKT';
      case 'L':
        return 'LMT';
      case 'SL':
        return 'SL-LMT';
      case 'SL-M':
        return 'SL-MKT';
      default:
        return value;
    }
  });
}
