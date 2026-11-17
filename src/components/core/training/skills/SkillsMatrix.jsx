import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Select } from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { MATRIX_LEVELS, getMatrixLevel } from "./skillsConstants";

const PINK = "#E1145A";
const BLUE_EMPLOYEES = "#1570B8";
const BLUE_SKILLS = "#2B88D4";
const BLUE_SKILL = "#7EB6E0";
const NAME_BG = "#E6EEF5";
const NAME_TEXT = "#5D6D7E";

const C = {
  red: "#F4285C",
  magenta: "#E045B0",
  orange: "#F5A31A",
  green: "#2DC36A",
  purple: "#6B2D91",
  fuchsia: "#C42B9B",
};

const SAMPLE_SKILLS = [
  { id: "management", name: "Management" },
  { id: "planning", name: "Planning" },
  { id: "recruiting", name: "Recruiting" },
  { id: "web", name: "Web development" },
  { id: "excel", name: "Excel\nAdvanced" },
  { id: "presentation", name: "Presentation\nSkills" },
  { id: "safety", name: "Safety\nTraining" },
];

const SAMPLE_STAFF = [
  {
    id: "james",
    name: "James",
    scores: [4, 4, 4, 4, 4, 4, 4],
    colors: [C.red, C.magenta, C.red, C.orange, C.red, C.green, C.green],
  },
  {
    id: "dan",
    name: "Dan",
    scores: [4, 4, 4, 4, 4, 4, 4],
    colors: [C.fuchsia, C.magenta, C.magenta, C.red, C.red, C.red, C.red],
  },
  {
    id: "joe",
    name: "Joe",
    scores: [3, 3, 3, 3, 3, 3, 3],
    colors: [C.purple, C.green, C.green, C.orange, C.orange, C.purple, C.green],
  },
  {
    id: "smith",
    name: "Smith",
    scores: [2, 2, 2, 2, 2, 2, 2],
    colors: [C.purple, C.green, C.green, C.green, C.green, C.orange, C.green],
  },
  {
    id: "juliana",
    name: "Juliana",
    scores: [8, 8, 8, 8, 8, 8, 8],
    colors: [C.purple, C.fuchsia, C.purple, C.green, C.green, C.green, C.green],
  },
];

const SAMPLE_TOTAL_COLORS = [C.orange, C.magenta, C.fuchsia, C.red, C.red, C.magenta, C.red];
const SAMPLE_AVG_COLORS = [C.orange, C.purple, C.orange, C.purple, C.orange, C.purple, C.purple];
const SAMPLE_AVG_DISPLAY = [3, 4, 3, 2, 3, 4, 4];

const cellBase = {
  border: "3px solid #fff",
  textAlign: "center",
  verticalAlign: "middle",
};

function legendColor(value) {
  const meta = getMatrixLevel(Math.min(5, Math.max(1, Number(value) || 0)));
  return meta?.color ?? NAME_BG;
}

function ScoreTd({ value, color, reduceMotion, as = "td" }) {
  const Tag = as;
  const bg = color || legendColor(value);
  return (
    <Tag
      style={{
        ...cellBase,
        backgroundColor: bg,
        color: "#fff",
        fontWeight: 600,
        fontSize: 15,
        padding: "12px 8px",
        transition: reduceMotion ? undefined : "background-color 0.35s ease",
      }}
    >
      {value ?? "–"}
    </Tag>
  );
}

ScoreTd.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
  reduceMotion: PropTypes.bool,
  as: PropTypes.string,
};

export default function SkillsMatrix() {
  const reduceMotion = useReducedMotion();
  const [skillIds, setSkillIds] = useState([]);
  const [staffIds, setStaffIds] = useState([]);

  const visibleSkills = useMemo(() => {
    if (!skillIds.length) return SAMPLE_SKILLS;
    const selected = new Set(skillIds.map(String));
    return SAMPLE_SKILLS.filter((skill) => selected.has(skill.id));
  }, [skillIds]);

  const visibleStaff = useMemo(() => {
    if (!staffIds.length) return SAMPLE_STAFF;
    const selected = new Set(staffIds.map(String));
    return SAMPLE_STAFF.filter((row) => selected.has(row.id));
  }, [staffIds]);

  const skillIndex = useMemo(
    () => new Map(SAMPLE_SKILLS.map((skill, index) => [skill.id, index])),
    [],
  );

  const stats = useMemo(
    () =>
      visibleSkills.map((skill) => {
        const index = skillIndex.get(skill.id);
        const values = visibleStaff.map((row) => Number(row.scores[index]) || 0);
        const total = values.reduce((sum, value) => sum + value, 0);
        const average = values.length ? total / values.length : 0;
        const unfiltered = !skillIds.length && !staffIds.length;
        const displayAvg = unfiltered
          ? SAMPLE_AVG_DISPLAY[index]
          : Number.isInteger(average)
            ? average
            : Number(average.toFixed(1));
        return {
          total,
          average,
          totalColor: unfiltered ? SAMPLE_TOTAL_COLORS[index] : legendColor(Math.round(average)),
          avgColor: unfiltered ? SAMPLE_AVG_COLORS[index] : legendColor(Math.round(displayAvg)),
          displayAvg,
        };
      }),
    [visibleSkills, visibleStaff, skillIndex, skillIds.length, staffIds.length],
  );

  const filtered = skillIds.length > 0 || staffIds.length > 0;
  const colSpan = Math.max(visibleSkills.length, 1);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">Matrix controls</h3>
            <p className="text-xs text-[#64748b]">
              Filter skills or staff. The grid updates live. Leave empty to show the full sample.
            </p>
          </div>
          {filtered && (
            <Button
              icon={<RotateCcw size={14} />}
              onClick={() => {
                setSkillIds([]);
                setStaffIds([]);
              }}
            >
              Reset view
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Skills
            </span>
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="All skills"
              value={skillIds}
              onChange={setSkillIds}
              options={SAMPLE_SKILLS.map((skill) => ({
                value: skill.id,
                label: skill.name.replace("\n", " "),
              }))}
              maxTagCount="responsive"
              virtual={false}
              size="large"
              className="w-full"
              getPopupContainer={() => document.body}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Staff
            </span>
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="All staff"
              value={staffIds}
              onChange={setStaffIds}
              options={SAMPLE_STAFF.map((row) => ({ value: row.id, label: row.name }))}
              maxTagCount="responsive"
              virtual={false}
              size="large"
              className="w-full"
              getPopupContainer={() => document.body}
            />
          </label>
        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-10 sm:py-10">
        <div className="mb-8">
          <div className="mb-3 h-[5px] w-[72px]" style={{ backgroundColor: PINK }} />
          <h2
            className="text-[40px] font-black italic leading-none tracking-tight sm:text-[48px]"
            style={{ fontFamily: '"Arial Black", Arial, Helvetica, sans-serif' }}
          >
            <span className="text-[#111827]">SKILLS </span>
            <span style={{ color: PINK }}>MATRIX</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <motion.table
            layout={!reduceMotion}
            className="w-full min-w-[720px] border-separate"
            style={{ borderSpacing: 0, tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: 160 }} />
              {visibleSkills.map((skill) => (
                <col key={skill.id} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    ...cellBase,
                    backgroundColor: BLUE_EMPLOYEES,
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    width: 160,
                  }}
                >
                  Employees
                </th>
                <th
                  colSpan={colSpan}
                  style={{
                    ...cellBase,
                    backgroundColor: BLUE_SKILLS,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 600,
                    padding: "10px 8px",
                  }}
                >
                  Skills
                </th>
              </tr>
              <tr>
                {visibleSkills.map((skill) => (
                  <th
                    key={skill.id}
                    style={{
                      ...cellBase,
                      backgroundColor: BLUE_SKILL,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.25,
                      padding: "10px 6px",
                      whiteSpace: "pre-line",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setSkillIds((prev) =>
                        prev.length === 1 && prev[0] === skill.id ? [] : [skill.id],
                      )
                    }
                  >
                    {skill.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visibleStaff.map((staff) => (
                  <motion.tr
                    key={staff.id}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <th
                      style={{
                        ...cellBase,
                        backgroundColor: NAME_BG,
                        color: NAME_TEXT,
                        fontWeight: 500,
                        fontSize: 14,
                        padding: "12px 10px",
                      }}
                    >
                      {staff.name}
                    </th>
                    {visibleSkills.map((skill) => {
                      const index = skillIndex.get(skill.id);
                      return (
                        <ScoreTd
                          key={`${staff.id}-${skill.id}`}
                          value={staff.scores[index]}
                          color={staff.colors[index]}
                          reduceMotion={reduceMotion}
                        />
                      );
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            <tfoot>
              <tr>
                <th
                  style={{
                    ...cellBase,
                    backgroundColor: NAME_BG,
                    color: NAME_TEXT,
                    fontWeight: 500,
                    fontSize: 14,
                    padding: "12px 10px",
                  }}
                >
                  Total
                </th>
                {visibleSkills.map((skill, index) => (
                  <ScoreTd
                    key={`total-${skill.id}`}
                    value={stats[index]?.total || "–"}
                    color={stats[index]?.totalColor}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </tr>
              <tr>
                <th
                  style={{
                    ...cellBase,
                    backgroundColor: NAME_BG,
                    color: NAME_TEXT,
                    fontWeight: 500,
                    fontSize: 14,
                    padding: "12px 10px",
                  }}
                >
                  Skills Average
                </th>
                {visibleSkills.map((skill, index) => (
                  <ScoreTd
                    key={`avg-${skill.id}`}
                    value={stats[index]?.average ? stats[index].displayAvg : "–"}
                    color={stats[index]?.avgColor}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </tr>
            </tfoot>
          </motion.table>
        </div>

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-start justify-between gap-x-6 gap-y-4 px-1">
          {MATRIX_LEVELS.map((item) => (
            <div key={item.level} className="flex items-center gap-3">
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[15px] font-bold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.level}
              </span>
              <span className="whitespace-pre-line text-[13px] leading-tight text-[#4B5563]">
                {item.name.replace(" ", "\n")}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
