"use client";

import { InlineWidget } from "react-calendly";
import { useUser } from "@clerk/nextjs";

export default function AppointmentClient() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Book Your <span className="text-amber-400">CISSP Mastery</span> Session
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Schedule a personalized consultation with Raju to master your CISSP preparation.
            Get expert guidance, clarify doubts, and accelerate your certification journey.
          </p>
        </div>

        {/* Calendly Widget Container */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <InlineWidget
              url="https://calendly.com/codesoles/master-cissp-with-raju"
              styles={{
                height: "700px",
                minWidth: "320px",
              }}
              prefill={{
                email: user?.emailAddresses[0]?.emailAddress || "",
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
                name: user?.fullName || "",
              }}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="text-amber-400 text-2xl mb-3">🎯</div>
              <h3 className="text-white font-semibold mb-2">Personalized Guidance</h3>
              <p className="text-slate-400 text-sm">
                Get tailored advice based on your current knowledge and learning pace
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="text-amber-400 text-2xl mb-3">📚</div>
              <h3 className="text-white font-semibold mb-2">Expert Insights</h3>
              <p className="text-slate-400 text-sm">
                Learn from real-world experience and proven strategies for CISSP success
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="text-amber-400 text-2xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Accelerate Learning</h3>
              <p className="text-slate-400 text-sm">
                Fast-track your preparation with focused sessions on challenging topics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
