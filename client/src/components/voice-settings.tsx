import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTTS } from "@/hooks/use-tts";
import { Play } from "lucide-react";

interface VoiceSettingsProps {
  session: any;
}

export default function VoiceSettings({ session }: VoiceSettingsProps) {
  const { speak } = useTTS();

  const testVoice = async () => {
    const config = session?.configuracionVoz || { voice: 'lorenzo', speed: 1, style: 'entusiasta' };
    await speak("Hola, esta es una prueba de la voz chilena del sistema BingoMT", {
      voice: config.voice,
      rate: config.speed
    });
  };

  const voiceConfig = session?.configuracionVoz || {
    voice: 'lorenzo',
    speed: 1,
    style: 'entusiasta'
  };

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Configuración de Voz</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-300 text-sm mb-2 block">Voz Chilena</Label>
          <Select value={voiceConfig.voice} disabled>
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
          <Label className="text-gray-300 text-sm mb-2 block">
            Velocidad: {voiceConfig.speed}
          </Label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Lento</span>
            <input
              type="range"
              className="flex-1"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceConfig.speed}
              disabled
            />
            <span className="text-xs text-gray-400">Rápido</span>
          </div>
        </div>
        
        <div>
          <Label className="text-gray-300 text-sm mb-2 block">Estilo</Label>
          <Select value={voiceConfig.style} disabled>
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
        
        <Button
          onClick={testVoice}
          className="w-full gradient-chile text-white py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          <Play className="h-4 w-4 mr-2" />
          Probar Voz
        </Button>
      </CardContent>
    </Card>
  );
}
