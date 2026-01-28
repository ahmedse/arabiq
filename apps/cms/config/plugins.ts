export default ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: env('RESEND_API_KEY'),
        },
      },
      settings: {
        defaultFrom: 'noreply@yourdomain.com',
        defaultReplyTo: 'support@yourdomain.com',
      },
    },
  },
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales: ['en', 'ar'],
    },
  },
});
