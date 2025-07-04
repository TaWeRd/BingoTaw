import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Volume2, Mic, Dice1, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import PatternDisplay from "./pattern-display";

interface GameControlPanelProps {
  session: any;
  currentNumber?: string;
  drawnNumbers: string[];
  onDrawNumber: () => void;
  onReadPattern: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onMesaPide: () => void;
  isDrawing: boolean;
}

export default function GameControlPanel({
  session,
  currentNumber,
  drawnNumbers,
  onDrawNumber,
  onReadPattern,
  onPause,
  onResume,
  onFinish,
  onMesaPide,
  isDrawing
}: GameControlPanelProps) {
  const { toast } = useToast();
  const isGameActive = session.estado === 'activo';
  const isGamePaused = session.estado === 'pausado';
  
  const shareableUrl = `${window.location.origin}/player/${session.sessionId}`;
  
  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    toast({
      title: "URL copiada",
      description: "La URL del juego se copió al portapapeles"
    });
  };

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-white mb-1">Panel de Control</CardTitle>
            <p className="text-gray-300 text-sm">
              Sesión: <span className="text-blue-400 font-semibold">#{session.sessionId}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">EN VIVO</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shareable URL Section */}
        <div className="glass-dark rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              URL para Jugadores
            </h3>
          </div>
          <div className="flex gap-2">
            <Input
              value={shareableUrl}
              readOnly
              className="glass-dark border-white/20 text-white text-sm"
            />
            <Button
              onClick={copyUrlToClipboard}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Comparte esta URL para que los jugadores puedan unirse al juego
          </p>
        </div>

        {/* Pattern Display */}
        <div>
          <div className="glass-dark rounded-xl p-4 mb-4">
            <h3 className="text-white font-semibold mb-3">
              Patrón Actual: {session.modalidad}
            </h3>
            
            {/* Improved Pattern Display */}
            {session.patronPersonalizado && (
              <PatternDisplay
                pattern={session.patronPersonalizado}
                patternName={session.modalidad}
                patternDescription=""
                className="max-w-xs mx-auto"
              />
            )}
            
            {!session.patronPersonalizado && (
              <div className="text-center text-gray-400">
                Patrón no definido
              </div>
            )}
          </div>
          
          <Button 
            onClick={onReadPattern}
            className="w-full gradient-chile text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Leer Descripción del Patrón
          </Button>
        </div>

        {/* Number Drawing Section */}
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block bingo-ball w-24 h-24 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-gray-800 bingo-number">
                {currentNumber || '--'}
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              {currentNumber ? 'Última bolita sorteada' : 'Esperando primer sorteo'}
            </p>
          </div>
          
          <Button
            onClick={onDrawNumber}
            disabled={!isGameActive || isDrawing}
            className="gradient-game text-white font-bold py-4 px-8 rounded-xl text-lg hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
          >
            <Dice1 className="h-6 w-6 mr-3" />
            {isDrawing ? 'Sorteando...' : 'Siguiente Bolita'}
          </Button>
        </div>

        {/* Game Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isGameActive ? (
            <Button
              onClick={onPause}
              className="glass-dark text-white py-3 px-4 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Pause className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Pausar</span>
            </Button>
          ) : isGamePaused ? (
            <Button
              onClick={onResume}
              className="glass-dark text-white py-3 px-4 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Reanudar</span>
            </Button>
          ) : (
            <Button
              disabled
              className="glass-dark text-gray-500 py-3 px-4 rounded-xl cursor-not-allowed"
            >
              <Square className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Finalizado</span>
            </Button>
          )}

          <Button
            onClick={onMesaPide}
            disabled={!isGameActive}
            className="glass-dark text-white py-3 px-4 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <Mic className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Mesa Pide</span>
          </Button>

          <Button
            className="glass-dark text-white py-3 px-4 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Config</span>
          </Button>

          <Button
            onClick={onFinish}
            disabled={session.estado === 'finalizado'}
            className="bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Square className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Finalizar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}