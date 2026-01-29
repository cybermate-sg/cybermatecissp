import SectionHeader from "../ui/SectionHeader";
import { TestimonialCard, Testimonial } from "./TestimonialCard";

const testimonials: Testimonial[] = [
  {
    initials: "AJ",
    name: "Alex Johnson",
    role: "Security Architect, Fortune 500",
    quote: "This was the only resource I needed. The practice questions were incredibly similar to the real exam, and the adaptive learning helped me focus exactly where I needed to.",
    colorScheme: "purple"
  },
  {
    initials: "MP",
    name: "Maria Patel",
    role: "InfoSec Manager, FinTech",
    quote: "The adaptive system is a game-changer. It knew my weak spots before I did and forced me to address them. Passed with confidence on first attempt.",
    colorScheme: "cyan"
  },
  {
    initials: "DK",
    name: "David Kim",
    role: "Cybersecurity Consultant",
    quote: "Best $197 I ever spent on my career. 180 days of access for this price is incredible value - just high-quality content that actually mirrors the exam. Passed on my first attempt!",
    colorScheme: "purple"
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-[#0f1729] to-[#1a2235] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Real Results from"
            highlightedText="Real Professionals"
            subtitle="Join the league of smart security professionals who transformed their careers through my CISSP training."
          />
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
