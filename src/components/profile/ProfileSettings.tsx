import { ApiError } from "@/components/ui/ApiError";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useProfile } from "@/context/ProfileContext";
import { initialsFromName } from "@/lib/format";
import type { UpdateProfileInput } from "@/types/domain";
import { FormEvent, useEffect, useState } from "react";

const emptyForm: Required<UpdateProfileInput> = {
  name: "",
  email: "",
  role: "",
  companyName: "",
  avatarUrl: "",
};

export function ProfileSettings() {
  const { profile, loading, error, refresh, updateProfile } = useProfile();
  const { notify } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name,
      email: profile.email,
      role: profile.role,
      companyName: profile.companyName,
      avatarUrl: profile.avatarUrl,
    });
  }, [profile]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      notify("Profile updated");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return <p className="text-sm text-slate-500">Loading profile from MongoDB...</p>;
  }

  if (error && !profile) {
    return <ApiError message={error} onRetry={() => void refresh()} />;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="p-6 text-center">
        {form.avatarUrl ? (
          <img
            src={form.avatarUrl}
            alt=""
            className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-ink-50"
          />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ink-900 text-2xl font-semibold text-white">
            {initialsFromName(form.name || "Client Flow")}
          </div>
        )}
        <p className="mt-4 font-display text-xl text-ink-950">{form.name || "Your name"}</p>
        <p className="text-sm text-slate-500">{form.role || "Your role"}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {form.companyName || "Company"}
        </p>
      </Card>

      <Card className="space-y-4 p-6">
        <Field label="Full name">
          <Input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </Field>
        <Field label="Email">
          <Input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </Field>
        <Field label="Role / job title">
          <Input
            required
            placeholder="MERN Stack Developer"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          />
        </Field>
        <Field label="Company name">
          <Input
            required
            value={form.companyName}
            onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
          />
        </Field>
        <Field label="Avatar URL">
          <Input
            type="url"
            placeholder="https://…"
            value={form.avatarUrl}
            onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
          />
        </Field>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
