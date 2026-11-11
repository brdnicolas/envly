/* eslint-disable @next/next/no-img-element -- static SVG brand mark, no optimisation needed */
/** The bare chrome shooting star (no app-icon tile). Size it by height. */
export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src="/logo.svg" alt="" aria-hidden="true" className={className} />;
}
