import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { CatalogItem } from "../lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[70vh] max-w-[calc(100vw-2rem)] flex-col p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-3">
          <DialogTitle className="sr-only">Pick a catalog item</DialogTitle>
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search catalog items…"
          />
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No catalog items yet. Add some in Settings → Catalog.
            </div>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => onPick(item)}
              className="flex w-full items-center justify-between gap-2 border-b px-4 py-2 text-left hover:bg-muted/60"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.description}</div>
                <div className="truncate text-xs text-muted-foreground">{item.scope}</div>
              </div>
              <div className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                AED {item.unit_price.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
