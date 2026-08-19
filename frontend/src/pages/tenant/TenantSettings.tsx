import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Banknote, CreditCard, FileText, Globe2, Languages, Landmark, Palette, Receipt, Save, Search, ShieldCheck, Smartphone } from "lucide-react";
import { tenantApi, type TenantSettings as TenantSettingsType } from "@/lib/tenantApi";
import { useStore } from "@/store/useStore";

const defaults: TenantSettingsType = {
  paymentMethods: {
    razorpay: { enabled: false, keyId: "", keySecret: "", webhookSecret: "" },
    payu: { enabled: false, merchantKey: "", salt: "" },
    stripe: { enabled: false, publishableKey: "", secretKey: "", webhookSecret: "" },
    upi: { enabled: false, upiId: "", displayName: "" },
    cash: { enabled: true },
    bankTransfer: { enabled: false, accountName: "", accountNumber: "", ifsc: "", bankName: "" },
  },
  invoice: { gstNumber: "", taxPercent: 0, prefix: "INV" },
  businessHours: { open: "09:00", close: "21:00" },
  branding: {
    companyDisplayName: "",
    logoUrl: "",
    faviconUrl: "",
    homepageBannerUrl: "",
    supportEmail: "",
    supportPhone: "",
    address: "",
    footerText: "",
    socialLinks: {},
  },
  theme: {
    mode: "light",
    primaryColor: "#0b5ed7",
    secondaryColor: "#f4f7fb",
    accentColor: "#ef4444",
    buttonStyle: "rounded",
    borderRadius: 12,
    typography: "Plus Jakarta Sans",
    homepageLayout: "marketplace",
    cardDesign: "premium",
    animations: true,
  },
  policies: {
    privacyPolicy: "",
    termsAndConditions: "",
    refundPolicy: "",
    cancellationPolicy: "",
    bookingRules: "",
    vehicleRules: "",
  },
  seo: {
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    canonicalUrl: "",
    openGraphImage: "",
    googleAnalyticsId: "",
    metaPixelId: "",
    googleTagManagerId: "",
  },
  localization: { defaultLanguage: "en", enabledLanguages: ["en"] },
};

type Provider = keyof NonNullable<TenantSettingsType["paymentMethods"]>;

const TenantSettings = () => {
  const token = useStore((state) => state.token);
  const [settings, setSettings] = useState<TenantSettingsType>(defaults);
  const [domainInput, setDomainInput] = useState("");
  const [domainType, setDomainType] = useState<"subdomain" | "custom">("custom");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    tenantApi.settings(token)
      .then((data) => setSettings({
        ...defaults,
        ...data,
        paymentMethods: { ...defaults.paymentMethods, ...data.paymentMethods },
        invoice: { ...defaults.invoice, ...data.invoice },
        businessHours: { ...defaults.businessHours, ...data.businessHours },
        branding: { ...defaults.branding, ...data.branding, socialLinks: { ...defaults.branding?.socialLinks, ...data.branding?.socialLinks } },
        theme: { ...defaults.theme, ...data.theme },
        policies: { ...defaults.policies, ...data.policies },
        seo: { ...defaults.seo, ...data.seo },
        localization: { ...defaults.localization, ...data.localization },
      }))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"));
  }, [token]);

  const enabledCount = useMemo(
    () => Object.values(settings.paymentMethods || {}).filter((method) => method?.enabled).length,
    [settings.paymentMethods],
  );
  const features = settings.entitlements?.features || {};
  const gateways = settings.entitlements?.gateways || {};
  const canUse = (feature: string) => Boolean(features[feature]);
  const canUseGateway = (gateway: string) => gateways[gateway] !== false;

  const updatePayment = (provider: Provider, patch: Record<string, string | boolean>) => {
    setSettings((current) => ({
      ...current,
      paymentMethods: {
        ...current.paymentMethods,
        [provider]: { ...(current.paymentMethods?.[provider] || {}), ...patch },
      },
    }));
  };

  const save = async () => {
    if (!token) return;
    try {
      const payload: TenantSettingsType = { ...settings };
      if (!canUse("themeBuilder")) delete payload.theme;
      if (!canUse("seoSettings") && !canUse("seoTools")) delete payload.seo;
      if (!canUse("multiLanguage")) delete payload.localization;
      if (!canUse("whiteLabelBranding") && !canUse("completeWhiteLabel")) delete payload.mobileBranding;
      payload.paymentMethods = Object.fromEntries(
        Object.entries(payload.paymentMethods || {}).filter(([provider]) => canUseGateway(provider))
      ) as TenantSettingsType["paymentMethods"];
      const saved = await tenantApi.updateSettings(token, payload);
      setSettings({
        ...defaults,
        ...saved,
        paymentMethods: { ...defaults.paymentMethods, ...saved.paymentMethods },
        invoice: { ...defaults.invoice, ...saved.invoice },
        businessHours: { ...defaults.businessHours, ...saved.businessHours },
        branding: { ...defaults.branding, ...saved.branding, socialLinks: { ...defaults.branding?.socialLinks, ...saved.branding?.socialLinks } },
        theme: { ...defaults.theme, ...saved.theme },
        policies: { ...defaults.policies, ...saved.policies },
        seo: { ...defaults.seo, ...saved.seo },
        localization: { ...defaults.localization, ...saved.localization },
      });
      setMessage("Settings saved for this tenant only");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  const addDomain = async () => {
    if (!token || !domainInput.trim()) return;
    try {
      await tenantApi.createDomain(token, { domain: domainInput, type: canUse("customDomain") ? domainType : "subdomain", makePrimary: settings.domains?.length === 0 });
      const fresh = await tenantApi.settings(token);
      setSettings((current) => ({ ...current, ...fresh }));
      setDomainInput("");
      setMessage("Domain added. Complete DNS verification to activate it.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add domain");
    }
  };

  const makePrimaryDomain = async (id: string) => {
    if (!token) return;
    try {
      await tenantApi.updateDomain(token, id, { isPrimary: true });
      const fresh = await tenantApi.settings(token);
      setSettings((current) => ({ ...current, ...fresh }));
      setMessage("Primary domain updated");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update domain");
    }
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Tenant settings</p>
            <h1 className="font-heading mt-2 text-3xl font-bold text-foreground">Payment, invoice, and business rules</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Configure gateways for your company only. Customer payments for your listed vehicles use these methods and never affect another tenant.
            </p>
          </div>
          <div className="rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
            {enabledCount} payment methods enabled
          </div>
        </div>
      </div>

      {message && <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{message}</div>}
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {(canUse("themeBuilder") || canUse("whiteLabelBranding")) && (
      <section className="dashboard-surface p-6">
        <div className="flex items-center gap-3">
          <Palette className="text-primary" size={22} />
          <h2 className="font-heading text-xl font-bold text-foreground">White label branding and theme</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Display Name" value={settings.branding?.companyDisplayName || ""} onChange={(value) => setSettings((s) => ({ ...s, branding: { ...s.branding, companyDisplayName: value } }))} />
          <Field label="Logo URL" value={settings.branding?.logoUrl || ""} onChange={(value) => setSettings((s) => ({ ...s, branding: { ...s.branding, logoUrl: value } }))} />
          <Field label="Favicon URL" value={settings.branding?.faviconUrl || ""} onChange={(value) => setSettings((s) => ({ ...s, branding: { ...s.branding, faviconUrl: value } }))} />
          <Field label="Homepage Banner URL" value={settings.branding?.homepageBannerUrl || ""} onChange={(value) => setSettings((s) => ({ ...s, branding: { ...s.branding, homepageBannerUrl: value } }))} />
          <Field label="Support Email" value={settings.branding?.supportEmail || ""} onChange={(value) => setSettings((s) => ({ ...s, branding: { ...s.branding, supportEmail: value } }))} />
          <Field label="Support Phone" value={settings.branding?.supportPhone || ""} onChange={(value) => setSettings((s) => ({ ...s, branding: { ...s.branding, supportPhone: value } }))} />
          <Field label="Primary Color" type="color" value={settings.theme?.primaryColor || "#0b5ed7"} onChange={(value) => setSettings((s) => ({ ...s, theme: { ...s.theme, primaryColor: value } }))} />
          <Field label="Secondary Color" type="color" value={settings.theme?.secondaryColor || "#f4f7fb"} onChange={(value) => setSettings((s) => ({ ...s, theme: { ...s.theme, secondaryColor: value } }))} />
          <Field label="Accent Color" type="color" value={settings.theme?.accentColor || "#ef4444"} onChange={(value) => setSettings((s) => ({ ...s, theme: { ...s.theme, accentColor: value } }))} />
          <Field label="Typography" value={settings.theme?.typography || ""} onChange={(value) => setSettings((s) => ({ ...s, theme: { ...s.theme, typography: value } }))} />
          <Field label="Border Radius" type="number" value={String(settings.theme?.borderRadius || 12)} onChange={(value) => setSettings((s) => ({ ...s, theme: { ...s.theme, borderRadius: Number(value) } }))} />
          <Field label="Footer Text" value={settings.branding?.footerText || ""} onChange={(value) => setSettings((s) => ({ ...s, branding: { ...s.branding, footerText: value } }))} />
        </div>
      </section>
      )}

      <section className="dashboard-surface p-6">
        <div className="flex items-center gap-3">
          <Globe2 className="text-primary" size={22} />
          <h2 className="font-heading text-xl font-bold text-foreground">Domain management</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]">
          <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" value={canUse("customDomain") ? domainType : "subdomain"} onChange={(event) => setDomainType(event.target.value as "subdomain" | "custom")}>
            {canUse("customDomain") && <option value="custom">Custom domain</option>}
            <option value="subdomain">Free subdomain</option>
          </select>
          <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" value={domainInput} onChange={(event) => setDomainInput(event.target.value)} placeholder="rentbikea.com or company.platform.com" />
          <button type="button" onClick={addDomain} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Add Domain</button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {(settings.domains || []).map((domain) => (
            <div key={domain._id || domain.id || domain.domain} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{domain.domain}</p>
                  <p className="text-xs text-muted-foreground">{domain.type} - {domain.status} - SSL {domain.sslStatus}</p>
                </div>
                {!domain.isPrimary && (
                  <button type="button" onClick={() => makePrimaryDomain(domain._id || domain.id || "")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground">
                    Make primary
                  </button>
                )}
                {domain.isPrimary && <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">Primary</span>}
              </div>
              {domain.verificationToken && (
                <p className="mt-3 break-all rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                  DNS TXT: {domain.verificationToken}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {(canUse("seoSettings") || canUse("seoTools") || canUse("multiLanguage")) && (
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {(canUse("seoSettings") || canUse("seoTools")) && (
        <div className="dashboard-surface p-6">
          <div className="flex items-center gap-3">
            <Search className="text-primary" size={22} />
            <h2 className="font-heading text-xl font-bold text-foreground">SEO and marketing</h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Meta Title" value={settings.seo?.metaTitle || ""} onChange={(value) => setSettings((s) => ({ ...s, seo: { ...s.seo, metaTitle: value } }))} />
            <Field label="Canonical URL" value={settings.seo?.canonicalUrl || ""} onChange={(value) => setSettings((s) => ({ ...s, seo: { ...s.seo, canonicalUrl: value } }))} />
            <Field label="Google Analytics ID" value={settings.seo?.googleAnalyticsId || ""} onChange={(value) => setSettings((s) => ({ ...s, seo: { ...s.seo, googleAnalyticsId: value } }))} />
            <Field label="Meta Pixel ID" value={settings.seo?.metaPixelId || ""} onChange={(value) => setSettings((s) => ({ ...s, seo: { ...s.seo, metaPixelId: value } }))} />
          </div>
          <textarea className="mt-4 min-h-24 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Meta Description" value={settings.seo?.metaDescription || ""} onChange={(event) => setSettings((s) => ({ ...s, seo: { ...s.seo, metaDescription: event.target.value } }))} />
        </div>
        )}
        {canUse("multiLanguage") && (
        <div className="dashboard-surface p-6">
          <div className="flex items-center gap-3">
            <FileText className="text-primary" size={22} />
            <h2 className="font-heading text-xl font-bold text-foreground">Policies and languages</h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Default Language" value={settings.localization?.defaultLanguage || "en"} onChange={(value) => setSettings((s) => ({ ...s, localization: { ...s.localization, defaultLanguage: value } }))} />
            <Field label="Enabled Languages" value={(settings.localization?.enabledLanguages || []).join(",")} onChange={(value) => setSettings((s) => ({ ...s, localization: { ...s.localization, enabledLanguages: value.split(",").map((item) => item.trim()).filter(Boolean) } }))} />
          </div>
          <textarea className="mt-4 min-h-20 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Cancellation Policy" value={settings.policies?.cancellationPolicy || ""} onChange={(event) => setSettings((s) => ({ ...s, policies: { ...s.policies, cancellationPolicy: event.target.value } }))} />
          <textarea className="mt-3 min-h-20 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Refund Policy" value={settings.policies?.refundPolicy || ""} onChange={(event) => setSettings((s) => ({ ...s, policies: { ...s.policies, refundPolicy: event.target.value } }))} />
        </div>
        )}
      </section>
      )}

      <section className="dashboard-surface p-6">
        <div className="flex items-center gap-3">
          <Languages className="text-primary" size={22} />
          <h2 className="font-heading text-xl font-bold text-foreground">Plan entitlements and hosting</h2>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Plan", settings.entitlements?.name || "-"],
            ["Storage", `${settings.hostingUsage?.storageUsedMb || 0}/${settings.entitlements?.limits?.storageMb || 0} MB`],
            ["Bandwidth", `${settings.hostingUsage?.bandwidthUsedGb || 0}/${settings.entitlements?.limits?.bandwidthGb || 0} GB`],
            ["API Usage", `${settings.hostingUsage?.apiUsageMonthly || 0}/${settings.entitlements?.limits?.apiMonthly || 0}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-2 font-heading text-lg font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {canUseGateway("razorpay") && <GatewayCard title="Razorpay" icon={CreditCard} enabled={Boolean(settings.paymentMethods?.razorpay?.enabled)} onToggle={(enabled) => updatePayment("razorpay", { enabled })}>
          <Field label="Key ID" value={settings.paymentMethods?.razorpay?.keyId || ""} onChange={(value) => updatePayment("razorpay", { keyId: value })} />
          <Field label="Key Secret" type="password" value={settings.paymentMethods?.razorpay?.keySecret || ""} onChange={(value) => updatePayment("razorpay", { keySecret: value })} />
          <Field label="Webhook Secret" type="password" value={settings.paymentMethods?.razorpay?.webhookSecret || ""} onChange={(value) => updatePayment("razorpay", { webhookSecret: value })} />
        </GatewayCard>}

        {canUseGateway("payu") && <GatewayCard title="PayU" icon={ShieldCheck} enabled={Boolean(settings.paymentMethods?.payu?.enabled)} onToggle={(enabled) => updatePayment("payu", { enabled })}>
          <Field label="Merchant Key" value={settings.paymentMethods?.payu?.merchantKey || ""} onChange={(value) => updatePayment("payu", { merchantKey: value })} />
          <Field label="Salt" type="password" value={settings.paymentMethods?.payu?.salt || ""} onChange={(value) => updatePayment("payu", { salt: value })} />
        </GatewayCard>}

        {canUseGateway("stripe") && <GatewayCard title="Stripe" icon={CreditCard} enabled={Boolean(settings.paymentMethods?.stripe?.enabled)} onToggle={(enabled) => updatePayment("stripe", { enabled })}>
          <Field label="Publishable Key" value={settings.paymentMethods?.stripe?.publishableKey || ""} onChange={(value) => updatePayment("stripe", { publishableKey: value })} />
          <Field label="Secret Key" type="password" value={settings.paymentMethods?.stripe?.secretKey || ""} onChange={(value) => updatePayment("stripe", { secretKey: value })} />
          <Field label="Webhook Secret" type="password" value={settings.paymentMethods?.stripe?.webhookSecret || ""} onChange={(value) => updatePayment("stripe", { webhookSecret: value })} />
        </GatewayCard>}

        {canUseGateway("upi") && <GatewayCard title="UPI" icon={Smartphone} enabled={Boolean(settings.paymentMethods?.upi?.enabled)} onToggle={(enabled) => updatePayment("upi", { enabled })}>
          <Field label="UPI ID" value={settings.paymentMethods?.upi?.upiId || ""} onChange={(value) => updatePayment("upi", { upiId: value })} />
          <Field label="Display Name" value={settings.paymentMethods?.upi?.displayName || ""} onChange={(value) => updatePayment("upi", { displayName: value })} />
        </GatewayCard>}

        {canUseGateway("bankTransfer") && <GatewayCard title="Bank Transfer" icon={Landmark} enabled={Boolean(settings.paymentMethods?.bankTransfer?.enabled)} onToggle={(enabled) => updatePayment("bankTransfer", { enabled })}>
          <Field label="Account Name" value={settings.paymentMethods?.bankTransfer?.accountName || ""} onChange={(value) => updatePayment("bankTransfer", { accountName: value })} />
          <Field label="Account Number" value={settings.paymentMethods?.bankTransfer?.accountNumber || ""} onChange={(value) => updatePayment("bankTransfer", { accountNumber: value })} />
          <Field label="IFSC" value={settings.paymentMethods?.bankTransfer?.ifsc || ""} onChange={(value) => updatePayment("bankTransfer", { ifsc: value })} />
          <Field label="Bank Name" value={settings.paymentMethods?.bankTransfer?.bankName || ""} onChange={(value) => updatePayment("bankTransfer", { bankName: value })} />
        </GatewayCard>}

        {canUseGateway("cash") && <GatewayCard title="Cash" icon={Banknote} enabled={Boolean(settings.paymentMethods?.cash?.enabled)} onToggle={(enabled) => updatePayment("cash", { enabled })}>
          <p className="text-sm text-muted-foreground">Enable this when your branch accepts cash during pickup or drop.</p>
        </GatewayCard>}
      </div>

      <section className="dashboard-surface p-6">
        <div className="flex items-center gap-3">
          <Receipt className="text-primary" size={22} />
          <h2 className="font-heading text-xl font-bold text-foreground">Invoice and business hours</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Field label="GST Number" value={settings.invoice?.gstNumber || ""} onChange={(value) => setSettings((s) => ({ ...s, invoice: { ...s.invoice, gstNumber: value } }))} />
          <Field label="Invoice Prefix" value={settings.invoice?.prefix || ""} onChange={(value) => setSettings((s) => ({ ...s, invoice: { ...s.invoice, prefix: value } }))} />
          <Field label="Tax Percent" type="number" value={String(settings.invoice?.taxPercent || 0)} onChange={(value) => setSettings((s) => ({ ...s, invoice: { ...s.invoice, taxPercent: Number(value) } }))} />
          <Field label="Open Time" type="time" value={settings.businessHours?.open || "09:00"} onChange={(value) => setSettings((s) => ({ ...s, businessHours: { ...s.businessHours, open: value } }))} />
          <Field label="Close Time" type="time" value={settings.businessHours?.close || "21:00"} onChange={(value) => setSettings((s) => ({ ...s, businessHours: { ...s.businessHours, close: value } }))} />
        </div>
      </section>

      <button onClick={save} className="btn-primary-gradient inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-primary-foreground">
        <Save size={17} />
        Save Tenant Settings
      </button>
    </div>
  );
};

const GatewayCard = ({
  title,
  icon: Icon,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof CreditCard;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}) => (
  <section className="premium-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={21} />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{enabled ? "Enabled for customers" : "Disabled"}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          enabled ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
        }`}
      >
        {enabled ? "On" : "Off"}
      </button>
    </div>
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  </section>
);

const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <label className="block text-sm">
    <span className="mb-2 block font-medium text-foreground">{label}</span>
    <input
      className="focus-ring w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={label}
    />
  </label>
);

export default TenantSettings;
