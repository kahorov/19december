export type OrderStatus = 'received' | 'in_progress' | 'ready' | 'completed';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Part {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface OrderPart {
  part_id: string;
  quantity: number;
  price_at_add: number; // Price might change, capture it at time of add
  name: string;
}

export interface Order {
  id: string;
  client_id: string;
  model: string;
  issue_description: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  parts: OrderPart[];
  labor_cost: number;
  notes: string;
}

// Helper to calculate total
export const calculateOrderTotal = (order: Order): number => {
  const partsTotal = order.parts.reduce((sum, item) => sum + (item.price_at_add * item.quantity), 0);
  return partsTotal + (order.labor_cost || 0);
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Принят',
  in_progress: 'В работе',
  ready: 'Готов к выдаче',
  completed: 'Выдан'
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  received: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800'
};