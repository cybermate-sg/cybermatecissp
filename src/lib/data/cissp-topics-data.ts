// CISSP Topics Data - All 8 Domains with Topics and Sub-Topics
// Based on ISC2 CISSP Exam Outline

export interface SubTopicData {
  name: string;
  order: number;
}

export interface TopicData {
  code: string; // e.g., "1.1", "1.2"
  name: string;
  subTopics: SubTopicData[];
  order: number;
}

export interface DomainTopicsData {
  domainNumber: number;
  domainName: string;
  topics: TopicData[];
}

export const CISSP_TOPICS_DATA: DomainTopicsData[] = [
  {
    domainNumber: 1,
    domainName: "Security and Risk Management",
    topics: [
      {
        code: "1.1",
        name: "Understand, adhere to, and promote professional ethics",
        order: 1,
        subTopics: [
          { name: "ISC2 Code of Professional Ethics", order: 1 },
          { name: "Organizational code of ethics", order: 2 },
        ],
      },
      {
        code: "1.2",
        name: "Understand and apply security concepts",
        order: 2,
        subTopics: [
          { name: "Confidentiality, integrity, and availability, authenticity, and nonrepudiation (5 Pillars of Information Security)", order: 1 },
          { name: "Alignment of the security function to business strategy, goals, mission, and objectives", order: 2 },
          { name: "Organizational processes (e.g., acquisitions, divestitures, governance committees)", order: 3 },
          { name: "Organizational roles and responsibilities", order: 4 },
          { name: "Security control frameworks (e.g., ISO, NIST, COBIT, SABSA, PCI, FedRAMP)", order: 5 },
        ],
      },
      {
        code: "1.3",
        name: "Evaluate and apply security governance principles",
        order: 3,
        subTopics: [
          { name: "Due care/due diligence", order: 1 },
          { name: "Cybercrimes and data breaches", order: 2 },
          { name: "Licensing and Intellectual Property requirements", order: 3 },
          { name: "Import/export controls", order: 4 },
          { name: "Transborder data flow", order: 5 },
          { name: "Issues related to privacy (e.g., GDPR, CCPA, PIPL, POPIA)", order: 6 },
          { name: "Contractual, legal, industry standards, and regulatory requirements", order: 7 },
        ],
      },
      {
        code: "1.4",
        name: "Understand legal, regulatory, and compliance issues that pertain to information security in a holistic context",
        order: 4,
        subTopics: [
          { name: "Cybercrimes and data breaches", order: 1 },
          { name: "Licensing and Intellectual Property requirements", order: 2 },
          { name: "Import/export controls", order: 3 },
          { name: "Transborder data flow", order: 4 },
          { name: "Issues related to privacy (e.g., GDPR, CCPA, PIPL, POPIA)", order: 5 },
          { name: "Contractual, legal, industry standards, and regulatory requirements", order: 6 },
        ],
      },
      {
        code: "1.5",
        name: "Understand requirements for investigation types",
        order: 5,
        subTopics: [],
      },
      {
        code: "1.6",
        name: "Develop, document, and implement security policy, standards, procedures, and guidelines",
        order: 6,
        subTopics: [],
      },
      {
        code: "1.7",
        name: "Identify, analyze, assess, prioritize, and implement Business Continuity (BC) requirements",
        order: 7,
        subTopics: [
          { name: "Business impact analysis (BIA)", order: 1 },
          { name: "External dependencies", order: 2 },
        ],
      },
      {
        code: "1.8",
        name: "Contribute to and enforce personnel security policies and procedures",
        order: 8,
        subTopics: [
          { name: "Candidate screening and hiring", order: 1 },
          { name: "Employment agreements and policy driven requirements", order: 2 },
          { name: "Onboarding, transfers, and termination processes", order: 3 },
          { name: "Vendor, consultant, and contractor agreements and controls", order: 4 },
        ],
      },
      {
        code: "1.9",
        name: "Understand and apply risk management concepts",
        order: 9,
        subTopics: [
          { name: "Threat and vulnerability identification", order: 1 },
          { name: "Risk analysis, assessment, and scope", order: 2 },
          { name: "Risk response and treatment (e.g., cybersecurity insurance)", order: 3 },
          { name: "Applicable types of controls (e.g., preventive, detection, corrective)", order: 4 },
          { name: "Control assessments (e.g., security, and privacy)", order: 5 },
          { name: "Continuous monitoring and measurement", order: 6 },
          { name: "Reporting (e.g., internal, external)", order: 7 },
          { name: "Continuous improvement (e.g., risk maturity modeling)", order: 8 },
          { name: "Risk frameworks (e.g., ISO, NIST, COBIT, SABSA, PCI)", order: 9 },
        ],
      },
      {
        code: "1.10",
        name: "Understand and apply threat modeling concepts and methodologies",
        order: 10,
        subTopics: [],
      },
      {
        code: "1.11",
        name: "Apply Supply Chain Risk Management (SCRM) concepts",
        order: 11,
        subTopics: [
          { name: "Risks associated with the acquisition of products and services from suppliers and providers", order: 1 },
          { name: "Risk mitigations (e.g., third-party assessment, minimum security requirements, silicon root of trust, SBOM)", order: 2 },
        ],
      },
      {
        code: "1.12",
        name: "Establish and maintain a security awareness, education, and training program",
        order: 12,
        subTopics: [
          { name: "Methods and techniques to increase awareness and training (e.g., social engineering, phishing, gamification)", order: 1 },
          { name: "Periodic content reviews to include emerging technologies (e.g., crypto, AI, blockchain)", order: 2 },
          { name: "Program effectiveness evaluation", order: 3 },
        ],
      },
    ],
  },
  {
    domainNumber: 2,
    domainName: "Asset Security",
    topics: [
      {
        code: "2.1",
        name: "Identify and classify information and assets",
        order: 1,
        subTopics: [
          { name: "Data classification", order: 1 },
          { name: "Asset classification", order: 2 },
        ],
      },
      {
        code: "2.2",
        name: "Establish information and asset handling requirements",
        order: 2,
        subTopics: [],
      },
      {
        code: "2.3",
        name: "Provision information and assets securely",
        order: 3,
        subTopics: [
          { name: "Information and asset ownership", order: 1 },
          { name: "Asset inventory (e.g., tangible, intangible)", order: 2 },
          { name: "Asset management", order: 3 },
        ],
      },
      {
        code: "2.4",
        name: "Manage data lifecycle",
        order: 4,
        subTopics: [
          { name: "Data roles (e.g., owners, controllers, custodians, processors, users/subjects)", order: 1 },
          { name: "Data collection", order: 2 },
          { name: "Data location", order: 3 },
          { name: "Data maintenance", order: 4 },
          { name: "Data retention", order: 5 },
          { name: "Data remanence", order: 6 },
          { name: "Data destruction", order: 7 },
        ],
      },
      {
        code: "2.5",
        name: "Ensure appropriate asset retention (e.g., End of Life, End of Support)",
        order: 5,
        subTopics: [],
      },
      {
        code: "2.6",
        name: "Determine data security controls and compliance requirements",
        order: 6,
        subTopics: [
          { name: "Data states (e.g., in use, in transit, at rest)", order: 1 },
          { name: "Scoping and tailoring", order: 2 },
          { name: "Standards selection", order: 3 },
          { name: "Data protection methods (e.g., Digital Rights Management (DRM), Data Loss Prevention (DLP), Cloud Access Security Broker (CASB))", order: 4 },
        ],
      },
    ],
  },
  {
    domainNumber: 3,
    domainName: "Security Architecture and Engineering",
    topics: [
      {
        code: "3.1",
        name: "Research, implement, and manage engineering processes using secure design principles",
        order: 1,
        subTopics: [
          { name: "Threat modeling", order: 1 },
          { name: "Least privilege", order: 2 },
          { name: "Defense in depth", order: 3 },
          { name: "Secure defaults", order: 4 },
          { name: "Fail securely", order: 5 },
          { name: "Separation of Duties (SoD)", order: 6 },
          { name: "Keep it simple", order: 7 },
          { name: "Zero trust", order: 8 },
          { name: "Privacy by design", order: 9 },
          { name: "Trust but verify", order: 10 },
          { name: "Shared responsibility", order: 11 },
        ],
      },
      {
        code: "3.2",
        name: "Understand the fundamental concepts of security models",
        order: 2,
        subTopics: [
          { name: "Bell-LaPadula", order: 1 },
          { name: "Biba", order: 2 },
          { name: "Clark-Wilson", order: 3 },
          { name: "Brewer-Nash", order: 4 },
        ],
      },
      {
        code: "3.3",
        name: "Select controls based upon systems security requirements",
        order: 3,
        subTopics: [],
      },
      {
        code: "3.4",
        name: "Understand security capabilities of Information Systems",
        order: 4,
        subTopics: [
          { name: "Memory protection", order: 1 },
          { name: "Trusted Platform Module (TPM)", order: 2 },
          { name: "Encryption/decryption", order: 3 },
        ],
      },
      {
        code: "3.5",
        name: "Assess and mitigate the vulnerabilities of security architectures, designs, and solution elements",
        order: 5,
        subTopics: [
          { name: "Client-based systems", order: 1 },
          { name: "Server-based systems", order: 2 },
          { name: "Database systems", order: 3 },
          { name: "Cryptographic systems", order: 4 },
          { name: "Industrial Control Systems (ICS)", order: 5 },
          { name: "Cloud-based systems (e.g., Software as a Service (SaaS), Infrastructure as a Service (IaaS), Platform as a Service (PaaS))", order: 6 },
          { name: "Distributed systems", order: 7 },
          { name: "Internet of Things (IoT)", order: 8 },
          { name: "Microservices", order: 9 },
          { name: "Containerization", order: 10 },
          { name: "Serverless", order: 11 },
          { name: "Embedded systems", order: 12 },
          { name: "High-Performance Computing systems", order: 13 },
          { name: "Edge computing systems", order: 14 },
          { name: "Virtualized systems", order: 15 },
        ],
      },
      {
        code: "3.6",
        name: "Select and determine cryptographic solutions",
        order: 6,
        subTopics: [
          { name: "Cryptographic life cycle (e.g., keys, algorithm selection)", order: 1 },
          { name: "Cryptographic methods (e.g., symmetric, asymmetric, elliptic curves, quantum)", order: 2 },
          { name: "Public Key Infrastructure (PKI)", order: 3 },
          { name: "Key management practices", order: 4 },
          { name: "Digital signatures and digital certificates", order: 5 },
          { name: "Non-repudiation", order: 6 },
          { name: "Integrity (e.g., hashing)", order: 7 },
        ],
      },
      {
        code: "3.7",
        name: "Understand methods of cryptanalytic attacks",
        order: 7,
        subTopics: [
          { name: "Brute force", order: 1 },
          { name: "Ciphertext only", order: 2 },
          { name: "Known plaintext", order: 3 },
          { name: "Frequency analysis", order: 4 },
          { name: "Chosen ciphertext", order: 5 },
          { name: "Implementation attacks", order: 6 },
          { name: "Side-channel", order: 7 },
          { name: "Fault injection", order: 8 },
          { name: "Timing", order: 9 },
          { name: "Man-in-the-Middle (MITM)", order: 10 },
          { name: "Pass the hash", order: 11 },
          { name: "Kerberos exploitation", order: 12 },
          { name: "Ransomware", order: 13 },
        ],
      },
      {
        code: "3.8",
        name: "Apply security principles to site and facility design",
        order: 8,
        subTopics: [],
      },
      {
        code: "3.9",
        name: "Design site and facility security controls",
        order: 9,
        subTopics: [
          { name: "Wiring closets/intermediate distribution facilities", order: 1 },
          { name: "Server rooms/data centers", order: 2 },
          { name: "Media storage facilities", order: 3 },
          { name: "Evidence storage", order: 4 },
          { name: "Restricted and work area security", order: 5 },
          { name: "Utilities and Heating, Ventilation, and Air Conditioning (HVAC)", order: 6 },
          { name: "Environmental issues", order: 7 },
          { name: "Fire prevention, detection, and suppression", order: 8 },
          { name: "Power (e.g., redundant, backup)", order: 9 },
        ],
      },
    ],
  },
  {
    domainNumber: 4,
    domainName: "Communication and Network Security",
    topics: [
      {
        code: "4.1",
        name: "Assess and implement secure design principles in network architectures",
        order: 1,
        subTopics: [
          { name: "Open System Interconnection (OSI) and Transmission Control Protocol/Internet Protocol (TCP/IP) models", order: 1 },
          { name: "Internet Protocol (IP) networking (e.g., Internet Protocol Security (IPSec), Internet Protocol (IP) v4/6)", order: 2 },
          { name: "Secure protocols", order: 3 },
          { name: "Implications of multilayer protocols", order: 4 },
          { name: "Converged protocols (e.g., Fiber Channel Over Ethernet (FCoE), Internet Small Computer Systems Interface (iSCSI), Voice over Internet Protocol (VoIP))", order: 5 },
          { name: "Micro-segmentation (e.g., Software Defined Networks (SDN), Virtual eXtensible Local Area Network (VXLAN), Encapsulation, Software-Defined Wide Area Network (SD-WAN))", order: 6 },
          { name: "Wireless networks (e.g., LiFi, Wi-Fi, Zigbee, satellite)", order: 7 },
          { name: "Cellular networks (e.g., 4G, 5G)", order: 8 },
          { name: "Content Distribution Networks (CDN)", order: 9 },
        ],
      },
      {
        code: "4.2",
        name: "Secure network components",
        order: 2,
        subTopics: [
          { name: "Operation of hardware (e.g., redundant power, warranty, support)", order: 1 },
          { name: "Transmission media", order: 2 },
          { name: "Network Access Control (NAC) devices", order: 3 },
          { name: "Endpoint security", order: 4 },
        ],
      },
      {
        code: "4.3",
        name: "Implement secure communication channels according to design",
        order: 3,
        subTopics: [
          { name: "Voice", order: 1 },
          { name: "Multimedia collaboration", order: 2 },
          { name: "Remote access", order: 3 },
          { name: "Data communications", order: 4 },
          { name: "Virtualized networks", order: 5 },
          { name: "Third-party connectivity", order: 6 },
        ],
      },
    ],
  },
  {
    domainNumber: 5,
    domainName: "Identity and Access Management",
    topics: [
      {
        code: "5.1",
        name: "Control physical and logical access to assets",
        order: 1,
        subTopics: [
          { name: "Information", order: 1 },
          { name: "Systems", order: 2 },
          { name: "Devices", order: 3 },
          { name: "Facilities", order: 4 },
          { name: "Applications", order: 5 },
        ],
      },
      {
        code: "5.2",
        name: "Manage identification and authentication of people, devices, and services",
        order: 2,
        subTopics: [
          { name: "Identity Management (IdM) implementation", order: 1 },
          { name: "Single/Multi-Factor Authentication (MFA)", order: 2 },
          { name: "Accountability", order: 3 },
          { name: "Session management", order: 4 },
          { name: "Registration, proofing, and establishment of identity", order: 5 },
          { name: "Federated Identity Management (FIM)", order: 6 },
          { name: "Credential management systems", order: 7 },
          { name: "Single Sign-On (SSO)", order: 8 },
          { name: "Just-In-Time (JIT)", order: 9 },
        ],
      },
      {
        code: "5.3",
        name: "Federated identity with a third-party service",
        order: 3,
        subTopics: [
          { name: "On-premise", order: 1 },
          { name: "Cloud", order: 2 },
          { name: "Hybrid", order: 3 },
        ],
      },
      {
        code: "5.4",
        name: "Implement and manage authorization mechanisms",
        order: 4,
        subTopics: [
          { name: "Role Based Access Control (RBAC)", order: 1 },
          { name: "Rule-based access control", order: 2 },
          { name: "Mandatory Access Control (MAC)", order: 3 },
          { name: "Discretionary Access Control (DAC)", order: 4 },
          { name: "Attribute Based Access Control (ABAC)", order: 5 },
          { name: "Risk-based access control", order: 6 },
        ],
      },
      {
        code: "5.5",
        name: "Manage the identity and access provisioning lifecycle",
        order: 5,
        subTopics: [
          { name: "Account access review (e.g., user, system, service)", order: 1 },
          { name: "Provisioning and deprovisioning (e.g., on/offboarding and transfers)", order: 2 },
          { name: "Role definition (e.g., people assigned to new roles)", order: 3 },
          { name: "Privilege escalation (e.g., managed service accounts, use of sudo, minimizing its use)", order: 4 },
        ],
      },
      {
        code: "5.6",
        name: "Implement authentication systems",
        order: 6,
        subTopics: [
          { name: "OpenID Connect (OIDC)/Open Authorization (OAuth)", order: 1 },
          { name: "Security Assertion Markup Language (SAML)", order: 2 },
          { name: "Kerberos", order: 3 },
          { name: "Remote Authentication Dial-In User Service (RADIUS)/Terminal Access Controller Access Control System Plus (TACACS+)", order: 4 },
        ],
      },
    ],
  },
  {
    domainNumber: 6,
    domainName: "Security Assessment and Testing",
    topics: [
      {
        code: "6.1",
        name: "Design and validate assessment, test, and audit strategies",
        order: 1,
        subTopics: [
          { name: "Internal", order: 1 },
          { name: "External", order: 2 },
          { name: "Third-party", order: 3 },
        ],
      },
      {
        code: "6.2",
        name: "Conduct security control testing",
        order: 2,
        subTopics: [
          { name: "Vulnerability assessment", order: 1 },
          { name: "Penetration testing", order: 2 },
          { name: "Log reviews", order: 3 },
          { name: "Synthetic transactions", order: 4 },
          { name: "Code review and testing", order: 5 },
          { name: "Misuse case testing", order: 6 },
          { name: "Test coverage analysis", order: 7 },
          { name: "Interface testing", order: 8 },
          { name: "Breach attack simulations", order: 9 },
          { name: "Compliance checks", order: 10 },
        ],
      },
      {
        code: "6.3",
        name: "Collect security process data (e.g., technical and administrative)",
        order: 3,
        subTopics: [
          { name: "Account management", order: 1 },
          { name: "Management review and approval", order: 2 },
          { name: "Key performance and risk indicators", order: 3 },
          { name: "Backup verification data", order: 4 },
          { name: "Training and awareness", order: 5 },
          { name: "Disaster Recovery (DR) and Business Continuity (BC)", order: 6 },
        ],
      },
      {
        code: "6.4",
        name: "Analyze test output and generate report",
        order: 4,
        subTopics: [
          { name: "Remediation", order: 1 },
          { name: "Exception handling", order: 2 },
          { name: "Ethical disclosure", order: 3 },
        ],
      },
      {
        code: "6.5",
        name: "Conduct or facilitate security audits",
        order: 5,
        subTopics: [
          { name: "Internal", order: 1 },
          { name: "External", order: 2 },
          { name: "Third-party", order: 3 },
        ],
      },
    ],
  },
  {
    domainNumber: 7,
    domainName: "Security Operations",
    topics: [
      {
        code: "7.1",
        name: "Understand and comply with investigations",
        order: 1,
        subTopics: [
          { name: "Evidence collection and handling", order: 1 },
          { name: "Reporting and documentation", order: 2 },
          { name: "Investigative techniques", order: 3 },
          { name: "Digital forensics tools, tactics, and procedures", order: 4 },
          { name: "Artifacts (e.g., computer, network, mobile device)", order: 5 },
        ],
      },
      {
        code: "7.2",
        name: "Conduct logging and monitoring activities",
        order: 2,
        subTopics: [
          { name: "Intrusion detection and prevention", order: 1 },
          { name: "Security Information and Event Management (SIEM)", order: 2 },
          { name: "Continuous monitoring", order: 3 },
          { name: "Egress monitoring", order: 4 },
          { name: "Log management", order: 5 },
          { name: "Threat intelligence (e.g., threat feeds, threat hunting)", order: 6 },
          { name: "User and Entity Behavior Analytics (UEBA)", order: 7 },
        ],
      },
      {
        code: "7.3",
        name: "Perform Configuration Management (CM) (e.g., provisioning, baselining, automation)",
        order: 3,
        subTopics: [],
      },
      {
        code: "7.4",
        name: "Apply foundational security operations concepts",
        order: 4,
        subTopics: [
          { name: "Need-to-know/least privilege", order: 1 },
          { name: "Separation of Duties (SoD) and responsibilities", order: 2 },
          { name: "Privileged account management", order: 3 },
          { name: "Job rotation", order: 4 },
          { name: "Service Level Agreements (SLA)", order: 5 },
        ],
      },
      {
        code: "7.5",
        name: "Apply resource protection",
        order: 5,
        subTopics: [
          { name: "Media management", order: 1 },
          { name: "Media protection techniques", order: 2 },
        ],
      },
      {
        code: "7.6",
        name: "Conduct incident management",
        order: 6,
        subTopics: [
          { name: "Detection", order: 1 },
          { name: "Response", order: 2 },
          { name: "Mitigation", order: 3 },
          { name: "Reporting", order: 4 },
          { name: "Recovery", order: 5 },
          { name: "Remediation", order: 6 },
          { name: "Lessons learned", order: 7 },
        ],
      },
      {
        code: "7.7",
        name: "Operate and maintain detective and preventative measures",
        order: 7,
        subTopics: [
          { name: "Firewalls (e.g., next generation, web application, network)", order: 1 },
          { name: "Intrusion Detection Systems (IDS) and Intrusion Prevention Systems (IPS)", order: 2 },
          { name: "Whitelisting/blacklisting", order: 3 },
          { name: "Third-party provided security services", order: 4 },
          { name: "Sandboxing", order: 5 },
          { name: "Honeypots/honeynets", order: 6 },
          { name: "Anti-malware", order: 7 },
          { name: "Machine learning and Artificial Intelligence (AI) based tools", order: 8 },
        ],
      },
      {
        code: "7.8",
        name: "Implement and support patch and vulnerability management",
        order: 8,
        subTopics: [],
      },
      {
        code: "7.9",
        name: "Understand and participate in change management processes",
        order: 9,
        subTopics: [],
      },
      {
        code: "7.10",
        name: "Implement recovery strategies",
        order: 10,
        subTopics: [
          { name: "Backup storage strategies", order: 1 },
          { name: "Recovery site strategies", order: 2 },
          { name: "Multiple processing sites", order: 3 },
          { name: "System resilience, High Availability (HA), Quality of Service (QoS), and fault tolerance", order: 4 },
        ],
      },
      {
        code: "7.11",
        name: "Implement Disaster Recovery (DR) processes",
        order: 11,
        subTopics: [
          { name: "Response", order: 1 },
          { name: "Personnel", order: 2 },
          { name: "Communications", order: 3 },
          { name: "Assessment", order: 4 },
          { name: "Restoration", order: 5 },
          { name: "Training and awareness", order: 6 },
          { name: "Lessons learned", order: 7 },
        ],
      },
      {
        code: "7.12",
        name: "Test Disaster Recovery Plans (DRP)",
        order: 12,
        subTopics: [
          { name: "Read-through/tabletop", order: 1 },
          { name: "Walkthrough", order: 2 },
          { name: "Simulation", order: 3 },
          { name: "Parallel", order: 4 },
          { name: "Full interruption", order: 5 },
        ],
      },
      {
        code: "7.13",
        name: "Participate in Business Continuity (BC) planning and exercises",
        order: 13,
        subTopics: [],
      },
      {
        code: "7.14",
        name: "Implement and manage physical security",
        order: 14,
        subTopics: [
          { name: "Perimeter security controls", order: 1 },
          { name: "Internal security controls", order: 2 },
        ],
      },
      {
        code: "7.15",
        name: "Address personnel safety and security concerns",
        order: 15,
        subTopics: [
          { name: "Travel", order: 1 },
          { name: "Security training and awareness", order: 2 },
          { name: "Emergency management", order: 3 },
          { name: "Duress", order: 4 },
        ],
      },
    ],
  },
  {
    domainNumber: 8,
    domainName: "Software Development Security",
    topics: [
      {
        code: "8.1",
        name: "Understand and integrate security in the Software Development Life Cycle (SDLC)",
        order: 1,
        subTopics: [
          { name: "Development methodologies (e.g., Agile, Waterfall, DevOps, DevSecOps)", order: 1 },
          { name: "Maturity models (e.g., Capability Maturity Model (CMM), Software Assurance Maturity Model (SAMM))", order: 2 },
          { name: "Operation and maintenance", order: 3 },
          { name: "Change management", order: 4 },
          { name: "Integrated Product Team (IPT)", order: 5 },
        ],
      },
      {
        code: "8.2",
        name: "Identify and apply security controls in software development ecosystems",
        order: 2,
        subTopics: [
          { name: "Programming languages", order: 1 },
          { name: "Libraries", order: 2 },
          { name: "Tool sets", order: 3 },
          { name: "Integrated Development Environment (IDE)", order: 4 },
          { name: "Runtime", order: 5 },
          { name: "Continuous Integration and Continuous Delivery (CI/CD)", order: 6 },
          { name: "Security Orchestration, Automation, and Response (SOAR)", order: 7 },
          { name: "Software Configuration Management (SCM)", order: 8 },
          { name: "Code repositories", order: 9 },
          { name: "Application security testing (e.g., Static Application Security Testing (SAST), Dynamic Application Security Testing (DAST))", order: 10 },
        ],
      },
      {
        code: "8.3",
        name: "Assess the effectiveness of software security",
        order: 3,
        subTopics: [
          { name: "Auditing and logging of changes", order: 1 },
          { name: "Risk analysis and mitigation", order: 2 },
        ],
      },
      {
        code: "8.4",
        name: "Assess security impact of acquired software",
        order: 4,
        subTopics: [
          { name: "Commercial-off-the-shelf (COTS)", order: 1 },
          { name: "Open source", order: 2 },
          { name: "Third-party", order: 3 },
          { name: "Managed services (e.g., Software as a Service (SaaS), Infrastructure as a Service (IaaS), Platform as a Service (PaaS))", order: 4 },
        ],
      },
      {
        code: "8.5",
        name: "Define and apply secure coding guidelines and standards",
        order: 5,
        subTopics: [
          { name: "Security weaknesses and vulnerabilities at the source-code level", order: 1 },
          { name: "Security of Application Programming Interfaces (APIs)", order: 2 },
          { name: "Secure coding practices", order: 3 },
          { name: "Software-defined security", order: 4 },
        ],
      },
    ],
  },
];

// Helper function to get all topics for a domain
export function getTopicsForDomain(domainNumber: number): TopicData[] {
  const domain = CISSP_TOPICS_DATA.find(d => d.domainNumber === domainNumber);
  return domain?.topics || [];
}

// Helper function to get all sub-topics for a topic code
export function getSubTopicsForTopic(topicCode: string): SubTopicData[] {
  for (const domain of CISSP_TOPICS_DATA) {
    const topic = domain.topics.find(t => t.code === topicCode);
    if (topic) {
      return topic.subTopics;
    }
  }
  return [];
}

// Helper function to find topic by code
export function findTopicByCode(topicCode: string): { domain: DomainTopicsData; topic: TopicData } | null {
  for (const domain of CISSP_TOPICS_DATA) {
    const topic = domain.topics.find(t => t.code === topicCode);
    if (topic) {
      return { domain, topic };
    }
  }
  return null;
}

// Helper function to find sub-topic by name within a topic
export function findSubTopicByName(topicCode: string, subTopicName: string): SubTopicData | null {
  const subTopics = getSubTopicsForTopic(topicCode);
  return subTopics.find(st => st.name.toLowerCase() === subTopicName.toLowerCase()) || null;
}

// Get total count of topics and sub-topics
export function getTopicsCounts(): { domains: number; topics: number; subTopics: number } {
  let topics = 0;
  let subTopics = 0;

  for (const domain of CISSP_TOPICS_DATA) {
    topics += domain.topics.length;
    for (const topic of domain.topics) {
      subTopics += topic.subTopics.length;
    }
  }

  return {
    domains: CISSP_TOPICS_DATA.length,
    topics,
    subTopics,
  };
}
