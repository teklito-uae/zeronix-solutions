import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, Plus, Search, UserRound, X } from "lucide-react";
import { api } from "../lib/api";
import type { Client } from "../lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ClientPicker({
  clientId,
  onChange,
}: {
  clientId: number | null;
  onChange: (id: number | null) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");

  useEffect(() => {
    api.clients.list().then(setClients);
  }, []);

  const selected = clients.find((c) => c.id === clientId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
    );
  }, [clients, query]);

  async function createClient() {
    if (!newName.trim()) return;
    const client = await api.clients.create({ name: newName, company: newCompany });
    setClients((prev) => [...prev, client]);
    onChange(client.id);
    resetCreateForm();
    setOpen(false);
  }

  function resetCreateForm() {
    setCreating(false);
    setNewName("");
    setNewCompany("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      resetCreateForm();
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Avatar size="sm">
            <AvatarFallback className={selected ? "bg-primary/10 text-primary" : ""}>
              {selected ? initials(selected.name) : <UserRound className="size-3.5" />}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            {selected ? (
              <span className="block truncate font-medium">{selected.name}</span>
            ) : (
              <span className="block truncate text-muted-foreground">Select a client</span>
            )}
            {selected?.company && (
              <span className="block truncate text-xs text-muted-foreground">{selected.company}</span>
            )}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" onOpenAutoFocus={(e) => !creating && e.preventDefault()}>
        {creating ? (
          <div className="space-y-2 p-3">
            <p className="text-xs font-medium text-muted-foreground">New client</p>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contact name"
              onKeyDown={(e) => e.key === "Enter" && createClient()}
            />
            <Input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Company (optional)"
              onKeyDown={(e) => e.key === "Enter" && createClient()}
            />
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" className="flex-1" disabled={!newName.trim()} onClick={createClient}>
                Add client
              </Button>
              <Button size="sm" variant="ghost" onClick={resetCreateForm}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 border-b p-2">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {selected && (
                <button
                  type="button"
                  title="Clear selection"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">No clients found</p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                    c.id === clientId ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{c.name}</span>
                    {c.company && (
                      <span className="block truncate text-xs text-muted-foreground">{c.company}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-primary/10"
              >
                <Plus className="size-3.5" />
                New client
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
