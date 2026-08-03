"use client";
import DoctorPortrait from "@/components/doctor/DoctorPortrait";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionStatus, CardAppointment, CardDoctor, ChatCard, ReminderSummary } from "@/types/medicalChat";
import {
  AlertTriangle, BellRing, CalendarCheck, CalendarPlus, CalendarClock, CalendarX, Check, Clock, LogIn, MapPin, Pill, Star, X,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";

export interface CardHandlers {
  /** Send a message on the user's behalf (quick replies, picking a doctor or slot). */
  onSend: (text: string) => void;
  onConfirm: (actionId: string) => Promise<void>;
  onDismiss: (actionId: string) => Promise<void>;
  busyActionId: string | null;
  disabled: boolean;
}

const shell = "rounded-xl border bg-card text-card-foreground shadow-sm";

function Initials({ name }: { name: string }) {
  const letters = name.replace(/^Dr\.?\s+/i, "").split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <span className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary">{letters}</span>;
}

function DoctorAvatar({ doctor, size = "h-12 w-12" }: { doctor: CardDoctor; size?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full bg-muted", size)}>
      {doctor.avatar_url ? (
        <DoctorPortrait src={doctor.avatar_url} name={doctor.name} className="object-cover object-top" sizes="64px" />
      ) : <Initials name={doctor.name} />}
    </div>
  );
}

function Rating({ doctor }: { doctor: CardDoctor }) {
  if (!doctor.rating) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-medium text-foreground">{doctor.rating.toFixed(1)}</span>
      ({doctor.review_count})
    </span>
  );
}

function DoctorList({ doctors, h }: { doctors: CardDoctor[]; h: CardHandlers }) {
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2" role="list" aria-label="Doctors">
      {doctors.map((doctor) => (
        <div key={doctor.id} role="listitem" className={cn(shell, "flex w-60 shrink-0 snap-start flex-col gap-3 p-3")}>
          <div className="flex items-center gap-3">
            <DoctorAvatar doctor={doctor} />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{doctor.name}</p>
              <p className="text-xs text-muted-foreground">
                {doctor.specialization}
                {doctor.experience_years ? ` · ${doctor.experience_years} yrs` : ""}
              </p>
              <Rating doctor={doctor} />
            </div>
          </div>
          {doctor.clinic && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{doctor.clinic}{doctor.address ? `, ${doctor.address}` : ""}</span>
            </p>
          )}
          <div className="mt-auto flex gap-2">
            <Button
              size="sm" className="flex-1" disabled={h.disabled}
              onClick={() => h.onSend(`Show me available times for ${doctor.name}`)}
            >
              Book
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/doctorDetail?id=${doctor.id}`} target="_blank">Profile</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotPicker({ card, h }: { card: Extract<ChatCard, { type: "slot_picker" }>; h: CardHandlers }) {
  const [active, setActive] = useState(0);
  const day = card.days[Math.min(active, card.days.length - 1)];
  return (
    <div className={cn(shell, "space-y-3 p-3")}>
      <div className="flex items-center gap-3">
        <DoctorAvatar doctor={card.doctor} size="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{card.doctor.name}</p>
          <p className="text-xs text-muted-foreground">Pick a day, then a time</p>
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Days">
        {card.days.map((d, index) => (
          <button
            key={d.date} type="button" role="tab" aria-selected={index === active} onClick={() => setActive(index)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              index === active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {d.label.split(",")[0]} {d.label.split(",")[1]?.trim().split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5" role="tabpanel">
        {day.slots.map((slot) => (
          <Button
            key={slot.time} size="sm" variant="outline" className="h-8 px-2.5 text-xs" disabled={h.disabled}
            onClick={() => h.onSend(`Book ${card.doctor.name} on ${day.date} at ${slot.time}`)}
          >
            {slot.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function StatusBanner({ status }: { status: ActionStatus }) {
  const map: Record<Exclude<ActionStatus, "pending">, { text: string; className: string }> = {
    confirmed: { text: "Confirmed", className: "text-emerald-700 dark:text-emerald-400" },
    dismissed: { text: "Dismissed", className: "text-muted-foreground" },
    failed: { text: "Could not be completed", className: "text-destructive" },
  };
  if (status === "pending") return null;
  const { text, className } = map[status];
  return <p role="status" className={cn("text-xs font-medium", className)}>{text}</p>;
}

function ConfirmShell({
  icon, title, children, actionId, status, confirmLabel, destructive, h,
}: {
  icon: ReactNode; title: string; children: ReactNode; actionId: string; status: ActionStatus;
  confirmLabel: string; destructive?: boolean; h: CardHandlers;
}) {
  const busy = h.busyActionId === actionId;
  return (
    <div className={cn(shell, "space-y-3 border-primary/30 p-3")}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary" aria-hidden>{icon}</span>{title}
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
      {status === "pending" ? (
        <div className="flex gap-2">
          <Button
            size="sm" variant={destructive ? "destructive" : "default"} disabled={busy || h.disabled}
            onClick={() => h.onConfirm(actionId)}
          >
            <Check className="mr-1.5 h-4 w-4" aria-hidden />{busy ? "Working…" : confirmLabel}
          </Button>
          <Button size="sm" variant="outline" disabled={busy || h.disabled} onClick={() => h.onDismiss(actionId)}>
            <X className="mr-1.5 h-4 w-4" aria-hidden />Not now
          </Button>
        </div>
      ) : <StatusBanner status={status} />}
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex gap-2"><span className="w-20 shrink-0 text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
);

function AppointmentConfirm({ card, h }: { card: Extract<ChatCard, { type: "appointment_confirm" }>; h: CardHandlers }) {
  const { doctor, date_label, time_label, reason } = card.summary;
  return (
    <ConfirmShell icon={<CalendarClock className="h-4 w-4" />} title="Confirm appointment" actionId={card.action_id}
      status={card.status} confirmLabel="Confirm booking" h={h}>
      <div className="flex items-center gap-3 pb-1">
        <DoctorAvatar doctor={doctor} size="h-10 w-10" />
        <div><p className="font-semibold">{doctor.name}</p><p className="text-xs text-muted-foreground">{doctor.specialization} · {doctor.clinic}</p></div>
      </div>
      <Row label="When" value={`${date_label}, ${time_label}`} />
      <Row label="Reason" value={reason} />
    </ConfirmShell>
  );
}

function CancelConfirm({ card, h }: { card: Extract<ChatCard, { type: "cancel_confirm" }>; h: CardHandlers }) {
  const a = card.summary.appointment;
  return (
    <ConfirmShell icon={<CalendarX className="h-4 w-4" />} title="Cancel this appointment?" actionId={card.action_id}
      status={card.status} confirmLabel="Yes, cancel it" destructive h={h}>
      <Row label="Doctor" value={a.doctor_name} />
      <Row label="When" value={`${a.date} ${a.time ?? ""}`} />
    </ConfirmShell>
  );
}

function RescheduleConfirm({ card, h }: { card: Extract<ChatCard, { type: "reschedule_confirm" }>; h: CardHandlers }) {
  const { appointment: a, new_date_label, new_time_label } = card.summary;
  return (
    <ConfirmShell icon={<CalendarClock className="h-4 w-4" />} title="Confirm new time" actionId={card.action_id}
      status={card.status} confirmLabel="Move appointment" h={h}>
      <Row label="Doctor" value={a.doctor_name} />
      <Row label="From" value={`${a.date} ${a.time ?? ""}`} />
      <Row label="To" value={`${new_date_label}, ${new_time_label}`} />
    </ConfirmShell>
  );
}

const ReminderDetails = ({ s }: { s: ReminderSummary }) => (
  <>
    <Row label="Medicine" value={`${s.medicine_name} · ${s.dosage} ${s.medicine_type.toLowerCase()}`} />
    <Row label="Time" value={`${s.time_label} (${s.timezone})`} />
    <Row label="Days" value={s.days_of_week.length === 7 ? "Every day" : s.days_of_week.join(", ")} />
  </>
);

function ReminderConfirm({ card, h }: { card: Extract<ChatCard, { type: "reminder_confirm" }>; h: CardHandlers }) {
  return (
    <ConfirmShell icon={<Pill className="h-4 w-4" />} title="Set this reminder?" actionId={card.action_id}
      status={card.status} confirmLabel="Set reminder" h={h}>
      <ReminderDetails s={card.summary} />
      <p className="pt-1 text-xs text-muted-foreground">You&apos;ll get an email at that time.</p>
    </ConfirmShell>
  );
}

function ResultCard({ icon, title, tone = "ok", children }: { icon: ReactNode; title: string; tone?: "ok" | "muted"; children: ReactNode }) {
  return (
    <div className={cn(shell, "space-y-1.5 p-3", tone === "ok" ? "border-emerald-500/40 bg-emerald-500/5" : "")}>
      <div className={cn("flex items-center gap-2 text-sm font-semibold", tone === "ok" && "text-emerald-700 dark:text-emerald-400")}>
        <span aria-hidden>{icon}</span>{title}
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

const statusStyle: Record<string, string> = {
  scheduled: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

function AppointmentList({ appointments, h }: { appointments: CardAppointment[]; h: CardHandlers }) {
  return (
    <div className={cn(shell, "divide-y")}>
      {appointments.map((a) => {
        const active = a.status === "scheduled" || a.status === "pending";
        return (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{a.doctor_name}</p>
              <p className="text-xs text-muted-foreground">{a.date} {a.time ? `· ${a.time}` : ""} {a.clinic ? `· ${a.clinic}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", statusStyle[a.status] ?? "bg-muted")}>{a.status}</span>
              {active && (
                <>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={h.disabled}
                    onClick={() => h.onSend(`I want to reschedule my appointment with ${a.doctor_name} on ${a.date}`)}>Reschedule</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" disabled={h.disabled}
                    onClick={() => h.onSend(`Cancel my appointment with ${a.doctor_name} on ${a.date}`)}>Cancel</Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function downloadIcs(title: string, date: string, time: string, location?: string | null) {
  const stamp = (d: string, t: string, plusMinutes = 0) => {
    const [y, m, day] = d.split("-").map(Number);
    const [hh, mm] = t.split(":").map(Number);
    const value = new Date(y, m - 1, day, hh, mm + plusMinutes);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}${p(value.getMonth() + 1)}${p(value.getDate())}T${p(value.getHours())}${p(value.getMinutes())}00`;
  };
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Symptoms Sense//EN", "BEGIN:VEVENT",
    `UID:${date}-${time}-${Math.random().toString(36).slice(2)}@symptoms-sense`,
    `DTSTAMP:${stamp(date, time)}`, `DTSTART:${stamp(date, time)}`, `DTEND:${stamp(date, time, 30)}`,
    `SUMMARY:${title}`, ...(location ? [`LOCATION:${location}`] : []), "END:VEVENT", "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "appointment.ics";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ChatCards({ cards, handlers }: { cards: ChatCard[]; handlers: CardHandlers }) {
  if (!cards.length) return null;
  const h = handlers;
  return (
    <div className="mt-2 w-full space-y-2">
      {cards.map((card, index) => {
        switch (card.type) {
          case "doctor_list": return <DoctorList key={index} doctors={card.doctors} h={h} />;
          case "slot_picker": return <SlotPicker key={index} card={card} h={h} />;
          case "appointment_confirm": return <AppointmentConfirm key={card.action_id} card={card} h={h} />;
          case "cancel_confirm": return <CancelConfirm key={card.action_id} card={card} h={h} />;
          case "reschedule_confirm": return <RescheduleConfirm key={card.action_id} card={card} h={h} />;
          case "reminder_confirm": return <ReminderConfirm key={card.action_id} card={card} h={h} />;
          case "appointment_created":
            return (
              <ResultCard key={index} icon={<CalendarCheck className="h-4 w-4" />} title="Appointment booked">
                <Row label="Doctor" value={card.summary.doctor.name} />
                <Row label="When" value={`${card.summary.date_label}, ${card.summary.time_label}`} />
                <p className="pt-1 text-xs text-muted-foreground">The clinic will confirm it shortly.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" asChild><Link href="/profile">View my appointments</Link></Button>
                  {card.summary.date && card.summary.time && (
                    <Button size="sm" variant="ghost" onClick={() => downloadIcs(
                      `Appointment with ${card.summary.doctor.name}`, card.summary.date as string, card.summary.time as string,
                      card.summary.doctor.clinic,
                    )}>
                      <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden />Add to calendar
                    </Button>
                  )}
                </div>
              </ResultCard>
            );
          case "appointment_cancelled":
            return (
              <ResultCard key={index} tone="muted" icon={<CalendarX className="h-4 w-4" />} title="Appointment cancelled">
                <Row label="Doctor" value={card.summary.appointment.doctor_name} />
              </ResultCard>
            );
          case "appointment_rescheduled":
            return (
              <ResultCard key={index} icon={<CalendarCheck className="h-4 w-4" />} title="Appointment moved">
                <Row label="Doctor" value={card.summary.appointment.doctor_name} />
                <Row label="New time" value={`${card.summary.new_date_label}, ${card.summary.new_time_label}`} />
              </ResultCard>
            );
          case "reminder_created":
            return (
              <ResultCard key={index} icon={<BellRing className="h-4 w-4" />} title="Reminder set">
                <ReminderDetails s={card.summary} />
                <div className="pt-1">
                  <Button size="sm" variant="outline" asChild><Link href="/medicineReminder">Manage reminders</Link></Button>
                </div>
              </ResultCard>
            );
          case "appointment_list": return <AppointmentList key={index} appointments={card.appointments} h={h} />;
          case "reminder_list":
            return (
              <div key={index} className={cn(shell, "divide-y")}>
                {card.reminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 text-sm">
                    <Pill className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-semibold">{r.medicine_name} <span className="font-normal text-muted-foreground">· {r.dosage} {r.medicine_type.toLowerCase()}</span></p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" aria-hidden />{r.reminder_time} · {r.days_of_week.length === 7 ? "Every day" : r.days_of_week.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          case "login_required":
            return (
              <div key={index} className={cn(shell, "flex flex-wrap items-center justify-between gap-3 p-3")}>
                <p className="text-sm">Sign in as a patient to book appointments and set reminders.</p>
                <Button size="sm" asChild><Link href="/login"><LogIn className="mr-1.5 h-4 w-4" aria-hidden />Sign in</Link></Button>
              </div>
            );
          case "urgent_notice":
            return (
              <div key={index} role="alert" className="flex gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  {card.level === "emergency"
                    ? "These symptoms may be an emergency. Call your local emergency number or go to the nearest emergency room now."
                    : "These symptoms may need prompt medical attention. Please see a doctor soon, or go to urgent care if they get worse."}
                </p>
              </div>
            );
          default: return null;
        }
      })}
    </div>
  );
}
