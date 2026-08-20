import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-psrr-navy px-8 py-16 lg:px-16">
      <div className="flex flex-col justify-between gap-16 lg:flex-row">
        {/* Brand Column */}
        <div className="flex w-full max-w-xs flex-col gap-6">
          <div className="flex items-center gap-5">
            <Image
              src="/sei-logo.png"
              alt="DOST-SEI Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <Image
              src="/start-logo.png"
              alt="START Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <div className="relative h-10 w-10">
              <Image
                src="/psrr.svg"
                alt="PSRR Logo"
                fill
                className="object-contain invert"
              />
            </div>            <span className="font-display text-2xl font-bold tracking-[0.1em] text-psrr-white uppercase">
              PSRR
            </span>
          </div>
          <p className="text-sm leading-relaxed text-psrr-slate-light">
            Patriot Scholars Research Repository
            <br />
            Department of Science and Technology
            <br />
            Science Education Institute
          </p>
        </div>

        {/* Links Grid */}
        <div className="flex flex-wrap gap-16 lg:gap-32">
          {/* Explore */}
          <div className="flex flex-col gap-5">
            <h4 className="text-sm font-bold text-psrr-white">Explore</h4>
            <nav className="flex flex-col gap-5">
              <Link
                href="/search"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                Papers
              </Link>
              <Link
                href="/researchers"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                Researchers
              </Link>
              <Link
                href="/regions"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                Regions
              </Link>
            </nav>
          </div>

          {/* About */}
          <div className="flex flex-col gap-5">
            <h4 className="text-sm font-bold text-psrr-white">About</h4>
            <nav className="flex flex-col gap-5">
              <Link
                href="https://sei.dost.gov.ph"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                DOST-SEI
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                Terms of Service
              </Link>
            </nav>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-5">
            <h4 className="text-sm font-bold text-psrr-white">Quick Links</h4>
            <nav className="flex flex-col gap-5">
              <Link
                href="https://sei.dost.gov.ph"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                DOST-SEI Website
              </Link>
              <Link
                href="https://start.dost.gov.ph"
                className="text-sm text-psrr-slate-light transition-colors hover:text-psrr-white"
              >
                START-DOST Website
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-8">
        <div className="h-px w-full bg-psrr-slate opacity-30" />
        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          <p className="text-[13px] text-psrr-slate-light">
            © {new Date().getFullYear()} DOST-SEI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
