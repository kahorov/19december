import { Client, Order, Part, OrderStatus } from '../types';

// Initial mock data to populate the app if empty
const INITIAL_CLIENTS: Client[] = [
  { id: '1', name: 'Алексей Петров', phone: '+7 999 123-45-67', email: 'alex@example.com', created_at: new Date().toISOString() },
  { id: '2', name: 'Мария Иванова', phone: '+7 999 987-65-43', email: 'maria@example.com', created_at: new Date().toISOString() },
];

const INITIAL_PARTS: Part[] = [
  { id: '1', name: 'SSD Samsung 500GB', price: 5500, quantity: 5, category: 'Накопители' },
  { id: '2', name: 'Матрица 15.6" IPS', price: 8000, quantity: 2, category: 'Экраны' },
  { id: '3', name: 'Термопаста Arctic MX-4', price: 800, quantity: 15, category: 'Расходники' },
  { id: '4', name: 'Клавиатура MacBook Pro', price: 12000, quantity: 1, category: 'Клавиатуры' },
  { id: '5', name: 'ОЗУ DDR4 8GB', price: 3200, quantity: 8, category: 'Память' },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: '1001',
    client_id: '1',
    model: 'MacBook Pro 13 2019',
    issue_description: 'Греется, шумит вентилятор',
    status: 'received',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    parts: [],
    labor_cost: 0,
    notes: ''
  },
  {
    id: '1002',
    client_id: '2',
    model: 'Asus ROG Zephyrus',
    issue_description: 'Не включается после залития',
    status: 'in_progress',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    parts: [
      { part_id: '3', quantity: 1, price_at_add: 800, name: 'Термопаста Arctic MX-4' }
    ],
    labor_cost: 5000,
    notes: 'Чистка платы завершена, требуется замена контроллера питания.'
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockStorage {
  private get<T>(key: string, initial: T): T {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  }

  private set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Clients
  async getClients(): Promise<Client[]> {
    await delay(300);
    return this.get<Client[]>('rf_clients', INITIAL_CLIENTS);
  }

  async findClientByPhone(phone: string): Promise<Client | undefined> {
    await delay(200);
    const clients = this.get<Client[]>('rf_clients', INITIAL_CLIENTS);
    return clients.find(c => c.phone === phone);
  }

  async addClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    await delay(300);
    const clients = this.get<Client[]>('rf_clients', INITIAL_CLIENTS);
    const newClient: Client = {
      ...client,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.set('rf_clients', [newClient, ...clients]);
    return newClient;
  }

  // Parts
  async getParts(): Promise<Part[]> {
    await delay(300);
    return this.get<Part[]>('rf_parts', INITIAL_PARTS);
  }

  async addPart(part: Omit<Part, 'id'>): Promise<Part> {
    await delay(300);
    const parts = this.get<Part[]>('rf_parts', INITIAL_PARTS);
    const newPart: Part = { ...part, id: Math.random().toString(36).substr(2, 9) };
    this.set('rf_parts', [newPart, ...parts]);
    return newPart;
  }

  async updatePart(id: string, updates: Partial<Part>): Promise<void> {
    await delay(200);
    const parts = this.get<Part[]>('rf_parts', INITIAL_PARTS);
    const updated = parts.map(p => p.id === id ? { ...p, ...updates } : p);
    this.set('rf_parts', updated);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    await delay(400);
    return this.get<Order[]>('rf_orders', INITIAL_ORDERS);
  }

  async addOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'parts' | 'labor_cost'>): Promise<Order> {
    await delay(400);
    const orders = this.get<Order[]>('rf_orders', INITIAL_ORDERS);
    const newOrder: Order = {
      ...order,
      id: (Math.floor(Math.random() * 9000) + 1000).toString(), // Simple 4 digit ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parts: [],
      labor_cost: 0,
      notes: ''
    };
    this.set('rf_orders', [newOrder, ...orders]);
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    await delay(300);
    const orders = this.get<Order[]>('rf_orders', INITIAL_ORDERS);
    let updatedOrder: Order | undefined;
    const newOrders = orders.map(o => {
      if (o.id === id) {
        updatedOrder = { ...o, ...updates, updated_at: new Date().toISOString() };
        return updatedOrder;
      }
      return o;
    });
    this.set('rf_orders', newOrders);
    if (!updatedOrder) throw new Error('Order not found');
    return updatedOrder;
  }
}

export const db = new MockStorage();