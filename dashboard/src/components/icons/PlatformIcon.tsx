import type { Platform } from "@/lib/types";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function TrustpilotGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="#00B67A">
      <path d="M12 1.5l3.1 6.9 7.5.75-5.6 5.05 1.6 7.3L12 17.6l-6.6 3.9 1.6-7.3-5.6-5.05 7.5-.75L12 1.5z" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M15.5 12.5h-2v7h-2.9v-7H9v-2.4h1.6V8.6c0-1.6.8-3.1 3.3-3.1h2.4v2.4h-1.8c-.3 0-.7.2-.7.9v1.3h2.5l-.3 2.4z"
      />
    </svg>
  );
}

function TikTokGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <rect width="24" height="24" rx="12" fill="#000" />
      <path
        fill="#fff"
        d="M15.6 5.5c.4 1.4 1.4 2.4 2.9 2.6v2.1c-1 .1-1.9-.2-2.9-.8v4.6a4.3 4.3 0 1 1-4.3-4.3c.2 0 .4 0 .6.05v2.1a2.2 2.2 0 1 0 1.5 2.1V5.5h2.2z"
      />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <defs>
        <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="10%" stopColor="#fdf497" />
          <stop offset="30%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="7" fill="url(#ig-gradient)" />
      <rect x="6" y="6" width="12" height="12" rx="4" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16.1" cy="7.9" r="0.9" fill="#fff" />
    </svg>
  );
}

function OverigGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <circle cx="12" cy="12" r="12" fill="#3f3f46" />
      <circle cx="7" cy="12" r="1.6" fill="#d4d4d8" />
      <circle cx="12" cy="12" r="1.6" fill="#d4d4d8" />
      <circle cx="17" cy="12" r="1.6" fill="#d4d4d8" />
    </svg>
  );
}

const GLYPHS: Record<Platform, () => React.JSX.Element> = {
  google: GoogleGlyph,
  trustpilot: TrustpilotGlyph,
  facebook: FacebookGlyph,
  tiktok: TikTokGlyph,
  instagram: InstagramGlyph,
  overig: OverigGlyph,
};

export function PlatformIcon({
  platform,
  size = 20,
  className,
}: {
  platform: Platform;
  size?: number;
  className?: string;
}) {
  const Glyph = GLYPHS[platform];
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: "inline-block", flexShrink: 0 }}
    >
      <Glyph />
    </span>
  );
}
