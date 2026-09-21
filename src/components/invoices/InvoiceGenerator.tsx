import { ActionHint, InfoTip } from "@/components/guide/InfoTip";
import { ApiError } from "@/components/ui/ApiError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useProfile } from "@/context/ProfileContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Invoice, InvoiceItem } from "@/types/domain";
import { Plus, Printer, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  rate: 0,
});

function nextInvoiceNumber(): string {
  return `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

export function InvoiceGenerator() {
  const { notify } = useToast();
  const { profile } = useProfile();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [clientId, setClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-DRAFT");
  const [issueDate, setIssueDate] = useState("2026-09-17");
  const [dueDate, setDueDate] = useState("2026-10-01");
  const [taxRate, setTaxRate] = useState(10);
  const [notes, setNotes] = useState("Payment due within 14 days. Bank transfer preferred.");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "new-item", description: "", quantity: 1, rate: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [nextClients, nextInvoices] = await Promise.all([api.clients.list(), api.invoices.list()]);
    setClients(nextClients);
    setInvoices(nextInvoices);
    setClientId((current) => current || nextClients[0]?.id || "");
    setError(null);
  }, []);

  useEffect(() => {
    setInvoiceNumber(nextInvoiceNumber());
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    return load()
      .catch((reason: unknown) => {
        const message = reason instanceof Error ? reason.message : "Unable to load invoices";
        setError(message);
        notify(message, "error");
      })
      .finally(() => setLoading(false));
  }, [load, notify]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const applyInvoice = (invoice: Invoice) => {
    setSelectedId(invoice.id);
    setClientId(invoice.clientId);
    setInvoiceNumber(invoice.invoiceNumber);
    setIssueDate(invoice.issueDate);
    setDueDate(invoice.dueDate);
    setTaxRate(invoice.taxRate);
    setNotes(invoice.notes);
    setItems(invoice.items.length > 0 ? invoice.items : [emptyItem()]);
  };

  const resetForm = () => {
    setSelectedId("new");
    setInvoiceNumber(nextInvoiceNumber());
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate("2026-10-01");
    setTaxRate(10);
    setNotes("Payment due within 14 days. Bank transfer preferred.");
    setItems([emptyItem()]);
    setClientId(clients[0]?.id || "");
  };

  const selectedClient = clients.find((client) => client.id === clientId);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = subtotal * (taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const saveInvoice = async () => {
    if (!clientId) {
      notify("Select a client before saving", "error");
      return;
    }

    setSaving(true);
    const payload = {
      invoiceNumber,
      clientId,
      issueDate,
      dueDate,
      taxRate,
      notes,
      items: items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
      })),
      status: "draft" as const,
    };

    try {
      const saved =
        selectedId === "new"
          ? await api.invoices.create(payload)
          : await api.invoices.update(selectedId, payload);
      await load();
      applyInvoice(saved);
      notify(selectedId === "new" ? "Invoice saved" : "Invoice updated");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to save invoice", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await api.invoices.remove(id);
      await load();
      if (selectedId === id) {
        resetForm();
      }
      notify("Invoice deleted");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to delete invoice", "error");
    }
  };

  return (
    <div className="space-y-6">
      {error ? <ApiError message={error} onRetry={() => void reload()} /> : null}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">Saved invoices</p>
          <ActionHint
            title="New invoice"
            hint="Starts a blank draft. Save sends POST /api/invoices (or PUT when editing) so the document lives in MongoDB and can be reopened from this list."
          >
            <Button variant="secondary" onClick={resetForm}>
              New invoice
            </Button>
          </ActionHint>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading invoices from MongoDB...</p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-slate-500">No invoices yet. Compose one below and save it.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => applyInvoice(invoice)}
                className={`rounded-full border px-3 py-1.5 text-left text-sm ${
                  selectedId === invoice.id
                    ? "border-aqua-600 bg-aqua-50 text-aqua-700"
                    : "border-ink-100 bg-white text-ink-800"
                }`}
              >
                {invoice.invoiceNumber}
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <h2 className="font-display text-2xl text-ink-950">Invoice details</h2>
          <p className="mt-1 text-sm text-slate-500">Pull a client, add line items, and save to MongoDB.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Bill to" className="sm:col-span-2">
              <Select value={clientId} onChange={(event) => setClientId(event.target.value)}>
                {clients.length === 0 ? <option value="">No clients loaded</option> : null}
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company} — {client.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Invoice number">
              <Input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
            </Field>
            <Field label="Tax %">
              <Input
                type="number"
                min={0}
                value={taxRate}
                onChange={(event) => setTaxRate(Number(event.target.value))}
              />
            </Field>
            <Field label="Issue date">
              <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </Field>
            <Field label="Due date">
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </Field>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">Line items</p>
              <Button variant="secondary" onClick={() => setItems((current) => [...current, emptyItem()])}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-2xl border border-ink-100 p-3 sm:grid-cols-[1fr_80px_110px_40px]"
              >
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(event) => updateItem(item.id, { description: event.target.value })}
                />
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                />
                <Input
                  type="number"
                  min={0}
                  value={item.rate}
                  onChange={(event) => updateItem(item.id, { rate: Number(event.target.value) })}
                />
                <Button
                  variant="ghost"
                  onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Field label="Notes" className="mt-4">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <ActionHint
              title="Save invoice"
              hint="Writes client, line items, tax, and totals with POST /api/invoices or PUT /api/invoices/:id. The API calculates subtotal, tax, and total in MongoDB."
              align="left"
            >
              <Button onClick={() => void saveInvoice()} disabled={saving || !clientId}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : selectedId === "new" ? "Save invoice" : "Update invoice"}
              </Button>
            </ActionHint>
            {selectedId !== "new" ? (
              <Button variant="danger" onClick={() => void deleteInvoice(selectedId)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </Card>

        <Card className="invoice-sheet p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-3xl text-ink-950">ClientFlow</p>
              <p className="mt-1 text-sm text-slate-500">
                {profile?.companyName ? `${profile.companyName} · Professional services` : "Professional services"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Invoice</p>
              <p className="mt-1 text-lg font-semibold">{invoiceNumber}</p>
              {selectedId !== "new" ? (
                <div className="mt-2">
                  <Badge value={invoices.find((invoice) => invoice.id === selectedId)?.status ?? "draft"} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Bill to</p>
              <p className="mt-1 font-semibold text-ink-900">{selectedClient?.company ?? "Select a client"}</p>
              <p className="text-sm text-slate-500">{selectedClient?.name}</p>
              <p className="text-sm text-slate-500">{selectedClient?.email}</p>
            </div>
            <div className="text-sm text-slate-600 sm:text-right">
              <p>Issued {formatDate(issueDate)}</p>
              <p>Due {formatDate(dueDate)}</p>
              <p>{selectedClient?.timezone}</p>
            </div>
          </div>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Rate</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-ink-50">
                  <td className="py-3">{item.description || "—"}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.rate)}</td>
                  <td className="text-right">{formatCurrency(item.quantity * item.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink-950">
              <span>Total due</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <p className="mt-8 text-sm text-slate-500">{notes}</p>

          <div className="mt-8 flex items-center gap-2 print:hidden">
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print / save PDF
            </Button>
            <InfoTip title="Print / save PDF" align="left">
              Opens the browser print dialog so you can print or save a PDF. Totals come from the invoice already saved through /api/invoices — this button does not write a new record.
            </InfoTip>
          </div>
        </Card>
      </div>
    </div>
  );
}
