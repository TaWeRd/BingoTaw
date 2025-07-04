import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth", formData);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        });
        setLocation("/dashboard");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Credenciales incorrectas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 gradient-chile rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🎯</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">BingoMT</h1>
              <p className="text-gray-300">Sistema Chileno</p>
            </div>
          </div>
        </div>

        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-center text-white">
              Acceso Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="master"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="glass-dark border-white/20 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="master1"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="glass-dark border-white/20 text-white placeholder-gray-400"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-chile hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>Credenciales por defecto:</p>
          <p>Usuario: <span className="text-blue-400">master</span></p>
          <p>Contraseña: <span className="text-blue-400">master1</span></p>
        </div>
      </div>
    </div>
  );
}
