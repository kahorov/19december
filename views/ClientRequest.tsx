import React, { useState } from 'react';
import { db } from '../services/storage';

interface ClientRequestProps {
  onBack: () => void;
}

export const ClientRequest: React.FC<ClientRequestProps> = ({ onBack }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    model: '',
    issue: ''
  });
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Find or create client
      let client = await db.findClientByPhone(formData.phone);
      if (!client) {
        client = await db.addClient({
          name: formData.name,
          phone: formData.phone,
          email: '' // optional
        });
      }

      // Create order
      const order = await db.addOrder({
        client_id: client.id,
        model: formData.model,
        issue_description: formData.issue,
        status: 'received',
        notes: 'Заявка с сайта'
      });

      setOrderId(order.id);
      setStep('success');
    } catch (error) {
      console.error(error);
      alert('Ошибка при отправке заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">RepairFlow</h2>
          <p className="text-blue-100">Сервисный центр по ремонту ноутбуков</p>
        </div>

        <div className="p-8">
          {step === 'form' ? (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Оставить заявку на ремонт</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя</label>
                  <input 
                    required
                    type="text"
                    placeholder="Иван Иванов"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input 
                    required
                    type="tel"
                    placeholder="+7 999 000-00-00"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Модель устройства</label>
                  <input 
                    required
                    type="text"
                    placeholder="Asus, HP, Apple..."
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание проблемы</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Не включается, разбит экран..."
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.issue}
                    onChange={(e) => setFormData({...formData, issue: e.target.value})}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Отправка...' : 'Отправить заявку'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Заявка принята!</h3>
              <p className="text-gray-600 mb-6">
                Номер вашей заявки: <span className="font-bold text-gray-900">#{orderId}</span>
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 mb-8">
                Мы свяжемся с вами по указанному телефону в ближайшее время для уточнения деталей.
              </div>
              <button 
                onClick={() => {
                  setStep('form');
                  setFormData({ name: '', phone: '', model: '', issue: '' });
                }}
                className="text-blue-600 font-medium hover:underline"
              >
                Отправить еще одну заявку
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            ← Вернуться в админ-панель
          </button>
        </div>
      </div>
    </div>
  );
};