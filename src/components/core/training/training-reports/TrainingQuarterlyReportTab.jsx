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
const QUARTERS = [
  "Q1 (Jan – Mar)",
  "Q2 (Apr – Jun)",
  "Q3 (Jul – Sep)",
  "Q4 (Oct – Dec)",
];

const QUARTER_DATA = {
  "Q1 (Jan – Mar)": {
    courses: 14,
    staffTrained: 89,
    budgetSpent: "₦5.2M",
    avgReview: "4.3/5",
    courseList: [
      {
        name: "Financial Reporting & IFRS Update",
        dept: "Finance",
        staff: 18,
        cost: "₦980,000",
        status: "Completed",
      },
      {
        name: "Cybersecurity Awareness Training",
        dept: "ICT",
        staff: 42,
        cost: "₦1,200,000",
        status: "Completed",
      },
      {
        name: "Records Management & Filing",
        dept: "Admin",
        staff: 12,
        cost: "₦450,000",
        status: "Completed",
      },
      {
        name: "Leadership Development Programme",
        dept: "HR",
        staff: 10,
        cost: "₦1,500,000",
        status: "Completed",
      },
      {
        name: "Procurement & Supply Chain Basics",
        dept: "Operations",
        staff: 7,
        cost: "₦620,000",
        status: "Completed",
      },
    ],
    deptBreakdown: [
      { dept: "Finance", courses: 3, staff: 28, spend: "₦1.6M" },
      { dept: "Operations", courses: 4, staff: 31, spend: "₦1.4M" },
      { dept: "ICT", courses: 3, staff: 18, spend: "₦1.2M" },
      { dept: "HR", courses: 2, staff: 8, spend: "₦0.6M" },
      { dept: "Admin", courses: 2, staff: 4, spend: "₦0.4M" },
    ],
  },
  "Q2 (Apr – Jun)": {
    courses: 13,
    staffTrained: 84,
    budgetSpent: "₦4.9M",
    avgReview: "4.1/5",
    courseList: [
      {
        name: "Tax Compliance & Planning",
        dept: "Finance",
        staff: 15,
        cost: "₦870,000",
        status: "Completed",
      },
      {
        name: "Project Management Fundamentals",
        dept: "Operations",
        staff: 22,
        cost: "₦1,100,000",
        status: "Completed",
      },
      {
        name: "Data Analysis with Excel",
        dept: "ICT",
        staff: 30,
        cost: "₦750,000",
        status: "Completed",
      },
      {
        name: "Performance Management Workshop",
        dept: "HR",
        staff: 9,
        cost: "₦980,000",
        status: "Completed",
      },
      {
        name: "Internal Audit Techniques",
        dept: "Audit",
        staff: 8,
        cost: "₦600,000",
        status: "Completed",
      },
    ],
    deptBreakdown: [
      { dept: "Finance", courses: 3, staff: 22, spend: "₦1.5M" },
      { dept: "Operations", courses: 4, staff: 28, spend: "₦1.3M" },
      { dept: "ICT", courses: 2, staff: 20, spend: "₦0.9M" },
      { dept: "HR", courses: 2, staff: 8, spend: "₦0.7M" },
      { dept: "Audit", courses: 2, staff: 6, spend: "₦0.5M" },
    ],
  },
  "Q3 (Jul – Sep)": {
    courses: 12,
    staffTrained: 91,
    budgetSpent: "₦5.1M",
    avgReview: "4.4/5",
    courseList: [
      {
        name: "Strategic Planning & Execution",
        dept: "Operations",
        staff: 25,
        cost: "₦1,300,000",
        status: "Completed",
      },
      {
        name: "HR Policy & Labour Law Update",
        dept: "HR",
        staff: 14,
        cost: "₦820,000",
        status: "Completed",
      },
      {
        name: "Network Administration Basics",
        dept: "ICT",
        staff: 18,
        cost: "₦950,000",
        status: "Completed",
      },
      {
        name: "Risk Management & Compliance",
        dept: "Audit",
        staff: 12,
        cost: "₦780,000",
        status: "Completed",
      },
      {
        name: "Customer Service Excellence",
        dept: "Admin",
        staff: 22,
        cost: "₦560,000",
        status: "Completed",
      },
    ],
    deptBreakdown: [
      { dept: "Operations", courses: 3, staff: 30, spend: "₦1.5M" },
      { dept: "Finance", courses: 3, staff: 24, spend: "₦1.2M" },
      { dept: "ICT", courses: 2, staff: 18, spend: "₦1.0M" },
      { dept: "HR", courses: 2, staff: 12, spend: "₦0.8M" },
      { dept: "Audit", courses: 2, staff: 7, spend: "₦0.6M" },
    ],
  },
  "Q4 (Oct – Dec)": {
    courses: 9,
    staffTrained: 48,
    budgetSpent: "₦3.2M",
    avgReview: "3.9/5",
    courseList: [
      {
        name: "Year-End Financial Procedures",
        dept: "Finance",
        staff: 16,
        cost: "₦720,000",
        status: "Completed",
      },
      {
        name: "Digital Literacy Refresher",
        dept: "ICT",
        staff: 14,
        cost: "₦480,000",
        status: "Completed",
      },
      {
        name: "Workplace Health & Safety",
        dept: "Admin",
        staff: 10,
        cost: "₦390,000",
        status: "Completed",
      },
      {
        name: "Budget Preparation Workshop",
        dept: "Finance",
        staff: 8,
        cost: "₦650,000",
        status: "Completed",
      },
    ],
    deptBreakdown: [
      { dept: "Finance", courses: 3, staff: 18, spend: "₦1.1M" },
      { dept: "ICT", courses: 2, staff: 12, spend: "₦0.8M" },
      { dept: "Operations", courses: 2, staff: 10, spend: "₦0.7M" },
      { dept: "Admin", courses: 1, staff: 5, spend: "₦0.4M" },
      { dept: "HR", courses: 1, staff: 3, spend: "₦0.2M" },
    ],
  },
};

const STATUS_COLORS = {
  Completed: "bg-green-50 text-green-700",
  Ongoing: "bg-blue-50 text-blue-700",
  Cancelled: "bg-red-50 text-red-700",
};

const TrainingQuarterlyReportTab = () => {
  const [dept, setDept] = useState("All departments");
  const [year, setYear] = useState("2025");
  const [quarter, setQuarter] = useState("Q1 (Jan – Mar)");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const data = QUARTER_DATA[quarter];

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
          Select a quarter to generate the training activity report for that
          period
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Quarter</label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {QUARTERS.map((q) => (
                <option key={q}>{q}</option>
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
                : "Generate quarterly report"}
          </button>
          {generated && (
            <>
              <button className="text-sm px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Export PDF
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

      {/* Report output */}
      {generated && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap pb-4 mb-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Quarterly training report — {quarter} {year}
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

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Courses delivered", val: data.courses },
                { label: "Staff trained", val: data.staffTrained },
                { label: "Budget spent", val: data.budgetSpent },
                { label: "Avg. review score", val: data.avgReview },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                  <p className="text-lg font-medium text-gray-900">{m.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Courses table */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Courses delivered this quarter
            </p>
            <p className="text-xs text-gray-400 mb-4">
              All training courses completed within {quarter} {year}
            </p>
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                style={{ tableLayout: "fixed" }}
              >
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-3 w-2/5">
                      Course name
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-3 w-1/5">
                      Department
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-3 w-1/10">
                      Staff
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-3 w-1/5">
                      Cost
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 w-1/10">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.courseList.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2.5 pr-3 text-gray-800 text-xs">
                        {c.name}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs">
                        {c.dept}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-800 text-xs">
                        {c.staff}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-800 text-xs">
                        {c.cost}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dept breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Department breakdown
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Training activity and spend per directorate for {quarter}
            </p>
            <div className="space-y-2">
              {data.deptBreakdown.map((d, i) => {
                const maxStaff = Math.max(
                  ...data.deptBreakdown.map((x) => x.staff),
                );
                const pct = Math.round((d.staff / maxStaff) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 shrink-0">
                      {d.dept}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-800 w-8 text-right shrink-0">
                      {d.staff}
                    </span>
                    <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                      {d.spend}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Bar = staff trained</span>
              <span className="text-xs text-gray-400">
                Right value = budget spend
              </span>
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">
            No report generated yet
          </p>
          <p className="text-xs text-gray-400">
            Select a quarter and year above, then click Generate quarterly
            report
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingQuarterlyReportTab;
