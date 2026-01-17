const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cybermateconsulting.com'

interface JsonLdProps {
  type?: 'organization' | 'course' | 'product' | 'faq'
}

export function JsonLd({ type = 'organization' }: JsonLdProps) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cybermate Professional Training',
    alternateName: 'CISSP Mastery',
    url: BASE_URL,
    logo: `${BASE_URL}/images/cybermate-logo.webp`,
    description: 'Professional CISSP certification training with confidence-based learning and a 98.2% first-time pass rate.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Raju Ragavan',
      jobTitle: 'Founder & Lead Instructor',
      description: '26+ years of cybersecurity experience, CISSP & CCNP Security certified',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@cybermateconsulting.com',
    },
    sameAs: [
      'https://www.linkedin.com/company/cybermateconsulting',
    ],
  }

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'CISSP Mastery in 50 Days',
    description: 'Comprehensive CISSP certification prep course with 1000+ flashcards, adaptive spaced repetition, and confidence-based learning across all 8 CISSP domains.',
    provider: {
      '@type': 'Organization',
      name: 'Cybermate Professional Training',
      url: BASE_URL,
    },
    instructor: {
      '@type': 'Person',
      name: 'Raju Ragavan',
      description: 'CISSP & CCNP Security certified instructor with 26+ years of experience',
    },
    educationalLevel: 'Professional',
    audience: {
      '@type': 'Audience',
      audienceType: 'Cybersecurity Professionals',
    },
    teaches: [
      'Security and Risk Management',
      'Asset Security',
      'Security Architecture and Engineering',
      'Communication and Network Security',
      'Identity and Access Management',
      'Security Assessment and Testing',
      'Security Operations',
      'Software Development Security',
    ],
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'P50D',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '127',
    },
    offers: {
      '@type': 'Offer',
      price: '197',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: '2024-01-01',
      priceValidUntil: '2025-12-31',
      url: `${BASE_URL}/pricing`,
    },
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'CISSP Mastery Course',
    description: 'Pass CISSP on your first attempt with our confidence-based flashcard system featuring 1000+ cards across all 8 domains.',
    brand: {
      '@type': 'Brand',
      name: 'Cybermate Professional Training',
    },
    offers: {
      '@type': 'Offer',
      price: '197',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2025-12-31',
      seller: {
        '@type': 'Organization',
        name: 'Cybermate Professional Training',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        author: {
          '@type': 'Person',
          name: 'Alex Johnson',
        },
        reviewBody: 'The confidence-based learning approach was exactly what I needed. I passed my CISSP exam on the first try after using this platform for 50 days.',
      },
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        author: {
          '@type': 'Person',
          name: 'Maria Patel',
        },
        reviewBody: 'As a working professional, I needed flexibility. The spaced repetition system helped me retain information efficiently.',
      },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the CISSP certification?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CISSP (Certified Information Systems Security Professional) is a globally recognized certification for cybersecurity professionals, administered by (ISC)². It validates expertise across 8 security domains.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does it take to prepare for CISSP with this course?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our structured 50-day study plan helps you systematically cover all 8 CISSP domains. Most students complete the course within 6-8 weeks while working full-time.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is your pass rate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our students have a 98.2% first-time pass rate, significantly higher than the industry average. This is achieved through our confidence-based learning system and adaptive spaced repetition.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long do I have access to the course?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You get 180 days (6 months) of full access to all course materials, including 1000+ flashcards, practice questions, and all future updates during your access period.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does confidence-based learning work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'After viewing each flashcard, you rate your confidence from 1-5. Cards you struggle with appear more frequently, while mastered cards are shown less often. This optimizes your study time by focusing on weak areas.',
        },
      },
    ],
  }

  const schemas: Record<string, object> = {
    organization: organizationSchema,
    course: courseSchema,
    product: productSchema,
    faq: faqSchema,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas[type]) }}
    />
  )
}

export function HomePageJsonLd() {
  return (
    <>
      <JsonLd type="organization" />
      <JsonLd type="course" />
      <JsonLd type="product" />
      <JsonLd type="faq" />
    </>
  )
}
