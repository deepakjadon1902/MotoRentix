# MotoRentix API Contract

Base path: `/api`

## Public

- `GET /subscriptions/plans`
  - Lists active SaaS plans.

- `GET /vehicles`
  - Lists public rentable vehicles.

- `GET /vehicles/:id`
  - Vehicle detail.

## Auth

- `POST /auth/register`
  - Customer/rider registration.

- `POST /auth/tenant/register`
  - Tenant owner registration.
  - Creates tenant, owner user, main branch, subscription, and payment placeholder.

- `POST /auth/login`
  - Shared login for rider, owner, and staff.

- `POST /admin/login`
  - Super admin login.

## Super Admin

- `GET /admin/analytics`
- `GET /admin/tenants`
- `POST /admin/tenants`
- `PUT /admin/tenants/:id/status`
- `POST /admin/tenants/:id/plan`
- `GET /admin/plans`
- `POST /admin/plans`
- `PUT /admin/plans/:id`
- `GET /admin/subscriptions`
- `POST /admin/subscriptions`
- `PUT /admin/subscriptions/:id`
- `DELETE /admin/subscriptions/:id`
- `GET /admin/payments`
- `GET /admin/users`
- `GET /admin/bookings`
- `GET /admin/messages`

## Tenant Owner / Staff

All `/tenant/*` routes require an owner or staff JWT. The server derives `tenantId` from the authenticated user.

- `GET /tenant/overview`
- `GET /tenant/vehicles`
- `POST /tenant/vehicles`
- `PUT /tenant/vehicles/:id`
- `GET /tenant/bookings`
- `PUT /tenant/bookings/:id/status`
- `GET /tenant/customers`
- `GET /tenant/branches`
- `POST /tenant/branches`
- `GET /tenant/staff`
- `POST /tenant/staff`

## Customer

- `POST /bookings`
- `GET /bookings/user`
- `POST /messages`
- `GET /messages`

## Future APIs

- `/payments/razorpay/order`
- `/payments/razorpay/subscription`
- `/payments/razorpay/webhook`
- `/payments/razorpay/refund`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/2fa`
- `/tenant/roles`
- `/tenant/permissions`
- `/tenant/reports`
- `/tenant/invoices`
- `/tenant/maintenance`
- `/tenant/settings`
