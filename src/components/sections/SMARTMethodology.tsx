import Image from "next/image";

interface SMARTCard {
  letter: string;
  word: string;
  description: string;
  colorFrom: string;
  colorTo: string;
  borderColor: string;
}

const smartCards: SMARTCard[] = [
  {
    letter: "S",
    word: "Specific",
    description: "Targeted content covering all 8 CISSP domains (Security and Risk Management, Asset Security, Security Architecture and Engineering, Communication and Network Security, Identity and Access Management, Security Assessment and Testing, Security Operations, and Software Development Security).",
    colorFrom: "from-blue-500",
    colorTo: "to-blue-600",
    borderColor: "border-blue-500"
  },
  {
    letter: "M",
    word: "Measurable",
    description: "Track your progress with detailed analytics – monitor quiz scores, flashcard mastery rates, and domain-specific performance to know exactly where you're exam ready.",
    colorFrom: "from-green-500",
    colorTo: "to-green-600",
    borderColor: "border-green-500"
  },
  {
    letter: "A",
    word: "Attainable",
    description: "Bite-sized progress with curated analytics – monitor your scores, flashcard mastery rates, and domain-specific performance to see exactly where you're progressing steadily.",
    colorFrom: "from-orange-500",
    colorTo: "to-orange-600",
    borderColor: "border-orange-500"
  },
  {
    letter: "R",
    word: "Relevant",
    description: "Every question card and explanation leads to actionable knowledge. Start at beginner level and build up with a difficulty that naturally adapts to your pace.",
    colorFrom: "from-purple-500",
    colorTo: "to-purple-600",
    borderColor: "border-purple-500"
  },
  {
    letter: "T",
    word: "Time Bound",
    description: "Bite-sized flashcards with measurable milestones. Aim to complete the exam prep in 60 days time frame. Conquer all 8 domains by your target exam date.",
    colorFrom: "from-red-500",
    colorTo: "to-red-600",
    borderColor: "border-red-500"
  }
];

function SMARTCardComponent({ card }: { card: SMARTCard }) {
  return (
    <div className={`relative bg-gradient-to-br from-[#1a2235] to-[#0f1729] border-t-4 ${card.borderColor} rounded-2xl p-4 sm:p-6 flex flex-col items-center transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl`}>
      <div className={`w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br ${card.colorFrom} ${card.colorTo} rounded-3xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}>
        <span className="text-4xl sm:text-6xl lg:text-7xl font-black text-white">{card.letter}</span>
      </div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-4">{card.word}</h3>
      <p className="text-gray-100 text-center leading-relaxed text-sm sm:text-base">{card.description}</p>
    </div>
  );
}

export default function SMARTMethodology() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-[#1a2235] via-[#0f1729] to-[#1a2235] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
              Achieve Your CISSP Certification with Confidence Using Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                SMART Preparation Approach
              </span>
            </h2>

            <div className="flex items-center justify-center gap-3 mb-8">
                {/* <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg> */}
                <Image
                              src="/images/cybermate-logo-trans.png"
                              alt="Cybermate Logo"
                              width={40}
                              height={40}
                              className="rounded"
                              quality={75}
                              sizes="40px"
                              priority
                              fetchPriority="high"
                            />
              
              <span className="text-2xl font-bold text-white">Cybermate Consulting</span>
            </div>

            <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#1a2235]/80 to-[#0f1729]/80 border border-cyan-500/30 rounded-2xl p-6 lg:p-8">
              <p className="text-gray-100 text-base lg:text-lg leading-relaxed">
                At Cybermate Consulting, we specialize in helping cybersecurity professionals like you pass the prestigious CISSP (Certified Information Systems Security Professional) exam on your first attempt. Our platform features thousands of interactive quizzes, detailed explanations, and progress tracking tools – all designed to make your study journey efficient and effective. We believe in the power of SMART goals to turn ambitious dreams into achievable realities. That&apos;s why our entire preparation system is built around the SMART methodology.
              </p>
            </div>
          </div>

          {/* SMART Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-4">
            {smartCards.map((card, index) => (
              <SMARTCardComponent key={index} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
