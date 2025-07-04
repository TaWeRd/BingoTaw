import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSocket } from "@/hooks/use-socket";
import { useTTS } from "@/hooks/use-tts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import GameControlPanel from "@/components/game-control-panel";
import DrawnNumbers from "@/components/drawn-numbers";
import BingoCard from "@/components/bingo-card";
import VoiceSettings from "@/components/voice-settings";
import LaMesaPideModal from "@/components/la-mesa-pide-modal";
import { useState } from "react";
import { Play, Pause, Square, Users, Volume2, Mic } from "lucide-react";

export default function GameMaster() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const [showMesaPide, setShowMesaPide] = useState(false);
  const { speak } = useTTS();

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/sessions", sessionId],
  });

  const { connected, players: socketPlayers } = useSocket({ 
    sessionId, 
    isGameMaster: true 
  });

  const drawNumberMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/game/${sessionId}/draw`),
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      
      // TTS announcement
      const number = result.number;
      await speak(`${number}. ${number}`, { 
        voice: session?.configuracionVoz?.voice || 'lorenzo',
        rate: session?.configuracionVoz?.speed || 1
      });
      
      toast({
        title: "Número sorteado",
        description: `${number}`,
      });
    },
  });

  const pauseGameMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/game/${sessionId}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      toast({
        title: "Juego pausado",
        description: "El juego ha sido pausado",
      });
    },
  });

  const resumeGameMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/game/${sessionId}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      toast({
        title: "Juego reanudado",
        description: "El juego ha sido reanudado",
      });
    },
  });

  const finishGameMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/game/${sessionId}/finish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      toast({
        title: "Juego finalizado",
        description: "El juego ha sido finalizado",
      });
    },
  });

  const readPatternDescription = async () => {
    const modalidad = session?.modalidad || "Bingo";
    const description = getPatternDescription(modalidad);
    await speak(`Señoras y señores, estamos jugando la modalidad ${modalidad}. ${description}. Completen esta línea.`, {
      voice: session?.configuracionVoz?.voice || 'lorenzo',
      rate: session?.configuracionVoz?.speed || 1
    });
  };

  const getPatternDescription = (modalidad: string): string => {
    switch (modalidad) {
      case "Línea Horizontal":
        return "Complete una línea horizontal completa en su cartón";
      case "Línea Vertical":
        return "Complete una línea vertical completa en su cartón";
      case "Cruz":
        return "Complete una cruz en el centro del cartón";
      case "Diagonal":
        return "Complete una diagonal completa";
      case "Cartón Lleno":
        return "Complete todo el cartón";
      default:
        return "Complete el patrón indicado";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-2xl p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-white mt-4 text-center">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect border-white/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-white text-xl font-bold mb-2">Sesión no encontrada</h2>
            <p className="text-gray-300 mb-4">La sesión #{sessionId} no existe</p>
            <Button onClick={() => window.history.back()}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentNumber = session.drawnNumbers?.slice(-1)[0];
  const isGameActive = session.estado === 'activo';
  const isGamePaused = session.estado === 'pausado';

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="glass-effect sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-chile rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">BingoMT</h1>
              <p className="text-gray-300 text-sm">Panel Master</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="glass-effect px-4 py-2 rounded-full">
              <span className="text-white text-sm">#{session.sessionId}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'CONECTADO' : 'DESCONECTADO'}
                </span>
              </div>
              <div className="text-gray-300 text-sm">
                {socketPlayers.length} jugadores
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Game Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            <GameControlPanel
              session={{...session, sessionId}}
              currentNumber={currentNumber}
              drawnNumbers={session.drawnNumbers || []}
              onDrawNumber={() => drawNumberMutation.mutate()}
              onReadPattern={readPatternDescription}
              onPause={() => pauseGameMutation.mutate()}
              onResume={() => resumeGameMutation.mutate()}
              onFinish={() => finishGameMutation.mutate()}
              onMesaPide={() => setShowMesaPide(true)}
              isDrawing={drawNumberMutation.isPending}
            />

            <DrawnNumbers numbers={session.drawnNumbers || []} />

            <BingoCard />
          </div>

          {/* Right Column: Sessions & Players */}
          <div className="space-y-6">
            {/* Connected Players */}
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Jugadores Conectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {socketPlayers && socketPlayers.length > 0 ? (
                    socketPlayers.map((player: any, index: number) => (
                      <div key={player.uuid} className="glass-dark rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-r ${getPlayerGradient(index)} rounded-full flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">
                              {player.playerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{player.playerName}</p>
                            <p className="text-gray-400 text-xs">Cartón #{player.uuid.slice(-3)}</p>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${player.conectado ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No hay jugadores conectados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <VoiceSettings session={session} />
          </div>
        </div>
      </div>

      {/* La Mesa Pide Modal */}
      {showMesaPide && (
        <LaMesaPideModal
          isOpen={showMesaPide}
          onClose={() => setShowMesaPide(false)}
          sessionId={sessionId!}
        />
      )}
    </div>
  );
}

function getPlayerGradient(index: number): string {
  const gradients = [
    "from-green-400 to-blue-500",
    "from-purple-400 to-pink-500",
    "from-orange-400 to-red-500",
    "from-blue-400 to-purple-500",
    "from-pink-400 to-rose-500",
    "from-teal-400 to-cyan-500",
  ];
  return gradients[index % gradients.length];
}
