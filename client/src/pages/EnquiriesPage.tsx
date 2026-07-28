import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  in_review: "In Review",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  on_hold: "On Hold",
};

const STATUS_BADGE_CLASS: Record<EnquiryStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  quoted: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  won: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  lost: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  on_hold: "bg-muted text-muted-foreground",
};

export function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const navigate = useNavigate();

  function reload(query = q, statusFilter = status) {
    api.enquiries.list(query, statusFilter === "all" ? "" : statusFilter).then(setEnquiries);
  }
  useEffect(() => reload(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            reload(e.target.value, status);
          }}
          placeholder="Search enquiries by title, number, or contact…"
          className="flex-1"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            reload(q, value);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ENQUIRY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => navigate("/enquiries/new")}>+ New Enquiry</Button>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enquiry No</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enquiries.map((enquiry) => (
              <TableRow key={enquiry.id} className="cursor-pointer" onClick={() => navigate(`/enquiries/${enquiry.id}`)}>
                <TableCell className="text-muted-foreground">{enquiry.enquiry_no}</TableCell>
                <TableCell>
                  <Link
                    to={`/enquiries/${enquiry.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-brand-navy hover:underline dark:text-foreground"
                  >
                    {enquiry.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {enquiry.contact_name}
                  {enquiry.company_name ? ` (${enquiry.company_name})` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{enquiry.service_type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_BADGE_CLASS[enquiry.status]}>
                    {STATUS_LABEL[enquiry.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">{enquiry.priority}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(enquiry.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {enquiries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="p-8 text-center text-muted-foreground">
                  No enquiries yet. Log one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
