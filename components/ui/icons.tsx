import type { SVGProps } from "react";

/**
 * The handful of glyphs the storefront needs, inlined so they can inherit
 * `currentColor` and so the project does not take an icon-library dependency.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" />
  </Icon>
);

export const CartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 3h1.6l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.2L20 6.5H5" />
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="17" cy="20" r="1.3" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Icon>
);

export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.3 4.9 13.4a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6a4.6 4.6 0 1 1 6.5 6.5Z" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p} strokeWidth={2.4}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
);

export const SlidersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4v6M5 14v6M12 4v3M12 11v9M19 4v10M19 18v2" />
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="9" r="2" />
    <circle cx="19" cy="16" r="2" />
  </Icon>
);

export const TagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 11.4V4.8a1.3 1.3 0 0 1 1.3-1.3h6.6a1.3 1.3 0 0 1 .9.4l8 8a1.3 1.3 0 0 1 0 1.8l-6.6 6.6a1.3 1.3 0 0 1-1.8 0l-8-8a1.3 1.3 0 0 1-.4-.9Z" />
    <circle cx="8" cy="8" r="1.2" />
  </Icon>
);

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </Icon>
);

/**
 * The tick is drawn as a cut-out onto the page behind the badge, so it tracks
 * `--color-surface` rather than a literal white that would strand on a dark
 * ground once the badge fill lightens.
 */
export const VerifiedIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 1.8 14.6 4l3.4-.3.9 3.3 2.9 1.9-1.4 3.1 1.4 3.1-2.9 1.9-.9 3.3-3.4-.3L12 22.2 9.4 20l-3.4.3-.9-3.3-2.9-1.9L3.6 12 2.2 8.9l2.9-1.9.9-3.3L9.4 4Z" />
    <path
      d="m8.2 12.2 2.6 2.6 5-5"
      fill="none"
      stroke="var(--color-surface)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5a8.5 8.5 0 1 0 10.9 10.9Z" />
  </Icon>
);

export const MonitorIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8.5 21h7M12 17v4" />
  </Icon>
);
