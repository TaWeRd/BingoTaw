import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BingoCardNew from '@/components/bingo-card-new';
import PatternDisplay from '@/components/pattern-display';
import DrawnNumbers from '@/components/drawn-numbers';
import { BingoUtils } from '@/lib/bingo-utils';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';
import { RefreshCw, User, Play, Loader2 } from 'lucide-react';

export default function PlayerPage() {
  const [, params] = useRoute('/player/:sessionId');
  const sessionId = params?.sessionId;
  
  // Flujo de estados: 'selecting' -> 'entering_name' -> 'waiting' -> 'playing'
  const [gamePhase, setGamePhase] = useState<'selecting' | 'entering_name' | 'waiting' | 'playing'>('selecting');
  const [availableCards, setAvailableCards] = useState(() => BingoUtils.generateMultipleCards(6));
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [drawnNumbers, setDrawnNumbers] = useState<string[]>([]);
  const [currentNumber, setCurrentNumber] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch session info
  const { data: session } = useQuery({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId
  });

  // Socket.IO connection
  const playerUuid = useState(() => BingoUtils.generatePlayerUUID())[0];
  const { connected, emitPlayerCardSelected } = useSocket({ 
    sessionId, 
    isGameMaster: false,
    playerData: gamePhase === 'waiting' || gamePhase === 'playing' ? {
      uuid: playerUuid,
      playerName,
      carton: selectedCardIndex !== null ? availableCards[selectedCardIndex] : null
    } : null
  });

  // Socket.IO connection handles joining automatically

  const handleRefreshCards = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setAvailableCards(BingoUtils.generateMultipleCards(6));
      setSelectedCardIndex(null);
      setIsRefreshing(false);
    }, 800);
  };

  const handleCardSelection = (cardIndex: number) => {
    setSelectedCardIndex(cardIndex);
    setGamePhase('entering_name');
  };

  const handleNameSubmit = () => {
    if (!playerName.trim()) return;
    
    setGamePhase('waiting');
    
    // Send player card selection via Socket.IO
    if (sessionId && selectedCardIndex !== null) {
      const selectedCard = availableCards[selectedCardIndex];
      emitPlayerCardSelected(playerUuid, selectedCard);
    }
  };

  const handleConfirmCard = () => {
    if (selectedCardIndex === null) return;
    
    const selectedCard = availableCards[selectedCardIndex];
    emitPlayerCardSelected(playerUuid, selectedCard);
  };

  const handleNumberClick = (bingoNumber: string) => {
    // Handle player marking number on their card
    console.log('Player marked:', bingoNumber);
  };

  const handleBingoClaim = () => {
    if (selectedCardIndex === null) return;
    
    // TODO: Implement bingo claim via Socket.IO
    console.log('Bingo claim not yet implemented');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Cargando sesión...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session && session.estado === 'finalizado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Juego Finalizado</h2>
              <p className="text-gray-600">Esta sesión de bingo ya ha terminado.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar según la fase del juego
  const renderCurrentPhase = () => {
    switch (gamePhase) {
      case 'selecting':
        return renderCardSelection();
      case 'entering_name':
        return renderNameEntry();
      case 'waiting':
        return renderWaitingScreen();
      case 'playing':
        return renderGameplay();
      default:
        return renderCardSelection();
    }
  };

  const renderCardSelection = () => (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Selecciona tu Cartón</h2>
      <p className="text-gray-600 mb-6">Elige uno de los 6 cartones generados para ti</p>
      
      <div className="flex justify-center mb-6">
        <Button
          onClick={handleRefreshCards}
          disabled={isRefreshing}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando nuevos cartones...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Cartones
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {availableCards.map((card, index) => (
          <div
            key={index}
            className={cn(
              "cursor-pointer transition-all duration-300 transform hover:scale-105",
              "p-4 rounded-xl border-2 bg-white/90",
              selectedCardIndex === index
                ? "border-orange-500 shadow-lg shadow-orange-200"
                : "border-gray-200 hover:border-orange-300"
            )}
            onClick={() => handleCardSelection(index)}
          >
            <div className="text-center mb-3">
              <Badge className="bg-blue-500 text-white">
                Cartón #{index + 1}
              </Badge>
            </div>
            <BingoCardNew
              card={card}
              isReadonly={true}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderNameEntry = () => (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Cartón Seleccionado!</h2>
      <p className="text-gray-600 mb-6">Ahora ingresa tu nombre o nick para continuar</p>
      
      {selectedCardIndex !== null && (
        <div className="mb-6 p-4 bg-white/90 rounded-xl border-2 border-orange-300">
          <Badge className="bg-orange-500 text-white mb-3">
            Tu Cartón Seleccionado
          </Badge>
          <BingoCardNew
            card={availableCards[selectedCardIndex]}
            isReadonly={true}
            className="w-full max-w-xs mx-auto"
          />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="player-name" className="text-gray-700 font-medium">
            Nombre o Nick
          </Label>
          <Input
            id="player-name"
            type="text"
            placeholder="Ingresa tu nombre..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="mt-2"
            maxLength={20}
          />
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setGamePhase('selecting')}
            className="flex-1"
          >
            Cambiar Cartón
          </Button>
          <Button
            onClick={handleNameSubmit}
            disabled={!playerName.trim()}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <User className="h-4 w-4 mr-2" />
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWaitingScreen = () => (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Listo para Jugar!</h2>
      <p className="text-gray-600 mb-6">Esperando a que el organizador inicie el juego...</p>
      
      <div className="mb-6 p-4 bg-white/90 rounded-xl border-2 border-green-300">
        <div className="flex items-center justify-center mb-3">
          <User className="h-5 w-5 mr-2 text-green-600" />
          <span className="font-medium text-green-800">{playerName}</span>
        </div>
        
        {selectedCardIndex !== null && (
          <>
            <Badge className="bg-green-500 text-white mb-3">
              Tu Cartón de Juego
            </Badge>
            <BingoCardNew
              card={availableCards[selectedCardIndex]}
              isReadonly={true}
              className="w-full max-w-xs mx-auto"
            />
          </>
        )}
      </div>

      <div className="animate-pulse">
        <Play className="h-8 w-8 mx-auto text-orange-500 mb-2" />
        <p className="text-gray-500">Esperando al organizador...</p>
      </div>
    </div>
  );

  const renderGameplay = () => (
    <div>
      {/* Existing gameplay UI */}
      {/* TODO: Implementar la interfaz de juego activo */}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Bingo 75</h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="bg-white/80">
              Sesión: {sessionId}
            </Badge>
            <Badge className={cn(
              (session as any)?.estado === 'activo' ? 'bg-green-500' : 'bg-yellow-500'
            )}>
              {(session as any)?.estado === 'activo' ? 'En Juego' : 'Esperando'}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        {renderCurrentPhase()}
      </div>
    </div>
  );
}