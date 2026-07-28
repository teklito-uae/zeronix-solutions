import { useState } from "react";
import type { CatalogItem, PriceTableBlock } from "../lib/types";
import { newId } from "../lib/id";
import { computeTotals, formatMoney } from "../lib/priceMath";
import { CatalogPickerModal } from "../components/CatalogPickerModal";

export function PriceTableBlockView({
  block,
  onChange,
}: {
  block: PriceTableBlock;
  onChange: (b: PriceTableBlock) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { subtotal, vat, grandTotal } = computeTotals(block.rows, block.vatPercent);

  function updateRow(id: string, patch: Partial<PriceTableBlock["rows"][number]>) {
    onChange({ ...block, rows: block.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }
  function addRow() {
    onChange({
      ...block,
      rows: [...block.rows, { id: newId("row"), description: "", scope: "", unit: 1, unitPrice: 0 }],
    });
  }
  function addFromCatalog(item: CatalogItem) {
    onChange({
      ...block,
      rows: [
        ...block.rows,
        {
          id: newId("row"),
          description: item.description,
          scope: item.scope,
          unit: Number(item.unit) || 1,
          unitPrice: item.unit_price,
        },
      ],
    });
    setPickerOpen(false);
  }
  function removeRow(id: string) {
    onChange({ ...block, rows: block.rows.filter((r) => r.id !== id) });
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-green-50 text-green-900 text-left">
            <th className="p-2 font-semibold">Description</th>
            <th className="p-2 font-semibold">Scope</th>
            <th className="p-2 font-semibold w-16">Unit</th>
            <th className="p-2 font-semibold w-32 text-right">Price (AED)</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100">
              <td className="p-1">
                <input
                  value={row.description}
                  onChange={(e) => updateRow(row.id, { description: e.target.value })}
                  className="w-full outline-none p-1"
                  placeholder="Item description"
                />
              </td>
              <td className="p-1">
                <input
                  value={row.scope}
                  onChange={(e) => updateRow(row.id, { scope: e.target.value })}
                  className="w-full outline-none p-1"
                  placeholder="Scope"
                />
              </td>
              <td className="p-1">
                <input
                  type="number"
                  value={row.unit}
                  onChange={(e) => updateRow(row.id, { unit: Number(e.target.value) })}
                  className="w-full outline-none p-1"
                />
              </td>
              <td className="p-1">
                <input
                  type="number"
                  value={row.unitPrice}
                  onChange={(e) => updateRow(row.id, { unitPrice: Number(e.target.value) })}
                  className="w-full outline-none p-1 text-right"
                />
              </td>
              <td className="p-1 text-center">
                <button
                  onClick={() => removeRow(row.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Remove row"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2 p-2 border-t border-gray-100 bg-gray-50">
        <button onClick={addRow} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
          + Add Row
        </button>
        <button onClick={() => setPickerOpen(true)} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
          + From Catalog
        </button>
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          VAT %
          <input
            type="number"
            value={block.vatPercent}
            onChange={(e) => onChange({ ...block, vatPercent: Number(e.target.value) })}
            className="w-14 border border-gray-300 rounded px-1 py-0.5 text-right"
          />
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 space-y-1 text-sm ml-auto max-w-xs text-right">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>AED {formatMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">VAT ({block.vatPercent}%)</span>
          <span>AED {formatMoney(vat)}</span>
        </div>
        <div className="flex justify-between font-bold text-brand-navy border-t border-gray-200 pt-1">
          <span>Grand Total</span>
          <span>AED {formatMoney(grandTotal)}</span>
        </div>
      </div>

      {pickerOpen && (
        <CatalogPickerModal onClose={() => setPickerOpen(false)} onPick={addFromCatalog} />
      )}
    </div>
  );
}
