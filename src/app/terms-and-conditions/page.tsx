import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 lg:p-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Terms and Conditions
          </h1>

          <p className="text-gray-400 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-invert prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                1. Agreement to Terms
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                These Terms and Conditions (&quot;Terms,&quot; &quot;Terms and Conditions&quot;) govern your relationship
                with CISSP Mastery (the &quot;Service&quot;) operated by CISSP Mastery (&quot;us,&quot; &quot;we,&quot; or &quot;our&quot;).
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Please read these Terms and Conditions carefully before using our website and services. Your access to
                and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms
                apply to all visitors, users, and others who access or use the Service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">By accessing or using the Service, you agree to be bound by these Terms.
                If you disagree with any part of the terms, then you may not access the Service.</strong>
              </p>
            </section>

            {/* Accounts */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                2. User Accounts
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current
                at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination
                of your account on our Service.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Safeguarding the password that you use to access the Service</li>
                <li>Any activities or actions under your account</li>
                <li>Maintaining the confidentiality of your account and password</li>
                <li>Restricting access to your computer and/or account</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                You agree to immediately notify us of any unauthorized use of your account or any other breach of security.
                We will not be liable for any loss or damage arising from your failure to comply with this security obligation.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                3. Intellectual Property Rights
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property
                of CISSP Mastery and its licensors. The Service is protected by copyright, trademark, and other laws of both
                the Singapore and foreign countries.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our trademarks and trade dress may not be used in connection with any product or service without the prior
                written consent of CISSP Mastery. All content, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Study materials, notes, and guides</li>
                <li>Practice questions and exams</li>
                <li>Videos, images, and graphics</li>
                <li>Text, code, and software</li>
                <li>Design, layout, and look-and-feel</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                All such content is owned by or licensed to CISSP Mastery and is subject to copyright and other intellectual
                property rights under Singapore and foreign laws and international conventions.
              </p>
            </section>

            {/* License to Use */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. License to Use Content
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable,
                non-sublicensable license to access and use the Service for your personal, non-commercial use only.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">You may NOT:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Reproduce, distribute, modify, or create derivative works of our content</li>
                <li>Share your account credentials or access with others</li>
                <li>Download, copy, or store content except as expressly permitted</li>
                <li>Use automated systems (bots, scrapers) to access the Service</li>
                <li>Remove, alter, or obscure any copyright or proprietary notices</li>
                <li>Sell, rent, lease, or sublicense access to the Service</li>
                <li>Use the Service for any commercial purpose without authorization</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </section>

            {/* Purchases and Payment */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                5. Purchases and Payment
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you wish to purchase any product or service made available through the Service, you may be asked to
                supply certain information relevant to your purchase, including but not limited to your email address
                and payment information.
              </p>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Payment Processing
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use third-party payment processors (Stripe) to process payments. By making a purchase, you agree to
                the payment processor&apos;s terms and conditions. We do not store your payment card details.
              </p>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Pricing and Availability
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Modify or discontinue products or services at any time</li>
                <li>Change prices for products and services at any time</li>
                <li>Refuse or cancel any order for any reason</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Billing and Renewal
              </h3>
              <p className="text-gray-300 leading-relaxed">
                For subscription-based services, your subscription will continue and automatically renew unless cancelled.
                You consent to our charging your payment method on a recurring basis without requiring your prior approval
                for each charge, until you cancel your subscription.
              </p>
            </section>

            {/* Refund Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Refund Policy
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We offer a satisfaction guarantee on our products and services. If you are not satisfied with your purchase,
                please contact us within 30 days of your purchase date to request a refund.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Refund requests will be evaluated on a case-by-case basis. We reserve the right to refuse refunds in cases
                where significant content has been accessed or downloaded, or where we suspect abuse of our refund policy.
              </p>
              <p className="text-gray-300 leading-relaxed">
                To request a refund, please contact us at{" "}
                <a href="mailto:support@cybermateconsulting.com" className="text-purple-400 hover:text-purple-300 underline">
                  support@cybermateconsulting.com
                </a>{" "}
                with your order details and reason for the refund request.
              </p>
            </section>

            {/* Prohibited Uses */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                7. Prohibited Uses
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You may use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to use
                the Service:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
                <li>To impersonate or attempt to impersonate CISSP Mastery, an employee, another user, or any other person or entity</li>
                <li>To engage in any conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Service</li>
                <li>To use any robot, spider, or other automatic device to access the Service for any purpose</li>
                <li>To introduce any viruses, trojan horses, worms, logic bombs, or other harmful material</li>
                <li>To attempt to gain unauthorized access to any portion of the Service or any systems or networks</li>
                <li>To interfere with or disrupt the Service or servers or networks connected to the Service</li>
              </ul>
            </section>

            {/* User Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                8. User-Generated Content
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our Service may allow you to post, link, store, share, and otherwise make available certain information,
                text, graphics, or other material (&quot;Content&quot;). You are responsible for the Content that you post
                on or through the Service, including its legality, reliability, and appropriateness.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                By posting Content on or through the Service, you grant us the right and license to use, modify, publicly
                perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain
                any and all of your rights to any Content you submit, post, or display on or through the Service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                You represent and warrant that: (i) the Content is yours or you have the right to use it, and (ii) the
                posting of your Content does not violate the privacy rights, publicity rights, copyrights, contract rights,
                or any other rights of any person.
              </p>
            </section>

            {/* Analytics and Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                9. Analytics and Tracking
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may use third-party Service Providers to monitor and analyze the use of our Service. This helps us
                improve the Service and provide a better user experience.
              </p>
              <p className="text-gray-300 leading-relaxed">
                For more information about how we collect, use, and share your information, please see our{" "}
                <Link href="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </Link>.
              </p>
            </section>

            {/* Links to Other Websites */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                10. Links to Other Websites
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our Service may contain links to third-party websites or services that are not owned or controlled by
                CISSP Mastery. We have no control over, and assume no responsibility for, the content, privacy policies,
                or practices of any third-party websites or services.
              </p>
              <p className="text-gray-300 leading-relaxed">
                You acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any
                damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such
                content, goods, or services available on or through any such websites or services.
              </p>
            </section>

            {/* Disclaimers */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                11. Disclaimers and Warranties
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">CISSP Certification Disclaimer:</strong> CISSP Mastery is an independent
                study resource and is not affiliated with, endorsed by, or sponsored by (ISC)² or any certification body.
                CISSP® is a registered trademark of (ISC)². Use of this trademark does not imply endorsement.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">No Guarantee of Results:</strong> While our materials are designed to help
                you prepare for the CISSP certification exam, we make no guarantees that you will pass the exam or achieve
                any specific result. Your success depends on many factors, including your prior knowledge, study habits,
                and test-taking abilities.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">Service &quot;As Is&quot;:</strong> The Service is provided on an &quot;AS IS&quot;
                and &quot;AS AVAILABLE&quot; basis. The Service is provided without warranties of any kind, whether express
                or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular
                purpose, non-infringement, or course of performance.
              </p>
              <p className="text-gray-300 leading-relaxed">
                CISSP Mastery, its subsidiaries, affiliates, and its licensors do not warrant that: (a) the Service will
                function uninterrupted, secure, or available at any particular time or location; (b) any errors or defects
                will be corrected; (c) the Service is free of viruses or other harmful components; or (d) the results of
                using the Service will meet your requirements.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                12. Limitation of Liability
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                In no event shall CISSP Mastery, nor its directors, employees, partners, agents, suppliers, or affiliates,
                be liable for any indirect, incidental, special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                In no event shall our total liability to you for all damages, losses, or causes of action exceed the amount
                you have paid to us in the last twelve (12) months, or one hundred dollars ($197), whichever is greater.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                13. Indemnification
              </h2>
              <p className="text-gray-300 leading-relaxed">
                You agree to defend, indemnify, and hold harmless CISSP Mastery and its licensee and licensors, and their
                employees, contractors, agents, officers, and directors, from and against any and all claims, damages,
                obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney&apos;s fees),
                resulting from or arising out of: (a) your use and access of the Service; (b) your violation of any term
                of these Terms; or (c) your violation of any third party right, including without limitation any copyright,
                property, or privacy right.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                14. Termination
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason
                whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the
                Service will immediately cease.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you wish to terminate your account, you may simply discontinue using the Service or contact us to request
                account deletion.
              </p>
              <p className="text-gray-300 leading-relaxed">
                All provisions of the Terms which by their nature should survive termination shall survive termination,
                including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                15. Governing Law and Jurisdiction
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                These Terms shall be governed and construed in accordance with the laws of the Singapore, without
                regard to its conflict of law provisions.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions
                of these Terms will remain in effect.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                16. Dispute Resolution
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">Informal Negotiations:</strong> To expedite resolution and control the cost
                of any dispute, controversy, or claim related to these Terms, you and CISSP Mastery agree to first attempt
                to negotiate any dispute informally for at least thirty (30) days before initiating arbitration.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">Binding Arbitration:</strong> If we cannot resolve a dispute through informal
                negotiations, any claim arising out of or relating to these Terms will be resolved by binding arbitration,
                rather than in court, except that you may assert claims in small claims court if your claims qualify.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                17. Changes to Terms
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision
                is material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect.
              </p>
              <p className="text-gray-300 leading-relaxed">
                By continuing to access or use our Service after those revisions become effective, you agree to be bound
                by the revised terms. If you do not agree to the new terms, please stop using the Service.
              </p>
            </section>

            {/* Entire Agreement */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                18. Entire Agreement
              </h2>
              <p className="text-gray-300 leading-relaxed">
                These Terms constitute the entire agreement between you and CISSP Mastery regarding the use of the Service,
                superseding any prior agreements between you and CISSP Mastery relating to your use of the Service.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                19. Contact Us
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">CISSP Mastery</strong>
                </p>
                <p className="text-gray-300 mb-2">
                  Email: <a href="mailto:support@cybermateconsulting.com" className="text-purple-400 hover:text-purple-300 underline">support@cybermateconsulting.com</a>
                </p>
                <p className="text-gray-300">
                  Website: <Link href="/" className="text-purple-400 hover:text-purple-300 underline">cybermateconsulting.com</Link>
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                20. Acknowledgment
              </h2>
              <p className="text-gray-300 leading-relaxed">
                By using CISSP Mastery, you acknowledge that you have read these Terms and Conditions and agree to be
                bound by them. If you do not agree with any part of these Terms, you must not use our Service.
              </p>
            </section>
          </div>

          {/* Back to Home Button */}
          <div className="mt-12 pt-8 border-t border-slate-700">
            <Link
              href="/"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
