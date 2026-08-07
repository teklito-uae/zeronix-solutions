import { newId } from "./id";
import type { Block } from "./types";

export function blockOutlineLabel(block: Block, headingNumber?: number): string {
  switch (block.type) {
    case "cover":
      return block.title.trim() || "Cover Page";
    case "heading":
      return headingNumber ? `${headingNumber}. ${block.text.trim() || "Untitled section"}` : block.text.trim() || "Untitled section";
    case "richtext": {
      const text = block.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return text ? (text.length > 40 ? `${text.slice(0, 40)}…` : text) : "Text";
    }
    case "about":
      return block.heading.trim() || "About the Company";
    case "pricetable":
      return "Price Table";
    case "table":
      return "Table";
    case "signature":
      return "Signature Block";
    case "divider":
      return "Divider";
    case "pagebreak":
      return "Page Break";
  }
}

export type InsertableType =
  | "cover"
  | "heading"
  | "richtext"
  | "pricetable"
  | "table"
  | "divider"
  | "pagebreak"
  | "signature"
  | "about";

export const INSERT_MENU_ITEMS: { type: InsertableType; label: string; hint: string }[] = [
  { type: "cover", label: "Cover Page", hint: "Project title, prepared for / by" },
  { type: "heading", label: "Heading", hint: "Section title, e.g. SCOPE OF WORK" },
  { type: "richtext", label: "Text", hint: "Paragraph, bullet or numbered list" },
  { type: "about", label: "About the Company", hint: "Company overview + services/products offered" },
  { type: "pricetable", label: "Price Table", hint: "Line items with auto subtotal / VAT / total" },
  { type: "table", label: "Table", hint: "Generic rows & columns, e.g. schedule" },
  { type: "signature", label: "Signature Block", hint: "Prepared By / Accepted By" },
  { type: "divider", label: "Divider", hint: "Horizontal rule" },
  { type: "pagebreak", label: "Page Break", hint: "Force a new page when printed" },
];

export function createBlock(type: InsertableType): Block {
  switch (type) {
    case "cover":
      return { id: newId("cover"), type: "cover", title: "New Project", preparedFor: "", preparedBy: "" };
    case "heading":
      return { id: newId("h"), type: "heading", text: "New Section" };
    case "richtext":
      return { id: newId("rt"), type: "richtext", html: "<p>New paragraph…</p>" };
    case "pricetable":
      return {
        id: newId("pt"),
        type: "pricetable",
        vatPercent: 5,
        rows: [{ id: newId("row"), description: "", scope: "", unit: 1, unitPrice: 0 }],
      };
    case "table":
      return {
        id: newId("tbl"),
        type: "table",
        headers: ["COLUMN 1", "COLUMN 2"],
        rows: [["", ""]],
      };
    case "divider":
      return { id: newId("div"), type: "divider" };
    case "pagebreak":
      return { id: newId("pb"), type: "pagebreak" };
    case "signature":
      return {
        id: newId("sig"),
        type: "signature",
        leftName: "",
        leftCompany: "Zeronix Technology LLC",
        rightLabel: "Client Company",
      };
    case "about":
      return {
        id: newId("about"),
        type: "about",
        heading: "About Us",
        description: "<p>Tell the client who you are and what makes your company the right fit for this project.</p>",
        services: [
          { id: newId("svc"), title: "Service or Product", description: "Short description of what you offer." },
        ],
      };
  }
}
