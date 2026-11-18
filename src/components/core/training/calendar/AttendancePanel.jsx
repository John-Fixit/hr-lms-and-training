import { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import dayjs from "dayjs";
import { Tooltip } from "antd";
import { CheckCheck, Loader2 } from "lucide-react";
import { useSetAttendance } from "../../../../API/trainingSessions";
import { errorToast, successToast } from "../../../../utils/toastMsgPop";
import { ATTENDANCE, ATTENDANCE_CYCLE, COMPLETION_THRESHOLD, SEATED_STATUSES } from "./calendarConstants";
import { isSampleRecord } from "../../../../API/trainingSample";

/** Day-by-day attendance register. Click a cell to cycle: — → Present → Late → Absent → —. */
export default function AttendancePanel({ session }) {
  const { mutateAsync: setAttendance } = useSetAttendance();
  const [busy, setBusy] = useState(null);
  const today = dayjs().startOf("day");
  const sampleRecord = isSampleRecord(session);
  const editable = session.STATUS !== "CANCELLED" && sampleRecord;
  const rows = session.PARTICIPANTS.filter((p) => SEATED_STATUSES.includes(p.STATUS));
  const started = !dayjs(session.START_DATE).isAfter(today, "day");

  const save = async (key, payload, toast) => {
    setBusy(key);
    try {
      const res = await setAttendance({ session_id: session.SESSION_ID, ...payload });
      if (toast) successToast(res?.message);
    } catch (err) {
      errorToast(err?.response?.data?.message ?? err?.message);
    } finally {
      setBusy(null);
    }
  };

  const cycle = (participant, date) => {
    const current = participant.ATTENDANCE[date];
    const next = ATTENDANCE_CYCLE[(ATTENDANCE_CYCLE.indexOf(current) + 1) % ATTENDANCE_CYCLE.length];
    if (next == null) {
      errorToast("The training API does not currently support clearing a saved attendance mark.");
      return;
    }
    save(`${participant.PARTICIPANT_ID}-${date}`, { staff_id: participant.STAFF_ID, date, value: next });
  };

  if (!started) {
    return (
      <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-white px-6 py-10 text-center">
        <p className="text-sm font-semibold text-[#0f172a]">Attendance opens on {dayjs(session.START_DATE).format("D MMM YYYY")}</p>
        <p className="mt-1 text-xs text-[#64748b]">You can take attendance for each day once it starts.</p>
      </div>
    );
  }
  if (!rows.length) {
    return <p className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center text-sm text-[#94a3b8]">No seated participants.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#475569]">
        {Object.entries(ATTENDANCE).map(([key, meta]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold" style={{ color: meta.color, backgroundColor: meta.bg }}>
              {meta.short}
            </span>
            {meta.label}
          </span>
        ))}
        <span className="text-[#94a3b8]">· {COMPLETION_THRESHOLD}% attendance (late counts) is needed to complete.</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-[#F9FAFB] text-left text-[11px] uppercase tracking-[0.06em] text-[#64748b]">
              <th scope="col" className="sticky left-0 z-10 bg-[#F9FAFB] px-3 py-2 font-semibold">Participant</th>
              {(session.DAYS ?? []).map((d) => {
                const future = dayjs(d).isAfter(today, "day");
                return (
                  <th key={d} scope="col" className="px-1.5 py-2 text-center font-semibold">
                    <div className={future ? "text-[#D0D5DD]" : ""}>{dayjs(d).format("ddd D")}</div>
                    {editable && !future && (
                      <Tooltip title="Mark everyone not yet marked as present">
                        <button
                          type="button"
                          onClick={() =>
                            save(
                              `all-${d}`,
                              {
                                date: d,
                                records: rows
                                  .filter((participant) => !participant.ATTENDANCE[d])
                                  .map((participant) => ({ staff_id: participant.STAFF_ID, value: "PRESENT" })),
                              },
                              true,
                            )
                          }
                          className="mt-1 inline-flex items-center rounded p-0.5 text-[#4F46E5] outline-none hover:bg-[#6366F1]/10 focus-visible:ring-2 focus-visible:ring-[#6366F1]/40"
                          aria-label={`Mark all present on ${dayjs(d).format("D MMM")}`}
                        >
                          {busy === `all-${d}` ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                        </button>
                      </Tooltip>
                    )}
                  </th>
                );
              })}
              <th scope="col" className="px-3 py-2 text-right font-semibold">Attended</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const rate = p.ATTENDANCE_RATE;
              return (
                <tr key={p.PARTICIPANT_ID} className="border-t border-[#f1f5f9]">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-normal">
                    <p className="max-w-[180px] truncate text-[13px] font-medium uppercase text-[#0f172a]">{`${p.LAST_NAME} ${p.FIRST_NAME}`}</p>
                    <p className="text-[11px] text-[#94a3b8]">{p.DEPARTMENT}</p>
                  </th>
                  {(session.DAYS ?? []).map((d) => {
                    const value = p.ATTENDANCE[d];
                    const meta = ATTENDANCE[value];
                    const future = dayjs(d).isAfter(today, "day");
                    const key = `${p.PARTICIPANT_ID}-${d}`;
                    return (
                      <td key={d} className="px-1.5 py-1.5 text-center">
                        <button
                          type="button"
                          disabled={!editable || future || busy === key}
                          onClick={() => cycle(p, d)}
                          aria-label={`${p.LAST_NAME} ${p.FIRST_NAME}, ${dayjs(d).format("D MMM")}: ${meta?.label ?? "not marked"}`}
                          className={clsx(
                            "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold outline-none transition-all",
                            "focus-visible:ring-2 focus-visible:ring-[#6366F1]/40",
                            future ? "cursor-not-allowed border-dashed border-[#e2e8f0] bg-[#F9FAFB]" : meta ? "border-transparent" : "border-[#e2e8f0] bg-white hover:border-[#6366F1]/50",
                          )}
                          style={meta ? { color: meta.color, backgroundColor: meta.bg } : undefined}
                        >
                          {busy === key ? <Loader2 size={13} className="animate-spin text-[#94a3b8]" /> : meta?.short ?? ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    <span
                      className={clsx(
                        "tabular-nums text-[13px] font-semibold",
                        rate === null ? "text-[#94a3b8]" : rate >= COMPLETION_THRESHOLD ? "text-[#15803d]" : "text-[#b45309]",
                      )}
                    >
                      {rate === null ? "—" : `${rate}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {session.STATUS === "COMPLETED" && (
        <p className="text-xs text-[#64748b]">This session is closed. Correcting attendance updates each participant&apos;s result.</p>
      )}
    </div>
  );
}

AttendancePanel.propTypes = {
  session: PropTypes.object.isRequired,
};
