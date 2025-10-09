import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            CISSP Mastery &copy; {currentYear}
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookie-policy"
              className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
            >
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
