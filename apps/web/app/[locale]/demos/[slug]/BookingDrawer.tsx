'use client';

/**
 * Booking Drawer
 * Side panel for making room bookings
 */

import React, { useState, useMemo } from 'react';
import { X, Calendar, Users, Loader2, CheckCircle, Bed } from 'lucide-react';
import { submitBooking } from '@/lib/api/bookings';
import type { TourItem } from '@/lib/matterport/types';

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demoId: number;
  room: (TourItem & { pricePerNight?: number; capacity?: number }) | null;
  businessName: string;
  locale: string;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  specialRequests: string;
}

export function BookingDrawer({ 
  isOpen, 
  onClose, 
  demoId,
  room,
  businessName,
  locale 
}: BookingDrawerProps) {
  const isRtl = locale === 'ar';
  
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 2,
    specialRequests: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bookingNumber, setBookingNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const t = {
    title: isRtl ? 'حجز الغرفة' : 'Book Room',
    subtitle: isRtl ? `احجز إقامتك في ${businessName}` : `Book your stay at ${businessName}`,
    name: isRtl ? 'الاسم الكامل' : 'Full Name',
    email: isRtl ? 'البريد الإلكتروني' : 'Email',
    phone: isRtl ? 'رقم الهاتف' : 'Phone',
    checkIn: isRtl ? 'تاريخ الوصول' : 'Check-in',
    checkOut: isRtl ? 'تاريخ المغادرة' : 'Check-out',
    guests: isRtl ? 'عدد الضيوف' : 'Guests',
    requests: isRtl ? 'طلبات خاصة' : 'Special Requests',
    requestsPlaceholder: isRtl ? 'تسجيل وصول مبكر، سرير إضافي...' : 'Early check-in, extra bed...',
    submit: isRtl ? 'تأكيد الحجز' : 'Confirm Booking',
    submitting: isRtl ? 'جاري الحجز...' : 'Booking...',
    successTitle: isRtl ? 'تم تأكيد حجزك!' : 'Booking Confirmed!',
    successDesc: isRtl ? 'سنرسل لك رسالة تأكيد' : "We'll send you a confirmation email",
    bookingNumber: isRtl ? 'رقم الحجز' : 'Booking Number',
    close: isRtl ? 'إغلاق' : 'Close',
    nights: isRtl ? 'ليالي' : 'nights',
    total: isRtl ? 'الإجمالي' : 'Total',
    guest: isRtl ? 'ضيف' : 'guest',
    guests_plural: isRtl ? 'ضيوف' : 'guests',
  };
  
  // Calculate nights and total
  const { nights, totalPrice } = useMemo(() => {
    if (!formData.checkInDate || !formData.checkOutDate || !room?.pricePerNight) {
      return { nights: 0, totalPrice: 0 };
    }
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      nights: diffNights > 0 ? diffNights : 0,
      totalPrice: diffNights > 0 ? diffNights * room.pricePerNight : 0,
    };
  }, [formData.checkInDate, formData.checkOutDate, room?.pricePerNight]);
  
  // Get min dates
  const today = new Date().toISOString().split('T')[0];
  const minCheckOut = formData.checkInDate 
    ? new Date(new Date(formData.checkInDate).getTime() + 86400000).toISOString().split('T')[0]
    : today;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: room?.currency || 'EGP',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const result = await submitBooking({
        demoId,
        roomId: room.id,
        roomName: room.name,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        guests: formData.guests,
        nights,
        totalAmount: totalPrice,
        currency: room.currency || 'EGP',
        specialRequests: formData.specialRequests,
      });
      
      setBookingNumber(result.bookingNumber);
      setStatus('success');
    } catch (error) {
      console.error('Booking error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to make booking');
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
        <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bed className="w-6 h-6" />
              {t.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {room && (
            <p className="text-purple-100">{room.name}</p>
          )}
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
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-600">{t.bookingNumber}</p>
                <p className="text-2xl font-mono font-bold text-purple-700">
                  {bookingNumber}
                </p>
              </div>
              <div className="text-sm text-gray-600 mb-6 space-y-1">
                <p><strong>{room?.name}</strong></p>
                <p>{t.checkIn}: {formData.checkInDate}</p>
                <p>{t.checkOut}: {formData.checkOutDate}</p>
                <p>{nights} {t.nights} • {formData.guests} {t.guests}</p>
                <p className="text-lg font-bold text-purple-600 mt-2">
                  {t.total}: {formatPrice(totalPrice)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Room Summary */}
              {room && room.pricePerNight && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{room.name}</span>
                    <span className="text-purple-600 font-bold">
                      {formatPrice(room.pricePerNight)}/night
                    </span>
                  </div>
                </div>
              )}
              
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Check-in & Check-out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {t.checkIn} *
                  </label>
                  <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    min={today}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {t.checkOut} *
                  </label>
                  <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    min={minCheckOut}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  {t.guests} *
                </label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Array.from({ length: room?.capacity || 4 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? t.guest : t.guests_plural}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Price Summary */}
              {nights > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{formatPrice(room?.pricePerNight || 0)} × {nights} {t.nights}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-purple-700">
                    <span>{t.total}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              )}
              
              {/* Error message */}
              {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'submitting' || nights === 0}
                className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Bed className="w-5 h-5" />
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
