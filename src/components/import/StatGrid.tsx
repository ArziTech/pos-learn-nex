import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ImportStatsGridProps {
  successCount: number;
  failedCount: number;
  totalCount: number;
}

interface StatItemProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  colorClass: string;
}

function StatItem({ icon, count, label, colorClass }: StatItemProps) {
  return (
    <div className="flex flex-col items-center space-y-1">
      {icon}
      <span className={`text-sm font-medium ${colorClass}`}>{count}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

export default function ImportStatsGrid({
  successCount,
  failedCount,
  totalCount,
}: ImportStatsGridProps) {
  const stats = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      count: successCount,
      label: "Berhasil",
      colorClass: "text-green-700",
    },
    {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      count: failedCount,
      label: "Gagal",
      colorClass: "text-red-700",
    },
    {
      icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
      count: totalCount,
      label: "Total",
      colorClass: "text-blue-700",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {stats.map((stat, index) => (
        <StatItem
          key={index}
          icon={stat.icon}
          count={stat.count}
          label={stat.label}
          colorClass={stat.colorClass}
        />
      ))}
    </div>
  );
}
