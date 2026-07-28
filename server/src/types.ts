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
  status: "draft" | "sent" | "accepted";
  title: string;
  blocks: Block[];
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
