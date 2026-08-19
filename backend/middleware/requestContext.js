import crypto from "crypto";
import Tenant from "../models/Tenant.js";
import TenantDomain from "../models/TenantDomain.js";

const normalizeHost = (host = "") => host.split(":")[0].toLowerCase().trim();

const platformRootDomain = () => (process.env.PLATFORM_ROOT_DOMAIN || "platform.com").toLowerCase().replace(/^\./, "");

export const requestContext = async (req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  try {
    const host = normalizeHost(req.headers["x-forwarded-host"] || req.headers.host);
    req.hostTenant = null;
    req.resolvedDomain = host;
    if (host && !["localhost", "127.0.0.1"].includes(host)) {
      const root = platformRootDomain();
      const domain = await TenantDomain.findOne({
        domain: host,
        status: { $in: ["active", "verified", "ssl_enabled"] },
      }).populate("tenantId", "companyName status publicWebsiteEnabled publicBookingEnabled marketplaceVisible");

      if (domain?.tenantId) {
        req.hostTenant = domain.tenantId;
      } else if (host.endsWith(`.${root}`)) {
        req.hostTenant = await Tenant.findOne({
          freeSubdomain: host,
          status: { $in: ["trial", "active", "renewal_due"] },
        }).select("companyName status publicWebsiteEnabled publicBookingEnabled marketplaceVisible");
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
