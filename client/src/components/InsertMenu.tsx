import { useEffect, useRef, useState } from "react";
import { INSERT_MENU_ITEMS, type InsertableType } from "../lib/blockFactory";

export function InsertMenu({ onInsert }: { onInsert: (type: InsertableType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative flex items-center justify-center py-1 group" ref={ref}>
      <div className="flex-1 border-t border-transparent group-hover:border-gray-200 transition-colors" />
      <button
        onClick={() => setOpen((o) => !o)}
        className="mx-2 w-6 h-6 rounded-full border border-gray-300 text-gray-400 text-sm leading-none opacity-0 group-hover:opacity-100 hover:bg-brand-navy hover:text-white hover:border-brand-navy transition-all flex items-center justify-center"
        title="Insert block"
      >
        +
      </button>
      <div className="flex-1 border-t border-transparent group-hover:border-gray-200 transition-colors" />

      {open && (
        <div className="absolute z-20 top-6 left-1/2 -translate-x-1/2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {INSERT_MENU_ITEMS.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                onInsert(item.type);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col"
            >
              <span className="text-sm font-medium text-gray-800">{item.label}</span>
              <span className="text-xs text-gray-400">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
