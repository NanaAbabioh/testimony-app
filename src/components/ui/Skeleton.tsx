interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export default function Skeleton({ 
  className = "", 
  height = "h-4", 
  width = "w-full" 
}: SkeletonProps) {
  return (
    <div 
      className={`
        ${height} ${width}
        bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
        dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
        animate-pulse rounded-[18px]
        ${className}
      `}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[18px] bg-[hsl(var(--bg-snow))] dark:bg-gray-800 shadow-[var(--shadow)] border border-black/5 dark:border-white/10 p-6 ${className}`}>
      <div className="space-y-3">
        <Skeleton height="h-3" width="w-24" />
        <Skeleton height="h-8" width="w-32" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-black/5 dark:border-white/10">
      <td className="py-3 px-3">
        <Skeleton height="h-4" width="w-4" className="rounded" />
      </td>
      <td className="py-3 px-3">
        <div className="space-y-2">
          <Skeleton height="h-4" width="w-48" />
          <Skeleton height="h-3" width="w-24" />
        </div>
      </td>
      <td className="py-3 px-3">
        <Skeleton height="h-6" width="w-20" className="rounded-full" />
      </td>
      <td className="py-3 px-3">
        <Skeleton height="h-4" width="w-32" />
      </td>
      <td className="py-3 px-3">
        <Skeleton height="h-8" width="w-8" className="rounded-[12px]" />
      </td>
    </tr>
  );
}