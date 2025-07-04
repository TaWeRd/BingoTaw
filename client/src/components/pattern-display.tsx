import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatternGrid } from '@/lib/bingo-utils';
import { cn } from '@/lib/utils';

interface PatternDisplayProps {
  pattern: PatternGrid;
  patternName: string;
  patternDescription: string;
  className?: string;
}

const COLUMN_HEADERS = ['B', 'I', 'N', 'G', 'O'];
const COLUMN_COLORS = [
  'bg-red-500', 
  'bg-yellow-500', 
  'bg-green-500', 
  'bg-blue-500', 
  'bg-purple-500'
];

export default function PatternDisplay({ 
  pattern, 
  patternName, 
  patternDescription, 
  className 
}: PatternDisplayProps) {
  return (
    <Card className={cn("bg-white/90 backdrop-blur-sm shadow-lg border-orange-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg font-bold text-gray-800">
          Patrón: {patternName}
        </CardTitle>
        <p className="text-center text-sm text-gray-600">
          {patternDescription}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="max-w-xs mx-auto">
          {/* BINGO Header */}
          <div className="grid grid-cols-5 gap-1 mb-2">
            {COLUMN_HEADERS.map((letter, colIndex) => (
              <div 
                key={letter}
                className={cn(
                  "h-8 flex items-center justify-center text-white font-bold text-sm rounded",
                  COLUMN_COLORS[colIndex]
                )}
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Pattern Grid */}
          <div className="grid grid-cols-5 gap-1">
            {pattern.map((row, rowIndex) =>
              row.map((isActive, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "h-8 flex items-center justify-center text-sm font-bold rounded border-2 transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-br from-orange-400 to-red-500 text-white border-orange-500 shadow-md animate-pulse" 
                      : "bg-gray-100 text-gray-400 border-gray-200",
                    rowIndex === 2 && colIndex === 2 && "bg-orange-300 border-orange-400" // Free space
                  )}
                >
                  {rowIndex === 2 && colIndex === 2 ? "★" : (isActive ? "●" : "")}
                </div>
              ))
            )}
          </div>

          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-red-500 rounded"></div>
                <span>Necesario para ganar</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}