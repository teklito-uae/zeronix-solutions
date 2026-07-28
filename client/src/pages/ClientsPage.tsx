import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Client } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const emptyForm = { name: "", company: "", phone: "", email: "", address: "" };

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  function reload(query = "") {
    api.clients.list(query).then(setClients);
  }
  useEffect(() => reload(), []);

  async function add() {
    if (!form.name.trim()) return;
    await api.clients.create(form);
    setForm(emptyForm);
    reload(q);
  }

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditForm({
      name: client.name,
      company: client.company,
      phone: client.phone,
      email: client.email,
      address: client.address,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
  }

  async function saveEdit(id: number) {
    await api.clients.update(id, editForm);
    setEditingId(null);
    reload(q);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    await api.clients.remove(deleteId);
    setDeleteId(null);
    reload(q);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Clients</h1>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-2 space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="col-span-1">
              <Button onClick={add} className="w-full">
                + Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          reload(e.target.value);
        }}
        placeholder="Search clients by name or company…"
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) =>
              editingId === client.id ? (
                <TableRow key={client.id} className="bg-muted/40">
                  <TableCell>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => saveEdit(client.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.company || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{client.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{client.address || "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(client)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(client.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                  No clients yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
