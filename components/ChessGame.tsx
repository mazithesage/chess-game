'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSounds } from '@/utils/sounds';

// Chess piece types
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
}

type Board = (Piece | null)[][];
type Position = { row: number; col: number };

// Unicode chess pieces
const PIECES = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

// Initialize the chess board
const initializeBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces
  board[0][0] = { type: 'rook', color: 'black' };
  board[0][1] = { type: 'knight', color: 'black' };
  board[0][2] = { type: 'bishop', color: 'black' };
  board[0][3] = { type: 'queen', color: 'black' };
  board[0][4] = { type: 'king', color: 'black' };
  board[0][5] = { type: 'bishop', color: 'black' };
  board[0][6] = { type: 'knight', color: 'black' };
  board[0][7] = { type: 'rook', color: 'black' };
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'pawn', color: 'black' };
  }

  // White pieces
  for (let i = 0; i < 8; i++) {
    board[6][i] = { type: 'pawn', color: 'white' };
  }
  board[7][0] = { type: 'rook', color: 'white' };
  board[7][1] = { type: 'knight', color: 'white' };
  board[7][2] = { type: 'bishop', color: 'white' };
  board[7][3] = { type: 'queen', color: 'white' };
  board[7][4] = { type: 'king', color: 'white' };
  board[7][5] = { type: 'bishop', color: 'white' };
  board[7][6] = { type: 'knight', color: 'white' };
  board[7][7] = { type: 'rook', color: 'white' };

  return board;
};

interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export default function ChessGame() {
  const router = useRouter();
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('white');
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[], black: Piece[] }>({ white: [], black: [] });
  const [castlingRights, setCastlingRights] = useState<CastlingRights>({
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  });
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null);
  const [promotionSquare, setPromotionSquare] = useState<Position | null>(null);
  const [whiteInCheck, setWhiteInCheck] = useState(false);
  const [blackInCheck, setBlackInCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isStalemate, setIsStalemate] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [drawReason, setDrawReason] = useState<string>('');
  const [halfMoveClock, setHalfMoveClock] = useState(0); // For fifty-move rule
  const [positionHistory, setPositionHistory] = useState<string[]>([]); // For threefold repetition
  const [hintMove, setHintMove] = useState<{ from: Position; to: Position } | null>(null);
  const sounds = getSounds();

  // Play game start sound on component mount
  useEffect(() => {
    sounds.playGameStart();
  }, []);

  // Helper: Find king position
  const findKing = useCallback((board: Board, color: PieceColor): Position | null => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }, []);

  // Helper: Check if a square is under attack by opponent
  const isSquareUnderAttack = useCallback((pos: Position, board: Board, byColor: PieceColor): boolean => {
    const isValidSquare = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

    // Check for pawn attacks
    const pawnDirection = byColor === 'white' ? -1 : 1;
    for (const offset of [-1, 1]) {
      const r = pos.row - pawnDirection;
      const c = pos.col + offset;
      if (isValidSquare(r, c)) {
        const piece = board[r][c];
        if (piece && piece.type === 'pawn' && piece.color === byColor) {
          return true;
        }
      }
    }

    // Check for knight attacks
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightMoves) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (isValidSquare(r, c)) {
        const piece = board[r][c];
        if (piece && piece.type === 'knight' && piece.color === byColor) {
          return true;
        }
      }
    }

    // Check for king attacks
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (isValidSquare(r, c)) {
          const piece = board[r][c];
          if (piece && piece.type === 'king' && piece.color === byColor) {
            return true;
          }
        }
      }
    }

    // Check for bishop/queen diagonal attacks
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      let r = pos.row + dr;
      let c = pos.col + dc;
      while (isValidSquare(r, c)) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === byColor && (piece.type === 'bishop' || piece.type === 'queen')) {
            return true;
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }

    // Check for rook/queen straight attacks
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      let r = pos.row + dr;
      let c = pos.col + dc;
      while (isValidSquare(r, c)) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === byColor && (piece.type === 'rook' || piece.type === 'queen')) {
            return true;
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }

    return false;
  }, []);

  // Helper: Check if king is in check
  const isKingInCheck = useCallback((board: Board, color: PieceColor): boolean => {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    return isSquareUnderAttack(kingPos, board, color === 'white' ? 'black' : 'white');
  }, [findKing, isSquareUnderAttack]);

  // Get pseudo-legal moves (without check validation)
  const getPseudoLegalMoves = useCallback((pos: Position, board: Board): Position[] => {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const moves: Position[] = [];
    const { row, col } = pos;
    const { type, color } = piece;
    const direction = color === 'white' ? -1 : 1;

    const isValidSquare = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const isEmptyOrEnemy = (r: number, c: number) => {
      if (!isValidSquare(r, c)) return false;
      const target = board[r][c];
      return !target || target.color !== color;
    };

    switch (type) {
      case 'pawn':
        // Forward move
        if (isValidSquare(row + direction, col) && !board[row + direction][col]) {
          moves.push({ row: row + direction, col });
          // Double move from starting position
          const startRow = color === 'white' ? 6 : 1;
          if (row === startRow && !board[row + 2 * direction][col]) {
            moves.push({ row: row + 2 * direction, col });
          }
        }
        // Captures
        [-1, 1].forEach(offset => {
          const newCol = col + offset;
          if (isValidSquare(row + direction, newCol)) {
            const target = board[row + direction][newCol];
            if (target && target.color !== color) {
              moves.push({ row: row + direction, col: newCol });
            }
            // En passant
            if (enPassantTarget &&
                row + direction === enPassantTarget.row &&
                newCol === enPassantTarget.col) {
              moves.push({ row: row + direction, col: newCol });
            }
          }
        });
        break;

      case 'knight':
        const knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        knightMoves.forEach(([dr, dc]) => {
          if (isEmptyOrEnemy(row + dr, col + dc)) {
            moves.push({ row: row + dr, col: col + dc });
          }
        });
        break;

      case 'bishop':
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
          let r = row + dr, c = col + dc;
          while (isValidSquare(r, c)) {
            if (board[r][c]) {
              if (board[r][c]!.color !== color) {
                moves.push({ row: r, col: c });
              }
              break;
            }
            moves.push({ row: r, col: c });
            r += dr;
            c += dc;
          }
        });
        break;

      case 'rook':
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
          let r = row + dr, c = col + dc;
          while (isValidSquare(r, c)) {
            if (board[r][c]) {
              if (board[r][c]!.color !== color) {
                moves.push({ row: r, col: c });
              }
              break;
            }
            moves.push({ row: r, col: c });
            r += dr;
            c += dc;
          }
        });
        break;

      case 'queen':
        [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
          let r = row + dr, c = col + dc;
          while (isValidSquare(r, c)) {
            if (board[r][c]) {
              if (board[r][c]!.color !== color) {
                moves.push({ row: r, col: c });
              }
              break;
            }
            moves.push({ row: r, col: c });
            r += dr;
            c += dc;
          }
        });
        break;

      case 'king':
        [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
          if (isEmptyOrEnemy(row + dr, col + dc)) {
            moves.push({ row: row + dr, col: col + dc });
          }
        });

        // Castling
        if (type === 'king' && !isKingInCheck(board, color)) {
          const baseRow = color === 'white' ? 7 : 0;
          if (row === baseRow && col === 4) {
            // Kingside castling
            if (color === 'white' ? castlingRights.whiteKingside : castlingRights.blackKingside) {
              if (!board[baseRow][5] && !board[baseRow][6] && board[baseRow][7]?.type === 'rook') {
                if (!isSquareUnderAttack({ row: baseRow, col: 5 }, board, color === 'white' ? 'black' : 'white') &&
                    !isSquareUnderAttack({ row: baseRow, col: 6 }, board, color === 'white' ? 'black' : 'white')) {
                  moves.push({ row: baseRow, col: 6 });
                }
              }
            }
            // Queenside castling
            if (color === 'white' ? castlingRights.whiteQueenside : castlingRights.blackQueenside) {
              if (!board[baseRow][3] && !board[baseRow][2] && !board[baseRow][1] && board[baseRow][0]?.type === 'rook') {
                if (!isSquareUnderAttack({ row: baseRow, col: 3 }, board, color === 'white' ? 'black' : 'white') &&
                    !isSquareUnderAttack({ row: baseRow, col: 2 }, board, color === 'white' ? 'black' : 'white')) {
                  moves.push({ row: baseRow, col: 2 });
                }
              }
            }
          }
        }
        break;
    }

    return moves;
  }, [enPassantTarget, castlingRights, isKingInCheck, isSquareUnderAttack]);

  // Get valid moves (with check validation)
  const getValidMoves = useCallback((pos: Position, board: Board): Position[] => {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const pseudoLegalMoves = getPseudoLegalMoves(pos, board);
    const validMoves: Position[] = [];

    // Filter out moves that would leave king in check or capture enemy king
    for (const move of pseudoLegalMoves) {
      // RULE: King can never be captured - game must end before this
      const targetPiece = board[move.row][move.col];
      if (targetPiece && targetPiece.type === 'king') {
        continue; // Skip this move - cannot capture king
      }

      // Simulate the move
      const newBoard = board.map(row => [...row]);

      // Handle en passant capture in simulation
      if (piece.type === 'pawn' && enPassantTarget &&
          move.row === enPassantTarget.row && move.col === enPassantTarget.col) {
        const capturedPawnRow = piece.color === 'white' ? move.row + 1 : move.row - 1;
        newBoard[capturedPawnRow][move.col] = null;
      }

      // Handle castling in simulation (move the rook too)
      if (piece.type === 'king' && Math.abs(move.col - pos.col) === 2) {
        const isKingside = move.col > pos.col;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;
        newBoard[pos.row][rookToCol] = newBoard[pos.row][rookFromCol];
        newBoard[pos.row][rookFromCol] = null;
      }

      newBoard[move.row][move.col] = newBoard[pos.row][pos.col];
      newBoard[pos.row][pos.col] = null;

      // Check if king would be in check after this move
      if (!isKingInCheck(newBoard, piece.color)) {
        validMoves.push(move);
      }
    }

    return validMoves;
  }, [getPseudoLegalMoves, isKingInCheck, enPassantTarget]);

  // Check for checkmate or stalemate
  const checkForCheckmate = useCallback((board: Board, color: PieceColor): boolean => {
    if (!isKingInCheck(board, color)) return false;

    // Check if there are any valid moves
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const moves = getValidMoves({ row, col }, board);
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }, [isKingInCheck, getValidMoves]);

  const checkForStalemate = useCallback((board: Board, color: PieceColor): boolean => {
    if (isKingInCheck(board, color)) return false;

    // Check if there are any valid moves
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const moves = getValidMoves({ row, col }, board);
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }, [isKingInCheck, getValidMoves]);

  // Helper: Convert board to position string for repetition detection
  const boardToString = useCallback((board: Board, turn: PieceColor, rights: CastlingRights, enPassant: Position | null): string => {
    let str = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          str += `${piece.color[0]}${piece.type[0]}${row}${col}`;
        }
      }
    }
    str += `|${turn}|${rights.whiteKingside}${rights.whiteQueenside}${rights.blackKingside}${rights.blackQueenside}`;
    if (enPassant) str += `|ep${enPassant.row}${enPassant.col}`;
    return str;
  }, []);

  // Check for insufficient material (automatic draw)
  const hasInsufficientMaterial = useCallback((board: Board): boolean => {
    const pieces: { type: PieceType; color: PieceColor }[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type !== 'king') {
          pieces.push(piece);
        }
      }
    }

    // King vs King
    if (pieces.length === 0) return true;

    // King + minor piece vs King
    if (pieces.length === 1) {
      const piece = pieces[0];
      return piece.type === 'bishop' || piece.type === 'knight';
    }

    // King + Bishop vs King + Bishop (same color squares)
    if (pieces.length === 2) {
      const [p1, p2] = pieces;
      if (p1.type === 'bishop' && p2.type === 'bishop') {
        // Find bishop positions to check square colors
        let bishop1Pos: Position | null = null;
        let bishop2Pos: Position | null = null;
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece?.type === 'bishop') {
              if (!bishop1Pos) bishop1Pos = { row, col };
              else bishop2Pos = { row, col };
            }
          }
        }
        if (bishop1Pos && bishop2Pos) {
          const color1 = (bishop1Pos.row + bishop1Pos.col) % 2;
          const color2 = (bishop2Pos.row + bishop2Pos.col) % 2;
          return color1 === color2;
        }
      }
    }

    return false;
  }, []);

  // Make AI move
  const makeAIMove = useCallback((currentBoard: Board, currentCastlingRights: CastlingRights, currentEnPassant: Position | null) => {
    // Check if black is currently in check
    const blackInCheckNow = isKingInCheck(currentBoard, 'black');

    const allMoves: { from: Position; to: Position }[] = [];

    // Find all possible moves for black
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col];
        if (piece && piece.color === 'black') {
          const moves = getValidMoves({ row, col }, currentBoard);
          moves.forEach(to => {
            allMoves.push({ from: { row, col }, to });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      // Check for checkmate or stalemate
      if (checkForCheckmate(currentBoard, 'black')) {
        setIsCheckmate(true);
        sounds.playCheckmate();
      } else {
        setIsStalemate(true);
        setIsDraw(true);
        setDrawReason('Stalemate');
      }
      return;
    }

    // If in check, prioritize moves that capture the attacker or move the king
    let chosenMove;
    if (blackInCheckNow) {
      // When in check, prefer king moves or captures to escape
      const kingMoves = allMoves.filter(m => currentBoard[m.from.row][m.from.col]?.type === 'king');
      const captureMoves = allMoves.filter(m => currentBoard[m.to.row][m.to.col] !== null);

      if (kingMoves.length > 0) {
        // Prefer moving the king to safety
        chosenMove = kingMoves[Math.floor(Math.random() * kingMoves.length)];
      } else if (captureMoves.length > 0) {
        // Or capturing the attacking piece
        chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else {
        // Or blocking
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    } else {
      // Normal play: pick a random valid move
      chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    const randomMove = chosenMove;
    const movingPiece = currentBoard[randomMove.from.row][randomMove.from.col];
    if (!movingPiece) return;

    // Check if this move captures a piece
    let capturedPiece = currentBoard[randomMove.to.row][randomMove.to.col];

    // SAFETY CHECK: King can never be captured
    if (capturedPiece && capturedPiece.type === 'king') {
      console.error('AI attempted illegal move: Cannot capture king!');
      return;
    }

    let isCapture = capturedPiece !== null;

    const newBoard = currentBoard.map(row => [...row]);
    const newCastlingRights = { ...currentCastlingRights };
    let newEnPassant: Position | null = null;

    // Handle en passant capture
    if (movingPiece.type === 'pawn' && currentEnPassant &&
        randomMove.to.row === currentEnPassant.row && randomMove.to.col === currentEnPassant.col) {
      const capturedPawnRow = movingPiece.color === 'white' ? randomMove.to.row + 1 : randomMove.to.row - 1;
      capturedPiece = newBoard[capturedPawnRow][randomMove.to.col];
      newBoard[capturedPawnRow][randomMove.to.col] = null;
      isCapture = true;
    }

    // Handle castling
    const isCastling = movingPiece.type === 'king' && Math.abs(randomMove.to.col - randomMove.from.col) === 2;
    if (isCastling) {
      const isKingside = randomMove.to.col > randomMove.from.col;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      newBoard[randomMove.from.row][rookToCol] = newBoard[randomMove.from.row][rookFromCol];
      newBoard[randomMove.from.row][rookFromCol] = null;
    }

    // Update castling rights
    if (movingPiece.type === 'king') {
      if (movingPiece.color === 'white') {
        newCastlingRights.whiteKingside = false;
        newCastlingRights.whiteQueenside = false;
      } else {
        newCastlingRights.blackKingside = false;
        newCastlingRights.blackQueenside = false;
      }
    }
    if (movingPiece.type === 'rook') {
      if (movingPiece.color === 'black') {
        if (randomMove.from.col === 0) newCastlingRights.blackQueenside = false;
        if (randomMove.from.col === 7) newCastlingRights.blackKingside = false;
      }
    }

    // Set en passant target for pawn double moves
    if (movingPiece.type === 'pawn' && Math.abs(randomMove.to.row - randomMove.from.row) === 2) {
      newEnPassant = {
        row: movingPiece.color === 'white' ? randomMove.from.row - 1 : randomMove.from.row + 1,
        col: randomMove.from.col
      };
    }

    // Move the piece
    newBoard[randomMove.to.row][randomMove.to.col] = movingPiece;
    newBoard[randomMove.from.row][randomMove.from.col] = null;

    // Handle pawn promotion for AI (always promote to queen)
    if (movingPiece.type === 'pawn' && randomMove.to.row === 7) {
      newBoard[randomMove.to.row][randomMove.to.col] = { type: 'queen', color: 'black' };
    }

    // Add captured piece to the list
    if (isCapture && capturedPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        white: [...prev.white, capturedPiece]
      }));
    }

    // Play appropriate sound
    if (isCastling) {
      sounds.playCastle();
    } else if (isCapture) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    // IMPORTANT: Verify AI's move doesn't leave its own king in check
    if (isKingInCheck(newBoard, 'black')) {
      console.error('AI made an illegal move - black king is still in check!');
      console.error('Move was from', randomMove.from, 'to', randomMove.to);
      // This shouldn't happen if getValidMoves is working correctly
      return;
    }

    setBoard(newBoard);
    setCastlingRights(newCastlingRights);
    setEnPassantTarget(newEnPassant);

    // Update half-move clock for fifty-move rule
    const isPawnMove = movingPiece.type === 'pawn';
    const newHalfMoveClock = (isPawnMove || isCapture) ? 0 : halfMoveClock + 1;
    setHalfMoveClock(newHalfMoveClock);

    // Check for fifty-move rule
    if (newHalfMoveClock >= 100) { // 50 moves = 100 half-moves
      setIsDraw(true);
      setDrawReason('Fifty-move rule');
      return;
    }

    // Update position history for threefold repetition
    const newPositionString = boardToString(newBoard, 'white', newCastlingRights, newEnPassant);
    const newHistory = [...positionHistory, newPositionString];
    setPositionHistory(newHistory);

    // Check for threefold repetition
    const positionCount = newHistory.filter(pos => pos === newPositionString).length;
    if (positionCount >= 3) {
      setIsDraw(true);
      setDrawReason('Threefold repetition');
      return;
    }

    // Check for insufficient material
    if (hasInsufficientMaterial(newBoard)) {
      setIsDraw(true);
      setDrawReason('Insufficient material');
      return;
    }

    // Check if white is in check or checkmate
    const checkWhite = isKingInCheck(newBoard, 'white');
    setWhiteInCheck(checkWhite);
    setBlackInCheck(false);

    if (checkWhite && checkForCheckmate(newBoard, 'white')) {
      setIsCheckmate(true);
      sounds.playCheckmate();
    } else if (checkWhite) {
      sounds.playCheck();
    }

    // Check for stalemate
    if (!checkWhite && checkForStalemate(newBoard, 'white')) {
      setIsStalemate(true);
      setIsDraw(true);
      setDrawReason('Stalemate');
      return;
    }

    setCurrentTurn('white');
  }, [getValidMoves, isKingInCheck, checkForCheckmate, checkForStalemate, boardToString, hasInsufficientMaterial, sounds, halfMoveClock, positionHistory]);

  const handleSquareClick = (row: number, col: number) => {
    // Don't allow moves if game is over or if promotion is pending
    if (currentTurn !== 'white' || isCheckmate || isDraw || promotionSquare) return;

    const piece = board[row][col];

    // If a square is selected and this is a valid move
    if (selectedSquare && validMoves.some(m => m.row === row && m.col === col)) {
      // Clear hint when move is made
      setHintMove(null);
      const movingPiece = board[selectedSquare.row][selectedSquare.col];
      if (!movingPiece) return;

      // Check if this move captures a piece
      let capturedPiece = board[row][col];

      // SAFETY CHECK: King can never be captured
      if (capturedPiece && capturedPiece.type === 'king') {
        console.error('Illegal move attempted: Cannot capture king!');
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      let isCapture = capturedPiece !== null;

      const newBoard = board.map(r => [...r]);
      const newCastlingRights = { ...castlingRights };
      let newEnPassant: Position | null = null;

      // Handle en passant capture
      if (movingPiece.type === 'pawn' && enPassantTarget &&
          row === enPassantTarget.row && col === enPassantTarget.col) {
        const capturedPawnRow = movingPiece.color === 'white' ? row + 1 : row - 1;
        capturedPiece = newBoard[capturedPawnRow][col];
        newBoard[capturedPawnRow][col] = null;
        isCapture = true;
      }

      // Handle castling
      const isCastling = movingPiece.type === 'king' && Math.abs(col - selectedSquare.col) === 2;
      if (isCastling) {
        const isKingside = col > selectedSquare.col;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;
        newBoard[selectedSquare.row][rookToCol] = newBoard[selectedSquare.row][rookFromCol];
        newBoard[selectedSquare.row][rookFromCol] = null;
      }

      // Update castling rights
      if (movingPiece.type === 'king') {
        if (movingPiece.color === 'white') {
          newCastlingRights.whiteKingside = false;
          newCastlingRights.whiteQueenside = false;
        } else {
          newCastlingRights.blackKingside = false;
          newCastlingRights.blackQueenside = false;
        }
      }
      if (movingPiece.type === 'rook') {
        if (movingPiece.color === 'white') {
          if (selectedSquare.col === 0) newCastlingRights.whiteQueenside = false;
          if (selectedSquare.col === 7) newCastlingRights.whiteKingside = false;
        }
      }

      // Set en passant target for pawn double moves
      if (movingPiece.type === 'pawn' && Math.abs(row - selectedSquare.row) === 2) {
        newEnPassant = {
          row: movingPiece.color === 'white' ? selectedSquare.row - 1 : selectedSquare.row + 1,
          col: selectedSquare.col
        };
      }

      // Move the piece
      newBoard[row][col] = movingPiece;
      newBoard[selectedSquare.row][selectedSquare.col] = null;

      // Check for pawn promotion
      if (movingPiece.type === 'pawn' && row === 0) {
        setPromotionSquare({ row, col });
        setBoard(newBoard);
        setSelectedSquare(null);
        setValidMoves([]);
        return; // Wait for promotion choice
      }

      // Add captured piece to the list
      if (isCapture && capturedPiece) {
        setCapturedPieces(prev => ({
          ...prev,
          black: [...prev.black, capturedPiece]
        }));
      }

      // Play appropriate sound for player move
      if (isCastling) {
        sounds.playCastle();
      } else if (isCapture) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }

      setBoard(newBoard);
      setCastlingRights(newCastlingRights);
      setEnPassantTarget(newEnPassant);
      setSelectedSquare(null);
      setValidMoves([]);

      // Update half-move clock for fifty-move rule
      const isPawnMove = movingPiece.type === 'pawn';
      const newHalfMoveClock = (isPawnMove || isCapture) ? 0 : halfMoveClock + 1;
      setHalfMoveClock(newHalfMoveClock);

      // Check for fifty-move rule
      if (newHalfMoveClock >= 100) {
        setIsDraw(true);
        setDrawReason('Fifty-move rule');
        return;
      }

      // Update position history for threefold repetition
      const newPositionString = boardToString(newBoard, 'black', newCastlingRights, newEnPassant);
      const newHistory = [...positionHistory, newPositionString];
      setPositionHistory(newHistory);

      // Check for threefold repetition
      const positionCount = newHistory.filter(pos => pos === newPositionString).length;
      if (positionCount >= 3) {
        setIsDraw(true);
        setDrawReason('Threefold repetition');
        return;
      }

      // Check for insufficient material
      if (hasInsufficientMaterial(newBoard)) {
        setIsDraw(true);
        setDrawReason('Insufficient material');
        return;
      }

      // Check if black is in check or checkmate
      const checkBlack = isKingInCheck(newBoard, 'black');
      setBlackInCheck(checkBlack);
      setWhiteInCheck(false);

      if (checkBlack && checkForCheckmate(newBoard, 'black')) {
        setIsCheckmate(true);
        sounds.playCheckmate();
        return; // Game over
      } else if (checkBlack) {
        sounds.playCheck();
      }

      // Check for stalemate
      if (!checkBlack && checkForStalemate(newBoard, 'black')) {
        setIsStalemate(true);
        setIsDraw(true);
        setDrawReason('Stalemate');
        return;
      }

      setCurrentTurn('black');

      // AI move after a short delay
      setTimeout(() => {
        makeAIMove(newBoard, newCastlingRights, newEnPassant);
      }, 500);
    }
    // If clicking on a white piece
    else if (piece && piece.color === 'white') {
      // Clear hint when selecting a piece
      setHintMove(null);

      // Calculate valid moves for this piece
      const pieceMoves = getValidMoves({ row, col }, board);

      // When in check, only allow selecting pieces that have moves to escape check
      if (whiteInCheck && pieceMoves.length === 0) {
        // Don't allow selecting this piece - it can't help escape check
        if (selectedSquare) {
          sounds.playDeselect();
        }
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Play deselect sound if switching pieces
      if (selectedSquare) {
        sounds.playDeselect();
      }
      // Play select sound
      sounds.playSelect();
      setSelectedSquare({ row, col });
      setValidMoves(pieceMoves);
    }
    // Deselect
    else {
      if (selectedSquare) {
        sounds.playDeselect();
      }
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handlePromotion = (pieceType: 'queen' | 'rook' | 'bishop' | 'knight') => {
    if (!promotionSquare) return;

    const newBoard = board.map(row => [...row]);
    newBoard[promotionSquare.row][promotionSquare.col] = {
      type: pieceType,
      color: 'white'
    };

    setBoard(newBoard);
    setPromotionSquare(null);

    // Check if black is in check or checkmate
    const checkBlack = isKingInCheck(newBoard, 'black');
    setBlackInCheck(checkBlack);
    setWhiteInCheck(false);

    if (checkBlack && checkForCheckmate(newBoard, 'black')) {
      setIsCheckmate(true);
      sounds.playCheckmate();
      return; // Game over
    } else if (checkBlack) {
      sounds.playCheck();
    }

    setCurrentTurn('black');

    // AI move after a short delay
    setTimeout(() => {
      makeAIMove(newBoard, castlingRights, enPassantTarget);
    }, 500);
  };

  const handleReset = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn('white');
    setCapturedPieces({ white: [], black: [] });
    setCastlingRights({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    });
    setEnPassantTarget(null);
    setPromotionSquare(null);
    setWhiteInCheck(false);
    setBlackInCheck(false);
    setIsCheckmate(false);
    setIsStalemate(false);
    setIsDraw(false);
    setDrawReason('');
    setHalfMoveClock(0);
    setPositionHistory([]);
    setHintMove(null);
    sounds.playGameStart();
  };

  const handleResign = () => {
    setIsCheckmate(true);
    setDrawReason('White resigned');
  };

  const handleHint = () => {
    // Clear previous hint
    setHintMove(null);

    // Find all possible moves for white
    const allMoves: { from: Position; to: Position; priority: number }[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === 'white') {
          const moves = getValidMoves({ row, col }, board);
          moves.forEach(to => {
            let priority = 0;

            // Prioritize captures
            if (board[to.row][to.col]) {
              priority += 10;
              // Higher priority for capturing more valuable pieces
              const capturedPiece = board[to.row][to.col];
              if (capturedPiece) {
                if (capturedPiece.type === 'queen') priority += 9;
                else if (capturedPiece.type === 'rook') priority += 5;
                else if (capturedPiece.type === 'bishop') priority += 3;
                else if (capturedPiece.type === 'knight') priority += 3;
                else if (capturedPiece.type === 'pawn') priority += 1;
              }
            }

            // Simulate move to check if it gives check
            const newBoard = board.map(r => [...r]);
            newBoard[to.row][to.col] = newBoard[row][col];
            newBoard[row][col] = null;
            if (isKingInCheck(newBoard, 'black')) {
              priority += 5; // Prioritize moves that give check
            }

            allMoves.push({ from: { row, col }, to, priority });
          });
        }
      }
    }

    if (allMoves.length === 0) return;

    // Sort by priority and pick from top moves
    allMoves.sort((a, b) => b.priority - a.priority);
    const topPriority = allMoves[0].priority;
    const topMoves = allMoves.filter(m => m.priority === topPriority);

    // Pick a random move from the top priority moves
    const hint = topMoves[Math.floor(Math.random() * topMoves.length)];
    setHintMove(hint);

    // Auto-clear hint after 5 seconds
    setTimeout(() => {
      setHintMove(null);
    }, 5000);
  };

  const isValidMove = (row: number, col: number) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#312E2B] relative">
      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-[#F0D9B5] hover:text-white hover:bg-[#1a1715] rounded-lg transition-all"
      >
        <span className="text-xl">←</span>
        <span>Back to Menu</span>
      </button>

      <h1 className="text-2xl mb-6 text-[#F0D9B5] font-bold">
        Chess • You (White) vs AI (Black)
      </h1>

      <div className="mb-4 px-4 py-2 bg-[#1a1715] rounded text-[#F0D9B5] border-2 border-[#8B6914]">
        {isDraw ? (
          <span className="text-blue-400 font-bold">Draw! {drawReason}</span>
        ) : isCheckmate ? (
          <span className="text-red-400 font-bold">
            {drawReason === 'White resigned' ? 'Black wins! White resigned' : `Checkmate! ${blackInCheck ? 'White' : 'Black'} wins!`}
          </span>
        ) : whiteInCheck ? (
          <span className="text-yellow-400 font-bold">⚠️ CHECK! You must get your King to safety!</span>
        ) : blackInCheck ? (
          <span className="text-yellow-400 font-bold">Black King in Check!</span>
        ) : (
          <span>{currentTurn === 'white' ? 'White to move' : 'Black to move'}</span>
        )}
      </div>

      <div className="flex items-start gap-8 mb-6">
        {/* Captured White Pieces (left side) */}
        <div className="flex flex-col gap-2 min-w-[80px]">
          <div className="text-[#F0D9B5] text-sm font-semibold text-center mb-2">Captured</div>
          <div className="flex flex-wrap gap-1 max-w-[80px]">
            {capturedPieces.white.map((piece, index) => (
              <div
                key={`captured-white-${index}`}
                className="w-8 h-8 flex items-center justify-center text-2xl animate-fade-in"
                style={{
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <span className="text-[#F0EDE4]">
                  {PIECES[piece.color][piece.type]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chess Board */}
        <div className="inline-block border-8 border-[#8B6914] shadow-2xl">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
              const isValid = isValidMove(rowIndex, colIndex);
              const isKingInCheck = piece?.type === 'king' &&
                ((piece.color === 'white' && whiteInCheck) || (piece.color === 'black' && blackInCheck));
              const isHintFrom = hintMove?.from.row === rowIndex && hintMove?.from.col === colIndex;
              const isHintTo = hintMove?.to.row === rowIndex && hintMove?.to.col === colIndex;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`
                    w-16 h-16 flex items-center justify-center text-4xl cursor-pointer
                    ${isLight ? 'bg-[#F0D9B5]' : 'bg-[#B58863]'}
                    ${isSelected ? 'ring-4 ring-yellow-500 ring-inset' : ''}
                    ${isValid ? 'ring-4 ring-yellow-400 ring-inset' : ''}
                    ${isKingInCheck ? 'ring-4 ring-red-500 ring-inset animate-pulse' : ''}
                    ${isHintFrom ? 'ring-4 ring-blue-400 ring-inset animate-pulse' : ''}
                    ${isHintTo ? 'ring-4 ring-green-400 ring-inset animate-pulse' : ''}
                    hover:opacity-90 transition-opacity
                  `}
                  style={{
                    textShadow: piece ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,0.5)' : undefined,
                    backgroundColor: isKingInCheck ? (isLight ? '#ffcccc' : '#cc8888') : undefined
                  }}
                >
                  {piece && (
                    <span className={`${piece.color === 'white' ? 'text-[#F0EDE4]' : 'text-[#5A5A5A]'}`}>
                      {PIECES[piece.color][piece.type]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        </div>

        {/* Captured Black Pieces (right side) */}
        <div className="flex flex-col gap-2 min-w-[80px]">
          <div className="text-[#F0D9B5] text-sm font-semibold text-center mb-2">Captured</div>
          <div className="flex flex-wrap gap-1 max-w-[80px]">
            {capturedPieces.black.map((piece, index) => (
              <div
                key={`captured-black-${index}`}
                className="w-8 h-8 flex items-center justify-center text-2xl animate-fade-in"
                style={{
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <span className="text-[#5A5A5A]">
                  {PIECES[piece.color][piece.type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-[#1a1715] border-2 border-[#8B6914] rounded hover:bg-[#8B6914] text-[#F0D9B5] font-semibold transition-all"
        >
          Reset
        </button>
        {!isCheckmate && !isDraw && currentTurn === 'white' && (
          <>
            <button
              onClick={handleHint}
              className="px-6 py-2 bg-[#1a1715] border-2 border-blue-600 rounded hover:bg-blue-600 text-[#F0D9B5] font-semibold transition-all"
            >
              Hint
            </button>
            <button
              onClick={handleResign}
              className="px-6 py-2 bg-[#1a1715] border-2 border-red-600 rounded hover:bg-red-600 text-[#F0D9B5] font-semibold transition-all"
            >
              Resign
            </button>
          </>
        )}
      </div>

      <p className="text-[#B58863] text-sm mb-2">
        Tip: Click a white piece, then a highlighted square to move.
      </p>

      {hintMove && (
        <p className="text-blue-400 text-sm mb-2 animate-pulse">
          💡 Hint: Move the piece with blue ring to the square with green ring!
        </p>
      )}

      {halfMoveClock >= 80 && (
        <p className="text-yellow-400 text-sm mb-2">
          {100 - halfMoveClock} moves until fifty-move draw
        </p>
      )}

      {/* Pawn Promotion Modal */}
      {promotionSquare && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#1a1715] border-4 border-[#8B6914] rounded-lg p-8">
            <h3 className="text-2xl text-[#F0D9B5] font-bold mb-6 text-center">Choose Promotion Piece</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handlePromotion('queen')}
                className="w-20 h-20 bg-[#312E2B] border-2 border-[#F0D9B5] rounded hover:bg-[#8B6914] transition-all flex items-center justify-center text-6xl"
                style={{
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,0.5)'
                }}
              >
                <span className="text-[#F0EDE4]">♕</span>
              </button>
              <button
                onClick={() => handlePromotion('rook')}
                className="w-20 h-20 bg-[#312E2B] border-2 border-[#F0D9B5] rounded hover:bg-[#8B6914] transition-all flex items-center justify-center text-6xl"
                style={{
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,0.5)'
                }}
              >
                <span className="text-[#F0EDE4]">♖</span>
              </button>
              <button
                onClick={() => handlePromotion('bishop')}
                className="w-20 h-20 bg-[#312E2B] border-2 border-[#F0D9B5] rounded hover:bg-[#8B6914] transition-all flex items-center justify-center text-6xl"
                style={{
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,0.5)'
                }}
              >
                <span className="text-[#F0EDE4]">♗</span>
              </button>
              <button
                onClick={() => handlePromotion('knight')}
                className="w-20 h-20 bg-[#312E2B] border-2 border-[#F0D9B5] rounded hover:bg-[#8B6914] transition-all flex items-center justify-center text-6xl"
                style={{
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,0.5)'
                }}
              >
                <span className="text-[#F0EDE4]">♘</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-[#8B6914] text-sm">
        by{' '}
        <a
          href="https://mazithesage.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#B58863] hover:text-[#F0D9B5] underline transition-colors"
        >
          mazithesage
        </a>
      </div>

    </div>
  );
}
