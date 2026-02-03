'use client';

/**
 * Checkout Modal
 * Collects customer info and submits order
 */

import React, { useState } from 'react';
import { X, Loader2, CheckCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { submitOrder } from '@/lib/api/orders';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoId: number;
  locale: string;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

export function CheckoutModal({ isOpen, onClose, demoId, locale }: CheckoutModalProps) {
  const { items, total, clearCart } = useCart();
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const isRtl = locale === 'ar';
  
  const t = {
    title: isRtl ? 'إتمام الطلب' : 'Complete Your Order',
    name: isRtl ? 'الاسم الكامل' : 'Full Name',
    email: isRtl ? 'البريد الإلكتروني' : 'Email',
    phone: isRtl ? 'رقم الهاتف' : 'Phone Number',
    notes: isRtl ? 'ملاحظات' : 'Notes',
    notesPlaceholder: isRtl ? 'أي ملاحظات خاصة...' : 'Any special notes...',
    submit: isRtl ? 'تأكيد الطلب' : 'Confirm Order',
    submitting: isRtl ? 'جاري الإرسال...' : 'Submitting...',
    successTitle: isRtl ? 'تم استلام طلبك!' : 'Order Received!',
    successDesc: isRtl ? 'سنتواصل معك قريباً' : "We'll contact you soon",
    orderNumber: isRtl ? 'رقم الطلب' : 'Order Number',
    total: isRtl ? 'الإجمالي' : 'Total',
    close: isRtl ? 'إغلاق' : 'Close',
    error: isRtl ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.',
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const orderItems = items.map(item => ({
        productId: parseInt(item.id),
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      }));
      
      const result = await submitOrder({
        demoId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        notes: formData.notes,
        items: orderItems,
        totalAmount: total,
        currency: 'EGP',
      });
      
      setOrderNumber(result.orderNumber);
      setStatus('success');
      clearCart();
    } catch (error) {
      console.error('Order submission error:', error);
      setErrorMessage(error instanceof Error ? error.message : t.error);
      setStatus('error');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden ${isRtl ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t.successTitle}
              </h3>
              <p className="text-gray-600 mb-4">{t.successDesc}</p>
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500">{t.orderNumber}</p>
                <p className="text-2xl font-mono font-bold text-primary-600">
                  {orderNumber}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t.total}</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {items.length} {isRtl ? 'منتجات' : 'items'}
                </p>
              </div>
              
              {/* Form fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.name} *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.email} *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.phone} *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.notes}
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t.notesPlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Error message */}
              {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  t.submit
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
