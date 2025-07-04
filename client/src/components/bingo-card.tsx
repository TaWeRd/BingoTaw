import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BingoCard() {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  
  // Sample bingo card data
  const carton = [
    [5, 17, 35, 47, 63],
    [12, 22, 33, 55, 67],
    [8, 18, 0, 51, 74], // 0 represents the free space
    [1, 29, 44, 49, 70],
    [15, 21, 41, 58, 72]
  ];

  const markedNumbers = ['B-5', 'N-35', 'G-47', 'O-63', 'B-12', 'I-22', 'G-51'];

  const isNumberMarked = (number: number, letter: string): boolean => {
    return markedNumbers.includes(`${letter}-${number}`);
  };

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Vista de Cartón</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl p-4 shadow-xl">
            {/* Header letters */}
            <div className="grid grid-cols-5 gap-1 mb-2">
              {letters.map((letter) => (
                <div key={letter} className="text-center font-bold text-chilean-red py-1">
                  {letter}
                </div>
              ))}
            </div>
            
            {/* Number grid */}
            <div className="grid grid-cols-5 gap-1">
              {carton.map((row, rowIndex) =>
                row.map((number, colIndex) => {
                  const letter = letters[colIndex];
                  const isMarked = isNumberMarked(number, letter);
                  const isCenter = rowIndex === 2 && colIndex === 2;
                  
                  if (isCenter) {
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                        <span className="text-white text-xl font-bold">★</span>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        number-cell w-10 h-10 border border-gray-300 rounded flex items-center justify-center text-sm font-semibold bg-gray-50
                        ${isMarked ? 'marked' : ''}
                      `}
                    >
                      {number}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-3 text-center">
              <Button className="gradient-success text-white font-bold py-2 px-6 rounded-full text-lg hover:scale-105 transition-transform animate-pulse-slow">
                ¡BINGO!
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
