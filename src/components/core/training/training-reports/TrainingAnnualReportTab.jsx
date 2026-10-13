import { useState } from "react";

const YEARS = ["2025", "2024", "2023"];
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

const ANNUAL_DATA = {
  2025: {
    metrics: {
      courses: 48,
      staffTrained: 312,
      budgetSpent: "₦18.4M",
      budgetAlloc: "₦21.9M",
      avgReview: "4.2/5",
      utilisation: "84%",
    },
    prev: { courses: 42, staffTrained: 274, budgetSpent: "₦16.1M" },
    quarters: [
      { q: "Q1", courses: 14, staff: 89, spend: "₦5.2M", review: "4.3" },
      { q: "Q2", courses: 13, staff: 84, spend: "₦4.9M", review: "4.1" },
      { q: "Q3", courses: 12, staff: 91, spend: "₦5.1M", review: "4.4" },
      { q: "Q4", courses: 9, staff: 48, spend: "₦3.2M", review: "3.9" },
    ],
    depts: [
      { dept: "Finance", courses: 9, staff: 68, spend: "₦5.9M", pct: 32 },
      { dept: "Operations", courses: 12, staff: 74, spend: "₦4.4M", pct: 24 },
      { dept: "ICT", courses: 7, staff: 52, spend: "₦3.3M", pct: 18 },
      { dept: "HR", courses: 6, staff: 38, spend: "₦2.2M", pct: 12 },
      { dept: "Legal", courses: 5, staff: 28, spend: "₦1.3M", pct: 7 },
      { dept: "Admin", courses: 5, staff: 24, spend: "₦0.7M", pct: 4 },
      { dept: "Audit", courses: 4, staff: 28, spend: "₦0.6M", pct: 3 },
    ],
    topCourses: [
      { name: "Cybersecurity Awareness Training", dept: "ICT", staff: 42 },
      {
        name: "Project Management Fundamentals",
        dept: "Operations",
        staff: 35,
      },
      { name: "Strategic Planning & Execution", dept: "Operations", staff: 30 },
      { name: "Financial Reporting & IFRS Update", dept: "Finance", staff: 28 },
      { name: "Data Analysis with Excel", dept: "ICT", staff: 30 },
    ],
    highlights: [
      {
        type: "success",
        text: "Staff trained increased by 14% year-on-year (274 → 312)",
      },
      {
        type: "success",
        text: "Q3 recorded the highest review score of the year at 4.4/5",
      },
      {
        type: "warning",
        text: "Q4 activity dropped significantly — only 9 courses vs 14 in Q1",
      },
      {
        type: "warning",
        text: "Audit directorate recorded a 12% decline in training participation",
      },
      {
        type: "info",
        text: "16% budget underspend (₦3.5M) — reallocatable to 2026 planning",
      },
    ],
  },
  2024: {
    metrics: {
      courses: 42,
      staffTrained: 274,
      budgetSpent: "₦16.1M",
      budgetAlloc: "₦19.5M",
      avgReview: "4.0/5",
      utilisation: "83%",
    },
    prev: { courses: 38, staffTrained: 251, budgetSpent: "₦14.3M" },
    quarters: [
      { q: "Q1", courses: 11, staff: 72, spend: "₦4.2M", review: "4.0" },
      { q: "Q2", courses: 12, staff: 78, spend: "₦4.5M", review: "4.1" },
      { q: "Q3", courses: 11, staff: 80, spend: "₦4.6M", review: "4.2" },
      { q: "Q4", courses: 8, staff: 44, spend: "₦2.8M", review: "3.7" },
    ],
    depts: [
      { dept: "Finance", courses: 8, staff: 60, spend: "₦5.2M", pct: 30 },
      { dept: "Operations", courses: 11, staff: 68, spend: "₦4.0M", pct: 25 },
      { dept: "ICT", courses: 6, staff: 46, spend: "₦2.9M", pct: 17 },
      { dept: "HR", courses: 6, staff: 34, spend: "₦2.0M", pct: 13 },
      { dept: "Legal", courses: 4, staff: 24, spend: "₦1.2M", pct: 8 },
      { dept: "Admin", courses: 4, staff: 22, spend: "₦0.5M", pct: 5 },
      { dept: "Audit", courses: 3, staff: 20, spend: "₦0.3M", pct: 2 },
    ],
    topCourses: [
      {
        name: "Project Management Fundamentals",
        dept: "Operations",
        staff: 38,
      },
      { name: "Financial Reporting & IFRS Update", dept: "Finance", staff: 32 },
      { name: "Data Analysis with Excel", dept: "ICT", staff: 28 },
      { name: "Leadership Development Programme", dept: "HR", staff: 22 },
      { name: "Risk Management & Compliance", dept: "Audit", staff: 18 },
    ],
    highlights: [
      {
        type: "success",
        text: "Staff trained increased by 9% year-on-year (251 → 274)",
      },
      {
        type: "success",
        text: "Q3 was the strongest quarter with 4.2/5 review score",
      },
      {
        type: "warning",
        text: "Q4 consistently underperforms — pattern observed for second year",
      },
      {
        type: "info",
        text: "17% budget underspend — suggests need for better Q4 planning",
      },
    ],
  },
};

const HIGHLIGHT_STYLES = {
  success: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

const YoYBadge = ({ current, prev }) => {
  const curr = parseFloat(String(current).replace(/[^0-9.]/g, ""));
  const p = parseFloat(String(prev).replace(/[^0-9.]/g, ""));
  if (!p) return null;
  const diff = curr - p;
  const pct = Math.round((diff / p) * 100);
  const up = diff >= 0;
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ml-1.5 ${up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
};

const TrainingAnnualReportTab = () => {
  const [year, setYear] = useState("2025");
  const [dept, setDept] = useState("All departments");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const data = ANNUAL_DATA[year] || ANNUAL_DATA["2025"];
  const { metrics, prev, quarters, depts, topCourses, highlights } = data;
  const maxStaff = Math.max(...depts.map((d) => d.staff));

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 700);
  };

  return (
    <div className="font-helvetica py-6 space-y-4">
      {/* Parameters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-medium text-gray-900 mb-0.5">
          Report parameters
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Select a year to generate the full annual training report with
          year-on-year comparisons
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4">
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Generating..."
              : generated
                ? "Regenerate"
                : "Generate annual report"}
          </button>
          {generated && (
            <>
              <button className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Export PDF
              </button>
              <button className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Export Word
              </button>
              <button className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Export Excel
              </button>
              <button className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Print
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report */}
      {generated && (
        <div className="space-y-4">
          {/* Title bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap pb-4 mb-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Annual training report — {year}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {dept} · Generated{" "}
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                Final
              </span>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Total courses</p>
                <div className="flex items-baseline">
                  <p className="text-lg font-medium text-gray-900">
                    {metrics.courses}
                  </p>
                  <YoYBadge current={metrics.courses} prev={prev.courses} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Prior year: {prev.courses}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Staff trained</p>
                <div className="flex items-baseline">
                  <p className="text-lg font-medium text-gray-900">
                    {metrics.staffTrained}
                  </p>
                  <YoYBadge
                    current={metrics.staffTrained}
                    prev={prev.staffTrained}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Prior year: {prev.staffTrained}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Budget spent</p>
                <div className="flex items-baseline">
                  <p className="text-lg font-medium text-gray-900">
                    {metrics.budgetSpent}
                  </p>
                  <YoYBadge
                    current={metrics.budgetSpent}
                    prev={prev.budgetSpent}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Allocated: {metrics.budgetAlloc} · {metrics.utilisation} used
                </p>
              </div>
            </div>

            {/* Avg review standalone */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg w-fit">
              <span className="text-xs text-blue-600">
                Average review score
              </span>
              <span className="text-sm font-medium text-blue-700">
                {metrics.avgReview}
              </span>
            </div>
          </div>

          {/* Quarterly breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Quarterly breakdown
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Activity summary across all four quarters of {year}
            </p>
            <div className="overflow-x-auto">
              <table
                className="w-full text-xs"
                style={{ tableLayout: "fixed" }}
              >
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Quarter",
                      "Courses",
                      "Staff trained",
                      "Budget spend",
                      "Avg. review",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left text-gray-400 font-medium pb-2 pr-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quarters.map((q, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2.5 pr-3 font-medium text-gray-800">
                        {q.q}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-700">{q.courses}</td>
                      <td className="py-2.5 pr-3 text-gray-700">{q.staff}</td>
                      <td className="py-2.5 pr-3 text-gray-700">{q.spend}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${parseFloat(q.review) >= 4.2 ? "bg-green-50 text-green-700" : parseFloat(q.review) >= 4.0 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {q.review}/5
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-900 rounded-bl-lg">
                      Total
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-gray-900">
                      {quarters.reduce((s, q) => s + q.courses, 0)}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-gray-900">
                      {quarters.reduce((s, q) => s + q.staff, 0)}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-gray-900">
                      {metrics.budgetSpent}
                    </td>
                    <td className="py-2.5 font-medium text-gray-900 rounded-br-lg">
                      {metrics.avgReview}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Dept breakdown + Top courses side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Department performance
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Staff trained and spend per directorate
              </p>
              <div className="space-y-2.5">
                {depts.map((d, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700">{d.dept}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {d.staff} staff
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{d.spend}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.round((d.staff / maxStaff) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Top 5 courses by attendance
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Most attended training programmes this year
              </p>
              <div className="space-y-3">
                {topCourses.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs font-medium text-gray-400 mt-0.5 w-4 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 leading-snug">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-400">{c.dept}</p>
                    </div>
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                      {c.staff}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Highlights & recommendations */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Key highlights & flags
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Auto-detected findings from {year} training data
            </p>
            <div className="space-y-2">
              {highlights.map((h, i) => {
                const s = HIGHLIGHT_STYLES[h.type];
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg ${s.bg}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${s.dot}`}
                    />
                    <p className={`text-xs leading-relaxed ${s.text}`}>
                      {h.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Idle */}
      {!generated && !loading && (
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">
            No report generated yet
          </p>
          <p className="text-xs text-gray-400">
            Select a year above and click Generate annual report to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingAnnualReportTab;
