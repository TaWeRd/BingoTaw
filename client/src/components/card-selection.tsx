import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BingoCard } from '@/lib/bingo-utils';
import { cn } from '@/lib/utils';

interface CardSelectionProps {
  cards: BingoCard[];
  onCardSelect: (cardIndex: number) => void;
  selectedCardIndex?: number;
}

const COLUMN_HEADERS = ['B', 'I', 'N', 'G', 'O'];
const COLUMN_COLORS = [
  'bg-red-500', 
  'bg-yellow-500', 
  'bg-green-500', 
  'bg-blue-500', 
  'bg-purple-500'
];

export default function CardSelection({ cards, onCardSelect, selectedCardIndex }: CardSelectionProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const renderBingoCard = (card: BingoCard, index: number) => {
    const isSelected = selectedCardIndex === index;
    const isHovered = hoveredCard === index;

    return (
      <Card 
        key={index}
        className={cn(
          "cursor-pointer transition-all duration-300 transform hover:scale-105",
          "border-2 bg-white/90 backdrop-blur-sm shadow-lg",
          isSelected ? "border-orange-500 ring-4 ring-orange-200" : "border-gray-200 hover:border-orange-300",
          isHovered && !isSelected && "shadow-xl border-orange-300"
        )}
        onClick={() => onCardSelect(index)}
        onMouseEnter={() => setHoveredCard(index)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <CardContent className="p-3">
          <div className="text-center mb-2">
            <span className="text-sm font-bold text-gray-700">Cartón {index + 1}</span>
          </div>
          
          {/* BINGO Header */}
          <div className="grid grid-cols-5 gap-1 mb-2">
            {COLUMN_HEADERS.map((letter, colIndex) => (
              <div 
                key={letter}
                className={cn(
                  "h-6 flex items-center justify-center text-white font-bold text-xs rounded",
                  COLUMN_COLORS[colIndex]
                )}
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Card Numbers */}
          <div className="grid grid-cols-5 gap-1">
            {card.map((row, rowIndex) =>
              row.map((number, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "h-6 flex items-center justify-center text-xs font-semibold rounded border",
                    rowIndex === 2 && colIndex === 2 
                      ? "bg-orange-400 text-white border-orange-500" // Free space
                      : "bg-gray-50 text-gray-800 border-gray-200"
                  )}
                >
                  {rowIndex === 2 && colIndex === 2 ? "★" : number}
                </div>
              ))
            )}
          </div>

          {isSelected && (
            <div className="mt-2 text-center">
              <span className="text-xs font-bold text-orange-600">✓ SELECCIONADO</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Selecciona tu Cartón
        </h2>
        <p className="text-gray-600">
          Elige uno de los 10 cartones generados para ti
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => renderBingoCard(card, index))}
      </div>

      {selectedCardIndex !== undefined && (
        <div className="mt-6 text-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-8 py-3"
          >
            Confirmar Cartón {selectedCardIndex + 1}
          </Button>
        </div>
      )}
    </div>
  );
}