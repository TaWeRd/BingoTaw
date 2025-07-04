import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DrawnNumbersProps {
  numbers: string[];
}

export default function DrawnNumbers({ numbers }: DrawnNumbersProps) {
  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Números Sorteados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
          {numbers.map((number, index) => (
            <div
              key={`${number}-${index}`}
              className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-scale-in"
            >
              {number}
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="text-gray-300 text-sm">
            {numbers.length} números sorteados de 75
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
