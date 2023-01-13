import { ExchangeType, OrderType, ProductType, TransactionType } from '../common';
import { Expose, plainToClass, Transform } from 'class-transformer';
import { TransformOrderType, TransformProduct } from '../../decorators';

export class CreateOrderParams {
  exchange: ExchangeType;
  tradingSymbol: string;
  transactionType: TransactionType;
  quantity: number;
  price: number;
  triggerPrice?: number;
  disclosedQuantity: number;

  validity?: string;
  tag?: string;

  @TransformProduct()
  product: ProductType;

  @TransformOrderType()
  orderType: OrderType;

  constructor(partial?: Partial<CreateOrderParams>) {
    Object.assign(this, partial);
  }
}
