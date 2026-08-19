# MotoRentix Enterprise SaaS Architecture

## Product Model

MotoRentix is a multi-tenant SaaS platform for independent bike and scooter rental companies.

The platform has four actor groups:

- Super Admin: owns and operates the SaaS platform.
- Tenant Owner: owns one rental company workspace.
- Staff: works inside one tenant with scoped permissions.
- Customer: books vehicles from one tenant.

This is not a single-company rental app. Every operational document must be tenant-scoped unless it is a platform-level collection.

## Tenant Isolation Rule

Every tenant-owned document must include `tenantId`.

Tenant-scoped collections:

- Branches
- Staff users
- Customers
- Vehicles
- Bookings
- Invoices
- Payments for customer rentals
- Maintenance
- Fuel logs
- Insurance
- Settings
- Audit logs
- Notifications
- Support tickets when raised by tenant users

Platform collections that do not require `tenantId`:

- Super admin users
- SubscriptionPlans
- Platform subscription payments
- SystemLogs
- CMS pages
- Blogs
- Platform announcements

Backend routes that serve tenant users must derive `tenantId` from the JWT-authenticated user. They must never trust a client-provided `tenantId` for authorization.

## Current Implementation

Implemented foundations:

- Multi-tenant data models: Tenant, SubscriptionPlan, Subscription, Payment, Branch, Customer.
- Tenant-scoped Vehicle and Booking records.
- Super admin client workflow: create client, assign plan, activate/deactivate.
- Tenant owner registration and tenant dashboard bootstrap.
- Subscription expiry lifecycle: expired subscriptions disable tenant owner/staff access.
- ImageKit upload integration with local fallback.
- Resend support mail helper with graceful failure.
- Public pricing endpoint and owner registration page.
- White-label tenant settings model for branding, theme, domains, SEO, policies, templates, localization, integrations, mobile branding, and hosting usage.
- TenantDomain registry with domain type, primary flag, DNS verification token, SSL status, and lifecycle status.
- Plan entitlements helper for reusable limit, feature flag, gateway, and summary enforcement.
- Tenant settings API returns current plan entitlements and domains.
- Tenant domain API supports adding and switching primary domains.
- Public white-label resolver endpoint: `/api/platform/white-label/resolve?host=...`.
- Tenant dashboard settings UI exposes branding, theme colors, domain management, SEO, policies, languages, hosting usage, gateways, invoice, and business hours.

## Target Module Boundaries

Backend:

- auth: login, registration, email verification, 2FA, refresh tokens, invitations.
- platform-admin: tenants, plans, subscriptions, payments, revenue, CMS, logs.
- tenant: tenant dashboard, settings, branches, staff, permissions.
- fleet: bikes, scooters, documents, insurance, maintenance, fuel logs.
- bookings: availability, booking lifecycle, extensions, pickup/drop.
- customers: KYC, documents, wallet, ride history.
- billing: Razorpay subscriptions, one-time payments, invoices, GST, refunds.
- notifications: email, SMS, WhatsApp, push.
- reports: analytics, exports, tax reports, utilization reports.
- security: audit logs, rate limiting, RBAC, tenant guards.

Frontend:

- marketing: landing, pricing, features, content pages.
- auth: login, register company, verify email, forgot/reset password, invitation accept.
- super-admin: SaaS control plane.
- tenant-dashboard: owner/staff workspace.
- customer-portal: browse, booking, profile, payments, invoices.
- shared-ui: reusable data tables, forms, dialogs, charts, empty states.

## Subscription Lifecycle

1. Super admin or owner creates a tenant.
2. Tenant selects a plan and billing cycle.
3. Payment succeeds.
4. Subscription is marked `active`.
5. Tenant and owner/staff users become active.
6. Expiry worker checks subscriptions on server start and hourly.
7. If `endDate <= now`, subscription becomes `expired`, tenant becomes `disabled`, owner/staff users become `blocked`.
8. Renewing or assigning a paid active plan reactivates the tenant.

## Plan Feature Matrix

Plans should control:

- bikeLimit
- staffLimit
- branchLimit
- bookingLimit
- storageLimitMb
- analyticsLevel
- supportLevel
- apiAccess
- customBranding
- digitalAgreements
- whatsappIntegration
- advancedReports
- inventory
- crm
- maintenanceModule
- featureFlags object for dynamic modules: gpsModule, fleetTracking, aiAnalytics, loyaltyProgram, referralProgram, coupons, blogs, mobileApp, vendorPortal, multiLanguage, franchiseModule, seoTools, themeBuilder, completeWhiteLabel
- gatewayAvailability object: razorpay, payu, stripe, upi, cash, bankTransfer
- customDomainLimit
- bandwidthLimitGb
- apiLimitMonthly

`0` means unlimited.

## White Label Runtime Resolution

Public branded pages should resolve tenant context from the request hostname through `/api/platform/white-label/resolve`.

Resolution order:

- Explicit `tenantId` query for previews and internal tooling.
- Verified `TenantDomain.domain`.
- `Tenant.primaryDomain`.
- `Tenant.freeSubdomain`.

Only `trial` and `active` tenants are returned. Disabled or expired tenants must return 404 so vehicles, booking pages, and branded websites disappear from the public surface until renewal.

## Security Baseline

Required:

- JWT authentication.
- Refresh tokens and rotation.
- Role-based access control.
- Permission matrix for staff.
- Tenant-scoped query middleware.
- Rate limiting for auth and write APIs.
- Security headers.
- Request ID on every request.
- Audit logs for sensitive writes.
- System logs for server events.
- Password hashing with bcrypt.
- Razorpay webhook signature verification.
- Input validation using Zod or equivalent.
- Encrypted secrets via deployment environment.

## Deployment Model

Frontend:

- Vercel
- Cloudflare in front of custom domain

Backend:

- Render or AWS EC2
- MongoDB Atlas
- ImageKit
- Resend
- Razorpay

Production requirements:

- `NODE_ENV=production`
- strict CORS allowlist
- strong `JWT_SECRET`
- MongoDB indexes
- health endpoint
- logs collected by host provider
- backups enabled in Atlas
