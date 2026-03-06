export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M10 10h12M10 16h9M10 22h12"
        stroke="var(--background, #fff)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
