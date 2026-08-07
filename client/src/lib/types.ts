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

export type AboutServiceItem = {
  id: string;
  title: string;
  description: string;
};

export type AboutBlock = {
  id: string;
  type: "about";
  heading: string;
  description: string;
  services: AboutServiceItem[];
};

export type Block =
  | CoverBlock
  | HeadingBlock
  | RichTextBlock
  | PriceTableBlock
  | GenericTableBlock
  | DividerBlock
  | PageBreakBlock
  | SignatureBlock
  | AboutBlock;

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

export interface OutreachMailbox {
  id: number;
  name: string;
  from_name: string;
  from_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_encryption: "tls" | "ssl";
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_encryption: "tls" | "ssl";
  imap_folder: string;
  daily_send_cap: number;
  sent_today: number;
  status: "pending_test" | "active" | "error" | "disabled";
  last_error: string | null;
  is_default: boolean;
}

export type OutreachCampaignStatus = "draft" | "researching" | "active" | "paused" | "completed";

export interface OutreachSequenceStep {
  id?: number;
  step_number: number;
  wait_days: number;
  subject_template: string;
  body_template: string;
  is_final_step: boolean;
}

export interface OutreachCampaign {
  id: number;
  name: string;
  mailbox_id: number | null;
  mailbox?: OutreachMailbox;
  service_focus: string | null;
  target_industry_notes: string | null;
  status: OutreachCampaignStatus;
  daily_new_send_limit: number;
  send_window_start: string;
  send_window_end: string;
  send_days: string[];
  unsubscribe_footer_text: string | null;
  sequence_steps?: OutreachSequenceStep[];
  prospects_count?: number;
  replied_count?: number;
  converted_count?: number;
  created_at: string;
  updated_at: string;
}

export type OutreachProspectStatus =
  | "pending_research"
  | "researched"
  | "contact_found"
  | "no_contact_found"
  | "queued"
  | "active"
  | "replied"
  | "converted"
  | "unsubscribed"
  | "bounced"
  | "stopped"
  | "rejected";

export interface OutreachContact {
  id: number;
  prospect_id: number;
  full_name: string | null;
  guessed_title: string | null;
  email: string | null;
  email_confidence: number | null;
  email_verification_status: "unverified" | "smtp_verified" | "smtp_invalid" | "risky" | "skipped";
  source_notes: string | null;
}

export interface OutreachEmailEvent {
  id: number;
  send_id: number;
  event_type: "open" | "click" | "reply" | "bounce" | "unsubscribe";
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}

export interface OutreachSend {
  id: number;
  prospect_id: number;
  contact_id: number;
  sequence_step_id: number;
  subject: string;
  body_html: string;
  status: "scheduled" | "sending" | "sent" | "failed" | "bounced" | "skipped_suppressed";
  scheduled_at: string | null;
  sent_at: string | null;
  failed_reason: string | null;
  events?: OutreachEmailEvent[];
  sequence_step?: OutreachSequenceStep;
}

export interface OutreachProspect {
  id: number;
  campaign_id: number;
  company_name: string;
  website_url: string | null;
  industry_guess: string | null;
  industry_confidence: number | null;
  research_summary: string | null;
  trigger_event: string | null;
  status: OutreachProspectStatus;
  research_error: string | null;
  converted_client_id: number | null;
  converted_enquiry_id: number | null;
  contacts?: OutreachContact[];
  sends?: OutreachSend[];
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
