import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import GameWizard from "@/components/game-wizard";
import { Play, Users, Trophy, Clock, Plus, Eye, Square, Pause, SquareX } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [showWizard, setShowWizard] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/sessions"],
  });

  const { data: activeSessions } = useQuery({
    queryKey: ["/api/sessions/active"],
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiRequest("DELETE", `/api/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Sesión eliminada",
        description: "La sesión ha sido eliminada correctamente",
      });
    },
  });

  const finishSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiRequest("POST", `/api/game/${sessionId}/finish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Sesión finalizada",
        description: "La sesión ha sido finalizada correctamente",
      });
    },
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVA</Badge>;
      case "pausado":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">PAUSADA</Badge>;
      case "finalizado":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">FINALIZADA</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-2xl p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-white mt-4 text-center">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const activeCount = activeSessions?.length || 0;
  const totalPlayers = activeSessions?.reduce((acc: number, session: any) => acc + (session.numeroCartones || 0), 0) || 0;
  const completedToday = sessions?.filter((s: any) => s.estado === 'finalizado').length || 0;

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
              <p className="text-gray-300 text-sm">Sistema Chileno</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="glass-effect px-4 py-2 rounded-full">
              <span className="text-white text-sm">Master Dashboard</span>
            </div>
            <button className="glass-effect p-2 rounded-full hover:bg-white/20 transition-colors">
              <Users className="text-white h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-effect border-white/20 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <Play className="text-white h-6 w-6" />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVAS</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{activeCount}</h3>
              <p className="text-gray-300 text-sm">Sesiones en juego</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="text-white h-6 w-6" />
                </div>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">CONECTADOS</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{totalPlayers}</h3>
              <p className="text-gray-300 text-sm">Cartones asignados</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                  <Trophy className="text-white h-6 w-6" />
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">HOY</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{completedToday}</h3>
              <p className="text-gray-300 text-sm">Partidas completadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Management */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Gestión de Sesiones</CardTitle>
              <Button
                onClick={() => setShowWizard(true)}
                className="gradient-chile hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sesión
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session: any) => (
                  <div key={session.id} className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-white font-semibold">#{session.sessionId}</h3>
                        {getStatusBadge(session.estado)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatDate(session.fechaInicio)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-xs">Modalidad</p>
                        <p className="text-white text-sm">{session.modalidad}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Cartones</p>
                        <p className="text-white text-sm">{session.numeroCartones}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Números sorteados</p>
                        <p className="text-white text-sm">{session.drawnNumbers?.length || 0}</p>
                      </div>
                    </div>
                    


                    <div className="flex space-x-2">
                      <Link href={`/game/${session.sessionId}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Eye className="h-4 w-4 mr-1" />
                          Panel Master
                        </Button>
                      </Link>
                      
                      {session.estado === 'activo' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                          onClick={() => {/* TODO: Implement pause */}}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                      )}
                      
                      {(session.estado === 'activo' || session.estado === 'pausado') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                          onClick={() => finishSessionMutation.mutate(session.sessionId)}
                          disabled={finishSessionMutation.isPending}
                        >
                          <Square className="h-4 w-4 mr-1" />
                          Finalizar
                        </Button>
                      )}
                      
                      {session.estado === 'finalizado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
                          onClick={() => deleteSessionMutation.mutate(session.sessionId)}
                          disabled={deleteSessionMutation.isPending}
                        >
                          <SquareX className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No hay sesiones creadas</p>
                <Button
                  onClick={() => setShowWizard(true)}
                  className="gradient-chile hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Sesión
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Estadísticas del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-float">
                  <Clock className="text-white h-8 w-8" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-1">15:32</h4>
                <p className="text-gray-300 text-sm">Duración Promedio</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-float" style={{animationDelay: '0.5s'}}>
                  <Trophy className="text-white h-8 w-8" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-1">{completedToday}</h4>
                <p className="text-gray-300 text-sm">Bingos Ganados</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-float" style={{animationDelay: '1s'}}>
                  <span className="text-white text-xl font-bold">%</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-1">87%</h4>
                <p className="text-gray-300 text-sm">Eficiencia</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-float" style={{animationDelay: '1.5s'}}>
                  <Users className="text-white h-8 w-8" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-1">{totalPlayers}</h4>
                <p className="text-gray-300 text-sm">Jugadores Únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Creation Wizard Modal */}
      {showWizard && (
        <GameWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
