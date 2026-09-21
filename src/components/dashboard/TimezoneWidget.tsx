import { InfoTip } from "@/components/guide/InfoTip";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import {
  WORLD_CLOCKS,
  convertWallTime,
  formatDateInZone,
  formatInZone,
  getLocalTimeZone,
  getZoneOffset,
  matchWorldClock,
} from "@/lib/timezone";

function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimezoneWidget() {
  const [now, setNow] = useState<Date | null>(null);
  const [localTimeZone, setLocalTimeZone] = useState("");
  const [sourceZone, setSourceZone] = useState(WORLD_CLOCKS[2]?.zone ?? "Europe/London");
  const [sourceTime, setSourceTime] = useState("");

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    setLocalTimeZone(getLocalTimeZone());
    setSourceTime(toDateTimeLocal(new Date()));
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const converted = useMemo(
    () => (sourceTime ? convertWallTime(sourceTime, sourceZone) : null),
    [sourceTime, sourceZone],
  );

  const localClock = useMemo(
    () => (localTimeZone ? matchWorldClock(localTimeZone) : undefined),
    [localTimeZone],
  );

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="flex items-start gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Global hubs
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink-950">World clock</h2>
          </div>
          <InfoTip title="World clock" align="left">
            Multi-hub clocks for Sydney (AEST), India (IST), London (GMT), and New York (EST), plus a converter for international standups. Time math runs in the browser; it does not call the API.
          </InfoTip>
        </div>
        <p className="text-xs text-slate-500">Sydney · India · London · New York</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {WORLD_CLOCKS.map((city) => {
          const isLocal = localClock?.id === city.id;
          return (
            <div
              key={city.id}
              aria-current={isLocal ? "true" : undefined}
              className={cn(
                "rounded-2xl border p-4",
                isLocal
                  ? "border-aqua-500 bg-aqua-50 ring-2 ring-aqua-500/20"
                  : "border-ink-100 bg-gradient-to-b from-white to-aqua-50/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    isLocal ? "text-aqua-800" : "text-aqua-700",
                  )}
                >
                  {city.label}
                </p>
                {isLocal ? (
                  <span className="rounded-full bg-aqua-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-950">
                    Local
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-display text-2xl tabular-nums text-ink-950 sm:text-3xl">
                {now ? formatInZone(now, city.zone) : "--:--:-- --"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {now ? formatDateInZone(now, city.zone) : "Loading"}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                {now ? `${city.city} · ${getZoneOffset(now, city.zone)}` : city.offsetHint}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-ink-950 p-4 text-white sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Convert from">
          <Select
            value={sourceZone}
            onChange={(event) => setSourceZone(event.target.value)}
            className="border-white/10 bg-white/10 text-white"
          >
            {WORLD_CLOCKS.map((city) => (
              <option key={city.zone} value={city.zone} className="text-ink-950">
                {city.label} ({city.city})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Local time">
          <Input
            type="datetime-local"
            value={sourceTime}
            onChange={(event) => setSourceTime(event.target.value)}
            className="border-white/10 bg-white/10 text-white"
          />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            className="w-full rounded-xl bg-aqua-500 px-3 py-2 text-sm font-semibold text-ink-950"
            onClick={() => setSourceTime(toDateTimeLocal(new Date()))}
          >
            Use now
          </button>
        </div>
        <div className="grid gap-2 sm:col-span-3 sm:grid-cols-2 xl:grid-cols-4">
          {WORLD_CLOCKS.map((city) => (
            <div key={`converted-${city.id}`} className="rounded-xl bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{city.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {converted ? formatInZone(converted, city.zone, false) : "--:-- --"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
