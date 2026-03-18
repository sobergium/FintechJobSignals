// ─────────────────────────────────────────────────────────────
// FINTECH JOBSCOUT — COMPANY LIST v0.2
// 57 companies · merged from GS tracking list + seed additions
//
// Segments:
//   XBORDER      — cross-border payments & remittance
//   IN_PG        — India payment gateways & acquiring
//   IN_INFRA     — India payments infra, APIs, embedded finance
//   IN_REGTECH   — India KYC, AA, compliance infra
//   US_FINTECH   — US corporate finance, spend management
//   AI_CREDIT    — AI-native underwriting, fraud, decisioning
//   CRYPTO_COMP  — crypto compliance & blockchain analytics
//
// ATS platforms: greenhouse | lever | ashby | workday | custom
// (?) = slug unverified — check careers page URL before deploying
// ─────────────────────────────────────────────────────────────

export type Segment =
  | "XBORDER"
  | "IN_PG"
  | "IN_INFRA"
  | "IN_REGTECH"
  | "US_FINTECH"
  | "AI_CREDIT"
  | "CRYPTO_COMP";

export type ATS =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workday"
  | "custom";

export interface CompanyConfig {
  name: string;
  segment: Segment;
  ats: ATS;
  slug: string;
  tags: string[];
  notes?: string;
  slugVerified?: boolean;
}

export const COMPANIES: CompanyConfig[] = [

  // ── CROSS-BORDER PAYMENTS & REMITTANCE ──────────────────────
  {
    name: "Stripe",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "stripe",
    tags: ["payments", "pg", "global"],
    slugVerified: true,
  },
  {
    name: "Adyen",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "adyen",
    tags: ["payments", "network", "global"],
    slugVerified: true,
  },
  {
    name: "Checkout.com",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "checkout-com",
    tags: ["payments", "global"],
    slugVerified: false,
  },
  {
    name: "Thunes",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "thunes",
    tags: ["cross-border", "remittance", "corridors", "global"],
    slugVerified: false,
  },
  {
    name: "TerraPay",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "terrapay",
    tags: ["cross-border", "remittance", "india", "africa", "global"],
    notes: "India-Africa-Middle East corridors. Compliance hiring = corridor expansion signal.",
    slugVerified: false,
  },
  {
    name: "Nium",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "nium",
    tags: ["cross-border", "b2b", "singapore", "global"],
    notes: "SG-HQ, India ops. Regulatory hire here = APAC licensing signal.",
    slugVerified: true,
  },
  {
    name: "Currencycloud",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "currencycloud",
    tags: ["cross-border", "fx", "b2b", "visa-owned", "global"],
    notes: "Now Visa-owned. B2B FX infra. Compliance roles = embedded FX expansion.",
    slugVerified: false,
  },
  {
    name: "Rapyd",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "rapyd",
    tags: ["payments", "global"],
    slugVerified: true,
  },
  {
    name: "Payoneer",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "payoneer",
    tags: ["cross-border", "marketplace", "global"],
    slugVerified: true,
  },
  {
    name: "Remitly",
    segment: "XBORDER",
    ats: "greenhouse",
    slug: "remitly",
    tags: ["remittance", "consumer", "cross-border", "global"],
    notes: "US-listed consumer remittance. Compliance hiring maps directly to corridor licensing.",
    slugVerified: true,
  },

  // ── INDIA: PAYMENT GATEWAYS & ACQUIRING ─────────────────────
  {
    name: "Razorpay",
    segment: "IN_PG",
    ats: "lever",
    slug: "razorpay",
    tags: ["payments", "pg", "india"],
    slugVerified: true,
  },
  {
    name: "Cashfree",
    segment: "IN_PG",
    ats: "lever",
    slug: "cashfree",
    tags: ["payments", "pg", "india"],
    slugVerified: false,
  },
  {
    name: "PhonePe",
    segment: "IN_PG",
    ats: "lever",
    slug: "phonepe",
    tags: ["payments", "upi", "india"],
    slugVerified: true,
  },
  {
    name: "Paytm",
    segment: "IN_PG",
    ats: "custom",
    slug: "",
    tags: ["payments", "upi", "wallet", "india"],
    notes: "Post-RBI action on PPBL — compliance hiring here is the highest-signal in India fintech. Monitor closely.",
    slugVerified: false,
  },
  {
    name: "Pine Labs",
    segment: "IN_PG",
    ats: "greenhouse",
    slug: "pine-labs",
    tags: ["payments", "pos", "merchant", "apac", "india"],
    notes: "POS + merchant acquiring. APAC licensing footprint expanding.",
    slugVerified: false,
  },
  {
    name: "BharatPe",
    segment: "IN_PG",
    ats: "lever",
    slug: "bharatpe",
    tags: ["payments", "merchant", "upi", "india"],
    slugVerified: true,
  },
  {
    name: "Mswipe",
    segment: "IN_PG",
    ats: "custom",
    slug: "",
    tags: ["payments", "pos", "merchant", "india"],
    slugVerified: false,
  },
  {
    name: "PayU",
    segment: "IN_PG",
    ats: "greenhouse",
    slug: "payu",
    tags: ["payments", "pg", "india"],
    slugVerified: false,
  },
  {
    name: "BillDesk",
    segment: "IN_PG",
    ats: "custom",
    slug: "",
    tags: ["payments", "bill-pay", "india"],
    notes: "PayU-owned post-acquisition. Custom careers portal.",
    slugVerified: false,
  },
  {
    name: "CCAvenue",
    segment: "IN_PG",
    ats: "custom",
    slug: "",
    tags: ["payments", "pg", "india"],
    notes: "Infibeam Avenues. Legacy PG but significant merchant volume. Custom ATS.",
    slugVerified: false,
  },

  // ── INDIA: PAYMENTS INFRA, APIs & EMBEDDED FINANCE ──────────
  {
    name: "M2P Fintech",
    segment: "IN_INFRA",
    ats: "custom",
    slug: "",
    tags: ["card-issuing", "baas", "infra", "india"],
    notes: "Cards-as-a-service. Compliance + product hires = new card program signal.",
    slugVerified: false,
  },
  {
    name: "Zeta",
    segment: "IN_INFRA",
    ats: "greenhouse",
    slug: "zeta",
    tags: ["banking-tech", "card-issuing", "core", "india", "global"],
    notes: "Banking OS + card issuing stack. Global ambitions (US, India). Regulatory hires = new bank partnership.",
    slugVerified: false,
  },
  {
    name: "Juspay",
    segment: "IN_INFRA",
    ats: "greenhouse",
    slug: "juspay",
    tags: ["payments", "upi", "orchestration", "india"],
    slugVerified: false,
  },
  {
    name: "Setu",
    segment: "IN_INFRA",
    ats: "lever",
    slug: "setu",
    tags: ["payments", "api", "upi", "aa", "india"],
    notes: "Pine Labs subsidiary. AA + UPI APIs. Compliance hires = new product surface.",
    slugVerified: false,
  },
  {
    name: "Open Financial Technologies",
    segment: "IN_INFRA",
    ats: "lever",
    slug: "open-financial-technologies",
    tags: ["neobank", "b2b", "banking-api", "india"],
    slugVerified: false,
  },
  {
    name: "Decentro",
    segment: "IN_INFRA",
    ats: "lever",
    slug: "decentro",
    tags: ["banking-api", "payments", "infra", "india"],
    slugVerified: false,
  },
  {
    name: "FinBox",
    segment: "IN_INFRA",
    ats: "lever",
    slug: "finbox",
    tags: ["credit-infra", "embedded-lending", "api", "india"],
    notes: "Embedded lending APIs. Credit decisioning + compliance hires = new lender onboarding.",
    slugVerified: false,
  },
  {
    name: "YAP",
    segment: "IN_INFRA",
    ats: "custom",
    slug: "",
    tags: ["banking-infra", "neobank", "india"],
    slugVerified: false,
  },

  // ── INDIA: REGTECH, KYC & COMPLIANCE INFRA ──────────────────
  {
    name: "Signzy",
    segment: "IN_REGTECH",
    ats: "lever",
    slug: "signzy",
    tags: ["regtech", "kyc", "onboarding", "india"],
    slugVerified: false,
  },
  {
    name: "Perfios",
    segment: "IN_REGTECH",
    ats: "custom",
    slug: "",
    tags: ["regtech", "aa", "bureau", "india"],
    notes: "AA infra + credit bureau integration. Compliance hiring = AA ecosystem expansion.",
    slugVerified: false,
  },

  // ── US FINTECH: CORPORATE SPEND & INFRASTRUCTURE ────────────
  {
    name: "Ramp",
    segment: "US_FINTECH",
    ats: "ashby",
    slug: "ramp",
    tags: ["spend-management", "corporate-card", "us"],
    slugVerified: true,
  },
  {
    name: "Brex",
    segment: "US_FINTECH",
    ats: "greenhouse",
    slug: "brex",
    tags: ["spend-management", "corporate-card", "us"],
    slugVerified: true,
  },

  // ── AI-NATIVE: CREDIT, FRAUD & DECISIONING ──────────────────
  {
    name: "Feedzai",
    segment: "AI_CREDIT",
    ats: "greenhouse",
    slug: "feedzai",
    tags: ["fraud", "financial-crime", "ml", "global"],
    notes: "ML-native fraud + financial crime platform. Hiring here = financial crime AI signal.",
    slugVerified: true,
  },
  {
    name: "Taktile",
    segment: "AI_CREDIT",
    ats: "ashby",
    slug: "taktile",
    tags: ["decisioning", "credit", "automation", "global"],
    notes: "Decision automation for financial services. Compliance + data science hires = new vertical signal.",
    slugVerified: false,
  },
  {
    name: "Upstart",
    segment: "AI_CREDIT",
    ats: "greenhouse",
    slug: "upstart",
    tags: ["ai-lending", "credit", "underwriting", "us"],
    notes: "AI credit underwriting, US-listed. Regulatory + model risk hires = CFPB/fair lending signal.",
    slugVerified: true,
  },
  {
    name: "Zest AI",
    segment: "AI_CREDIT",
    ats: "greenhouse",
    slug: "zest-ai",
    tags: ["ai-lending", "credit", "underwriting", "us"],
    notes: "Credit underwriting AI for banks/CUs. Hires = bank partnership + regulatory approval signal.",
    slugVerified: false,
  },

  // ── CRYPTO COMPLIANCE & BLOCKCHAIN ANALYTICS ─────────────────
  {
    name: "Chainalysis",
    segment: "CRYPTO_COMP",
    ats: "greenhouse",
    slug: "chainalysis",
    tags: ["crypto", "blockchain-analytics", "aml", "global"],
    slugVerified: true,
  },
  {
    name: "Elliptic",
    segment: "CRYPTO_COMP",
    ats: "greenhouse",
    slug: "elliptic",
    tags: ["crypto", "blockchain-analytics", "aml", "global"],
    notes: "Chainalysis competitor. Compliance hires here = crypto AML market expanding.",
    slugVerified: true,
  },
  {
    name: "PaymanAI",
    segment: "CRYPTO_COMP",
    ats: "custom",
    slug: "",
    tags: ["ai-payments", "crypto", "global"],
    notes: "AI-native payments. Early stage — ATS likely custom or Ashby. Verify before deploying.",
    slugVerified: false,
  },

];

// ─────────────────────────────────────────────────────────────
// ROLE TAXONOMY
// Keywords matched against job title + description.
// A job matching any keyword in a category gets that label.
// Multiple categories can match a single job.
// ─────────────────────────────────────────────────────────────

export const ROLE_TAXONOMY: Record<string, string[]> = {
  compliance: [
    "compliance", "regulatory affairs", "regulatory", "licensing",
    "government affairs", "policy", "legal counsel", "general counsel",
    "regulatory counsel", "chief compliance", "cco",
  ],
  aml_kyc: [
    "aml", "anti-money laundering", "kyc", "know your customer",
    "fiu", "financial intelligence", "transaction monitoring",
    "sanctions", "ofac", "cft", "financial crime", "bsa",
    "customer due diligence", "cdd", "enhanced due diligence", "edd",
  ],
  risk: [
    "risk", "credit risk", "fraud", "fraud prevention",
    "operational risk", "model risk", "enterprise risk",
    "risk management", "underwriting",
  ],
  payments_ops: [
    "payments", "payment operations", "payment product",
    "acquiring", "issuing", "settlements", "reconciliation",
    "treasury", "chargeback", "dispute", "scheme",
  ],
  data_privacy: [
    "data privacy", "data protection", "dpdp", "gdpr", "pdpa",
    "information security", "ciso", "data governance", "privacy counsel",
  ],
  regtech: [
    "regtech", "regulatory technology", "regulatory reporting",
    "prudential", "basel", "rwa", "reg reporting",
  ],
  policy_govt: [
    "public policy", "government relations", "public affairs",
    "regulatory strategy", "central bank", "rbi liaison",
  ],
};

// ─────────────────────────────────────────────────────────────
// THEME TAGS
// Maps scraped job content to strategic themes.
// Used for the weekly digest narrative + velocity signals.
// ─────────────────────────────────────────────────────────────

export const THEMES: Record<string, string[]> = {
  cbdc:           ["cbdc", "central bank digital", "digital rupee", "e-rupee", "digital currency"],
  upi:            ["upi", "unified payments", "npci", "bhim", "upi lite", "rupay"],
  open_banking:   ["account aggregator", " aa ", "open banking", "fip", "fiu", "consent manager"],
  cross_border:   ["cross-border", "remittance", "forex", "fx", "swift", "correspondent banking", "corridor"],
  bnpl:           ["bnpl", "buy now pay later", "credit line", "sachet credit", "pay later"],
  crypto_web3:    ["crypto", "blockchain", "defi", "web3", "digital assets", "virtual assets", "vasp"],
  embedded_fin:   ["embedded finance", "banking-as-a-service", "baas", "api banking", "banking api"],
  data_privacy:   ["dpdp", "data protection", "data privacy", "gdpr", "pdpa"],
  ai_credit:      ["ai underwriting", "ml model", "credit model", "fair lending", "model risk", "explainability"],
  aml_crypto:     ["travel rule", "vasp", "fatf", "blockchain analytics", "chain analysis", "on-chain"],
};

// ─────────────────────────────────────────────────────────────
// VELOCITY THRESHOLDS
// Used to trigger surge alerts.
// ─────────────────────────────────────────────────────────────

export const VELOCITY_CONFIG = {
  surgePeriodDays: 30,
  surgeThreshold: 3,          // X+ compliance-tagged hires in period = surge
  watchThreshold: 2,          // show in digest but no alert
  roleTypesForVelocity: [     // only these role types count toward surge
    "compliance",
    "aml_kyc",
    "risk",
    "policy_govt",
  ],
};
