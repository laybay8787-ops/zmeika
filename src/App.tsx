import { useEffect, useRef, useCallback } from 'react';
import { useSnakeGame, Direction, Difficulty } from './hooks/useSnakeGame';

function App() {
  const {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    gridSize,
    startGame,
    pauseGame,
    resetGame,
    changeDirection,
    changeDifficulty,
  } = useSnakeGame();

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gameBoardRef = useRef<HTMLDivElement>(null);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      changeDirection(dy > 0 ? 'DOWN' : 'UP');
    }
    touchStartRef.current = null;
  }, [changeDirection]);

  // Prevent default scroll/zoom on touch (mobile)
  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  const getCellClass = (x: number, y: number) => {
    const isSnakeHead = snake[0].x === x && snake[0].y === y;
    const isSnakeBody = snake.some((seg, i) => i > 0 && seg.x === x && seg.y === y);
    const isFood = food.x === x && food.y === y;

    if (isSnakeHead) return 'snake-head';
    if (isSnakeBody) return 'snake-body';
    if (isFood) return 'food';
    return '';
  };

  const getSnakeBodyIndex = (x: number, y: number) => {
    const idx = snake.findIndex(seg => seg.x === x && seg.y === y);
    return idx;
  };

  const getSnakeOpacity = (x: number, y: number) => {
    const idx = getSnakeBodyIndex(x, y);
    if (idx === -1) return 1;
    if (idx === 0) return 1;
    return Math.max(0.4, 1 - (idx / snake.length) * 0.6);
  };

  const directionArrows: Record<Direction, string> = {
    UP: '▲',
    DOWN: '▼',
    LEFT: '◀',
    RIGHT: '▶',
  };

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 mb-2">
          🐍 Змейка
        </h1>
        
        {/* Score panel */}
        <div className="flex justify-between items-center bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-700/50">
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Счёт</div>
            <div className="text-2xl font-bold text-green-400">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Рекорд</div>
            <div className="text-2xl font-bold text-yellow-400">{highScore}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Сложность</div>
            <div className="text-lg font-bold text-purple-400">{difficultyLabels[difficulty]}</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        ref={gameBoardRef}
        className="relative bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-600/50 shadow-2xl shadow-purple-900/30 overflow-hidden"
        style={{ aspectRatio: '1/1', width: 'min(80vw, 70vh, 480px)' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid */}
        <div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            gap: '1px',
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const cellClass = getCellClass(x, y);
            const opacity = getSnakeOpacity(x, y);

            return (
              <div
                key={i}
                className={`
                  transition-all duration-100
                  ${cellClass === 'snake-head' ? 'bg-green-400 rounded-sm shadow-lg shadow-green-400/50 scale-105 z-10' : ''}
                  ${cellClass === 'snake-body' ? 'bg-green-500 rounded-sm' : ''}
                  ${cellClass === 'food' ? 'bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50 scale-90' : ''}
                  ${cellClass === '' ? 'bg-gray-700/30' : ''}
                `}
                style={{
                  opacity: cellClass === 'snake-body' ? opacity : 1,
                }}
              />
            );
          })}
        </div>

        {/* Overlays */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 animate-fade-in">
            <div className="text-6xl mb-4">🐍</div>
            <p className="text-white text-lg mb-2">Нажмите для начала</p>
            <p className="text-gray-400 text-sm mb-4">или пробел</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              Играть
            </button>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 animate-fade-in">
            <div className="text-5xl mb-4">⏸️</div>
            <p className="text-white text-xl mb-4">Пауза</p>
            <button
              onClick={pauseGame}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              Продолжить
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20 animate-fade-in">
            <div className="text-5xl mb-3">💀</div>
            <p className="text-red-400 text-2xl font-bold mb-1">Игра окончена</p>
            <p className="text-white text-lg mb-1">Счёт: <span className="text-green-400 font-bold">{score}</span></p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm mb-3 animate-bounce">🏆 Новый рекорд!</p>
            )}
            <button
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95 mt-2"
            >
              Играть снова
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-4 space-y-3">
        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          {gameState === 'playing' && (
            <button
              onClick={pauseGame}
              className="px-4 py-2 bg-gray-700/80 text-gray-200 font-medium rounded-lg border border-gray-600/50 hover:bg-gray-600/80 transition-colors active:scale-95"
            >
              ⏸ Пауза
            </button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-gray-700/80 text-gray-200 font-medium rounded-lg border border-gray-600/50 hover:bg-gray-600/80 transition-colors active:scale-95"
            >
              🔄 Заново
            </button>
          )}
        </div>

        {/* Difficulty selector */}
        <div className="flex justify-center gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => changeDifficulty(diff)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95 ${
                difficulty === diff
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-gray-700/60 text-gray-300 border border-gray-600/50 hover:bg-gray-600/60'
              }`}
            >
              {difficultyLabels[diff]}
            </button>
          ))}
        </div>

        {/* Mobile D-pad */}
        <div className="flex justify-center md:hidden mt-2">
          <div className="grid grid-cols-3 gap-1 w-36 h-36">
            <div />
            <button
              onTouchStart={() => changeDirection('UP')}
              className="bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 transition-colors border border-gray-600/50"
            >
              ▲
            </button>
            <div />
            <button
              onTouchStart={() => changeDirection('LEFT')}
              className="bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 transition-colors border border-gray-600/50"
            >
              ◀
            </button>
            <div className="bg-gray-800/40 rounded-lg flex items-center justify-center text-gray-500 text-xs">
              {directionArrows[direction]}
            </div>
            <button
              onTouchStart={() => changeDirection('RIGHT')}
              className="bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 transition-colors border border-gray-600/50"
            >
              ▶
            </button>
            <div />
            <button
              onTouchStart={() => changeDirection('DOWN')}
              className="bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 transition-colors border border-gray-600/50"
            >
              ▼
            </button>
            <div />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-gray-500 text-xs mt-2 hidden md:block">
          <p>Управление: ← ↑ ↓ → или WASD | Пробел — пауза/старт | Esc — пауза</p>
        </div>
        <div className="text-center text-gray-500 text-xs mt-2 md:hidden">
          <p>Свайп по полю или кнопки для управления</p>
        </div>
      </div>
    </div>
  );
}

export default App;
