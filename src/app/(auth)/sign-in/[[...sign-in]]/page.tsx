import { SignIn } from '@clerk/nextjs';

export default function SignInPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">CISSP Mastery</h1>
          <p className="mt-2 text-gray-600">Sign in to continue learning</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl",
            }
          }}
          forceRedirectUrl={searchParams.redirect_url || undefined}
        />
      </div>
    </div>
  );
}
