import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoEntry = {
  title: string;
  description: string;
  robots?: string;
};

const siteName = "MotoRentix";
const siteUrl = (import.meta.env.VITE_SITE_URL || "https://motorentix.com").replace(/\/$/, "");
const imageUrl = `${siteUrl}/motorentix-logo.jpeg`;

const seoMap: Record<string, SeoEntry> = {
  "/": {
    title: "MotoRentix | Premium Bike and Scooter Rentals",
    description:
      "Book premium bikes, scooters, and electric rides with MotoRentix for hourly, daily, and weekly rentals with fast pickup, transparent pricing, and trusted support.",
  },
  "/dashboard": {
    title: "Rental Dashboard | MotoRentix",
    description:
      "Browse available MotoRentix bikes and scooters, compare prices, and choose the right two-wheeler for your next city ride.",
  },
  "/my-bookings": {
    title: "My Bookings | MotoRentix",
    description: "Track MotoRentix bike and scooter bookings, rental dates, pricing, and booking status from your personal account.",
    robots: "noindex,nofollow",
  },
  "/profile": {
    title: "My Profile | MotoRentix",
    description: "Manage your MotoRentix rider profile, contact details, address, and account information securely.",
    robots: "noindex,nofollow",
  },
  "/about": {
    title: "About MotoRentix | Premium Two-Wheeler Rental Platform",
    description:
      "Learn how MotoRentix helps riders rent reliable bikes and scooters with flexible plans, premium support, and simple digital booking.",
  },
  "/contact": {
    title: "Contact MotoRentix | Bike and Scooter Rental Support",
    description:
      "Contact MotoRentix for bike rentals, scooter bookings, electric rides, fleet questions, or customer support.",
  },
  "/login": {
    title: "Login | MotoRentix",
    description: "Sign in to MotoRentix to book bikes and scooters, manage your profile, and review rental history.",
    robots: "noindex,nofollow",
  },
  "/register": {
    title: "Create Account | MotoRentix",
    description: "Create your MotoRentix account to rent bikes and scooters faster with secure profile and booking management.",
  },
  "/admin/login": {
    title: "Admin Login | MotoRentix",
    description: "Secure MotoRentix admin login for fleet, booking, user, revenue, and support management.",
    robots: "noindex,nofollow",
  },
  "/admin": {
    title: "Admin Dashboard | MotoRentix",
    description: "MotoRentix admin dashboard for fleet analytics, bookings, users, revenue, and support performance.",
    robots: "noindex,nofollow",
  },
  "/admin/vehicles": {
    title: "Vehicle Management | MotoRentix Admin",
    description: "Manage MotoRentix rental bikes and scooters, optimized images, pricing, availability, and fleet details.",
    robots: "noindex,nofollow",
  },
  "/admin/users": {
    title: "User Management | MotoRentix Admin",
    description: "Manage MotoRentix users, account status, contact details, and rider verification information.",
    robots: "noindex,nofollow",
  },
  "/admin/bookings": {
    title: "Booking Management | MotoRentix Admin",
    description: "Review, confirm, reject, and complete MotoRentix rental bookings from the admin command center.",
    robots: "noindex,nofollow",
  },
  "/admin/messages": {
    title: "Support Messages | MotoRentix Admin",
    description: "Reply to MotoRentix customer messages and send support responses through Resend-powered email.",
    robots: "noindex,nofollow",
  },
};

const getSeo = (pathname: string): SeoEntry => {
  if (pathname.startsWith("/vehicle/")) {
    return {
      title: "Bike and Scooter Rental Details | MotoRentix",
      description:
        "View MotoRentix vehicle details, rental pricing, availability, image gallery, and booking options for your selected ride.",
    };
  }

  if (pathname.startsWith("/booking/")) {
    return {
      title: "Book Your Ride | MotoRentix",
      description: "Complete your MotoRentix bike or scooter booking with flexible hourly and daily rental options.",
      robots: "noindex,nofollow",
    };
  }

  return seoMap[pathname] || {
    title: "Page Not Found | MotoRentix",
    description: "The MotoRentix page you requested could not be found. Return home to browse premium bikes and scooters.",
    robots: "noindex,nofollow",
  };
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

const SeoManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getSeo(pathname);
    const canonical = `${siteUrl}${pathname === "/" ? "" : pathname}`;
    document.title = seo.title;

    upsertMeta('meta[name="description"]', { name: "description", content: seo.description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: seo.robots || "index,follow,max-image-preview:large" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: siteName });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: seo.description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: seo.description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    upsertLink("canonical", canonical);
  }, [pathname]);

  return null;
};

export default SeoManager;
