import type { Metadata } from "next";
import { getSiteSettings, getContactPage } from "@/lib/strapi";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/ContactForm";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, contact] = await Promise.all([getSiteSettings(locale), getContactPage(locale)]);
  
  const title = contact?.heroTitle || (locale === "ar" ? "اتصل بنا" : "Contact");
  const siteName = site?.title ?? "Arabiq";

  return {
    title: `${title} | ${siteName}`,
    description: contact?.heroSubtitle ?? site?.description ?? undefined,
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  const contact = await getContactPage(locale).catch(() => null);

  // Content with fallbacks
  const heroTitle = contact?.heroTitle || (isRTL ? "تواصل معنا" : "Get in Touch");
  const heroSubtitle = contact?.heroSubtitle || (isRTL ? "نحب أن نسمع منك" : "We'd love to hear from you");
  const formTitle = contact?.formTitle || (isRTL ? "أرسل رسالة" : "Send a Message");
  const nameLabel = contact?.nameLabel || (isRTL ? "الاسم الكامل" : "Full Name");
  const emailLabel = contact?.emailLabel || (isRTL ? "البريد الإلكتروني" : "Email Address");
  const phoneLabel = contact?.phoneLabel || (isRTL ? "رقم الهاتف" : "Phone Number");
  const messageLabel = contact?.messageLabel || (isRTL ? "رسالتك" : "Your Message");
  const submitButton = contact?.submitButton || (isRTL ? "إرسال الرسالة" : "Send Message");
  const infoTitle = contact?.infoTitle || (isRTL ? "معلومات التواصل" : "Contact Information");
  const address = contact?.address || (isRTL ? "القاهرة، مصر\nدبي، الإمارات" : "Cairo, Egypt\nDubai, UAE");
  const email = contact?.email || "hello@arabiq.tech";
  const phone = contact?.phone || "+20 123 456 7890";
  const hoursTitle = contact?.hoursTitle || (isRTL ? "ساعات العمل" : "Business Hours");
  const hoursText = contact?.hoursText || (isRTL ? "الأحد - الخميس: 9ص - 6م" : "Sunday - Thursday: 9AM - 6PM");

  // Form labels for the client component
  const formLabels = {
    formTitle,
    nameLabel,
    namePlaceholder: isRTL ? "أحمد محمد" : "John Doe",
    emailLabel,
    phoneLabel,
    messageLabel,
    messagePlaceholder: isRTL ? "كيف يمكننا مساعدتك؟" : "How can we help you?",
    submitButton,
    sendingText: isRTL ? "جاري الإرسال..." : "Sending...",
    successTitle: isRTL ? "تم الإرسال بنجاح!" : "Message Sent!",
    successMessage: isRTL ? "شكراً لرسالتك. سنتواصل معك قريباً." : "Thank you for your message. We'll get back to you soon.",
    errorMessage: isRTL ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again.",
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              {heroTitle}
            </h1>
            <p className="mt-6 text-xl text-slate-600">
              {heroSubtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <ContactForm locale={locale} labels={formLabels} />

            {/* Contact Info */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-900">{infoTitle}</h2>

              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{isRTL ? "العنوان" : "Address"}</h3>
                    <p className="mt-1 text-slate-600 whitespace-pre-line">{address}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{isRTL ? "البريد الإلكتروني" : "Email"}</h3>
                    <a href={`mailto:${email}`} className="mt-1 text-indigo-600 hover:underline">
                      {email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{isRTL ? "الهاتف" : "Phone"}</h3>
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="mt-1 text-indigo-600 hover:underline">
                      {phone}
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{hoursTitle}</h3>
                    <p className="mt-1 text-slate-600 whitespace-pre-line">{hoursText}</p>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="mt-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 h-64 flex items-center justify-center">
                <p className="text-slate-500">{isRTL ? "خريطة الموقع" : "Map Location"}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
