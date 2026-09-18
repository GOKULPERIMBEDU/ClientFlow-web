"use client";

import { ActionHint } from "@/components/guide/InfoTip";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { Client, ClientStatus, CreateClientInput } from "@/types/domain";
import { Plus, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

const emptyForm: CreateClientInput = {
  name: "",
  email: "",
  company: "",
  phone: "",
  status: "onboarding",
  timezone: "UTC",
  industry: "SaaS",
};

export function ClientManager() {
  const { notify } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateClientInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await api.clients.list();
    setClients(data);
    setError(null);
  }, []);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((reason: unknown) => {
        const message = reason instanceof Error ? reason.message : "Unable to load clients";
        setError(message);
        notify(message, "error");
      })
      .finally(() => setLoading(false));
  }, [load, notify]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.clients.create(form);
      setForm(emptyForm);
      setOpen(false);
      await load();
      notify("Client created");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to create client";
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api.clients.remove(id);
      await load();
      notify("Client deleted");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to delete client", "error");
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? "Loading accounts..." : `${clients.length} accounts in the directory`}
        </p>
        <ActionHint
          title="New client"
          hint="Opens a form that POSTs to /api/clients. MongoDB stores the account so the project picker, Kanban, and invoice generator can select it."
        >
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New client
          </Button>
        </ActionHint>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Timezone</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    Fetching clients from MongoDB...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    No clients yet. Add the first account.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-t border-ink-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </td>
                    <td className="px-4 py-3">{client.company}</td>
                    <td className="px-4 py-3">{client.timezone}</td>
                    <td className="px-4 py-3">{client.industry}</td>
                    <td className="px-4 py-3">
                      <Badge value={client.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" onClick={() => void onDelete(client.id)} aria-label="Delete client">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} title="Add client" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Contact name">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                required
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                required
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Timezone">
              <Select
                value={form.timezone}
                onChange={(event) => setForm({ ...form, timezone: event.target.value })}
              >
                <option value="Australia/Sydney">Sydney (AEST)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="UTC">UTC</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}
              >
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
          </div>
          <Field label="Industry">
            <Input
              value={form.industry}
              onChange={(event) => setForm({ ...form, industry: event.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create client"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
