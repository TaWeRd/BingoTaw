import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PatternEditorProps {
  onPatternChange: (pattern: any) => void;
}

export default function PatternEditor({ onPatternChange }: PatternEditorProps) {
  const [patternName, setPatternName] = useState("");
  const [patternDescription, setPatternDescription] = useState("");
  const [selectedCells, setSelectedCells] = useState<boolean[][]>(
    Array(5).fill(null).map(() => Array(5).fill(false))
  );

  const letters = ['B', 'I', 'N', 'G', 'O'];

  const toggleCell = (row: number, col: number) => {
    const newPattern = selectedCells.map((r, rowIndex) =>
      r.map((cell, colIndex) => 
        rowIndex === row && colIndex === col ? !cell : cell
      )
    );
    setSelectedCells(newPattern);
    
    onPatternChange({
      nombre: patternName,
      descripcion: patternDescription,
      patron: newPattern,
      esPredefinido: false
    });
  };

  return (
    <Card className="glass-dark border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Editor de Patrón Personalizado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Nombre del patrón</Label>
            <Input
              value={patternName}
              onChange={(e) => {
                setPatternName(e.target.value);
                onPatternChange({
                  nombre: e.target.value,
                  descripcion: patternDescription,
                  patron: selectedCells,
                  esPredefinido: false
                });
              }}
              placeholder="Ej: Mi patrón especial"
              className="glass-dark border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300 mb-2 block">Descripción</Label>
            <Input
              value={patternDescription}
              onChange={(e) => {
                setPatternDescription(e.target.value);
                onPatternChange({
                  nombre: patternName,
                  descripcion: e.target.value,
                  patron: selectedCells,
                  esPredefinido: false
                });
              }}
              placeholder="Describe el patrón..."
              className="glass-dark border-white/20 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-gray-300 mb-2 block">
            Diseña tu patrón (haz clic en las celdas):
          </Label>
          <div className="max-w-xs mx-auto">
            {/* Header letters */}
            <div className="grid grid-cols-5 gap-1 mb-2">
              {letters.map((letter) => (
                <div key={letter} className="text-center font-bold text-white py-2 text-sm">
                  {letter}
                </div>
              ))}
            </div>
            
            {/* Pattern grid */}
            <div className="grid grid-cols-5 gap-1">
              {selectedCells.map((row, rowIndex) =>
                row.map((isSelected, colIndex) => {
                  const isCenter = rowIndex === 2 && colIndex === 2;
                  
                  if (isCenter) {
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                        <span className="text-white text-sm font-bold">★</span>
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => toggleCell(rowIndex, colIndex)}
                      className={`
                        w-10 h-10 border border-gray-300 rounded flex items-center justify-center text-xs font-semibold
                        transition-all duration-200 hover:scale-105
                        ${isSelected 
                          ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }
                      `}
                    >
                      {isSelected ? '✓' : ''}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => {
              const newPattern = Array(5).fill(null).map(() => Array(5).fill(false));
              setSelectedCells(newPattern);
              onPatternChange({
                nombre: patternName,
                descripcion: patternDescription,
                patron: newPattern,
                esPredefinido: false
              });
            }}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/20"
          >
            Limpiar
          </Button>
          <Button
            onClick={() => {
              const newPattern = Array(5).fill(null).map(() => Array(5).fill(true));
              setSelectedCells(newPattern);
              onPatternChange({
                nombre: patternName,
                descripcion: patternDescription,
                patron: newPattern,
                esPredefinido: false
              });
            }}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/20"
          >
            Seleccionar Todo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
