export type RichTextBlock = { id: string; type: "richtext"; html: string };
export type HeadingBlock = { id: string; type: "heading"; text: string; number?: string };
export type DividerBlock = { id: string; type: "divider" };
export type PageBreakBlock = { id: string; type: "pagebreak" };

export type PriceRow = {
  id: string;
  description: string;
  scope: string;
  unit: number;
  unitPrice: number;
};
export type PriceTableBlock = {
  id: string;
  type: "pricetable";
  rows: PriceRow[];
  vatPercent: number;
};

export type GenericTableBlock = {
  id: string;
  type: "table";
  headers: string[];
  rows: string[][];
};

export type CoverBlock = {
  id: string;
  type: "cover";
  title: string;
  preparedFor: string;
  preparedBy: string;
};

export type SignatureBlock = {
  id: string;
  type: "signature";
  leftName: string;
  leftCompany: string;
  rightLabel: string;
};

export type Block =
  | CoverBlock
  | HeadingBlock
  | RichTextBlock
  | PriceTableBlock
  | GenericTableBlock
  | DividerBlock
  | PageBreakBlock
  | SignatureBlock;

export interface Client {
  id: number;
  name: string;
  company: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Quote {
  id: number;
  quote_no: string;
  quote_date: string;
  due_date: string | null;
  client_id: number | null;
  client_name?: string;
  status: "draft" | "sent" | "accepted";
  title: string;
  blocks: Block[];
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  id: number;
  description: string;
  scope: string;
  unit: string;
  unit_price: number;
  created_at: string;
}

export interface Company {
  id: 1;
  name: string;
  address: string;
  trn: string;
  phone: string;
  email: string;
  logo_data_url: string;
  logo_dark_data_url: string;
  default_payment_terms: string;
  default_terms: string;
  default_signatory: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export const SERVICE_TYPES = [
  "Networking",
  "Cloud",
  "Cybersecurity",
  "Software Development",
  "IT Support & Maintenance",
  "Hardware Supply",
  "CCTV & Surveillance",
  "Other",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const ENQUIRY_PRIORITIES = ["low", "medium", "high"] as const;
export type EnquiryPriority = (typeof ENQUIRY_PRIORITIES)[number];

export const ENQUIRY_SOURCES = ["website", "referral", "call", "email", "walkin", "other"] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

export const ENQUIRY_STATUSES = ["new", "in_review", "quoted", "won", "lost", "on_hold"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export interface Enquiry {
  id: number;
  enquiry_no: string;
  client_id: number | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  company_name: string | null;
  service_type: ServiceType;
  title: string;
  scope_of_work: string;
  budget_range: string | null;
  priority: EnquiryPriority;
  source: EnquirySource;
  status: EnquiryStatus;
  converted_quote_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  quotes_total: number;
  quotes_by_status: {
    draft: number;
    sent: number;
    accepted: number;
  };
  accepted_value_total: number;
  enquiries_total: number;
  enquiries_by_status: Partial<Record<EnquiryStatus, number>>;
  conversion_rate: number;
  monthly_trend: Array<{
    month: string;
    quotes_created: number;
    quotes_accepted: number;
  }>;
}
