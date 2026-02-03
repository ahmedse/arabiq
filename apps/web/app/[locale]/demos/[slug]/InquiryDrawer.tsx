'use client';

/**
 * Inquiry Drawer
 * Side panel for submitting property inquiries
 */

import React, { useState } from 'react';
import { X, Building2, Loader2, CheckCircle, Send, MessageSquare } from 'lucide-react';
import { submitInquiry } from '@/lib/api/inquiries';

interface InquiryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demoId: number;
  propertyTitle: string;
  propertyPrice?: number;
  locale: string;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  preferredContact: 'email' | 'phone' | 'whatsapp';
}

export function InquiryDrawer({ 
  isOpen, 
  onClose, 
  demoId,
  propertyTitle,
  propertyPrice,
  locale 
}: InquiryDrawerProps) {
  const isRtl = locale === 'ar';
  
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    message: '',
    preferredContact: 'email',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [inquiryNumber, setInquiryNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const t = {
    title: isRtl ? 'استفسار عن العقار' : 'Property Inquiry',
    subtitle: isRtl ? `استفسر عن ${propertyTitle}` : `Inquire about ${propertyTitle}`,
    name: isRtl ? 'الاسم الكامل' : 'Full Name',
    email: isRtl ? 'البريد الإلكتروني' : 'Email',
    phone: isRtl ? 'رقم الهاتف' : 'Phone',
    message: isRtl ? 'رسالتك' : 'Your Message',
    messagePlaceholder: isRtl ? 'أخبرنا عن اهتمامك بهذا العقار...' : 'Tell us about your interest in this property...',
    preferredContact: isRtl ? 'طريقة التواصل المفضلة' : 'Preferred Contact Method',
    viaEmail: isRtl ? 'بريد إلكتروني' : 'Email',
    viaPhone: isRtl ? 'هاتف' : 'Phone',
    viaWhatsapp: isRtl ? 'واتساب' : 'WhatsApp',
    submit: isRtl ? 'إرسال الاستفسار' : 'Send Inquiry',
    submitting: isRtl ? 'جاري الإرسال...' : 'Sending...',
    successTitle: isRtl ? 'تم استلام استفسارك!' : 'Inquiry Received!',
    successDesc: isRtl ? 'سنتواصل معك قريباً' : "We'll contact you soon",
    inquiryNumber: isRtl ? 'رقم الاستفسار' : 'Inquiry Number',
    close: isRtl ? 'إغلاق' : 'Close',
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const result = await submitInquiry({
        demoId,
        propertyTitle,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        message: formData.message,
        preferredContact: formData.preferredContact,
      });
      
      setInquiryNumber(result.inquiryNumber);
      setStatus('success');
    } catch (error) {
      console.error('Inquiry error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send inquiry');
      setStatus('error');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
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
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {t.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100">{propertyTitle}</p>
          {propertyPrice && (
            <p className="text-white font-bold text-lg mt-1">{formatPrice(propertyPrice)}</p>
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
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-600">{t.inquiryNumber}</p>
                <p className="text-2xl font-mono font-bold text-blue-700">
                  {inquiryNumber}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Preferred Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.preferredContact}
                </label>
                <select
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="email">{t.viaEmail}</option>
                  <option value="phone">{t.viaPhone}</option>
                  <option value="whatsapp">{t.viaWhatsapp}</option>
                </select>
              </div>
              
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  {t.message}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t.messagePlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
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
