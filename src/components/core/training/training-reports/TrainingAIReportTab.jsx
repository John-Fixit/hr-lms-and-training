import { useState } from "react";

const DEPARTMENTS = [
  "All departments",
  "Finance",
  "Operations",
  "ICT",
  "HR",
  "Legal",
  "Admin",
  "Audit",
];
const YEARS = ["2025", "2024", "2023"];

const SAMPLE_REPORT = `Executive Summary

The 2025 training programme reflects a strong institutional commitment to staff development. A total of 48 courses were delivered across 9 departments, resulting in 312 staff members receiving structured training — a 14% increase over the previous year.

Key Findings

Budget utilisation stood at 84% of the annual allocation (₦18.4M of ₦21.9M), indicating efficient planning with moderate underspend in the Legal and Admin directorates. Operations and Finance accounted for the highest share of training expenditure at 24% and 32% respectively, aligned with their larger staff populations.

Staff participation rates improved markedly in ICT and HR directorates, with both recording a 20%+ increase in courses attended compared to 2024. This coincides with the rollout of two organisation-wide digital upskilling initiatives in Q2 and Q3.

The average staff review score of 4.2 out of 5 (from 289 submitted reviews) suggests a high level of satisfaction with course quality. However, 23 staff members (7.4%) did not submit reviews or certificates of participation after course completion — this gap should be addressed in the next cycle through stricter completion tracking.

Areas of Concern

The Audit directorate recorded the lowest training activity with only 4 courses and 28 staff trained, representing a 12% decline from 2024. Given the evolving regulatory landscape, it is recommended that a targeted audit-skills training plan be developed for Q1 2026.

Q4 showed a consistent drop in both course delivery and attendance across all departments. This seasonal pattern suggests the need for proactive Q4 scheduling in future annual training plans to avoid end-of-year gaps.

Recommendations

1. Develop a dedicated Q4 training calendar to prevent the recurring activity dip observed in October through December.
2. Introduce mandatory certificate submission as a system-enforced requirement — currently optional in the self-service portal.
3. Prioritise the Audit directorate with at least 6 targeted courses in the first half of 2026.
4. Explore cost-sharing arrangements for high-fee external courses, particularly in Finance, where spend per staff is the highest across all directorates.
5. Consider introducing a peer-learning component alongside formal courses to increase training touchpoints without proportionally increasing budget spend.

Conclusion

Overall, the 2025 training year demonstrated solid execution and improved participation. With targeted interventions in Q4 scheduling, completion tracking, and directorate-specific planning, the organisation is well-positioned to exceed its 2026 training objectives.`;

function TypingText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useState(() => {
    if (idx >= text.length) {
      setDone(true);
      onDone?.();
      return;
    }
    const t = setTimeout(() => {
      setDisplayed((prev) => prev + text[idx]);
      setIdx((prev) => prev + 1);
    }, 8);
    return () => clearTimeout(t);
  }, [idx]);

  const paragraphs = displayed.split("\n\n");

  return (
    <div className="font-helvetica">
      {paragraphs.map((p, i) => {
        if (!p.trim()) return null;
        const isHeading = p.trim().length < 40 && !p.includes(".") && i !== 0;
        if (isHeading)
          return (
            <p key={i} className="text-sm font-medium text-gray-900 mt-5 mb-1">
              {p.trim()}
            </p>
          );
        if (/^\d+\./.test(p.trim())) {
          return (
            <div key={i} className="my-1">
              {p.split("\n").map((line, j) => (
                <p
                  key={j}
                  className="text-sm text-gray-600 leading-relaxed my-0.5"
                >
                  {line}
                </p>
              ))}
            </div>
          );
        }
        return (
          <p key={i} className="text-sm text-gray-600 leading-relaxed my-1.5">
            {p}
          </p>
        );
      })}
      {!done && (
        <>
          <span className="inline-block w-0.5 h-3.5 bg-blue-600 ml-0.5 align-middle animate-pulse" />
        </>
      )}
    </div>
  );
}

const TrainingAIReportTab = () => {
  const [dept, setDept] = useState("All departments");
  const [year, setYear] = useState("2025");
  const [focus, setFocus] = useState("");
  const [status, setStatus] = useState("idle");
  const [showReport, setShowReport] = useState(false);

  const handleGenerate = () => {
    setStatus("generating");
    setShowReport(false);
    setTimeout(() => setShowReport(true), 800);
  };

  const handleCopy = () => navigator.clipboard?.writeText(SAMPLE_REPORT);

  return (
    <div className="font-helvetica py-6 space-y-4">
      {/* Parameters card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-medium text-gray-900 mb-0.5">
          Report parameters
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Configure what the AI should analyse and generate a narrative report
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Department
            </label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Focus area <span className="text-gray-300">(optional)</span>
            </label>
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. budget efficiency, participation gaps"
              className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={status === "generating"}
            className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {status === "generating"
              ? "Generating..."
              : status === "done"
                ? "Regenerate report"
                : "Generate AI report"}
          </button>
          {status === "done" && (
            <>
              <button
                onClick={handleCopy}
                className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Copy text
              </button>
              <button className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Export PDF
              </button>
              <button className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Export Word
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report output */}
      {showReport && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {/* Report header */}
          <div className="flex items-start justify-between gap-3 flex-wrap pb-4 mb-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">
                AI-generated training report
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {dept} · {year} · Generated{" "}
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
              AI generated
            </span>
          </div>

          {/* Metric summary */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: "Courses run", val: "48" },
              { label: "Staff trained", val: "312" },
              { label: "Budget spent", val: "₦18.4M" },
              { label: "Avg. review", val: "4.2 / 5" },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                <p className="text-lg font-medium text-gray-900">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 text-amber-800 text-xs rounded-lg px-3.5 py-2.5 mb-5 leading-relaxed">
            This report was generated by AI based on training records in the
            system. Please review carefully before sharing or printing.
          </div>

          {/* Typing body */}
          <TypingText text={SAMPLE_REPORT} onDone={() => setStatus("done")} />
        </div>
      )}

      {/* Idle empty state */}
      {status === "idle" && (
        <div className="bg-white border border-gray-200 rounded-xl py-16 px-6 flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">
            No report generated yet
          </p>
          <p className="text-xs text-gray-400">
            Configure the parameters above and click Generate AI report to get
            started
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingAIReportTab;
