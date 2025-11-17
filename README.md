# Chess Game

A fully-featured chess game built with Next.js 15, TypeScript, and Tailwind CSS. Play as White against a simple AI opponent (Black) with complete chess rules implementation.

## Features

### Core Gameplay
- **Complete FIDE Chess Rules Implementation**:
  - ✅ All standard piece movements (pawns, knights, bishops, rooks, queens, kings)
  - ✅ **King Protection** - **King can NEVER be captured** (fundamental chess rule)
    - Game ends in checkmate before king can be taken
    - Moves that would capture a king are filtered out and prevented
  - ✅ **Check Detection** with visual and audio alerts
  - ✅ **Forced Check Response** - When in check, you can only select pieces that can escape check
    - Only moves that get the king out of check are allowed
    - Pieces with no valid escape moves cannot be selected
  - ✅ **Checkmate Detection** - Game recognizes when a player is checkmated
  - ✅ **Stalemate Detection** - Detects when player has no legal moves but not in check
  - ✅ **Castling** (both kingside and queenside) with full validation:
    - King and rook haven't moved
    - No pieces between them
    - King not in check, doesn't pass through or land on attacked square
  - ✅ **En Passant** capture for pawns (must be executed immediately)
  - ✅ **Pawn Promotion** with UI to choose piece (Queen, Rook, Bishop, Knight)
  - ✅ **Fifty-Move Rule** - Automatic draw after 50 moves without pawn move or capture
  - ✅ **Threefold Repetition** - Automatic draw when position repeats 3 times
  - ✅ **Insufficient Material** - Automatic draw when checkmate is impossible:
    - King vs King
    - King + Bishop vs King
    - King + Knight vs King
    - King + Bishop vs King + Bishop (same-color bishops)
  - ✅ **Resignation** - Player can resign to end the game
  - ✅ Move validation that prevents illegal moves (cannot move into check)

### Visual Features
- **Dark Theme UI** with brown chess board (matching 24/7 Chess aesthetic)
- **Gamified Welcome Page** with animated background and floating chess pieces
- **Check Indicator**: King's square highlighted in red with pulsing animation when in check
- **Captured Pieces Display**: Shows captured pieces on both sides with fade-in animations
- **Move Counter Warning**: Shows countdown when approaching fifty-move rule (at 80 half-moves)
- **Game Control Buttons**:
  - Reset - Start a new game
  - Resign - Forfeit the game
- Visual highlighting for selected pieces and valid moves
- Clean, minimal UI design with clear game status messages

### Audio Features
- **Enhanced Sound Effects** using Web Audio API (no external files needed):
  - Game start/reset sound
  - Piece selection and deselection sounds
  - Move sounds (different for regular moves vs captures)
  - **Check warning sound** - Alert tone when king is in check
  - **Checkmate sound** - Dramatic sequence when game ends
  - **Castling sound** - Special sound for castling moves

### AI Opponent
- AI that follows all chess rules including check/checkmate detection
- **Smart Check Defense**: When in check, the AI prioritizes:
  1. Moving the king to safety
  2. Capturing the attacking piece
  3. Blocking the attack
- Makes only legal moves (never leaves its king in check)
- Properly handles special moves (castling, en passant)
- Automatically promotes pawns to queens

## Getting Started

The development server is already running at:
- Local: http://localhost:3001

Visit this URL in your browser to play the game.

## How to Play

1. Open the app and you'll see the gamified welcome page
2. Click the "Play Now" button to start the game
3. Click on any white piece to select it
4. Valid moves will be highlighted with a green ring
5. Click on a highlighted square to move the piece
6. The AI (Black) will automatically make a move after you
7. Continue playing until you want to reset or go back
8. Click the "Reset" button to start a new game, or "Back to Menu" to return to the welcome page

## Routes

- `/` - Welcome page with game introduction
- `/game` - Chess game page

## Development

To restart the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
npm start
```

## Technologies Used

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Hooks (useState, useCallback, useEffect)
- Web Audio API for procedural sound generation
