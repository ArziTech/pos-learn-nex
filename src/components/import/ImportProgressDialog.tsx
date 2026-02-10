import { Progress } from "@/components/ui/progress";

interface ImportProgressDisplayProps {
  currentStudent: string;
  progress: number;
  successCount: number;
  failedCount: number;
  totalCount: number;
}

export default function ImportProgressDisplay({
  currentStudent,
  progress,
  successCount,
  failedCount,
  totalCount,
}: ImportProgressDisplayProps) {
  const processedCount = successCount + failedCount;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Mengimport Data Siswa...</h3>
        <p className="text-sm text-gray-600 mt-1">
          Sedang memproses: {currentStudent}
        </p>
      </div>

      <Progress value={progress} className="w-full" />

      <div className="flex justify-between text-sm text-gray-600">
        <span>{Math.round(progress)}% selesai</span>
        <span>
          {processedCount} / {totalCount}
        </span>
      </div>
    </div>
  );
}
