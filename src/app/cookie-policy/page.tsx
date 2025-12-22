import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 lg:p-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Cookie Policy
          </h1>

          <p className="text-gray-400 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-invert prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <p className="text-gray-300 leading-relaxed">
                This Cookie Policy explains how CISSP Mastery (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and similar
                tracking technologies when you visit our website. This policy describes what these technologies are, why we use them,
                and your rights to control their use.
              </p>
            </section>

            {/* What Are Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                1. What Are Cookies?
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make
                websites work more efficiently and provide information to website owners.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Cookies can be &quot;persistent&quot; or &quot;session&quot; cookies. Persistent cookies remain on your device after you close
                your browser, while session cookies are deleted when you close your browser.
              </p>
            </section>

            {/* How We Use Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                2. How We Use Cookies
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>

              <div className="space-y-6">
                <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-semibold text-purple-400 mb-3">
                    Essential Cookies
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    These cookies are necessary for the website to function properly. They enable core functionality such as:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Authentication and account access</li>
                    <li>Security features and fraud prevention</li>
                    <li>Session management</li>
                    <li>Load balancing</li>
                  </ul>
                  <p className="text-gray-300 leading-relaxed mt-3 text-sm">
                    <strong>Cannot be disabled:</strong> These cookies are essential for the website to work.
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-semibold text-purple-400 mb-3">
                    Functional Cookies
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    These cookies enable enhanced functionality and personalization:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Remembering your preferences and settings</li>
                    <li>Saving your progress in flashcard decks</li>
                    <li>Storing your learning history</li>
                    <li>Language and region preferences</li>
                  </ul>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-semibold text-purple-400 mb-3">
                    Analytics Cookies
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    These cookies help us understand how visitors interact with our website:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Understanding how you use the website</li>
                    <li>Measuring website performance</li>
                    <li>Identifying technical issues</li>
                    <li>Improving our services</li>
                  </ul>
                  <p className="text-gray-300 leading-relaxed mt-3 text-sm">
                    <strong>Note:</strong> We use privacy-friendly analytics that do not track you across other websites.
                  </p>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                3. Third-Party Cookies
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use trusted third-party services that may set cookies on your device:
              </p>

              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Clerk (Authentication)
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm mb-2">
                    <strong>Purpose:</strong> Manages user authentication and account security
                  </p>
                  <p className="text-gray-300 leading-relaxed text-sm mb-2">
                    <strong>Type:</strong> Essential - Required for login and account access
                  </p>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    <strong>Privacy Policy:</strong>{" "}
                    <a
                      href="https://clerk.com/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      https://clerk.com/legal/privacy
                    </a>
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Stripe (Payment Processing)
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm mb-2">
                    <strong>Purpose:</strong> Processes payments securely and prevents fraud
                  </p>
                  <p className="text-gray-300 leading-relaxed text-sm mb-2">
                    <strong>Type:</strong> Essential - Required for purchases
                  </p>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    <strong>Privacy Policy:</strong>{" "}
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      https://stripe.com/privacy
                    </a>
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Sentry (Error Monitoring)
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm mb-2">
                    <strong>Purpose:</strong> Monitors and reports technical errors to improve service reliability
                  </p>
                  <p className="text-gray-300 leading-relaxed text-sm mb-2">
                    <strong>Type:</strong> Functional - Helps us fix bugs and improve performance
                  </p>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    <strong>Privacy Policy:</strong>{" "}
                    <a
                      href="https://sentry.io/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      https://sentry.io/privacy/
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Managing Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. How to Control Cookies
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting
                your preferences in your browser.
              </p>

              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                Browser Controls
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Most web browsers allow you to control cookies through their settings. However, if you block essential cookies,
                you may not be able to use all features of our website.
              </p>

              <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Browser Cookie Settings:
                </h4>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>
                    <strong>Chrome:</strong>{" "}
                    <a
                      href="https://support.google.com/chrome/answer/95647"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline text-sm"
                    >
                      Manage cookies in Chrome
                    </a>
                  </li>
                  <li>
                    <strong>Firefox:</strong>{" "}
                    <a
                      href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline text-sm"
                    >
                      Manage cookies in Firefox
                    </a>
                  </li>
                  <li>
                    <strong>Safari:</strong>{" "}
                    <a
                      href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline text-sm"
                    >
                      Manage cookies in Safari
                    </a>
                  </li>
                  <li>
                    <strong>Edge:</strong>{" "}
                    <a
                      href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline text-sm"
                    >
                      Manage cookies in Edge
                    </a>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-amber-400 mb-2">
                  ⚠️ Important Notice
                </h4>
                <p className="text-gray-300 leading-relaxed text-sm">
                  If you disable essential cookies, you will not be able to log in or access your account. Some features
                  of the website may not work properly without cookies enabled.
                </p>
              </div>
            </section>

            {/* Cookie Duration */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                5. How Long Do Cookies Last?
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The length of time a cookie remains on your device depends on its type:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>
                  <strong>Session cookies:</strong> Deleted when you close your browser
                </li>
                <li>
                  <strong>Persistent cookies:</strong> Remain for a set period (typically 30 days to 1 year) or until you delete them
                </li>
                <li>
                  <strong>Authentication cookies:</strong> Typically last 30 days or until you log out
                </li>
              </ul>
            </section>

            {/* Updates to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Updates to This Cookie Policy
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational,
                or regulatory reasons. We will notify you of any significant changes by posting a notice on our website or by
                sending you an email. The &quot;Last Updated&quot; date at the top of this policy indicates when it was last revised.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                7. Contact Us
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
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

            {/* More Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                8. More Information
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                For more information about how we handle your personal data, please see our{" "}
                <Link href="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </Link>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                To learn more about cookies in general, visit{" "}
                <a
                  href="https://www.allaboutcookies.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  www.allaboutcookies.org
                </a>.
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
