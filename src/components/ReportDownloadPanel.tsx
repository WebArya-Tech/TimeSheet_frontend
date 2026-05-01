import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { downloadReport, type ReportFormat, type ReportPeriod } from "@/lib/reportDownloads";

const periods: ReportPeriod[] = ["daily", "weekly", "monthly"];
const formats: ReportFormat[] = ["csv", "xlsx", "pdf"];

export default function ReportDownloadPanel({ title = "Download Reports" }: { title?: string }) {
  const { toast } = useToast();

  const onDownload = async (period: ReportPeriod, format: ReportFormat) => {
    try {
      await downloadReport(period, format);
      toast({ title: `${period} ${format.toUpperCase()} downloaded` });
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {periods.map((p) => (
          <div key={p} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-2">
            <span className="text-sm font-semibold capitalize">{p}</span>
            <div className="flex gap-2">
              {formats.map((f) => (
                <Button key={f} size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => onDownload(p, f)}>
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
