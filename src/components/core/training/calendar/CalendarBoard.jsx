import { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import clsx from "clsx";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button, Input, Segmented, Select, Switch } from "antd";
import { AlertTriangle, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, List, MapPin, Search } from "lucide-react";
import { useGetProgrammes } from "../../../../API/trainingCatalogue";
import { useGetProviders } from "../../../../API/trainingProviders";
import { CARD_CLASS, accentFor } from "../shared/trainingTheme";
import { DEFAULT_SESSION_FILTERS, formatDateRange } from "./calendarConstants";
import { CapacityBar, PhaseBadge } from "./SessionBadges";
import "./trainingCalendar.css";

const PHASE_FILTERS = [
  { value: "active", label: "Active", phases: ["UPCOMING", "IN_PROGRESS", "AWAITING_CLOSE"] },
  { value: "COMPLETED", label: "Completed", phases: ["COMPLETED"] },
  { value: "CANCELLED", label: "Cancelled", phases: ["CANCELLED"] },
  { value: "all", label: "All", phases: null },
];

function EventChip({ session }) {
  const accent = accentFor(session.PROGRAMME_ID ?? "");
  const cancelled = session.PHASE === "CANCELLED";
  return (
    <div
      className={clsx("flex w-full items-center gap-1 overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight", cancelled && "opacity-60")}
      style={{ backgroundColor: `${accent}18`, color: "#0f172a", borderLeft: `3px solid ${accent}` }}
      title={`${session.COURSE_TITLE} · ${session.ENROLLED}/${session.CAPACITY_MAX} seats`}
    >
      {session.CLASHES?.length > 0 && <AlertTriangle size={11} className="shrink-0 text-[#b45309]" />}
      <span className={clsx("truncate font-semibold", cancelled && "line-through")}>{session.COURSE_CODE}</span>
      <span className="hidden truncate text-[#475569] sm:inline">{session.COURSE_TITLE}</span>
    </div>
  );
}

EventChip.propTypes = { session: PropTypes.object.isRequired };

function Agenda({ sessions, onOpen }) {
  const groups = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const key = dayjs(s.START_DATE).format("YYYY-MM");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return [...map.entries()];
  }, [sessions]);

  if (!sessions.length) {
    return (
      <div className={`${CARD_CLASS} px-6 py-14 text-center`}>
        <p className="text-sm font-semibold text-[#0f172a]">No sessions match these filters</p>
        <p className="mt-1 text-xs text-[#64748b]">Try another status, or schedule a session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([month, items]) => (
        <section key={month}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b]">{dayjs(`${month}-01`).format("MMMM YYYY")}</h3>
          <ul className="space-y-2">
            {items.map((s) => {
              const accent = accentFor(s.PROGRAMME_ID ?? "");
              return (
                <li key={s.SESSION_ID}>
                  <button
                    type="button"
                    onClick={() => onOpen(s.SESSION_ID)}
                    className={clsx(
                      CARD_CLASS,
                      "grid w-full grid-cols-[56px_1fr] items-center gap-4 p-3 text-left outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#6366F1]/40 sm:grid-cols-[56px_1fr_160px_120px]",
                      s.PHASE === "CANCELLED" && "opacity-70",
                    )}
                  >
                    <span className="flex flex-col items-center rounded-lg py-1.5" style={{ backgroundColor: `${accent}14`, color: accent }}>
                      <span className="text-[10px] font-semibold uppercase">{dayjs(s.START_DATE).format("ddd")}</span>
                      <span className="text-xl font-bold leading-none">{dayjs(s.START_DATE).format("D")}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={clsx("truncate text-sm font-semibold text-[#0f172a]", s.PHASE === "CANCELLED" && "line-through")}>{s.COURSE_TITLE}</span>
                        {s.CLASHES?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#b45309]">
                            <AlertTriangle size={12} /> {s.CLASHES.length} clash{s.CLASHES.length === 1 ? "" : "es"}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[#64748b]">
                        <span>{s.COURSE_CODE} · {formatDateRange(s.START_DATE, s.END_DATE)}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} />{s.VENUE}</span>
                        {s.TRAINER_NAMES?.length > 0 && <span>{s.TRAINER_NAMES.join(", ")}</span>}
                      </span>
                    </span>
                    <span className="col-span-2 sm:col-span-1">
                      <CapacityBar enrolled={s.ENROLLED} max={s.CAPACITY_MAX} min={s.CAPACITY_MIN} waitlisted={s.WAITLISTED} />
                    </span>
                    <span className="col-span-2 sm:col-span-1 sm:text-right"><PhaseBadge phase={s.PHASE} /></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

Agenda.propTypes = { sessions: PropTypes.array.isRequired, onOpen: PropTypes.func.isRequired };

export default function CalendarBoard({ sessions, loading, filters, onFiltersChange, onOpenSession, onScheduleOn }) {
  const calendarRef = useRef(null);
  const [view, setView] = useState("month");
  const [title, setTitle] = useState(dayjs().format("MMMM YYYY"));
  const { data: programmes = [] } = useGetProgrammes();
  const { data: providers = [] } = useGetProviders();

  const update = (patch) => onFiltersChange((prev) => ({ ...prev, ...patch }));

  const filtered = useMemo(() => {
    const phases = PHASE_FILTERS.find((p) => p.value === filters.phase)?.phases;
    const term = filters.search.trim().toLowerCase();
    return sessions.filter(
      (s) =>
        (!phases || phases.includes(s.PHASE)) &&
        (!filters.programme_id || s.PROGRAMME_ID === filters.programme_id) &&
        (!filters.provider_id || s.PROVIDER_ID === filters.provider_id) &&
        (!filters.clashes_only || s.CLASHES?.length) &&
        (!term || [s.COURSE_TITLE, s.COURSE_CODE, s.VENUE, ...(s.TRAINER_NAMES ?? [])].join(" ").toLowerCase().includes(term)),
    );
  }, [sessions, filters]);

  const events = filtered.map((s) => ({
    id: s.SESSION_ID,
    start: s.START_DATE,
    end: dayjs(s.END_DATE).add(1, "day").format("YYYY-MM-DD"), // FullCalendar end is exclusive
    allDay: true,
    extendedProps: { session: s },
  }));

  const api = () => calendarRef.current?.getApi();
  const go = (action) => {
    api()?.[action]();
    setTitle(api()?.view.title ?? title);
  };
  const changeView = (next) => {
    setView(next);
    if (next !== "agenda") {
      // Wait for the calendar to mount when coming back from the agenda view.
      setTimeout(() => {
        api()?.changeView(next === "week" ? "dayGridWeek" : "dayGridMonth");
        setTitle(api()?.view.title ?? title);
      });
    }
  };

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_SESSION_FILTERS);

  return (
    <div className="space-y-4">
      <section className={`${CARD_CLASS} space-y-3 p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            allowClear
            size="large"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search course, venue or trainer"
            prefix={<Search size={15} className="text-[#94a3b8]" />}
            className="lg:max-w-sm"
          />
          <Segmented value={filters.phase} onChange={(value) => update({ phase: value })} options={PHASE_FILTERS.map(({ value, label }) => ({ value, label }))} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select allowClear virtual={false} placeholder="All programmes" value={filters.programme_id} onChange={(v) => update({ programme_id: v })} options={programmes.map((p) => ({ value: p.PROGRAMME_ID, label: p.PROGRAMME_NAME }))} />
          <Select allowClear showSearch optionFilterProp="label" virtual={false} placeholder="All providers" value={filters.provider_id} onChange={(v) => update({ provider_id: v })} options={providers.map((p) => ({ value: p.PROVIDER_ID, label: p.PROVIDER_NAME }))} />
          <label className="flex items-center gap-2 text-sm text-[#344054]">
            <Switch size="small" checked={filters.clashes_only} onChange={(checked) => update({ clashes_only: checked })} />
            Clashes only
            {isFiltered && (
              <Button type="link" size="small" className="!ml-auto !px-1" onClick={() => onFiltersChange(DEFAULT_SESSION_FILTERS)}>
                Reset
              </Button>
            )}
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === "agenda" ? (
          <p className="text-sm text-[#344054]">
            <span className="text-lg font-bold tabular-nums text-[#0f172a]">{filtered.length}</span> session{filtered.length === 1 ? "" : "s"}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <Button aria-label="Previous" icon={<ChevronLeft size={16} />} onClick={() => go("prev")} />
            <Button onClick={() => go("today")}>Today</Button>
            <Button aria-label="Next" icon={<ChevronRight size={16} />} onClick={() => go("next")} />
            <h2 className="ml-2 text-lg font-bold text-[#0f172a]">{title}</h2>
          </div>
        )}
        <Segmented
          value={view}
          onChange={changeView}
          options={[
            { value: "month", label: <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />Month</span> },
            { value: "week", label: <span className="inline-flex items-center gap-1.5"><CalendarRange size={14} />Week</span> },
            { value: "agenda", label: <span className="inline-flex items-center gap-1.5"><List size={14} />Agenda</span> },
          ]}
        />
      </div>

      {view === "agenda" ? (
        <Agenda sessions={filtered} onOpen={onOpenSession} />
      ) : (
        <div className={clsx(CARD_CLASS, "training-calendar overflow-hidden p-2 sm:p-3", loading && "opacity-60")}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView={view === "week" ? "dayGridWeek" : "dayGridMonth"}
            headerToolbar={false}
            height="auto"
            firstDay={1}
            dayMaxEvents={3}
            fixedWeekCount={false}
            events={events}
            eventContent={(arg) => <EventChip session={arg.event.extendedProps.session} />}
            eventClick={(arg) => onOpenSession(arg.event.id)}
            dateClick={(arg) => onScheduleOn(arg.dateStr)}
            datesSet={(arg) => setTitle(arg.view.title)}
          />
          <p className="px-2 pt-2 text-[11px] text-[#94a3b8]">Click a day to schedule a session on it.</p>
        </div>
      )}
    </div>
  );
}

CalendarBoard.propTypes = {
  sessions: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onOpenSession: PropTypes.func.isRequired,
  onScheduleOn: PropTypes.func.isRequired,
};
