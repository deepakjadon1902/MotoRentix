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
      "Book premium bikes and scooters with MotoRentix for hourly, daily, and subscription-based rides with fast pickup, transparent pricing, and trusted support.",
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
      "Contact MotoRentix for bike rentals, scooter bookings, subscription plans, fleet questions, or customer support.",
  },
  "/pricing": {
    title: "Bike Rental Software Pricing | MotoRentix SaaS",
    description:
      "Compare MotoRentix SaaS subscription plans for bike rental shop owners, including fleet limits, staff accounts, branches, analytics, branding, and API access.",
  },
  "/owner/register": {
    title: "Register Your Bike Rental Shop | MotoRentix SaaS",
    description:
      "Create a MotoRentix owner account, choose a subscription plan, and launch a tenant dashboard for your bike rental business.",
  },
  "/tenant": {
    title: "Owner Dashboard | MotoRentix SaaS",
    description: "Manage your MotoRentix rental shop workspace, bikes, bookings, customers, staff, branches, and subscription status.",
    robots: "noindex,nofollow",
  },
  "/tenant/fleet": {
    title: "Fleet Management | MotoRentix SaaS",
    description: "Manage tenant-specific bikes, scooters, pricing, availability, and fleet records.",
    robots: "noindex,nofollow",
  },
  "/tenant/users": {
    title: "Tenant Users | MotoRentix SaaS",
    description: "View customers and staff for a single bike rental company workspace.",
    robots: "noindex,nofollow",
  },
  "/tenant/bookings": {
    title: "Tenant Bookings | MotoRentix SaaS",
    description: "Manage tenant-scoped booking orders and booking status.",
    robots: "noindex,nofollow",
  },
  "/tenant/orders": {
    title: "Tenant Orders | MotoRentix SaaS",
    description: "Review tenant booking orders and rental workflow status.",
    robots: "noindex,nofollow",
  },
  "/tenant/payments": {
    title: "Tenant Payments | MotoRentix SaaS",
    description: "View tenant-specific customer rental payments and subscription payment records.",
    robots: "noindex,nofollow",
  },
  "/tenant/settings": {
    title: "Tenant Settings | MotoRentix SaaS",
    description: "Configure tenant payment gateways, Razorpay, UPI, invoices, and business settings.",
    robots: "noindex,nofollow",
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
    description: "Secure MotoRentix super admin login for fleet, client, subscription, booking, and support management.",
    robots: "noindex,nofollow",
  },
  "/admin": {
    title: "Super Admin Dashboard | MotoRentix",
    description: "MotoRentix super admin dashboard for fleet analytics, bookings, users, revenue, and subscription performance.",
    robots: "noindex,nofollow",
  },
  "/admin/vehicles": {
    title: "Vehicle Management | MotoRentix Admin",
    description: "Manage MotoRentix rental bikes and scooters, optimized images, pricing, availability, and fleet details.",
    robots: "noindex,nofollow",
  },
  "/admin/users": {
    title: "Client Management | MotoRentix Admin",
    description: "Manage MotoRentix clients, account status, contact details, and rider verification information.",
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
  "/admin/subscriptions": {
    title: "Subscription Management | MotoRentix Admin",
    description: "Create and manage MotoRentix client subscriptions, billing cycles, ride credits, discounts, and plan status.",
    robots: "noindex,nofollow",
  },
  "/admin/clients": {
    title: "Client Management | MotoRentix Admin",
    description: "Add bike rental shop clients, assign subscription plans, activate access, deactivate clients, and monitor expiry status.",
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
