import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BingoCard as BingoCardType } from '@/lib/bingo-utils';
import { cn } from '@/lib/utils';

interface BingoCardProps {
  card: BingoCardType;
  markedNumbers?: string[];
  onNumberClick?: (number: string) => void;
  isReadonly?: boolean;
  className?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  cardIndex?: number;
}

const COLUMN_HEADERS = ['B', 'I', 'N', 'G', 'O'];
const COLUMN_COLORS = [
  'bg-red-500', 
  'bg-yellow-500', 
  'bg-green-500', 
  'bg-blue-500', 
  'bg-purple-500'
];

export default function BingoCardNew({ 
  card, 
  markedNumbers = [], 
  onNumberClick, 
  isReadonly = false, 
  className,
  isSelectionMode = false,
  isSelected = false,
  cardIndex
}: BingoCardProps) {
  const [playerMarked, setPlayerMarked] = useState<Set<string>>(new Set());

  const handleNumberClick = (number: number, row: number, col: number) => {
    if (isReadonly || isSelectionMode || (row === 2 && col === 2)) return;
    
    const bingoNumber = `${COLUMN_HEADERS[col]}-${number}`;
    
    // Solo permitir marcar números que han sido cantados
    if (!markedNumbers.includes(bingoNumber)) return;
    
    const newMarked = new Set(playerMarked);
    if (newMarked.has(bingoNumber)) {
      newMarked.delete(bingoNumber);
    } else {
      newMarked.add(bingoNumber);
    }
    setPlayerMarked(newMarked);
    onNumberClick?.(bingoNumber);
  };

  const isNumberPlayerMarked = (number: number, col: number) => {
    const bingoNumber = `${COLUMN_HEADERS[col]}-${number}`;
    return playerMarked.has(bingoNumber);
  };

  const isNumberCalled = (number: number, col: number) => {
    const bingoNumber = `${COLUMN_HEADERS[col]}-${number}`;
    return markedNumbers.includes(bingoNumber);
  };

  return (
    <Card className={cn(
      "transition-all duration-300 border-4 shadow-xl rounded-xl overflow-hidden",
      isSelectionMode 
        ? isSelected 
          ? "border-orange-500 ring-4 ring-orange-200 bg-white scale-105 shadow-2xl" 
          : "border-orange-300 hover:border-orange-400 bg-white/95 hover:scale-102 cursor-pointer"
        : "bg-white border-orange-300",
      className
    )}>
      <CardContent className="p-4">
        {isSelectionMode && cardIndex && (
          <div className="text-center mb-3">
            <span className="text-sm font-bold text-gray-700">Cartón {cardIndex}</span>
          </div>
        )}
        
        {/* BINGO Header */}
        <div className="grid grid-cols-5 gap-1 mb-3 rounded-lg overflow-hidden border-2 border-orange-400">
          {COLUMN_HEADERS.map((letter, index) => (
            <div 
              key={letter}
              className={cn(
                "h-12 flex items-center justify-center text-white font-bold text-xl",
                COLUMN_COLORS[index]
              )}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-5 gap-1 border-2 border-orange-400 rounded-lg overflow-hidden">
          {card.map((row, rowIndex) =>
            row.map((number, colIndex) => {
              const isFreeSpace = rowIndex === 2 && colIndex === 2;
              const isPlayerMarked = isNumberPlayerMarked(number, colIndex);
              const isCalled = isNumberCalled(number, colIndex);
              
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleNumberClick(number, rowIndex, colIndex)}
                  disabled={isReadonly || isSelectionMode}
                  className={cn(
                    "h-14 text-lg font-bold transition-all duration-200 border-r border-b border-orange-200 last:border-r-0",
                    "flex items-center justify-center",
                    isFreeSpace 
                      ? "bg-orange-500 text-white text-2xl" 
                      : isPlayerMarked 
                        ? "bg-green-500 text-white shadow-inner animate-pulse" 
                        : isCalled && !isSelectionMode
                          ? "bg-yellow-200 text-gray-900 hover:bg-yellow-300" 
                          : "bg-white text-gray-900 hover:bg-gray-50",
                    !isReadonly && !isSelectionMode && isCalled && !isFreeSpace && "hover:scale-110 cursor-pointer",
                    (isReadonly || isSelectionMode) && "cursor-default hover:scale-100",
                    // Bordes internos
                    colIndex === 4 && "border-r-0",
                    rowIndex === 4 && "border-b-0"
                  )}
                >
                  {isFreeSpace ? "★" : number}
                </button>
              );
            })
          )}
        </div>

        {isSelectionMode && isSelected && (
          <div className="mt-3 text-center">
            <span className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
              ✓ SELECCIONADO
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}