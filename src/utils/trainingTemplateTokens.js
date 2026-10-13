import ReactQuill from "react-quill";
import { numberToWord } from "./number-to-word";

const Quill = ReactQuill.Quill;
const Embed = Quill.import("blots/embed");

class MergeTokenBlot extends Embed {
  static create(value) {
    const node = super.create();
    node.setAttribute("data-token", value.token);
    node.setAttribute("data-label", value.label);
    node.setAttribute("contenteditable", "false");
    node.style.fontStyle = "italic";
    node.innerText = `{{${value.label}}}`;
    return node;
  }

  static value(node) {
    return {
      token: node.getAttribute("data-token"),
      label: node.getAttribute("data-label") || node.innerText,
    };
  }
}
MergeTokenBlot.blotName = "mergeToken";
MergeTokenBlot.tagName = "span";
MergeTokenBlot.className = "ql-merge-token";

Quill.register(MergeTokenBlot);

export const TRAINING_TEMPLATE_TOKENS = [
  { token: "LOCATION", label: "Location" },
  { token: "ORGANISER", label: "Organiser" },
  { token: "TRAINING_TITLE", label: "Training Title" },
  { token: "VENUE", label: "Venue" },
  { token: "DATE", label: "Date" },
  { token: "DURATION", label: "Duration" },
  { token: "TIME", label: "Time" },
  { token: "FINANCE_TABLE", label: "Finance Table" },
  { token: "TOTAL_COST", label: "Total Cost" },
  { token: "TOTAL_COST_IN_WORDS", label: "Total Cost in words" },
];

// Quill's Embed blot wraps every custom embed with invisible U+FEFF guard
// characters (for cursor placement next to the embed) that end up saved as
// part of the content HTML. The live editor re-parses saved HTML through its
// own blot-aware importer and discards them, but anywhere the raw saved HTML
// is rendered directly (View drawer, merged letters) they surface as a
// visible "?" glyph bracketing each token. Strip them before using stored
// content outside the editor.
const EMBED_GUARD_CHAR = "﻿";

export function stripEmbedGuards(html) {
  if (!html) return html;
  return html.split(EMBED_GUARD_CHAR).join("");
}

export function insertMergeToken(quillRef, token, label) {
  const editor = quillRef?.current?.getEditor?.();
  if (!editor) return;
  const range = editor.getSelection(true);
  const index = range ? range.index : editor.getLength();
  editor.insertEmbed(index, "mergeToken", { token, label }, "user");
  editor.setSelection(index + 1, 0);
}

// Tokens in this set are inserted as raw HTML markup (e.g. a table) rather
// than escaped plain text when merged.
const HTML_MERGE_TOKENS = new Set(["FINANCE_TABLE"]);

export function mergeTemplateContent(html, mergeData) {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(stripEmbedGuards(html), "text/html");
  doc.querySelectorAll("[data-token]").forEach((node) => {
    const token = node.getAttribute("data-token");

    const value = mergeData?.[token];

    if (HTML_MERGE_TOKENS.has(token)) {
      const fragment = parser.parseFromString(
        value || "",
        "text/html",
      ).body;
      node.replaceWith(...fragment.childNodes);
      return;
    }

    const fallback = node.getAttribute("data-label") ?? node.innerText ?? "";
    node.replaceWith(document.createTextNode(value ?? fallback));
  });
  return doc.body.innerHTML;
}

const FINANCE_TABLE_FIELDS = [
  "TRAINING_COST",
  "AIR_TRANSPORT",
  "TRANSPORT",
  "DTA",
  "LOCAL",
];

function toAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatAmount(value) {
  return toAmount(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function computeFinanceGrandTotal(staffList) {
  const rows = Array.isArray(staffList) ? staffList : [];
  return rows.reduce(
    (sum, staff) =>
      sum +
      FINANCE_TABLE_FIELDS.reduce(
        (rowSum, field) => rowSum + toAmount(staff?.[field]),
        0,
      ),
    0,
  );
}

export function formatFinanceAmount(value) {
  return `₦${formatAmount(value)}`;
}

export function financeAmountToWords(value) {
  const result = numberToWord(Math.round(toAmount(value)));
  if (!result || typeof result !== "object" || !result.naira) return "";
  return result.kobo
    ? `${result.naira} Naira, ${result.kobo} Kobo Only`
    : `${result.naira} Naira Only`;
}

const FINANCE_TD_STYLE =
  "border:1px solid;padding:4px;font-size:8px;line-height:1.2em;vertical-align:top;";

/**
 * Replicates the per-staff cost breakdown from TrainingFinanceDrawer.jsx
 * (Full Name, Grade, Staff Number, Department, From, Course Fee, Flight,
 * Airport Taxi, DTA, Local Run, Total + Grand Total) as a plain HTML table,
 * for insertion into a merged letter via the FINANCE_TABLE token.
 */
export function buildFinanceTableHtml(staffList) {
  const rows = Array.isArray(staffList) ? staffList : [];

  const sortedRows = [...rows].sort(
    (a, b) => toAmount(b?.GRADE) - toAmount(a?.GRADE),
  );

  const bodyRows = sortedRows
    .map((staff, index) => {
      const fullName =
        [staff?.LAST_NAME, staff?.FIRST_NAME]
          .map((name) => name?.trim())
          .filter(Boolean)
          .join(" ") || "—";
      const total = FINANCE_TABLE_FIELDS.reduce(
        (sum, field) => sum + toAmount(staff?.[field]),
        0,
      );

      return `<tr>
        <td style="${FINANCE_TD_STYLE}">${index + 1}</td>
        <td style="${FINANCE_TD_STYLE}text-transform:capitalize;"><span>${fullName}</span></td>
        <td style="${FINANCE_TD_STYLE}">${staff?.GRADE ?? "—"}</td>
        <td style="${FINANCE_TD_STYLE}">${staff?.STAFF_NUMBER ?? "—"}</td>
        <td style="${FINANCE_TD_STYLE}">${staff?.DEPARTMENT_NAME ?? "—"}</td>
        <td style="${FINANCE_TD_STYLE}text-transform:capitalize;">${staff?.START_FROM ?? staff?.FROM ?? "—"}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(staff?.TRAINING_COST)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(staff?.AIR_TRANSPORT)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(staff?.AIR_TAXI)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(staff?.TRANSPORT)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(staff?.DTA)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(staff?.LOCAL)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;font-weight:600;">${formatAmount(total)}</td>
      </tr>`;
    })
    .join("");

  const grandTotals = FINANCE_TABLE_FIELDS.reduce(
    (totals, field) => {
      totals[field] = rows.reduce(
        (sum, staff) => sum + toAmount(staff?.[field]),
        0,
      );
      return totals;
    },
    { grand: 0 },
  );
  grandTotals.grand = computeFinanceGrandTotal(rows);

  const headerCells = [
    "S/N",
    "Full Name",
    "Grade",
    "Staff Number",
    "Department",
    "From",
    "Course Fee",
    "Flight",
    "Airport Taxi",
    "Local Taxi",
    "DTA",
    "Local Run",
    "Total",
  ]
    .map(
      (label) =>
        `<th style="${FINANCE_TD_STYLE}text-align:left;">${label}</th>`,
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:8px 0;">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
      <tr style="font-weight:600;">
        <td style="${FINANCE_TD_STYLE}" colspan="6">Grand Total</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(grandTotals.TRAINING_COST)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(grandTotals.AIR_TRANSPORT)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(grandTotals.AIR_TAXI)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(grandTotals.TRANSPORT)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(grandTotals.DTA)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(grandTotals.LOCAL)}</td>
        <td style="${FINANCE_TD_STYLE}text-align:right;">${formatAmount(grandTotals.grand)}</td>
      </tr>
    </tfoot>
  </table>`;
}
