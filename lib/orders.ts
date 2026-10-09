import { db } from './db';
import { recordAction } from './log';

export type Order = {
  orderId: string;
  productName: string;
  shippingStatus: string;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  currency: string;
  totalAmount: number;
};

// Both filters come from the session or API key, never from the message; an order ID only narrows the query.
export async function getCustomerOrders(tenantId: string, customerId: string, orderId?: string, requestId?: string): Promise<Order[]> {
  let query = db().collection('demo_orders').where('tenantId', '==', tenantId).where('customerId', '==', customerId);
  if (orderId) query = query.where('orderId', '==', orderId);
  const snap = await query.limit(10).get();
  const orders = snap.docs.map(d => ({
    orderId: String(d.get('orderId') ?? d.id),
    productName: String(d.get('productName') ?? ''),
    shippingStatus: String(d.get('shippingStatus') ?? ''),
    trackingNumber: (d.get('trackingNumber') as string | null | undefined) ?? null,
    estimatedDelivery: (d.get('estimatedDelivery') as string | null | undefined) ?? null,
    currency: String(d.get('currency') ?? 'LKR'),
    totalAmount: Number(d.get('totalAmount') ?? 0),
  }));
  await recordAction({ tenantId, userId: customerId, requestId, type: 'database', status: 'ok', details: { orderId: orderId ?? null, count: orders.length } });
  return orders;
}

export function describeOrder(o: Order): string {
  const tracking = o.trackingNumber ? `Tracking reference: ${o.trackingNumber}.` : 'No tracking reference is available yet.';
  const delivery = o.estimatedDelivery ? `Estimated delivery: ${o.estimatedDelivery}.` : 'A delivery date has not been confirmed yet.';
  return `${o.productName} (${o.orderId}) is ${o.shippingStatus.toLowerCase()}. ${tracking} ${delivery}`;
}
