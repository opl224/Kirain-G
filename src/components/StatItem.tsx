
import { cn } from '@/lib/utils';

export function StatItem({ label, value, isDisabled = false }: { label: string; value: number | string, isDisabled?: boolean }) {
  return (
    <div className={cn("text-center", isDisabled && "cursor-not-allowed opacity-50")}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
