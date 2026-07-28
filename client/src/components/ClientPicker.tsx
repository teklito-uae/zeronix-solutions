import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Client } from "../lib/types";

export function ClientPicker({
  clientId,
  onChange,
}: {
  clientId: number | null;
  onChange: (id: number | null) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");

  function reload() {
    api.clients.list().then(setClients);
  }
  useEffect(reload, []);

  async function createClient() {
    if (!newName.trim()) return;
    const client = await api.clients.create({ name: newName, company: newCompany });
    setClients((prev) => [...prev, client]);
    onChange(client.id);
    setCreating(false);
    setNewName("");
    setNewCompany("");
  }

  if (creating) {
    return (
      <div className="space-y-1.5">
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Contact name"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-brand-navy"
        />
        <input
          value={newCompany}
          onChange={(e) => setNewCompany(e.target.value)}
          placeholder="Client company"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-brand-navy"
        />
        <div className="flex gap-1.5">
          <button onClick={createClient} className="text-xs px-2 py-1 rounded bg-brand-navy text-white">
            Add
          </button>
          <button onClick={() => setCreating(false)} className="text-xs px-2 py-1 rounded border border-gray-300">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      <select
        value={clientId ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-brand-navy"
      >
        <option value="">— No client —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}{c.company ? ` (${c.company})` : ""}
          </option>
        ))}
      </select>
      <button
        onClick={() => setCreating(true)}
        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
        title="New client"
      >
        + New
      </button>
    </div>
  );
}
