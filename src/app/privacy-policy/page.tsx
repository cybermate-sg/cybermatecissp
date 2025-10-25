import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 lg:p-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>

          <p className="text-gray-400 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-invert prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <p className="text-gray-300 leading-relaxed">
                CISSP Mastery (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you visit our website and use our services. Please read this privacy policy carefully. If you do
                not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                1. Information We Collect
              </h2>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Personal Information
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Register for an account</li>
                <li>Make a purchase</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact us for support</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                This information may include:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>Name and email address</li>
                <li>LinkedIn profile information (when using LinkedIn authentication)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Communication preferences</li>
                <li>Any other information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Automatically Collected Information
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                When you visit our website, we automatically collect certain information about your device, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>IP address and browser type</li>
                <li>Operating system and device information</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Usage patterns and preferences</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Provide, operate, and maintain our services</li>
                <li>Process your transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Send you marketing and promotional communications (with your consent)</li>
                <li>Monitor and analyze usage and trends to improve your experience</li>
                <li>Detect, prevent, and address technical issues and fraudulent activity</li>
                <li>Personalize your learning experience and content recommendations</li>
                <li>Comply with legal obligations and enforce our terms of service</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                3. How We Share Your Information
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may share your information in the following situations:
              </p>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Service Providers
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We work with third-party service providers to help us operate our business and deliver services to you:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li><strong>Clerk:</strong> Authentication and user management</li>
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>LinkedIn:</strong> Social authentication</li>
                <li><strong>Hosting providers:</strong> Website and database hosting</li>
                <li><strong>Analytics providers:</strong> Usage analytics and performance monitoring</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Legal Requirements
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                We may disclose your information if required to do so by law or in response to valid requests by
                public authorities (e.g., a court or government agency).
              </p>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Business Transfers
              </h3>
              <p className="text-gray-300 leading-relaxed">
                If we are involved in a merger, acquisition, or sale of assets, your information may be transferred
                as part of that transaction. We will provide notice before your information is transferred and becomes
                subject to a different privacy policy.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication through industry-standard providers</li>
                <li>Regular security assessments and updates</li>
                <li>Limited access to personal information by authorized personnel only</li>
                <li>PCI DSS compliant payment processing through Stripe</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we
                strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                5. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our website and hold certain information.
                Cookies are files with a small amount of data that may include an anonymous unique identifier.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However,
                if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We use both session cookies (which expire when you close your browser) and persistent cookies (which
                stay on your device until deleted) for authentication, preferences, and analytics purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Your Privacy Rights
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your information to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restrict processing:</strong> Request limitation on how we use your information</li>
                <li><strong>Object:</strong> Object to certain types of processing</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided below. We will respond to
                your request within 30 days.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                7. Data Retention
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in
                this privacy policy, unless a longer retention period is required or permitted by law. When we no longer
                need your information, we will securely delete or anonymize it.
              </p>
            </section>

            {/* Third-Party Links */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                8. Third-Party Websites
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Our website may contain links to third-party websites that are not operated by us. If you click on a
                third-party link, you will be directed to that third party&apos;s site. We strongly advise you to review
                the privacy policy of every site you visit. We have no control over and assume no responsibility for the
                content, privacy policies, or practices of any third-party sites or services.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                9. Children&apos;s Privacy
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal
                information from children under 18. If you are a parent or guardian and you are aware that your child has
                provided us with personal information, please contact us. If we become aware that we have collected personal
                information from children without verification of parental consent, we will take steps to remove that
                information from our servers.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                10. International Data Transfers
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Your information may be transferred to and maintained on computers located outside of your state, province,
                country, or other governmental jurisdiction where data protection laws may differ. By using our services,
                you consent to the transfer of your information to our facilities and the third parties with whom we share
                it as described in this privacy policy.
              </p>
            </section>

            {/* California Privacy Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                11. California Privacy Rights (CCPA)
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Right to know what personal information is collected, used, shared, or sold</li>
                <li>Right to delete personal information held by businesses</li>
                <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                <li>Right to non-discrimination for exercising your CCPA rights</li>
              </ul>
            </section>

            {/* GDPR Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                12. European Privacy Rights (GDPR)
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you are located in the European Economic Area (EEA), you have certain data protection rights under the
                General Data Protection Regulation (GDPR). We process your personal information based on the following
                legal grounds:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li><strong>Contract:</strong> To perform our contract with you</li>
                <li><strong>Consent:</strong> Where you have given explicit consent</li>
                <li><strong>Legitimate interests:</strong> For our business operations</li>
                <li><strong>Legal obligation:</strong> To comply with legal requirements</li>
              </ul>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                13. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We may update our privacy policy from time to time. We will notify you of any changes by posting the new
                privacy policy on this page and updating the &quot;Last Updated&quot; date. We will notify you via email and/or
                a prominent notice on our website prior to the change becoming effective. You are advised to review this
                privacy policy periodically for any changes.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                14. Contact Us
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about this privacy policy or our privacy practices, please contact us:
              </p>
              <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">CISSP Mastery</strong>
                </p>
                <p className="text-gray-300 mb-2">
                  Email: <a href="mailto:privacy@cisspmastery.com" className="text-purple-400 hover:text-purple-300 underline">privacy@cisspmastery.com</a>
                </p>
                <p className="text-gray-300">
                  Website: <Link href="/" className="text-purple-400 hover:text-purple-300 underline">cisspmastery.com</Link>
                </p>
              </div>
            </section>

            {/* Consent */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                15. Your Consent
              </h2>
              <p className="text-gray-300 leading-relaxed">
                By using our website and services, you consent to this privacy policy and agree to its terms. If you do
                not agree to this policy, please do not use our services.
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
