import './App.css';
import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Toaster, toast } from 'react-hot-toast';

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState('easy');
  const [history, setHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null); // Track selected piece

  const safeGameMutate = (modify) => {
    setGame((g) => {
      const update = { ...g };
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
    for (const [piece, count] of Object.entries(game.board().flat().reduce((acc, square) => {
      if (square) {
        const pieceType = square.type;
        const pieceColor = square.color === 'w' ? pieceType : pieceType.toUpperCase();
        acc[pieceColor] = (acc[pieceColor] || 0) + 1;
      }
      return acc;
    }, {}))) {
      totalValue += pieceValue[piece.toLowerCase()] * count;
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
    });
  };

  const handleSquareClick = (square) => {
    if (selectedSquare) {
      // Move the piece to the target square
      safeGameMutate((game) => {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q' // always promote to a queen for simplicity
        });
        
        if (move) {
          setHistory((h) => [...h, move]);
          toast.success('Move successful!', { icon: '✅' });

          if (game.in_check()) {
            toast('Check!', { icon: '⚠️' });
          }
          if (game.in_checkmate()) {
            toast.error('Checkmate! Game over!', { icon: '🛑' });
            return;
          }

          // After the player's move, make the opponent's move
          setTimeout(makeRandomMove, 300); // Delay opponent's move for visibility
        } else {
          toast.error('Illegal move!', { icon: '🚫' });
        }
      });
      setSelectedSquare(null); // Reset selected square
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square); // Select the piece
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
  );
};

export default App;
