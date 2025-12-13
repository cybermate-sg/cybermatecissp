/**
 * AI Prompt Templates for CISSP Quiz Generation
 *
 * These prompts are optimized for generating high-quality CISSP exam-style
 * multiple-choice questions with detailed explanations and elimination tactics.
 */

export interface PromptOptions {
  topic: string;
  questionCount: number;
}

/**
 * Builds the main CISSP quiz generation prompt
 */
export function buildCisspQuizPrompt({ topic, questionCount }: PromptOptions): string {
  return `Act as a seasoned CISSP exam question writer and instructor.
Generate ${questionCount} high-quality, scenario-based practice questions focusing on the following topic: ${topic}

**Criteria for Questions:**
1. **Level:** Bloom Taxonomy Level 2 (Comprehension/Application). The user must apply knowledge to a scenario, not just define terms.
2. **Style:** Mimic the actual CISSP exam format. Questions should often ask for the "BEST," "MOST effective," "FIRST," or "PRIMARY" solution. Focus on the managerial/risk-management mindset rather than purely technical fixes.
3. **Distractors:** Incorrect options must be plausible but wrong due to context, scope, or order of operations (e.g., too tactical, violates ethics, or ignores business needs).
4. **elimination_tactics:** Eliminate any two options that are incorrect and provide justification of the elimination.
5. **correct_answer_with_justification:** Analyze the remaining two options and justify correct answer option.

**Output Format:**
You must strictly output the response in the following JSON format. Do not include markdown formatting (like \`\`\`json) surrounding the output, just the raw JSON.

{
    "questions": [
        {
            "question": "Scenario text here...",
            "options": [
                {
                    "text": "Option A text",
                    "isCorrect": false
                },
                {
                    "text": "Option B text",
                    "isCorrect": true
                },
                {
                    "text": "Option C text",
                    "isCorrect": false
                },
                {
                    "text": "Option D text",
                    "isCorrect": false
                }
            ],
            "explanation": "A summary of why the correct answer is the best choice according to ISC2 concepts.",
            "elimination_tactics": {
                "Option A text": "Specific reason why this is incorrect (e.g., technically valid but not the first step).",
                "Option C text": "Specific reason why this is incorrect."
            },
            "compare_remaining_options_with_justification": {
                "Option D text": "Deep dive into why this aligns close to correct answer.",
                "Option B text": "Deep dive into why this aligns close to correct answer."
            },
            "correct_options_justification": {
                "Option B text": "A summary of why the correct answer is the best choice according to ISC2 concepts."
            }
        }
    ]
}`;
}

/**
 * Example of a well-formatted quiz question for reference
 */
export const EXAMPLE_QUIZ_QUESTION = {
  question: "An organization is implementing a new SaaS-based HR platform and intends to use SAML 2.0 to provide Single Sign-On (SSO) capabilities for employees. The Chief Information Security Officer (CISO) insists that the integration must strictly adhere to the concept of Federated Identity Management to minimize credential management overhead. Which of the following components MUST be established to create the initial trust relationship between the organization's network and the SaaS provider?",
  options: [
    { text: "A shared secret key", isCorrect: false },
    { text: "Metadata exchange", isCorrect: true },
    { text: "OAuth 2.0 authorization server", isCorrect: false },
    { text: "Mutual TLS certificates", isCorrect: false }
  ],
  explanation: "In SAML 2.0 federations, the initial trust relationship is established through metadata exchange between the Identity Provider (IdP) and Service Provider (SP). This metadata includes entity IDs, certificate information, endpoint URLs, and supported bindings. This is fundamental to SAML-based SSO implementations.",
  elimination_tactics: {
    "A shared secret key": "While shared secrets are used in some authentication protocols, SAML 2.0 relies on asymmetric cryptography and digital signatures, not shared secrets for the trust relationship.",
    "OAuth 2.0 authorization server": "OAuth 2.0 is a different protocol used for authorization, not authentication. SAML 2.0 doesn't require OAuth components for SSO.",
    "Mutual TLS certificates": "While certificates are involved in SAML, mTLS is not required for the initial trust establishment. SAML uses certificates within the metadata exchange process."
  },
  correct_answer_with_justification: {
    "Metadata exchange": "SAML metadata exchange is the standardized method (defined in SAML 2.0 specifications) for establishing trust. It allows the IdP and SP to exchange public keys, endpoints, and supported protocols without manual configuration."
  },
  compare_remaining_options_with_justification: {
    "Metadata vs Certificates": "While certificates are part of the metadata, the complete metadata exchange (not just certificates) is what establishes the trust relationship and enables the federation."
  },
  correct_options_justification: {
    "Metadata exchange": "According to SAML 2.0 specifications and NIST SP 800-63C, metadata exchange is the foundation of federated identity management. It provides the necessary information for both parties to validate assertions, verify signatures, and establish secure communication channels."
  }
};

/**
 * Validates that the AI response matches the expected structure
 */
export function isValidQuizResponse(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false;

  const resp = response as Record<string, unknown>;
  if (!Array.isArray(resp.questions)) return false;

  return resp.questions.every((q: unknown) => {
    if (!q || typeof q !== 'object') return false;
    const question = q as Record<string, unknown>;

    return (
      typeof question.question === 'string' &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      question.options.length <= 6
    );
  });
}
