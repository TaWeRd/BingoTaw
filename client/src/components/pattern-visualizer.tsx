import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BingoUtils, type PatternGrid } from "@/lib/bingo-utils";

interface PatternVisualizerProps {
  selectedPattern: string;
  onPatternChange: (pattern: any) => void;
}

export default function PatternVisualizer({ selectedPattern, onPatternChange }: PatternVisualizerProps) {
  const [customPatternName, setCustomPatternName] = useState("");
  const [customPattern, setCustomPattern] = useState<PatternGrid>(() => 
    Array(5).fill(null).map(() => Array(5).fill(false))
  );
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Generate pattern grid based on selection
  const generatePatternGrid = (patternType: string, lineIndex?: number): PatternGrid => {
    const grid: PatternGrid = Array(5).fill(null).map(() => Array(5).fill(false));
    
    switch (patternType) {
      case "Línea Horizontal":
        if (lineIndex !== undefined && lineIndex >= 0 && lineIndex < 5) {
          for (let j = 0; j < 5; j++) {
            grid[lineIndex][j] = true;
          }
        }
        break;
      case "Línea Vertical":
        if (lineIndex !== undefined && lineIndex >= 0 && lineIndex < 5) {
          for (let i = 0; i < 5; i++) {
            grid[i][lineIndex] = true;
          }
        }
        break;
      case "Cruz":
        // Centro y líneas cruzadas
        for (let i = 0; i < 5; i++) {
          grid[2][i] = true; // Línea horizontal central
          grid[i][2] = true; // Línea vertical central
        }
        break;
      case "Diagonal":
        // Diagonal principal
        for (let i = 0; i < 5; i++) {
          grid[i][i] = true;
        }
        break;
      case "Cartón Lleno":
        // Todo el cartón
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            grid[i][j] = true;
          }
        }
        break;
    }
    
    // FREE space always marked
    grid[2][2] = true;
    return grid;
  };

  const currentPattern = selectedPattern === "Patrón Personalizado" 
    ? customPattern 
    : generatePatternGrid(selectedPattern, selectedLine || undefined);

  const handleCustomPatternToggle = (row: number, col: number) => {
    if (selectedPattern !== "Patrón Personalizado") return;
    
    const newPattern = customPattern.map((r, i) => 
      r.map((c, j) => {
        if (i === 2 && j === 2) return true; // FREE space always true
        if (i === row && j === col) return !c;
        return c;
      })
    );
    setCustomPattern(newPattern);
    
    onPatternChange({
      modalidad: customPatternName || "Patrón Personalizado",
      patronPersonalizado: newPattern,
      isCustom: true
    });
  };

  const handleLineSelection = (lineIndex: number) => {
    setSelectedLine(lineIndex);
    const pattern = generatePatternGrid(selectedPattern, lineIndex);
    
    onPatternChange({
      modalidad: selectedPattern,
      patronPersonalizado: pattern,
      selectedLine: lineIndex
    });
  };

  const handleStandardPattern = () => {
    const pattern = generatePatternGrid(selectedPattern);
    onPatternChange({
      modalidad: selectedPattern,
      patronPersonalizado: pattern
    });
  };

  const renderPatternGrid = () => {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    
    return (
      <div className="bg-white rounded-lg p-4 shadow-inner">
        {/* Header */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          {letters.map((letter, index) => (
            <div
              key={letter}
              className={cn(
                "w-12 h-8 flex items-center justify-center text-white font-bold text-sm rounded",
                index === 0 && "bg-red-500",
                index === 1 && "bg-blue-500", 
                index === 2 && "bg-green-500",
                index === 3 && "bg-yellow-500",
                index === 4 && "bg-purple-500"
              )}
            >
              {letter}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-5 gap-1">
          {currentPattern.map((row, rowIndex) =>
            row.map((isMarked, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCustomPatternToggle(rowIndex, colIndex)}
                className={cn(
                  "w-12 h-12 border-2 flex items-center justify-center text-xs font-semibold rounded cursor-pointer transition-all",
                  isMarked 
                    ? "bg-orange-500 text-white border-orange-600 shadow-lg" 
                    : "bg-gray-100 border-gray-300 hover:bg-gray-200",
                  rowIndex === 2 && colIndex === 2 && "bg-green-500 text-white border-green-600",
                  selectedPattern !== "Patrón Personalizado" && "cursor-not-allowed"
                )}
              >
                {rowIndex === 2 && colIndex === 2 ? "FREE" : ""}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderLineSelector = () => {
    if (selectedPattern !== "Línea Horizontal" && selectedPattern !== "Línea Vertical") {
      return null;
    }

    const isHorizontal = selectedPattern === "Línea Horizontal";
    const lines = ["Primera", "Segunda", "Tercera", "Cuarta", "Quinta"];

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Selecciona la {isHorizontal ? "fila" : "columna"}:
        </Label>
        <div className="grid grid-cols-5 gap-2">
          {lines.map((line, index) => (
            <Button
              key={index}
              variant={selectedLine === index ? "default" : "outline"}
              size="sm"
              onClick={() => handleLineSelection(index)}
              className="text-xs"
            >
              {line}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-slate-50">
      <CardHeader>
        <CardTitle className="text-lg text-center">Vista Previa del Patrón</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pattern Grid */}
        <div className="flex justify-center">
          {renderPatternGrid()}
        </div>

        {/* Custom Pattern Name */}
        {selectedPattern === "Patrón Personalizado" && (
          <div className="space-y-2">
            <Label htmlFor="patternName">Nombre del Patrón:</Label>
            <Input
              id="patternName"
              value={customPatternName}
              onChange={(e) => setCustomPatternName(e.target.value)}
              placeholder="Ej: Mi Patrón Especial"
            />
          </div>
        )}

        {/* Line Selector */}
        {renderLineSelector()}

        {/* Pattern Confirmation */}
        {selectedPattern !== "Patrón Personalizado" && 
         selectedPattern !== "Línea Horizontal" && 
         selectedPattern !== "Línea Vertical" && (
          <div className="text-center">
            <Button onClick={handleStandardPattern} className="bg-orange-500 hover:bg-orange-600">
              Confirmar Patrón: {selectedPattern}
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 text-center">
          {selectedPattern === "Patrón Personalizado" && 
            "Haz clic en los cuadros para crear tu patrón personalizado"}
          {(selectedPattern === "Línea Horizontal" || selectedPattern === "Línea Vertical") && 
            "Selecciona qué línea específica quieres usar"}
        </div>
      </CardContent>
    </Card>
  );
}