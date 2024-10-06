import './App.css';
import { useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Toaster, toast } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import audio files
import checkSoundFile from './assets/check.mp3';
import checkmateSoundFile from './assets/checkmate.mp3';

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState('easy');
  const [history, setHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Audio references
  const checkSound = useRef(new Audio(checkSoundFile));
  const checkmateSound = useRef(new Audio(checkmateSoundFile));

  const safeGameMutate = (modify) => {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  };

  const evaluateBoard = (game) => {
    const pieceValue = {
      p: 1,
      r: 5,
      n: 3,
      b: 3,
      q: 9,
      k: 0,
    };

    let totalValue = 0;
    for (const square of game.board().flat()) {
      if (square) {
        const pieceColor = square.color === 'w' ? square.type : square.type.toUpperCase();
        totalValue += pieceValue[square.type] * (square.color === 'w' ? 1 : -1);
      }
    }
    return totalValue;
  };

  const getBestMove = () => {
    const possibleMoves = game.moves();

    if (difficulty === 'easy') {
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    if (difficulty === 'medium') {
      const captures = possibleMoves.filter(move => game.get(move).captured);
      if (captures.length > 0) {
        return captures[Math.floor(Math.random() * captures.length)];
      }
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    if (difficulty === 'hard') {
      let bestMove = null;
      let bestValue = -Infinity;

      const evaluatedMoves = possibleMoves.map(move => {
        let value = 0;
        safeGameMutate((g) => {
          g.move(move);
          value = evaluateBoard(g);
          g.undo();
        });
        return { move, value };
      });

      for (const { move, value } of evaluatedMoves) {
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
      }

      return bestMove || possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }
  };

  const makeRandomMove = () => {
    if (game.game_over() || game.in_draw()) {
      toast.success('Game over!', { icon: '🛑' });
      return;
    }

    const bestMove = getBestMove();
    safeGameMutate((game) => {
      game.move(bestMove);
      setHistory((h) => [...h, bestMove]);
      toast.success('Opponent moved: ' + bestMove, { icon: '🤖' });

      if (game.in_check()) {
        checkSound.current.play();
        toast('Check!', { icon: '⚠️' });
      }
    });
  };

  const handleSquareClick = (square) => {
    if (selectedSquare) {
      safeGameMutate((game) => {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          setHistory((h) => [...h, move]);
          toast.success('Move successful!', { icon: '✅' });

          if (game.in_check()) {
            checkSound.current.play();
            toast('Check!', { icon: '⚠️' });
          }

          if (game.in_checkmate()) {
            checkmateSound.current.play();
            toast.error('Checkmate! Game over!', { icon: '🛑' });
            return;
          }

          setTimeout(makeRandomMove, 300);
        } else {
          toast.error('Illegal move! Please try again.', { icon: '🚫' });
        }
      });
      setSelectedSquare(null);
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      } else {
        toast.error('Select your piece first!', { icon: '🚫' });
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) {
      toast.error('No moves to undo!', { icon: '🚫' });
      return;
    }

    safeGameMutate((game) => {
      game.undo();
    });

    setHistory((h) => h.slice(0, h.length - 1));
    toast.success('Move undone!', { icon: '🔄' });
  };

  const handleReset = () => {
    setGame(new Chess());
    setHistory([]);
    toast.success('Game reset!', { icon: '🔄' });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <Toaster position='top-right' />
        <h1>Chess Game</h1>
        <div>
          <label>Select Difficulty: </label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <Chessboard 
          position={game.fen()}
          onSquareClick={handleSquareClick}
        />
        <div className="controls">
          <button className="button" onClick={handleUndo}>Undo</button>
          <button className="button" onClick={handleReset}>Reset</button>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;
