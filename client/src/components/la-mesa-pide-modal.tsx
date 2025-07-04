import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTTS } from "@/hooks/use-tts";
import { Mic, Volume2 } from "lucide-react";

interface LaMesaPideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export default function LaMesaPideModal({ isOpen, onClose, sessionId }: LaMesaPideModalProps) {
  const { toast } = useToast();
  const { speak } = useTTS();
  const [mensaje, setMensaje] = useState("");

  const mesaPideMutation = useMutation({
    mutationFn: (data: { mensaje: string }) => 
      apiRequest("POST", `/api/game/${sessionId}/mesa-pide`, data),
    onSuccess: async () => {
      // Speak the announcement
      await speak(`La mesa pide... ${mensaje}`, { voice: 'lorenzo', rate: 1 });
      
      toast({
        title: "Anuncio enviado",
        description: "La mesa pide ha sido anunciada a todos los jugadores",
      });
      
      setMensaje("");
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el anuncio",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mensaje.trim()) {
      mesaPideMutation.mutate({ mensaje: mensaje.trim() });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/20 max-w-md text-white">
        <DialogHeader>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="text-white h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white mb-2">
              La Mesa Pide
            </DialogTitle>
            <p className="text-gray-300 text-sm">
              Ingresa la palabra o frase que deben buscar los jugadores
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder='Ej: Una palabra que termine en "ción"'
              className="glass-dark border-white/20 text-white placeholder-gray-400"
              maxLength={100}
              required
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 glass-dark border-white/20 text-white hover:bg-white/20"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!mensaje.trim() || mesaPideMutation.isPending}
              className="flex-1 gradient-chile hover:opacity-90 transition-opacity"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {mesaPideMutation.isPending ? "Anunciando..." : "Anunciar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
