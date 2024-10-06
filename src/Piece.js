import { useDrag, useDrop } from 'react-dnd';

const Piece = ({ piece, square, onMove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'piece',
    item: { piece, square },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className={`piece ${isDragging ? 'dragging' : ''}`}>
      {piece}
    </div>
  );
};

const Square = ({ square, piece, onDrop }) => {
  const [, drop] = useDrop(() => ({
    accept: 'piece',
    drop: (item) => {
      onDrop(item.square, square);
    },
  }));

  return (
    <div ref={drop} className="square">
      {piece && <Piece piece={piece} square={square} />}
    </div>
  );
};
