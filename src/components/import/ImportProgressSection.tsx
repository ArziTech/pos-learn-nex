import ImportProgressDisplay from "./ImportProgressDialog";
import ImportStatsGrid from "./StatGrid";

interface ImportProgressSectionProps {
  currentStudent: string;
  progress: number;
  importResults: {
    success: number;
    failed: number;
    total: number;
    errors: Array<{ student: string; error: string }>;
  };
}

export default function ImportProgressSection({
  currentStudent,
  progress,
  importResults,
}: ImportProgressSectionProps) {
  return (
    <div className="space-y-4">
      <ImportProgressDisplay
        currentStudent={currentStudent}
        progress={progress}
        successCount={importResults.success}
        failedCount={importResults.failed}
        totalCount={importResults.total}
      />

      <ImportStatsGrid
        successCount={importResults.success}
        failedCount={importResults.failed}
        totalCount={importResults.total}
      />
    </div>
  );
}
