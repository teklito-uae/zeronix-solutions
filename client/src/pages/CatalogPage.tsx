import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { CatalogItem } from "../lib/types";
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

export function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState({ description: "", scope: "", unit: "1", unit_price: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  function reload() {
    api.catalog.list().then(setItems);
  }
  useEffect(reload, []);

  async function add() {
    if (!form.description.trim()) return;
    await api.catalog.create(form);
    setForm({ description: "", scope: "", unit: "1", unit_price: 0 });
    reload();
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    await api.catalog.remove(deleteId);
    setDeleteId(null);
    reload();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Catalog Items</h1>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4 space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label>Scope</Label>
              <Input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Unit Price (AED)</Label>
              <Input
                type="number"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <Button onClick={add} className="w-full">
                + Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-muted-foreground">{item.scope}</TableCell>
                <TableCell className="text-muted-foreground">AED {item.unit_price.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(item.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="p-8 text-center text-muted-foreground">
                  No catalog items yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this catalog item?</AlertDialogTitle>
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
