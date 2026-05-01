import api from "@/lib/axios";

export type ReportPeriod = "daily" | "weekly" | "monthly";
export type ReportFormat = "csv" | "xlsx" | "pdf";

export async function downloadReport(period: ReportPeriod, format: ReportFormat, startDate?: string, endDate?: string) {
  const response = await api.get("/reports/export", {
    params: {
      period,
      format,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ext = format;
  a.href = url;
  a.download = `${period}-report.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
