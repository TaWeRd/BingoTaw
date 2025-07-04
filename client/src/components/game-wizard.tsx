import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PatternVisualizer from "./pattern-visualizer";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";

interface GameWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WizardData {
  modalidad: string;
  patronPersonalizado?: any;
  configuracionVoz: {
    voice: 'lorenzo' | 'catalina';
    speed: number;
    style: 'entusiasta' | 'formal' | 'neutral';
  };
}

export default function GameWizard({ isOpen, onClose }: GameWizardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    modalidad: "",
    configuracionVoz: {
      voice: 'lorenzo',
      speed: 1,
      style: 'entusiasta'
    }
  });

  const { data: patterns } = useQuery({
    queryKey: ["/api/patterns"],
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sessions", data),
    onSuccess: async (response) => {
      const session = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      
      toast({
        title: "Sesión creada",
        description: `Sesión #${session.sessionId} creada exitosamente`,
      });
      
      onClose();
      setLocation(`/game/${session.sessionId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la sesión",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    const sessionId = `BINGO-${Date.now()}`;
    
    // Ensure we have a pattern
    let pattern = wizardData.patronPersonalizado;
    if (!pattern && wizardData.modalidad) {
      // Generate default pattern based on modalidad
      pattern = generatePatternForModalidad(wizardData.modalidad);
    }
    
    const sessionData = {
      sessionId,
      creador: "master",
      estado: "activo" as const,
      modalidad: wizardData.modalidad,
      numeroCartones: 0,
      configuracionVoz: wizardData.configuracionVoz,
      patronPersonalizado: pattern
    };

    createSessionMutation.mutate(sessionData);
  };

  const generatePatternForModalidad = (modalidad: string) => {
    const grid = Array(5).fill(null).map(() => Array(5).fill(false));
    
    switch (modalidad) {
      case "Línea Horizontal":
        for (let j = 0; j < 5; j++) {
          grid[0][j] = true; // Primera línea horizontal
        }
        break;
      case "Línea Vertical":
        for (let i = 0; i < 5; i++) {
          grid[i][0] = true; // Primera línea vertical
        }
        break;
      case "Cruz":
        for (let i = 0; i < 5; i++) {
          grid[2][i] = true; // Línea horizontal central
          grid[i][2] = true; // Línea vertical central
        }
        break;
      case "Diagonal":
        for (let i = 0; i < 5; i++) {
          grid[i][i] = true;
        }
        break;
      case "Cartón Lleno":
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            grid[i][j] = true;
          }
        }
        break;
    }
    
    // FREE space always true
    grid[2][2] = true;
    return grid;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Selección de Modalidad";
      case 2: return "Configuración de Voz";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/20 max-w-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Crear Nueva Sesión
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center ${step < 2 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${step <= currentStep ? 'text-white' : 'text-gray-400'}`}>
                  {step === 1 ? 'Modalidad' : 'Voz'}
                </span>
              </div>
              {step < 2 && (
                <div className={`flex-1 h-1 mx-4 ${step < currentStep ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h3 className="text-white font-semibold mb-4">{getStepTitle()}</h3>

          {/* Step 1: Game Pattern */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pattern Selection */}
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">Selecciona la modalidad de juego:</p>
                {patterns && patterns.length > 0 ? (
                  <div className="space-y-3">
                    {patterns.filter((p: any) => p.esPredefinido).map((pattern: any) => (
                      <button
                        key={pattern.id}
                        onClick={() => setWizardData(prev => ({ ...prev, modalidad: pattern.nombre }))}
                        className={`w-full glass-dark p-4 rounded-xl hover:bg-white/20 transition-colors text-left
                          ${wizardData.modalidad === pattern.nombre ? 'border-2 border-blue-500' : ''}`}
                      >
                        <div className="font-semibold text-white mb-1">{pattern.nombre}</div>
                        <div className="text-sm text-gray-300">{pattern.descripcion}</div>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setWizardData(prev => ({ ...prev, modalidad: 'Patrón Personalizado' }))}
                      className={`w-full glass-dark p-4 rounded-xl hover:bg-white/20 transition-colors text-left
                        ${wizardData.modalidad === 'Patrón Personalizado' ? 'border-2 border-blue-500' : ''}`}
                    >
                      <div className="font-semibold text-white mb-1">Patrón Personalizado</div>
                      <div className="text-sm text-gray-300">Crea tu propio patrón de juego</div>
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400">Cargando patrones...</div>
                )}
              </div>

              {/* Pattern Visualizer */}
              {wizardData.modalidad && (
                <div>
                  <PatternVisualizer
                    selectedPattern={wizardData.modalidad}
                    onPatternChange={(pattern) => 
                      setWizardData(prev => ({ 
                        ...prev, 
                        patronPersonalizado: pattern.patronPersonalizado,
                        modalidad: pattern.modalidad || prev.modalidad
                      }))
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Voice Configuration */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Voz Chilena</Label>
                <Select 
                  value={wizardData.configuracionVoz.voice} 
                  onValueChange={(value: 'lorenzo' | 'catalina') => 
                    setWizardData(prev => ({ 
                      ...prev, 
                      configuracionVoz: { ...prev.configuracionVoz, voice: value }
                    }))
                  }
                >
                  <SelectTrigger className="glass-dark border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lorenzo">Lorenzo (Masculino)</SelectItem>
                    <SelectItem value="catalina">Catalina (Femenino)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">
                  Velocidad: {wizardData.configuracionVoz.speed}
                </Label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">Lento</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={wizardData.configuracionVoz.speed}
                    onChange={(e) => setWizardData(prev => ({ 
                      ...prev, 
                      configuracionVoz: { ...prev.configuracionVoz, speed: parseFloat(e.target.value) }
                    }))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400">Rápido</span>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Estilo</Label>
                <Select 
                  value={wizardData.configuracionVoz.style} 
                  onValueChange={(value: 'entusiasta' | 'formal' | 'neutral') => 
                    setWizardData(prev => ({ 
                      ...prev, 
                      configuracionVoz: { ...prev.configuracionVoz, style: value }
                    }))
                  }
                >
                  <SelectTrigger className="glass-dark border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entusiasta">Entusiasta</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            className="glass-dark border-white/20 text-white hover:bg-white/20"
          >
            {currentStep === 1 ? (
              "Cancelar"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </>
            )}
          </Button>

          <Button
            onClick={currentStep === 2 ? handleFinish : handleNext}
            className="gradient-chile hover:opacity-90 transition-opacity"
            disabled={
              (currentStep === 1 && !wizardData.modalidad) ||
              createSessionMutation.isPending
            }
          >
            {currentStep === 2 ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                {createSessionMutation.isPending ? "Creando..." : "Crear Sesión"}
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
