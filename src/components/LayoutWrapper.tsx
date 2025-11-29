"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/Header"), {
  loading: () => (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm" style={{height: '64px'}} />
  ),
});

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
});

const ClientToaster = dynamic(() => import("@/components/ClientToaster"), {
  loading: () => null,
});

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  if (isAuthPage) {
    return (
      <>
        {children}
        <ClientToaster />
      </>
    );
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      <ClientToaster />
    </>
  );
}
