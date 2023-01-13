import { Expose } from 'class-transformer';
import { TransformOrderType } from '../../decorators';
import { ExchangeType, OrderType } from '../common';

export class ModifyOrderParams {
  exchange: ExchangeType;
  tradingSymbol: string;
  quantity: number;
  price: number;
  triggerPrice?: number;
  validity?: string;

  @TransformOrderType()
  orderType: OrderType;
}
