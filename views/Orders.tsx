import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../services/storage';
import { Order, Client, Part, OrderStatus, STATUS_LABELS, STATUS_COLORS, calculateOrderTotal } from '../types';
import { Modal } from '../components/Modal';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New Order Form State
  const [newOrderClient, setNewOrderClient] = useState('');
  const [newOrderModel, setNewOrderModel] = useState('');
  const [newOrderIssue, setNewOrderIssue] = useState('');

  // Editing Order State
  const [laborCostInput, setLaborCostInput] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [o, c, p] = await Promise.all([db.getOrders(), db.getClients(), db.getParts()]);
    setOrders(o);
    setClients(c);
    setParts(p);
    setLoading(false);
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Неизвестный';

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderClient || !newOrderModel || !newOrderIssue) return;
    
    await db.addOrder({
      client_id: newOrderClient,
      model: newOrderModel,
      issue_description: newOrderIssue,
      status: 'received',
      notes: ''
    });
    
    setIsAddModalOpen(false);
    setNewOrderClient('');
    setNewOrderModel('');
    setNewOrderIssue('');
    fetchData();
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await db.updateOrder(orderId, { status: newStatus });
    
    if (newStatus === 'ready' || newStatus === 'completed') {
      // Mock Notification
      alert(`Уведомление отправлено клиенту: Ваш заказ #${orderId} готов!`);
    }
    
    fetchData();
    if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });
  };

  const handleUpdateLaborCost = async () => {
    if (!selectedOrder) return;
    await db.updateOrder(selectedOrder.id, { labor_cost: laborCostInput });
    setSelectedOrder({...selectedOrder, labor_cost: laborCostInput});
    fetchData();
  };

  const handleAddPartToOrder = async (partId: string) => {
    if (!selectedOrder) return;
    const part = parts.find(p => p.id === partId);
    if (!part || part.quantity <= 0) return alert("Нет в наличии");

    // Decrement stock
    await db.updatePart(partId, { quantity: part.quantity - 1 });
    
    // Add to order parts
    const currentParts = [...selectedOrder.parts];
    const existingIndex = currentParts.findIndex(p => p.part_id === partId);
    
    if (existingIndex >= 0) {
      currentParts[existingIndex].quantity += 1;
    } else {
      currentParts.push({
        part_id: part.id,
        name: part.name,
        price_at_add: part.price,
        quantity: 1
      });
    }

    await db.updateOrder(selectedOrder.id, { parts: currentParts });
    setSelectedOrder({...selectedOrder, parts: currentParts});
    fetchData(); // refresh parts stock locally
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const clientName = getClientName(order.client_id).toLowerCase();
      const matchesSearch = 
        order.id.includes(searchTerm) || 
        order.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
        clientName.includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus, clients]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Заказы</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Новый заказ
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Поиск по ID, модели или клиенту..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
        >
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Клиент</th>
                  <th className="px-6 py-4">Устройство</th>
                  <th className="px-6 py-4">Неисправность</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Стоимость</th>
                  <th className="px-6 py-4">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Заказы не найдены</td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getClientName(order.client_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{order.model}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{order.issue_description}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {calculateOrderTotal(order).toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setLaborCostInput(order.labor_cost);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Регистрация нового заказа">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
            <select 
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              value={newOrderClient}
              onChange={(e) => setNewOrderClient(e.target.value)}
            >
              <option value="">Выберите клиента</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Модель ноутбука</label>
            <input 
              required
              type="text"
              placeholder="Например, ASUS TUF Gaming"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              value={newOrderModel}
              onChange={(e) => setNewOrderModel(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание проблемы</label>
            <textarea 
              required
              placeholder="Что случилось?"
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              value={newOrderIssue}
              onChange={(e) => setNewOrderIssue(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Создать заказ
          </button>
        </form>
      </Modal>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Заказ #${selectedOrder.id}`}>
          <div className="space-y-6">
            
            {/* Status Bar */}
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                 <p className="text-sm text-gray-500">Текущий статус</p>
                 <span className={`text-lg font-bold ${STATUS_COLORS[selectedOrder.status].split(' ')[1]}`}>
                   {STATUS_LABELS[selectedOrder.status]}
                 </span>
               </div>
               <div className="flex gap-2">
                 {selectedOrder.status === 'received' && (
                   <button onClick={() => handleStatusChange(selectedOrder.id, 'in_progress')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">Начать работу</button>
                 )}
                 {selectedOrder.status === 'in_progress' && (
                   <button onClick={() => handleStatusChange(selectedOrder.id, 'ready')} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Готов</button>
                 )}
                 {selectedOrder.status === 'ready' && (
                   <button onClick={() => handleStatusChange(selectedOrder.id, 'completed')} className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm">Выдать</button>
                 )}
               </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Клиент</p>
                <p className="text-gray-900">{getClientName(selectedOrder.client_id)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Модель</p>
                <p className="text-gray-900">{selectedOrder.model}</p>
              </div>
              <div className="col-span-2">
                 <p className="text-sm font-medium text-gray-500">Проблема</p>
                 <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedOrder.issue_description}</p>
              </div>
            </div>

            {/* Parts & Cost */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Запчасти и работы</h4>
              
              {selectedOrder.parts.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {selectedOrder.parts.map((p, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span>{p.name} x{p.quantity}</span>
                      <span>{(p.price_at_add * p.quantity).toLocaleString()} ₽</span>
                    </li>
                  ))}
                </ul>
              )}

              {selectedOrder.status === 'in_progress' && (
                 <div className="flex gap-2 mb-4">
                   <select 
                     className="flex-1 text-sm border rounded p-1"
                     onChange={(e) => {
                       if(e.target.value) handleAddPartToOrder(e.target.value);
                       e.target.value = "";
                     }}
                   >
                     <option value="">+ Добавить запчасть со склада</option>
                     {parts.filter(p => p.quantity > 0).map(p => (
                       <option key={p.id} value={p.id}>{p.name} ({p.price} ₽) - Ост: {p.quantity}</option>
                     ))}
                   </select>
                 </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-700">Стоимость работ:</span>
                <div className="flex items-center">
                  <input 
                     type="number" 
                     className="w-24 text-right border rounded p-1 mr-2"
                     value={laborCostInput}
                     onChange={(e) => setLaborCostInput(Number(e.target.value))}
                     disabled={selectedOrder.status === 'completed'}
                  />
                  <span className="text-gray-500">₽</span>
                  {selectedOrder.status !== 'completed' && selectedOrder.labor_cost !== laborCostInput && (
                    <button onClick={handleUpdateLaborCost} className="ml-2 text-xs text-blue-600 hover:underline">Сохранить</button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                <span>Итого к оплате:</span>
                <span>{calculateOrderTotal({ ...selectedOrder, labor_cost: laborCostInput }).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};