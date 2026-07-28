import { newId } from "./id";
import type { Block } from "./types";

export type InsertableType =
  | "heading"
  | "richtext"
  | "pricetable"
  | "table"
  | "divider"
  | "pagebreak"
  | "signature";

export const INSERT_MENU_ITEMS: { type: InsertableType; label: string; hint: string }[] = [
  { type: "heading", label: "Heading", hint: "Section title, e.g. SCOPE OF WORK" },
  { type: "richtext", label: "Text", hint: "Paragraph, bullet or numbered list" },
  { type: "pricetable", label: "Price Table", hint: "Line items with auto subtotal / VAT / total" },
  { type: "table", label: "Table", hint: "Generic rows & columns, e.g. schedule" },
  { type: "signature", label: "Signature Block", hint: "Prepared By / Accepted By" },
  { type: "divider", label: "Divider", hint: "Horizontal rule" },
  { type: "pagebreak", label: "Page Break", hint: "Force a new page when printed" },
];

export function createBlock(type: InsertableType): Block {
  switch (type) {
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
  }
}
