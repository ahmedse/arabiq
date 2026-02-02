/**
 * Structured Data (JSON-LD) components for SEO
 * These provide rich snippets for search engines
 */

interface OrganizationSchemaProps {
  locale?: 'en' | 'ar';
}

export function OrganizationSchema({ locale = 'en' }: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Arabiq',
    url: 'https://arabiq.tech',
    logo: 'https://arabiq.tech/arabiq-logo.svg',
    description: locale === 'ar' 
      ? 'حلول التوائم الرقمية والجولات الافتراضية للشركات في الشرق الأوسط'
      : 'Digital twin and virtual tour solutions for businesses in the MENA region',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+20-123-456-7890',
      contactType: 'customer service',
      availableLanguage: ['English', 'Arabic'],
      areaServed: ['EG', 'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      addressLocality: 'Cairo',
    },
    sameAs: [
      'https://twitter.com/arabiqtech',
      'https://linkedin.com/company/arabiq',
      'https://instagram.com/arabiqtech',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Arabiq',
    alternateName: 'أربيك',
    url: 'https://arabiq.tech',
    description: 'Digital twin and virtual tour platform for businesses',
    inLanguage: ['en', 'ar'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://arabiq.tech/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ServiceSchemaProps {
  service: {
    title: string;
    description: string;
    slug: string;
  };
  locale?: 'en' | 'ar';
}

export function ServiceSchema({ service, locale = 'en' }: ServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'Arabiq',
      url: 'https://arabiq.tech',
    },
    url: `https://arabiq.tech/${locale}/solutions/${service.slug}`,
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 25.2048,
        longitude: 55.2708,
      },
      geoRadius: '3000 km',
    },
    serviceType: 'Digital Twin Solutions',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://arabiq.tech${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface LocalBusinessSchemaProps {
  locale?: 'en' | 'ar';
}

export function LocalBusinessSchema({ locale = 'en' }: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Arabiq',
    image: 'https://arabiq.tech/arabiq-logo.svg',
    '@id': 'https://arabiq.tech',
    url: 'https://arabiq.tech',
    telephone: '+20-123-456-7890',
    email: 'hello@arabiq.tech',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: 'Cairo',
      addressCountry: 'EG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.0444,
      longitude: 31.2357,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '18:00',
    },
    priceRange: '$$$',
    description: locale === 'ar'
      ? 'حلول التوائم الرقمية والجولات الافتراضية'
      : 'Digital twin and virtual tour solutions',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
