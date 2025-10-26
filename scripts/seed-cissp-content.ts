import 'dotenv/config';
import { db } from '../src/lib/db';
import { domains, topics, decks, flashcards } from '../src/lib/db/schema';

/**
 * Seed script to populate CISSP domains, topics, decks, and sample flashcards
 * Run with: npm run db:seed
 */

const CISSP_DOMAINS_DATA = [
  {
    name: "Security and Risk Management",
    description: "Security concepts, policies, governance, compliance, and risk management",
    order: 1,
    icon: "Shield",
    color: "blue",
    topics: [
      {
        name: "Security Concepts",
        description: "CIA Triad, Defense in Depth, and core security principles",
        order: 1,
        decks: [
          {
            name: "Fundamental Security Principles",
            description: "Core security concepts every CISSP should know",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is the CIA Triad in information security?",
                answer: "Confidentiality, Integrity, and Availability - the three core principles that form the foundation of information security.",
                explanation: "Confidentiality ensures data is only accessible to authorized parties, Integrity ensures data accuracy and trustworthiness, and Availability ensures authorized users have access when needed.",
                difficulty: 1,
                order: 1
              },
              {
                question: "What is Defense in Depth?",
                answer: "A layered security approach that uses multiple security controls at different levels to protect assets. If one layer fails, others continue to provide protection.",
                explanation: "Also known as layered security, this strategy implements multiple defensive mechanisms so that if one fails, others still provide protection. Examples include firewalls, IDS, encryption, and access controls.",
                difficulty: 2,
                order: 2
              },
              {
                question: "What does the principle of Least Privilege mean?",
                answer: "Users should only be granted the minimum levels of access or permissions needed to perform their job functions, reducing potential security risks.",
                explanation: "This principle minimizes the attack surface by ensuring users, processes, and systems only have the permissions absolutely necessary for their legitimate purpose.",
                difficulty: 1,
                order: 3
              }
            ]
          }
        ]
      },
      {
        name: "Risk Management",
        description: "Risk assessment, treatment, and management processes",
        order: 2,
        decks: [
          {
            name: "Risk Management Fundamentals",
            description: "Understanding risk, threats, and vulnerabilities",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is the difference between a vulnerability and a threat?",
                answer: "A vulnerability is a weakness in a system, while a threat is a potential danger that could exploit that vulnerability. Risk is the likelihood of a threat exploiting a vulnerability.",
                explanation: "Vulnerability = weakness, Threat = potential danger, Risk = probability × impact. All three must be present for risk to exist.",
                difficulty: 2,
                order: 1
              },
              {
                question: "What is Risk Management?",
                answer: "The process of identifying, assessing, and controlling threats to an organization's capital and earnings, including strategic, financial, operational, and security risks.",
                explanation: "Risk management involves: 1) Risk identification, 2) Risk assessment, 3) Risk treatment (accept, avoid, transfer, mitigate), and 4) Risk monitoring.",
                difficulty: 2,
                order: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Asset Security",
    description: "Information lifecycle, data handling, privacy, and asset classification",
    order: 2,
    icon: "Database",
    color: "green",
    topics: [
      {
        name: "Data Classification",
        description: "Classifying and protecting organizational data",
        order: 1,
        decks: [
          {
            name: "Data Classification Levels",
            description: "Understanding how to classify data by sensitivity",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is data classification?",
                answer: "The process of organizing data into categories based on its sensitivity, criticality, and value to help determine appropriate security controls.",
                explanation: "Data classification helps organizations apply appropriate security controls based on the data's sensitivity and business value.",
                difficulty: 1,
                order: 1
              },
              {
                question: "What are the typical data classification levels?",
                answer: "Common levels include: Public, Internal, Confidential, and Restricted (or Top Secret). The specific levels vary by organization.",
                explanation: "Public = no harm if disclosed, Internal = internal use only, Confidential = could cause damage if disclosed, Restricted/Top Secret = severe damage if disclosed.",
                difficulty: 2,
                order: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Security Architecture and Engineering",
    description: "Security models, capabilities, design principles, and cryptography",
    order: 3,
    icon: "Building",
    color: "purple",
    topics: [
      {
        name: "Cryptography",
        description: "Encryption, hashing, and cryptographic principles",
        order: 1,
        decks: [
          {
            name: "Encryption Fundamentals",
            description: "Symmetric and asymmetric encryption concepts",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is symmetric encryption?",
                answer: "Encryption method that uses the same key for both encryption and decryption. It's faster but requires secure key distribution.",
                explanation: "Examples include AES, DES, 3DES. The main challenge is securely distributing the shared key. Used for bulk data encryption due to speed.",
                difficulty: 2,
                order: 1
              },
              {
                question: "What is asymmetric encryption?",
                answer: "Encryption using a key pair: a public key for encryption and a private key for decryption. Solves key distribution problem but is slower than symmetric encryption.",
                explanation: "Examples include RSA, ECC, DSA. Public key can be freely distributed, while private key must be kept secret. Often used for key exchange and digital signatures.",
                difficulty: 2,
                order: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Communication and Network Security",
    description: "Network security, protocols, and secure communications",
    order: 4,
    icon: "Network",
    color: "orange",
    topics: [
      {
        name: "Network Models",
        description: "OSI Model, TCP/IP, and network architecture",
        order: 1,
        decks: [
          {
            name: "OSI Model Basics",
            description: "Understanding the 7-layer network model",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is the OSI Model?",
                answer: "A 7-layer conceptual framework for network communication: Physical, Data Link, Network, Transport, Session, Presentation, and Application layers.",
                explanation: "Mnemonic: 'Please Do Not Throw Sausage Pizza Away'. Each layer provides services to the layer above and uses services from the layer below.",
                difficulty: 2,
                order: 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Identity and Access Management (IAM)",
    description: "Physical and logical access control, identification, and authentication",
    order: 5,
    icon: "Key",
    color: "pink",
    topics: [
      {
        name: "Authentication",
        description: "Multi-factor authentication and identity verification",
        order: 1,
        decks: [
          {
            name: "Authentication Methods",
            description: "Understanding different authentication factors",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is Multi-Factor Authentication (MFA)?",
                answer: "A security mechanism requiring two or more verification factors: something you know (password), something you have (token), or something you are (biometric).",
                explanation: "MFA significantly increases security by requiring multiple independent credentials. Even if one factor is compromised, unauthorized access is still prevented.",
                difficulty: 1,
                order: 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Security Assessment and Testing",
    description: "Assessment strategies, security audits, and vulnerability assessments",
    order: 6,
    icon: "TestTube",
    color: "yellow",
    topics: [
      {
        name: "Security Testing",
        description: "Penetration testing and vulnerability assessments",
        order: 1,
        decks: [
          {
            name: "Penetration Testing",
            description: "Understanding ethical hacking and security testing",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is penetration testing?",
                answer: "An authorized simulated cyberattack on a system to evaluate its security, identify vulnerabilities, and assess the effectiveness of security controls.",
                explanation: "Pen testing can be black box (no knowledge), white box (full knowledge), or gray box (partial knowledge). Always requires proper authorization.",
                difficulty: 2,
                order: 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Security Operations",
    description: "Incident management, investigations, disaster recovery, and logging",
    order: 7,
    icon: "Activity",
    color: "red",
    topics: [
      {
        name: "Incident Response",
        description: "Responding to and managing security incidents",
        order: 1,
        decks: [
          {
            name: "Incident Response Process",
            description: "Steps for handling security incidents",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is an Incident Response Plan?",
                answer: "A documented process for detecting, responding to, and recovering from security incidents to minimize impact and restore normal operations.",
                explanation: "Typical phases: Preparation, Detection/Identification, Containment, Eradication, Recovery, Lessons Learned. Often follows NIST or SANS frameworks.",
                difficulty: 2,
                order: 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Software Development Security",
    description: "Secure software development lifecycle and application security",
    order: 8,
    icon: "Code",
    color: "indigo",
    topics: [
      {
        name: "Secure SDLC",
        description: "Integrating security into software development",
        order: 1,
        decks: [
          {
            name: "SDLC Security",
            description: "Security in software development lifecycle",
            order: 1,
            isPremium: false,
            flashcards: [
              {
                question: "What is the Secure Software Development Lifecycle (SDLC)?",
                answer: "A framework integrating security practices into every phase of software development from planning through deployment and maintenance.",
                explanation: "Security should be built in, not bolted on. Includes threat modeling, secure coding practices, security testing, and security reviews at each phase.",
                difficulty: 2,
                order: 1
              }
            ]
          }
        ]
      }
    ]
  }
];

async function seed() {
  console.log('🌱 Starting CISSP content seed...\n');

  try {
    // Admin user - must exist in database before running this seed
    // Run: npx tsx scripts/create-admin.ts first
    const adminUserId = 'user_33oqZCsrKLsESLa3hoPcJpUHEFf';

    console.log('📚 Seeding CISSP domains, topics, decks, and flashcards...\n');

    for (const domainData of CISSP_DOMAINS_DATA) {
      console.log(`  Creating domain: ${domainData.name}`);

      // Insert domain
      const [domain] = await db.insert(domains).values({
        name: domainData.name,
        description: domainData.description,
        order: domainData.order,
        icon: domainData.icon,
        createdBy: adminUserId,
      }).returning();

      // Insert topics
      for (const topicData of domainData.topics) {
        console.log(`    Creating topic: ${topicData.name}`);

        const [topic] = await db.insert(topics).values({
          domainId: domain.id,
          name: topicData.name,
          description: topicData.description,
          order: topicData.order,
          createdBy: adminUserId,
        }).returning();

        // Insert decks
        for (const deckData of topicData.decks) {
          console.log(`      Creating deck: ${deckData.name}`);

          const [deck] = await db.insert(decks).values({
            topicId: topic.id,
            name: deckData.name,
            description: deckData.description,
            order: deckData.order,
            isPremium: deckData.isPremium,
            cardCount: deckData.flashcards.length,
            createdBy: adminUserId,
          }).returning();

          // Insert flashcards
          for (const flashcardData of deckData.flashcards) {
            await db.insert(flashcards).values({
              deckId: deck.id,
              question: flashcardData.question,
              answer: flashcardData.answer,
              explanation: flashcardData.explanation,
              difficulty: flashcardData.difficulty,
              order: flashcardData.order,
              isPublished: true,
              createdBy: adminUserId,
            });
          }

          console.log(`        ✓ Added ${deckData.flashcards.length} flashcards`);
        }
      }

      console.log(`  ✓ Domain "${domainData.name}" completed\n`);
    }

    console.log('✅ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Domains: ${CISSP_DOMAINS_DATA.length}`);
    console.log(`  - Topics: ${CISSP_DOMAINS_DATA.reduce((sum, d) => sum + d.topics.length, 0)}`);
    console.log(`  - Decks: ${CISSP_DOMAINS_DATA.reduce((sum, d) => sum + d.topics.reduce((s, t) => s + t.decks.length, 0), 0)}`);
    console.log(`  - Flashcards: ${CISSP_DOMAINS_DATA.reduce((sum, d) => sum + d.topics.reduce((s, t) => s + t.decks.reduce((c, deck) => c + deck.flashcards.length, 0), 0), 0)}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
