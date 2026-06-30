/* ------------------------------------------------------------------ */
/* Client-side export helpers — no dependencies.                       */
/*  • exportExcel: builds an HTML table workbook that Excel opens       */
/*    natively as .xls (preserves multiple sheets/sections + headers).  */
/*  • exportCsv: plain comma-separated values.                          */
/* ------------------------------------------------------------------ */

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function csvCell(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * sections: [{ title, columns: string[], rows: (string|number)[][] }]
 */
export function exportExcel(sections, filename = "dashboard-report.xls") {
  const blocks = sections
    .map((sec) => {
      const head = `<tr>${sec.columns
        .map(
          (c) =>
            `<th style="background:#18181b;color:#fff;text-align:left;padding:6px 10px;border:1px solid #d4d4d8;">${esc(
              c,
            )}</th>`,
        )
        .join("")}</tr>`;
      const body = sec.rows
        .map(
          (r) =>
            `<tr>${r
              .map(
                (c) =>
                  `<td style="padding:6px 10px;border:1px solid #e4e4e7;">${esc(
                    c,
                  )}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("");
      return `<h3 style="font-family:Arial;margin:14px 0 6px;">${esc(
        sec.title,
      )}</h3><table style="border-collapse:collapse;font-family:Arial;font-size:13px;">${head}${body}</table>`;
    })
    .join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body>${blocks}</body></html>`;
  download(
    new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }),
    filename,
  );
}

/**
 * columns: string[], rows: (string|number)[][]
 */
export function exportCsv(columns, rows, filename = "dashboard-report.csv") {
  const lines = [columns.map(csvCell).join(",")];
  for (const r of rows) lines.push(r.map(csvCell).join(","));
  download(
    new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    filename,
  );
}
