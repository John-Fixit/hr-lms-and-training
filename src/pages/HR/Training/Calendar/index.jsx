import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider } from "antd";
import TrainingPageHeader from "../../../../components/core/training/shared/TrainingPageHeader";
import "../../../../components/core/training/shared/trainingDesignSystem.css";
import { TRAINING_THEME } from "../../../../components/core/training/shared/trainingTheme";
import { useGetSessions } from "../../../../API/trainingSessions";
import CalendarOverviewStrip from "../../../../components/core/training/calendar/CalendarOverviewStrip";
import CalendarBoard from "../../../../components/core/training/calendar/CalendarBoard";
import SessionDetailDrawer from "../../../../components/core/training/calendar/SessionDetailDrawer";
import SessionFormDrawer from "../../../../components/core/training/calendar/SessionFormDrawer";
import { DEFAULT_SESSION_FILTERS } from "../../../../components/core/training/calendar/calendarConstants";

const CLOSED_FORM = { open: false, session: null, preset: null };

/**
 * Training Calendar & Scheduling, with participant enrolment and attendance inside each session.
 * Deep links: ?course=<id>&need=<id> or ?course=<id>&request=<id> open the schedule form pre-filled;
 * ?session=<id> opens a session.
 */
export default function TrainingCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: sessions = [], isPending } = useGetSessions();
  const [filters, setFilters] = useState(DEFAULT_SESSION_FILTERS);
  const [openSessionId, setOpenSessionId] = useState(null);
  const [form, setForm] = useState(CLOSED_FORM);

  useEffect(() => {
    const course = searchParams.get("course");
    const session = searchParams.get("session");
    if (!course && !session) return;
    if (course) {
      setForm({
        open: true,
        session: null,
        preset: { course_id: course, need_id: searchParams.get("need") ?? undefined, request_id: searchParams.get("request") ?? undefined },
      });
    }
    if (session) setOpenSessionId(session);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <ConfigProvider theme={TRAINING_THEME}>
      <main className="training-suite space-y-6 py-6">
        <TrainingPageHeader
          header_text="Training Calendar"
          breadCrumb_data={[{ name: "HR" }, { name: "Skill management" }, { name: "Calendar" }]}
          subtitle="Human Resources / Skill management"
          buttonProp={[{ button_text: "Schedule Session", fn: () => setForm({ open: true, session: null, preset: null }) }]}
        />

        <CalendarOverviewStrip onShowClashes={() => setFilters({ ...DEFAULT_SESSION_FILTERS, clashes_only: true })} />

        <CalendarBoard
          sessions={sessions}
          loading={isPending}
          filters={filters}
          onFiltersChange={setFilters}
          onOpenSession={setOpenSessionId}
          onScheduleOn={(date) => setForm({ open: true, session: null, preset: { start_date: date } })}
        />

        <SessionDetailDrawer
          open={Boolean(openSessionId)}
          sessionId={openSessionId}
          onClose={() => setOpenSessionId(null)}
          onEdit={(session) => setForm({ open: true, session, preset: null })}
        />
        <SessionFormDrawer
          open={form.open}
          session={form.session}
          preset={form.preset ?? undefined}
          onClose={() => setForm(CLOSED_FORM)}
          onSaved={(sessionId) => {
            if (!form.session && sessionId) setOpenSessionId(sessionId);
          }}
        />
      </main>
    </ConfigProvider>
  );
}
