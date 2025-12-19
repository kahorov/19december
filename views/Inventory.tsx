import React, { useEffect, useState } from 'react';
import { db } from '../services/storage';
import { Part } from '../types';
import { Modal } from '../components/Modal';

export const Inventory: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 0, quantity: 0, category: '' });

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    const data = await db.getParts();
    setParts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addPart(formData);
    setFormData({ name: '', price: 0, quantity: 0, category: '' });
    setIsModalOpen(false);
    loadParts();
  };

  const handleUpdateQuantity = async (id: string, newQty: number) => {
    if (newQty < 0) return;
    await db.updatePart(id, { quantity: newQty });
    loadParts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Склад запчастей</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Добавить товар
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parts.map(part => (
          <div key={part.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{part.category}</span>
                <span className="font-bold text-lg text-gray-900">{part.price} ₽</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{part.name}</h3>
              <p className={`text-sm font-medium ${part.quantity < 3 ? 'text-red-500' : 'text-green-600'}`}>
                {part.quantity === 0 ? 'Нет в наличии' : `В наличии: ${part.quantity} шт.`}
              </p>
            </div>
            
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-gray-500">Управление остатком:</span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleUpdateQuantity(part.id, part.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{part.quantity}</span>
                <button 
                  onClick={() => handleUpdateQuantity(part.id, part.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Добавить запчасть">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input 
              required
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
              <input 
                required
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.price || ''}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
              <input 
                required
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.quantity || ''}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
            <input 
              type="text"
              placeholder="Например: Экраны"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">
            Сохранить
          </button>
        </form>
      </Modal>
    </div>
  );
};