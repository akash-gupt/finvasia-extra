import { Transform, TransformFnParams } from 'class-transformer';

export function TransformProduct() {
  return Transform(({ value }) => {
    switch (value.toUpperCase()) {
      case 'NRML':
        return 'M';
      case 'MIS':
        return 'I';
      case 'CNC':
        return 'C';
      default:
        return value;
    }
  });
}
