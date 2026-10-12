import { useState, useCallback, useEffect, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;

const SPEED_MAP: Record<Difficulty, number> = {
  easy: 150,
  medium: 100,
  hard: 60,
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<Direction>('RIGHT');

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    lastDirectionRef.current = 'RIGHT';
    setScore(0);
    setGameState('idle');
  }, []);

  const startGame = useCallback(() => {
    if (gameState === 'gameover' || gameState === 'idle') {
      const initialSnake = [{ x: 10, y: 10 }];
      setSnake(initialSnake);
      setFood(getRandomPosition(initialSnake));
      setDirection('RIGHT');
      directionRef.current = 'RIGHT';
      lastDirectionRef.current = 'RIGHT';
      setScore(0);
    }
    setGameState('playing');
  }, [gameState]);

  const pauseGame = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  const changeDirection = useCallback((newDir: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (opposites[newDir] !== lastDirectionRef.current) {
      directionRef.current = newDir;
      setDirection(newDir);
    }
  }, []);

  const changeDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    if (gameState !== 'playing') {
      resetGame();
    }
  }, [gameState, resetGame]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const speed = SPEED_MAP[difficulty];

    gameLoopRef.current = window.setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;
        lastDirectionRef.current = currentDir;

        switch (currentDir) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameState('gameover');
          setScore(prev => {
            const finalScore = prev;
            setHighScore(hs => {
              const newHigh = Math.max(hs, finalScore);
              localStorage.setItem('snake-high-score', String(newHigh));
              return newHigh;
            });
            return prev;
          });
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          setGameState('gameover');
          setScore(prev => {
            const finalScore = prev;
            setHighScore(hs => {
              const newHigh = Math.max(hs, finalScore);
              localStorage.setItem('snake-high-score', String(newHigh));
              return newHigh;
            });
            return prev;
          });
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food
        setFood(prevFood => {
          if (head.x === prevFood.x && head.y === prevFood.y) {
            setScore(s => s + 10);
            const newFood = getRandomPosition(newSnake);
            return newFood;
          } else {
            newSnake.pop();
            return prevFood;
          }
        });

        return newSnake;
      });
    }, speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, difficulty]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (gameState === 'idle' || gameState === 'gameover') {
            startGame();
          } else {
            pauseGame();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (gameState === 'playing') {
            pauseGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, gameState, startGame, pauseGame]);

  return {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    gridSize: GRID_SIZE,
    startGame,
    pauseGame,
    resetGame,
    changeDirection,
    changeDifficulty,
  };
}
