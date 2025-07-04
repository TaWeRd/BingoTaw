export type BingoCard = number[][];
export type PatternGrid = boolean[][];
export type DrawnNumber = string;

export interface BingoPattern {
  id: number;
  nombre: string;
  descripcion: string;
  patron: PatternGrid;
  esPredefinido: boolean;
}

export class BingoUtils {
  // Generate a valid bingo card with proper number distribution
  static generateBingoCard(): BingoCard {
    const card: BingoCard = [];
    const ranges = [
      [1, 15],   // B column
      [16, 30],  // I column
      [31, 45],  // N column
      [46, 60],  // G column
      [61, 75]   // O column
    ];

    // Generate numbers for each column
    for (let col = 0; col < 5; col++) {
      const [min, max] = ranges[col];
      const availableNumbers = Array.from(
        { length: max - min + 1 }, 
        (_, i) => min + i
      );
      
      // Shuffle and take first 5 numbers
      for (let i = availableNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
      }
      
      const columnNumbers = availableNumbers.slice(0, 5);
      
      // Add column to card
      for (let row = 0; row < 5; row++) {
        if (!card[row]) card[row] = [];
        card[row][col] = columnNumbers[row];
      }
    }

    // The center space (2,2) is traditionally a free space
    // We'll keep the generated number but mark it as special
    return card;
  }

  static generateMultipleCards(count: number = 10): BingoCard[] {
    const cards: BingoCard[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(this.generateBingoCard());
    }
    return cards;
  }

  // Convert number and position to bingo format (e.g., "B-5", "O-72")
  static numberToBingoFormat(number: number, column: number): string {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    return `${letters[column]}-${number}`;
  }

  // Parse bingo format back to number and column
  static parseBingoNumber(bingoNumber: string): { number: number; column: number; letter: string } | null {
    const match = bingoNumber.match(/^([BINGO])-(\d+)$/);
    if (!match) return null;

    const letter = match[1];
    const number = parseInt(match[2]);
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const column = letters.indexOf(letter);

    if (column === -1) return null;

    return { number, column, letter };
  }

  // Validate if a number belongs to the correct column
  static isValidBingoNumber(bingoNumber: string): boolean {
    const parsed = this.parseBingoNumber(bingoNumber);
    if (!parsed) return false;

    const { number, column } = parsed;
    const ranges = [
      [1, 15],   // B
      [16, 30],  // I
      [31, 45],  // N
      [46, 60],  // G
      [61, 75]   // O
    ];

    const [min, max] = ranges[column];
    return number >= min && number <= max;
  }

  // Generate next random number that hasn't been drawn
  static generateNextNumber(drawnNumbers: string[]): string | null {
    const allPossibleNumbers: string[] = [];
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const ranges = [
      [1, 15], [16, 30], [31, 45], [46, 60], [61, 75]
    ];

    // Generate all possible numbers
    for (let col = 0; col < 5; col++) {
      const [min, max] = ranges[col];
      for (let num = min; num <= max; num++) {
        allPossibleNumbers.push(`${letters[col]}-${num}`);
      }
    }

    // Filter out already drawn numbers
    const availableNumbers = allPossibleNumbers.filter(
      num => !drawnNumbers.includes(num)
    );

    if (availableNumbers.length === 0) {
      return null; // All numbers have been drawn
    }

    // Return random available number
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    return availableNumbers[randomIndex];
  }

  // Check if a bingo card wins with the given pattern and drawn numbers
  static checkBingo(
    card: BingoCard, 
    drawnNumbers: string[], 
    pattern: PatternGrid
  ): boolean {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        // Skip if this cell is not part of the winning pattern
        if (!pattern[row][col]) continue;

        // Check center space (free space)
        if (row === 2 && col === 2) continue;

        // Check if the number in this position has been drawn
        const cardNumber = card[row][col];
        const bingoFormat = `${letters[col]}-${cardNumber}`;
        
        if (!drawnNumbers.includes(bingoFormat)) {
          return false; // This required number hasn't been drawn
        }
      }
    }

    return true; // All required numbers have been drawn
  }

  // Get marked numbers for a card based on drawn numbers
  static getMarkedNumbers(card: BingoCard, drawnNumbers: string[]): string[] {
    const markedNumbers: string[] = [];
    const letters = ['B', 'I', 'N', 'G', 'O'];

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cardNumber = card[row][col];
        const bingoFormat = `${letters[col]}-${cardNumber}`;
        
        if (drawnNumbers.includes(bingoFormat)) {
          markedNumbers.push(bingoFormat);
        }
      }
    }

    return markedNumbers;
  }

  // Calculate game statistics
  static calculateGameStats(
    drawnNumbers: string[], 
    duration: number, 
    playerCount: number
  ): {
    efficiency: number;
    averageNumbersPerMinute: number;
    completionRate: number;
  } {
    const totalPossibleNumbers = 75;
    const drawnCount = drawnNumbers.length;
    const durationMinutes = duration / 60;

    return {
      efficiency: Math.round((drawnCount / totalPossibleNumbers) * 100),
      averageNumbersPerMinute: durationMinutes > 0 ? Math.round((drawnCount / durationMinutes) * 10) / 10 : 0,
      completionRate: Math.round((drawnCount / Math.min(25, totalPossibleNumbers)) * 100) // Assuming 25 numbers for average game
    };
  }

  // Validate pattern grid
  static isValidPattern(pattern: PatternGrid): boolean {
    if (!pattern || pattern.length !== 5) return false;
    
    for (const row of pattern) {
      if (!row || row.length !== 5) return false;
    }

    // Check if at least one cell is selected (excluding center)
    let hasSelection = false;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (pattern[row][col] && !(row === 2 && col === 2)) {
          hasSelection = true;
          break;
        }
      }
      if (hasSelection) break;
    }

    return hasSelection;
  }

  // Get pattern description for TTS
  static getPatternDescription(patternName: string): string {
    const descriptions: { [key: string]: string } = {
      "Línea Horizontal": "Complete una línea horizontal completa en su cartón",
      "Línea Vertical": "Complete una línea vertical completa en su cartón", 
      "Cruz": "Complete una cruz en el centro del cartón",
      "Diagonal": "Complete una diagonal completa de esquina a esquina",
      "Cartón Lleno": "Complete todo el cartón de bingo",
      "Esquinas": "Complete las cuatro esquinas del cartón",
      "Marco": "Complete todo el borde del cartón",
      "X": "Complete una X completa en el cartón",
      "T": "Complete una T en el cartón",
      "L": "Complete una L en cualquier esquina"
    };

    return descriptions[patternName] || "Complete el patrón indicado en su cartón";
  }

  // Create predefined patterns
  static getPredefinedPatterns(): Omit<BingoPattern, 'id'>[] {
    return [
      {
        nombre: "Línea Horizontal",
        descripcion: "Complete una línea horizontal completa",
        patron: [
          [true, true, true, true, true],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Línea Vertical",
        descripcion: "Complete una línea vertical completa",
        patron: [
          [true, false, false, false, false],
          [true, false, false, false, false],
          [true, false, false, false, false],
          [true, false, false, false, false],
          [true, false, false, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Cruz",
        descripcion: "Complete una cruz en el centro del cartón",
        patron: [
          [false, false, true, false, false],
          [false, false, true, false, false],
          [true, true, true, true, true],
          [false, false, true, false, false],
          [false, false, true, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Diagonal",
        descripcion: "Complete una diagonal completa",
        patron: [
          [true, false, false, false, false],
          [false, true, false, false, false],
          [false, false, true, false, false],
          [false, false, false, true, false],
          [false, false, false, false, true]
        ],
        esPredefinido: true
      },
      {
        nombre: "X",
        descripcion: "Complete una X completa",
        patron: [
          [true, false, false, false, true],
          [false, true, false, true, false],
          [false, false, true, false, false],
          [false, true, false, true, false],
          [true, false, false, false, true]
        ],
        esPredefinido: true
      },
      {
        nombre: "Esquinas",
        descripcion: "Complete las cuatro esquinas",
        patron: [
          [true, false, false, false, true],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [true, false, false, false, true]
        ],
        esPredefinido: true
      },
      {
        nombre: "Marco",
        descripcion: "Complete todo el borde del cartón",
        patron: [
          [true, true, true, true, true],
          [true, false, false, false, true],
          [true, false, false, false, true],
          [true, false, false, false, true],
          [true, true, true, true, true]
        ],
        esPredefinido: true
      },
      {
        nombre: "Cartón Lleno",
        descripcion: "Complete todo el cartón",
        patron: [
          [true, true, true, true, true],
          [true, true, true, true, true],
          [true, true, true, true, true],
          [true, true, true, true, true],
          [true, true, true, true, true]
        ],
        esPredefinido: true
      }
    ];
  }

  // Format time duration for display
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Generate unique session ID
  static generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BINGO-${timestamp}-${random}`;
  }

  // Generate unique player UUID
  static generatePlayerUUID(): string {
    return 'player-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }
}
