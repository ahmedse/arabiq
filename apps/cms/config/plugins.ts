export default ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('EMAIL_HOST', 'smtp.resend.com'),
        port: env.int('EMAIL_PORT', 465),
        secure: env.bool('EMAIL_SECURE', true),
        auth: {
          user: env('EMAIL_USERNAME', 'resend'),
          pass: env('EMAIL_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@arabiq.tech'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'support@arabiq.tech'),
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
