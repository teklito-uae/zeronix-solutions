import type { Block } from "./types.js";

let counter = 0;
function id(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function buildDefaultBlocks(): Block[] {
  return [
    {
      id: id("cover"),
      type: "cover",
      title: "IT Infrastructure\nProposal",
      preparedFor: "CLIENT NAME",
      preparedBy: "ZERONIX TECHNOLOGY LLC",
    },
    { id: id("h"), type: "heading", text: "INTRODUCTION", number: "1" },
    {
      id: id("rt"),
      type: "richtext",
      html: "<p>Zeronix Technology LLC is pleased to submit this proposal to the client. Describe the project objective, scope, and approach here.</p>",
    },
    { id: id("h"), type: "heading", text: "SCOPE OF WORK", number: "2" },
    {
      id: id("rt"),
      type: "richtext",
      html: "<ul><li><strong>Item 1</strong> — description of the work item.</li><li><strong>Item 2</strong> — description of the work item.</li></ul>",
    },
    { id: id("h"), type: "heading", text: "TIMELINE & DELIVERABLES", number: "3" },
    {
      id: id("table"),
      type: "table",
      headers: ["DURATION", "ACTIVITY"],
      rows: [
        ["DAY 01", "Preparation"],
        ["DAY 02", "Execution"],
        ["DAY 03", "Testing & Handover"],
      ],
    },
    { id: id("h"), type: "heading", text: "COMMERCIAL PROPOSAL", number: "4" },
    {
      id: id("pt"),
      type: "pricetable",
      vatPercent: 5,
      rows: [
        { id: id("row"), description: "Sample Line Item", scope: "Scope description", unit: 1, unitPrice: 0 },
      ],
    },
    { id: id("h"), type: "heading", text: "TERMS & CONDITIONS", number: "5" },
    {
      id: id("rt"),
      type: "richtext",
      html: "<ul><li>Payment terms: 60% advance, 40% on completion.</li><li>Add project-specific terms here.</li></ul>",
    },
    { id: id("divider"), type: "divider" },
    {
      id: id("sig"),
      type: "signature",
      leftName: "ISMAIL THASRIF KM",
      leftCompany: "Zeronix Technology LLC",
      rightLabel: "Client Company",
    },
  ];
}
