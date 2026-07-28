import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { CatalogItem } from "../lib/types";

export function CatalogPickerModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (item: CatalogItem) => void;
}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.catalog.list().then(setItems);
  }, []);

  const filtered = items.filter((i) => i.description.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-gray-200">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search catalog items…"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-brand-navy"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 && (
            <div className="p-4 text-sm text-gray-400 text-center">
              No catalog items yet. Add some in Settings → Catalog.
            </div>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => onPick(item)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-50 flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-medium">{item.description}</div>
                <div className="text-xs text-gray-400">{item.scope}</div>
              </div>
              <div className="text-sm text-gray-600 whitespace-nowrap ml-2">
                AED {item.unit_price.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-gray-200 text-right">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
