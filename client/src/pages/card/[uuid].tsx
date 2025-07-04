import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Volume2 } from "lucide-react";

export default function PlayerCard() {
  const { uuid } = useParams();
  const [markedNumbers, setMarkedNumbers] = useState<string[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('activo');

  const { data: player, isLoading } = useQuery({
    queryKey: ["/api/card", uuid],
  });

  const websocket = useWebSocket(`/ws?uuid=${uuid}`);

  useEffect(() => {
    if (websocket) {
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'number_drawn':
            setDrawnNumbers(data.drawnNumbers || []);
            break;
          case 'game_paused':
            setGameStatus('pausado');
            break;
          case 'game_resumed':
            setGameStatus('activo');
            break;
          case 'game_finished':
            setGameStatus('finalizado');
            break;
          case 'bingo_winner':
            if (data.uuid === uuid) {
              alert('¡Felicidades! ¡Has ganado el BINGO!');
            }
            break;
        }
      };
    }
  }, [websocket, uuid]);

  const claimBingo = () => {
    if (websocket && gameStatus === 'activo') {
      websocket.send(JSON.stringify({
        type: 'bingo_claim',
        uuid: uuid
      }));
    }
  };

  const toggleNumber = (number: number, letter: string) => {
    const numberStr = `${letter}-${number}`;
    if (drawnNumbers.includes(numberStr)) {
      setMarkedNumbers(prev => 
        prev.includes(numberStr) 
          ? prev.filter(n => n !== numberStr)
          : [...prev, numberStr]
      );
    }
  };

  const isNumberDrawn = (number: number, letter: string): boolean => {
    return drawnNumbers.includes(`${letter}-${number}`);
  };

  const isNumberMarked = (number: number, letter: string): boolean => {
    return markedNumbers.includes(`${letter}-${number}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-2xl p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-white mt-4 text-center">Cargando cartón...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect border-white/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-white text-xl font-bold mb-2">Cartón no encontrado</h2>
            <p className="text-gray-300 mb-4">El cartón #{uuid} no existe</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const letters = ['B', 'I', 'N', 'G', 'O'];
  const carton = player.carton as number[][];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 gradient-chile rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🎯</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BingoMT</h1>
              <p className="text-gray-300">Cartón de {player.playerName}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <Badge className={`${gameStatus === 'activo' ? 'bg-green-500/20 text-green-400' : 
                             gameStatus === 'pausado' ? 'bg-yellow-500/20 text-yellow-400' : 
                             'bg-gray-500/20 text-gray-400'} border-current/30`}>
              {gameStatus.toUpperCase()}
            </Badge>
            <span className="text-gray-300 text-sm">#{uuid.slice(-6)}</span>
          </div>
        </div>

        {/* Bingo Card */}
        <Card className="glass-effect border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-white">Cartón de Bingo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-xl p-4 shadow-xl">
              {/* Header letters */}
              <div className="grid grid-cols-5 gap-1 mb-2">
                {letters.map((letter) => (
                  <div key={letter} className="text-center font-bold text-chilean-red py-2 text-lg">
                    {letter}
                  </div>
                ))}
              </div>
              
              {/* Number grid */}
              <div className="grid grid-cols-5 gap-1">
                {carton.map((row, rowIndex) =>
                  row.map((number, colIndex) => {
                    const letter = letters[colIndex];
                    const isDrawn = isNumberDrawn(number, letter);
                    const isMarked = isNumberMarked(number, letter);
                    const isCenter = rowIndex === 2 && colIndex === 2;
                    
                    if (isCenter) {
                      return (
                        <div key={`${rowIndex}-${colIndex}`} className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl font-bold">★</span>
                        </div>
                      );
                    }
                    
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => toggleNumber(number, letter)}
                        disabled={!isDrawn || gameStatus !== 'activo'}
                        className={`
                          w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center text-sm font-semibold
                          transition-all duration-200 hover:scale-105
                          ${isMarked 
                            ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white transform scale-95' 
                            : isDrawn 
                              ? 'bg-blue-100 hover:bg-blue-200 cursor-pointer' 
                              : 'bg-gray-50 cursor-not-allowed opacity-50'
                          }
                        `}
                      >
                        {number}
                        {isMarked && (
                          <span className="absolute text-xs">✓</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{drawnNumbers.length}</div>
              <div className="text-gray-300 text-sm">Números sorteados</div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{markedNumbers.length}</div>
              <div className="text-gray-300 text-sm">Números marcados</div>
            </CardContent>
          </Card>
        </div>

        {/* Bingo Button */}
        {gameStatus === 'activo' && (
          <div className="text-center">
            <Button
              onClick={claimBingo}
              className="gradient-success text-white font-bold py-4 px-8 rounded-xl text-xl hover:scale-105 transition-transform animate-pulse-slow"
            >
              <Trophy className="h-6 w-6 mr-2" />
              ¡BINGO!
            </Button>
            <p className="text-gray-400 text-sm mt-2">
              Presiona cuando completes el patrón
            </p>
          </div>
        )}

        {/* Last drawn number */}
        {drawnNumbers.length > 0 && (
          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-gray-300 text-sm mb-2">Último número sorteado</div>
              <div className="inline-block bingo-ball w-16 h-16 rounded-full flex items-center justify-center animate-draw-number">
                <span className="text-2xl font-bold text-gray-800 bingo-number">
                  {drawnNumbers[drawnNumbers.length - 1]}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
