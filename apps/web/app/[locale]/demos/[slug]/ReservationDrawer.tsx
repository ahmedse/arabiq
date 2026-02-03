'use client';

/**
 * Reservation Drawer
 * Side panel for making table reservations
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Loader2, CheckCircle } from 'lucide-react';
import { submitReservation } from '@/lib/api/reservations';

interface ReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demoId: number;
  businessName: string;
  locale: string;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  specialRequests: string;
}

export function ReservationDrawer({ 
  isOpen, 
  onClose, 
  demoId,
  businessName,
  locale 
}: ReservationDrawerProps) {
  const isRtl = locale === 'ar';
  
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    partySize: 2,
    reservationDate: '',
    reservationTime: '',
    specialRequests: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [reservationNumber, setReservationNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const t = {
    title: isRtl ? 'حجز طاولة' : 'Reserve a Table',
    subtitle: isRtl ? `احجز طاولتك في ${businessName}` : `Book your table at ${businessName}`,
    name: isRtl ? 'الاسم الكامل' : 'Full Name',
    email: isRtl ? 'البريد الإلكتروني' : 'Email',
    phone: isRtl ? 'رقم الهاتف' : 'Phone',
    guests: isRtl ? 'عدد الضيوف' : 'Number of Guests',
    date: isRtl ? 'التاريخ' : 'Date',
    time: isRtl ? 'الوقت' : 'Time',
    requests: isRtl ? 'طلبات خاصة' : 'Special Requests',
    requestsPlaceholder: isRtl ? 'حساسية طعام، مناسبة خاصة...' : 'Allergies, special occasions...',
    submit: isRtl ? 'تأكيد الحجز' : 'Confirm Reservation',
    submitting: isRtl ? 'جاري الحجز...' : 'Booking...',
    successTitle: isRtl ? 'تم تأكيد حجزك!' : 'Reservation Confirmed!',
    successDesc: isRtl ? 'سنرسل لك رسالة تأكيد' : "We'll send you a confirmation",
    reservationNumber: isRtl ? 'رقم الحجز' : 'Reservation Number',
    close: isRtl ? 'إغلاق' : 'Close',
    guest: isRtl ? 'ضيف' : 'guest',
    guests_plural: isRtl ? 'ضيوف' : 'guests',
  };
  
  // Generate time slots
  const timeSlots: string[] = [];
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      timeSlots.push(`${hour}:${min}`);
    }
  }
  
  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const result = await submitReservation({
        demoId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        partySize: formData.partySize,
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        specialRequests: formData.specialRequests,
      });
      
      setReservationNumber(result.reservationNumber);
      setStatus('success');
    } catch (error) {
      console.error('Reservation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to make reservation');
      setStatus('error');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`
        absolute top-0 bottom-0 w-full max-w-md bg-white shadow-2xl
        flex flex-col overflow-hidden
        ${isRtl ? 'left-0' : 'right-0'}
      `}>
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {t.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-amber-100">{t.subtitle}</p>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t.successTitle}
              </h3>
              <p className="text-gray-600 mb-4">{t.successDesc}</p>
              <div className="bg-amber-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-600">{t.reservationNumber}</p>
                <p className="text-2xl font-mono font-bold text-amber-700">
                  {reservationNumber}
                </p>
              </div>
              <div className="text-sm text-gray-600 mb-6">
                <p><strong>{t.date}:</strong> {formData.reservationDate}</p>
                <p><strong>{t.time}:</strong> {formData.reservationTime}</p>
                <p><strong>{t.guests}:</strong> {formData.partySize}</p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              
              {/* Email */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              
              {/* Phone */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              
              {/* Party Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  {t.guests} *
                </label>
                <select
                  name="partySize"
                  value={formData.partySize}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? t.guest : t.guests_plural}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {t.date} *
                  </label>
                  <input
                    type="date"
                    name="reservationDate"
                    value={formData.reservationDate}
                    onChange={handleChange}
                    min={today}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {t.time} *
                  </label>
                  <select
                    name="reservationTime"
                    value={formData.reservationTime}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">--:--</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.requests}
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t.requestsPlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full py-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    {t.submit}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
