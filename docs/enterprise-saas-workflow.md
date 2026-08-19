# MotoRentix Enterprise Multi-Tenant SaaS Workflow

## Product model

MotoRentix is a marketplace SaaS for independent bike and scooter rental companies.

- Super Admin owns the platform, subscriptions, clients, revenue, announcements, and system controls.
- Client/Tenant owns one rental business and manages only its own vehicles, bookings, staff, branches, payment gateways, and customers.
- Customer browses public vehicles from active tenants and books a vehicle from a specific company.

## Tenant isolation rules

Every operational document must include `tenantId`: vehicles, bookings, customers, branches, staff users, payments, invoices, settings, notifications, support tickets, audit logs, maintenance, insurance, and documents.

Backend rules:

- Tenant dashboard APIs always filter by `req.user.tenantId`.
- Public marketplace only lists vehicles from tenants with `status` of `trial` or `active`.
- Booking creation reads `tenantId` from the selected vehicle; the client cannot submit or override it.
- Customer payments are created against the selected vehicle tenant and must use that tenant's configured gateway.
- Super Admin vehicle view is read-only and cannot create, edit, or delete tenant vehicles.

## Public marketplace flow

1. Customer browses `/vehicles`.
2. API returns active, available vehicles with populated `tenantId` and `branchId`.
3. Listing cards show vehicle image, name, category, company name/logo, branch location, availability, hourly/daily/weekly price, rating, and CTA.
4. Vehicle detail shows company ownership, pickup branch, pricing, policies, and accepted tenant payment methods.
5. Booking request writes `tenantId`, `userId`, `vehicleId`, dates, duration, total, and status.

## Client registration workflow

1. Owner registers manually or with Google OAuth.
2. Tenant record is created with business details and `trial` or pending subscription status.
3. Owner user is created with role `owner` and assigned `tenantId`.
4. Owner chooses plan and billing cycle.
5. Payment/subscription is created.
6. Tenant status becomes `active`.
7. Owner dashboard is available.

## Client dashboard workflow

Owner/staff can manage:

- Fleet CRUD with images, registration number, branch, prices, availability, status, and documents.
- Bookings scoped to the tenant.
- Customers scoped to the tenant.
- Payments scoped to the tenant.
- Staff and branch operations.
- Payment gateway settings for Razorpay, PayU, Stripe, UPI, Cash, and Bank Transfer.
- Subscription status, renewal, and upgrade/downgrade actions.

## Super Admin workflow

Super Admin can:

- View clients, approve/suspend/reactivate them, assign or extend plans, and inspect revenue summaries.
- Manage subscription plans and subscriptions.
- View platform analytics, payments, bookings, users, and read-only vehicle listings.
- Send client messages, notifications, broadcasts, and announcements.
- Review audit logs, system health, storage usage, API usage, and reports.

Super Admin should not perform day-to-day tenant operations such as adding/editing/deleting tenant vehicles.

## Core collections

- `Tenants`
- `Users`
- `SubscriptionPlans`
- `Subscriptions`
- `Payments`
- `TenantSettings`
- `Vehicles`
- `Branches`
- `Bookings`
- `Customers`
- `Invoices`
- `Roles`
- `Permissions`
- `Notifications`
- `SupportTickets`
- `AuditLogs`
- `SystemLogs`
- `CMSPages`
- `Blogs`

## Indexing strategy

Recommended indexes:

- `vehicles`: `{ tenantId: 1, category: 1, availability: 1 }`, `{ tenantId: 1, branchId: 1 }`, `{ status: 1 }`
- `bookings`: `{ tenantId: 1, status: 1, createdAt: -1 }`, `{ userId: 1, createdAt: -1 }`, `{ vehicleId: 1, startDate: 1, endDate: 1 }`
- `payments`: `{ tenantId: 1, status: 1, createdAt: -1 }`, `{ paymentFor: 1, createdAt: -1 }`
- `users`: `{ tenantId: 1, role: 1 }`, `{ email: 1 }`
- `subscriptions`: `{ tenantId: 1, status: 1 }`, `{ endDate: 1, status: 1 }`
- `tenantSettings`: `{ tenantId: 1 }`

## Security checklist

- JWT authentication.
- Google OAuth.
- Tenant middleware.
- RBAC and permission checks.
- Password hashing.
- Rate limiting and Helmet.
- Secure upload validation.
- Audit logs for sensitive changes.
- Webhook signature verification for payment providers.
- Secrets must be stored server-side and never exposed publicly.
- Super Admin mutation APIs must be limited to platform-level data.

## Payment routing rule

For every customer booking:

1. Load selected vehicle.
2. Resolve `vehicle.tenantId`.
3. Load that tenant's `TenantSettings.paymentMethods`.
4. Create payment using only that tenant's enabled gateway.
5. Store `tenantId` on payment, invoice, and booking.
6. Never use another tenant's credentials for this booking.
