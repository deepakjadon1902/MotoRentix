import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type ProIconName =
  | "bike"
  | "bolt"
  | "building"
  | "calendar"
  | "card"
  | "check"
  | "compass"
  | "gauge"
  | "message"
  | "route"
  | "search"
  | "shield"
  | "star"
  | "user";

type ProIconProps = SVGProps<SVGSVGElement> & {
  name: ProIconName;
  size?: number;
};

const paths: Record<ProIconName, JSX.Element> = {
  bike: (
    <>
      <path d="M5 16.5a3 3 0 1 0 0 .01M19 16.5a3 3 0 1 0 0 .01" />
      <path d="M8 16.5h4.1l2.1-5.4h2.1l2.7 5.4M12.1 16.5 8.9 9.8h-2" />
      <path d="M13.9 11.1h-3.6M16.3 11.1l1.2-2.4h2" />
    </>
  ),
  bolt: <path d="m13 2-7 11h5l-1 9 8-12h-5l1-8Z" />,
  building: (
    <>
      <path d="M4 21V5.8L12 2l8 3.8V21" />
      <path d="M8 21v-6h8v6M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  calendar: (
    <>
      <path d="M6 3v3M18 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <path d="M8 12h3v3H8zM14 12h2M14 16h2" />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M3.5 9h17M7 14h4M15 14h2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.2 5-4.8 2 2.2-5 4.8-2Z" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l4-6M7 16h10" />
    </>
  ),
  message: (
    <>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M7 9h10M7 13h6" />
    </>
  ),
  route: (
    <>
      <path d="M6 18c3 0 3-12 6-12s3 12 6 12" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <circle cx="12" cy="6" r="2" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.3 2.8 8.1 7 10 4.2-1.9 7-5.7 7-10V6l-7-3Z" />
      <path d="m8.8 12 2 2 4.4-5" />
    </>
  ),
  star: <path d="m12 3 2.5 5.6 6 .6-4.5 4 1.3 5.8-5.3-3-5.3 3L8 13.2l-4.5-4 6-.6L12 3Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
};

export const ProIcon = ({ name, size = 20, className, ...props }: ProIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={cn("shrink-0", className)}
    {...props}
  >
    {paths[name]}
  </svg>
);

export type { ProIconName };
