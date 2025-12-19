import React, { useEffect, useState } from 'react';
import { StatsCard } from '../components/StatsCard';
import { db } from '../services/storage';
import { Order, Part, calculateOrderTotal } from '../types';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOrders: 0,
    revenue: 0,
    lowStock: 0,
    completedToday: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      const orders = await db.getOrders();
      const parts = await db.getParts();
      
      const active = orders.filter(o => o.status === 'received' || o.status === 'in_progress').length;
      
      // Calculate revenue (simplified: sum of all completed orders)
      const revenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + calculateOrderTotal(o), 0);
        
      const lowStock = parts.filter(p => p.quantity < 3).length;
      
      const today = new Date().toDateString();
      const completedToday = orders.filter(o => 
        o.status === 'completed' && new Date(o.updated_at).toDateString() === today
      ).length;

      setStats({ activeOrders: active, revenue, lowStock, completedToday });
      setLoading(false);
    };
    loadStats();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="h-40 bg-gray-200 w-full rounded"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Обзор мастерской</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="В работе" 
          value={stats.activeOrders} 
          icon={<span className="text-xl">🛠️</span>}
          color="blue"
        />
        <StatsCard 
          title="Выручка (всего)" 
          value={`${stats.revenue.toLocaleString('ru-RU')} ₽`} 
          icon={<span className="text-xl">💰</span>}
          color="green"
          trend="+12% за неделю"
          trendUp={true}
        />
        <StatsCard 
          title="Заканчиваются запчасти" 
          value={stats.lowStock} 
          icon={<span className="text-xl">⚠️</span>}
          color="orange"
          trend={stats.lowStock > 0 ? "Требуется закупка" : "Все в порядке"}
          trendUp={stats.lowStock === 0}
        />
        <StatsCard 
          title="Готово сегодня" 
          value={stats.completedToday} 
          icon={<span className="text-xl">✅</span>}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Быстрые действия</h3>
        <div className="flex gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            + Новый заказ
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Добавить клиента
          </button>
        </div>
      </div>
    </div>
  );
};