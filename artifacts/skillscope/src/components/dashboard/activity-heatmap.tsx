import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HeatmapDay } from "@workspace/api-client-react";

export default function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  // A simple Github-style heatmap. 
  // We'll organize days into columns (weeks).
  
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[160px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">No activity data available</p>
        <p className="text-xs text-muted-foreground mt-1">Connect GitHub to see your contribution heatmap.</p>
      </div>
    );
  }

  // Ensure we have complete weeks if we want a perfect grid, 
  // but for simplicity we just render them wrapping.
  // GitHub renders top-to-bottom, left-to-right.
  // We'll use CSS grid with columns.

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted';
      case 1: return 'bg-emerald-200 dark:bg-emerald-950';
      case 2: return 'bg-emerald-400 dark:bg-emerald-800';
      case 3: return 'bg-emerald-600 dark:bg-emerald-600';
      case 4: return 'bg-emerald-800 dark:bg-emerald-400';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[700px] flex gap-1">
        {/* We assume data is sorted historically. Group by weeks. */}
        {/* Since data might just be 365 days, we chunk it into 7s for columns */}
        {Array.from({ length: Math.ceil(data.length / 7) }).map((_, colIndex) => {
          const weekData = data.slice(colIndex * 7, (colIndex + 1) * 7);
          return (
            <div key={colIndex} className="grid grid-rows-7 gap-1 flex-1">
              {weekData.map((day, rowIndex) => (
                <Tooltip key={`${colIndex}-${rowIndex}`}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} transition-all hover:ring-1 hover:ring-ring hover:ring-offset-1`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      <span className="font-semibold">{day.count} contributions</span> on {new Date(day.date).toLocaleDateString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className={`w-3 h-3 rounded-sm ${getLevelColor(0)}`} />
        <div className={`w-3 h-3 rounded-sm ${getLevelColor(1)}`} />
        <div className={`w-3 h-3 rounded-sm ${getLevelColor(2)}`} />
        <div className={`w-3 h-3 rounded-sm ${getLevelColor(3)}`} />
        <div className={`w-3 h-3 rounded-sm ${getLevelColor(4)}`} />
        <span>More</span>
      </div>
    </div>
  );
}
