import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-psrr-white flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <p className="font-display text-8xl font-bold text-psrr-navy mb-4 opacity-20">404</p>
        <h1 className="font-display text-3xl font-bold text-psrr-navy mb-4">Page Not Found</h1>
        <p className="text-psrr-slate mb-10 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. 
          Please check the URL or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-psrr-navy-cta px-8 py-3 text-sm font-semibold text-white hover:bg-psrr-navy transition-all active:scale-95 shadow-sm"
          >
            Back to Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full border-2 border-psrr-navy-cta px-8 py-3 text-sm font-semibold text-psrr-navy-cta hover:bg-psrr-navy-cta hover:text-white transition-all active:scale-95"
          >
            Search Papers
          </Link>
        </div>
      </div>
    </div>
  );
}
