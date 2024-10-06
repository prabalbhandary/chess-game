import './App.css';
import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Toaster, toast } from 'react-hot-toast';

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState('easy');

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

  const getBestMove = (depth = 1) => {
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
    });
  };

  const onDrop = (source, target) => {
    let move = null;
    safeGameMutate((game) => {
      move = game.move({
        from: source,
        to: target,
        promotion: 'q'
      });
    });

    if (move == null) {
      toast.error('Illegal move!', { icon: '🚫' });
      return false;
    }

    if (game.in_check()) {
      toast('Check!', { icon: '⚠️' });
    }
    if (game.in_checkmate()) {
      toast.error('Checkmate! Game over!', { icon: '🛑' });
      return false;
    }

    toast.success('Move successful!', { icon: '✅' });
    setTimeout(makeRandomMove, 200);
    return true;
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
        onPieceDrop={onDrop}
      />
    </div>
  );
};

export default App;
