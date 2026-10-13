import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Select, SelectItem, Card, CardBody, Button } from "@nextui-org/react";

const DEPT_LABELS = [
  "Finance",
  "Operations",
  "ICT",
  "HR",
  "Legal",
  "Admin",
  "Audit",
];
const PIE_COLORS = [
  "#185FA5",
  "#1D9E75",
  "#534AB7",
  "#D85A30",
  "#BA7517",
  "#888780",
  "#5DCAA5",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const mockData = {
  metrics: {
    courses: 48,
    staffTrained: 312,
    budgetSpent: "₦18.4M",
    avgReview: "4.2/5",
  },
  bar: {
    coursesRun: [9, 12, 7, 6, 5, 5, 4],
    staffTrained: [58, 74, 42, 38, 28, 44, 28],
  },
  pie: [32, 24, 18, 12, 7, 4, 3],
  line: {
    courses: [3, 4, 5, 4, 6, 5, 4, 3, 5, 4, 3, 2],
    attendance: [19, 24, 31, 26, 38, 34, 27, 21, 33, 28, 19, 12],
  },
};

function MetricCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: "var(--color-bg-secondary, #f5f5f4)",
        borderRadius: 8,
        padding: "1rem",
      }}
    >
      <div
        className="font-helvetica text-sm text-gray-500 mb-2"
        style={{ fontSize: 12, color: "#888", marginBottom: 4 }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 500 }} className="font-helvetica">
        {value}
      </div>
      {sub && (
        <div
          style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}
          className="font-helvetica"
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 10,
        fontSize: 12,
        color: "#888",
      }}
    >
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: item.color,
              flexShrink: 0,
            }}
            className="font-helvetica"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function BarChartCard({ data }) {
  const ref = useRef();
  const chartRef = useRef();
  useEffect(() => {
    if (!window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels: DEPT_LABELS,
        datasets: [
          {
            label: "Courses run",
            data: data.coursesRun,
            backgroundColor: "#185FA5",
            borderRadius: 3,
            barPercentage: 0.5,
          },
          {
            label: "Staff trained",
            data: data.staffTrained,
            backgroundColor: "#9FE1CB",
            borderRadius: 3,
            barPercentage: 0.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, autoSkip: false, maxRotation: 30 },
          },
          y: {
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 11 } },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid rgba(0,0,0,0.1)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        flex: "1.6 1 0",
        minWidth: 0,
      }}
    >
      <div
        style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}
        className="font-helvetica"
      >
        Courses per department
      </div>
      <div
        style={{ fontSize: 12, color: "#888", marginBottom: 12 }}
        className="font-helvetica"
      >
        Number of training courses run by each directorate
      </div>
      <Legend
        items={[
          { color: "#185FA5", label: "Courses run" },
          { color: "#9FE1CB", label: "Staff trained" },
        ]}
      />
      <div style={{ position: "relative", width: "100%", height: 220 }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}

function PieChartCard({ data }) {
  const ref = useRef();
  const chartRef = useRef();
  useEffect(() => {
    if (!window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: DEPT_LABELS,
        datasets: [
          { data, backgroundColor: PIE_COLORS, borderWidth: 0, hoverOffset: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed}%` } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid rgba(0,0,0,0.1)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        flex: "1 1 0",
        minWidth: 0,
      }}
    >
      <div
        style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}
        className="font-helvetica"
      >
        Budget spend by department
      </div>
      <div
        style={{ fontSize: 12, color: "#888", marginBottom: 8 }}
        className="font-helvetica"
      >
        Share of total training budget
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}
      >
        {DEPT_LABELS.map((l, i) => (
          <span
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "#888",
            }}
            className="font-helvetica"
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: PIE_COLORS[i],
                flexShrink: 0,
              }}
              className="font-helvetica"
            />
            {l} {data[i]}%
          </span>
        ))}
      </div>
      <div style={{ position: "relative", width: "100%", height: 200 }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}

function LineChartCard({ data }) {
  const ref = useRef();
  const chartRef = useRef();
  useEffect(() => {
    if (!window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "line",
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: "Courses completed",
            data: data.courses,
            borderColor: "#185FA5",
            backgroundColor: "rgba(24,95,165,0.06)",
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: "#185FA5",
            yAxisID: "y",
          },
          {
            label: "Staff attendance",
            data: data.attendance,
            borderColor: "#1D9E75",
            backgroundColor: "rgba(29,158,117,0.06)",
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: "#1D9E75",
            yAxisID: "y2",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, autoSkip: false },
          },
          y: {
            position: "left",
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 11 } },
            title: {
              display: true,
              text: "Courses",
              font: { size: 11 },
              color: "#185FA5",
            },
          },
          y2: {
            position: "right",
            grid: { display: false },
            ticks: { font: { size: 11 } },
            title: {
              display: true,
              text: "Staff",
              font: { size: 11 },
              color: "#1D9E75",
            },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid rgba(0,0,0,0.1)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      <div
        style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}
        className="font-helvetica"
      >
        Monthly training activity
      </div>
      <div
        style={{ fontSize: 12, color: "#888", marginBottom: 12 }}
        className="font-helvetica"
      >
        Courses completed and staff attendance trend across the year
      </div>
      <Legend
        items={[
          { color: "#185FA5", label: "Courses completed" },
          { color: "#1D9E75", label: "Staff attendance" },
        ]}
      />
      <div style={{ position: "relative", width: "100%", height: 200 }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}

const DEPARTMENT_OPTIONS = [
  "All departments",
  "Finance",
  "Operations",
  "ICT",
  "HR",
  "Legal",
  "Admin",
  "Audit",
];

const PERIOD_OPTIONS = ["Full year", "Q1", "Q2", "Q3", "Q4"];

function getYearOptions() {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => String(current - i));
}

export default function TrainingReportDashboard({
  currentYear: currentYearProp,
}) {
  const currentYear = currentYearProp ?? String(new Date().getFullYear());
  const [dept, setDept] = useState("All departments");
  const [period, setPeriod] = useState("Full year");
  const [year, setYear] = useState(currentYear);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (window.Chart) {
      setChartReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => setChartReady(true);
    document.head.appendChild(script);
  }, []);

  return (
    <div
      className="bg-white rounded-xl font-helvetica"
      style={{
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        color: "#1a1a1a",
      }}
    >
      {/* Filter section */}
      {/* <Card className="border border-default-200/80 shadow-sm mb-5">
        <CardBody className="p-4 sm:p-5">
          <p className="text-sm font-medium text-foreground/80 mb-3">Filters</p>
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Department"
              placeholder="Select department"
              selectedKeys={dept ? [dept] : []}
              onSelectionChange={(keys) => {
                const v = [...keys][0];
                setDept(v ?? "All departments");
              }}
              className="max-w-[220px]"
              size="md"
              variant="bordered"
              radius="md"
              classNames={{
                trigger: "border-default-200 data-[hover=true]:bg-default-100",
              }}
            >
              {DEPARTMENT_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Year"
              placeholder="Select year"
              selectedKeys={year ? [year] : []}
              onSelectionChange={(keys) => {
                const v = [...keys][0];
                setYear(v ?? currentYear);
              }}
              className="max-w-[140px]"
              size="md"
              variant="bordered"
              radius="md"
              classNames={{
                trigger: "border-default-200 data-[hover=true]:bg-default-100",
              }}
            >
              {getYearOptions().map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Period"
              placeholder="Select period"
              selectedKeys={period ? [period] : []}
              onSelectionChange={(keys) => {
                const v = [...keys][0];
                setPeriod(v ?? "Full year");
              }}
              className="max-w-[180px]"
              size="md"
              variant="bordered"
              radius="md"
              classNames={{
                trigger: "border-default-200 data-[hover=true]:bg-default-100",
              }}
            >
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </Select>
            <Button
              size="md"
              variant="bordered"
              radius="md"
              className="border-default-200 font-helvetica"
            >
              Export PDF
            </Button>
          </div>
        </CardBody>
      </Card> */}

      {/* Report title */}
      <p className="text-default-600 text-base mb-4 font-helvetica">
        Training graphical report -{" "}
        <span className="font-semibold text-foreground font-helvetica">
          {year}
        </span>
      </p>

      {/* Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0,1fr))",
          gap: 10,
          marginBottom: "1.25rem",
        }}
      >
        <MetricCard
          label="Total courses run"
          value={mockData.metrics.courses}
          sub="+6 from last year"
        />
        <MetricCard
          label="Staff trained"
          value={mockData.metrics.staffTrained}
          sub="across 9 departments"
        />
        <MetricCard
          label="Total budget spent"
          value={mockData.metrics.budgetSpent}
          sub="84% of annual allocation"
        />
        <MetricCard
          label="Avg. review score"
          value={mockData.metrics.avgReview}
          sub="from 289 reviews"
        />
      </div>

      {/* Bar + Pie row */}
      {chartReady && (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <BarChartCard data={mockData.bar} />
            <PieChartCard data={mockData.pie} />
          </div>
          {/* Line chart */}
          <LineChartCard data={mockData.line} />
        </>
      )}
    </div>
  );
}

TrainingReportDashboard.propTypes = {
  currentYear: PropTypes.string,
};
