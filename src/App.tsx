import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, RotateCcw, Hash, Bot, Users, Globe, ChevronDown } from 'lucide-react';
import './styles.css';
import './index.css';

import GameBoard from './components/GameBoard';
import Scoreboard from './components/Scoreboard';
import SettingsPanel from './components/Settings';
import Multiplayer from './components/Multiplayer';

import { Theme, ThemeConfig, THEMES, EMOJI_SETS } from './lib/themes';
import { checkWinner, isDraw, getAIMove, getCommentary, Difficulty } from './lib/AI';
import { sounds } from './lib/sounds';
import { getScores, saveScore, resetScores, ScoreMode, ScoreData } from './lib/storage';

type GameMode = 'local' | 'ai' | 'online';

const EMPTY_BOARD = Array(9).fill('');

export default function App() {
  // Theme & settings
  const [theme, setTheme] = useState<Theme>('night');
  const [emojiSetIndex, setEmojiSetIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Game mode
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');

  // Game state
  const [board, setBoard] = useState<string[]>(EMPTY_BOARD);
  const [currentTurn, setCurrentTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [draw, setDraw] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [commentary, setCommentary] = useState<string | null>(null);
  const commentaryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scores
  const [scores, setScores] = useState<ScoreData>({ wins: 0, losses: 0, draws: 0 });

  const themeConfig: ThemeConfig = THEMES[theme];
  const emojiSet = EMOJI_SETS[emojiSetIndex];

  const scoreMode: ScoreMode =
    gameMode === 'ai' ? `ai-${aiDifficulty}` as ScoreMode : gameMode === 'local' ? 'local' : 'online';

  useEffect(() => {
    setScores(getScores(scoreMode));
  }, [scoreMode]);

  const mapEmoji = (val: string) => {
    if (val === 'X') return emojiSet.x;
    if (val === 'O') return emojiSet.o;
    return val;
  };

  const displayBoard = board.map(mapEmoji);

  const showCommentary = (text: string) => {
    if (commentaryTimer.current) clearTimeout(commentaryTimer.current);
    setCommentary(text);
    commentaryTimer.current = setTimeout(() => setCommentary(null), 3000);
  };

  const handleGameOver = useCallback((newBoard: string[], w: string | null, d: boolean) => {
    if (w) {
      if (soundEnabled) sounds.win();
      if (gameMode === 'ai') {
        const aiWon = w === 'O';
        showCommentary(getCommentary(aiWon ? 'win' : 'lose'));
        saveScore(scoreMode, aiWon ? 'loss' : 'win');
      } else {
        saveScore(scoreMode, w === 'X' ? 'win' : 'loss');
      }
    } else if (d) {
      if (soundEnabled) sounds.draw();
      if (gameMode === 'ai') showCommentary(getCommentary('draw'));
      saveScore(scoreMode, 'draw');
    }
    setScores(getScores(scoreMode));
  }, [gameMode, scoreMode, soundEnabled]);

  const makeMove = useCallback((index: number, currentBoard: string[], turn: 'X' | 'O') => {
    if (currentBoard[index] !== '' || winner || draw) return null;

    const newBoard = [...currentBoard];
    newBoard[index] = turn;

    const w = checkWinner(newBoard);
    const d = !w && isDraw(newBoard);

    setBoard(newBoard);
    if (w) setWinner(w);
    else if (d) setDraw(true);
    else setCurrentTurn(turn === 'X' ? 'O' : 'X');

    return { newBoard, w, d };
  }, [winner, draw]);

  const handleCellClick = useCallback((index: number) => {
    if (winner || draw || aiThinking) return;
    if (gameMode === 'ai' && currentTurn === 'O') return;

    if (soundEnabled) sounds.click();
    const result = makeMove(index, board, currentTurn);
    if (!result) return;

    if (result.w || result.d) {
      handleGameOver(result.newBoard, result.w, result.d);
      return;
    }

    if (gameMode === 'ai') {
      setAiThinking(true);
      showCommentary(getCommentary('move'));
      setTimeout(() => {
        const aiMove = getAIMove(result.newBoard, aiDifficulty);
        if (aiMove === -1) { setAiThinking(false); return; }

        const aiBoard = [...result.newBoard];
        aiBoard[aiMove] = 'O';
        if (soundEnabled) sounds.click();

        const aiW = checkWinner(aiBoard);
        const aiD = !aiW && isDraw(aiBoard);

        setBoard(aiBoard);
        if (aiW) setWinner(aiW);
        else if (aiD) setDraw(true);
        else setCurrentTurn('X');

        if (aiW || aiD) handleGameOver(aiBoard, aiW, aiD);
        setAiThinking(false);
      }, 0);
    }
  }, [winner, draw, aiThinking, gameMode, currentTurn, board, aiDifficulty, soundEnabled, makeMove, handleGameOver]);

  const resetGame = useCallback(() => {
    setBoard(EMPTY_BOARD);
    setCurrentTurn('X');
    setWinner(null);
    setDraw(false);
    setAiThinking(false);
    setCommentary(null);
  }, []);

  const handleResetScores = () => {
    resetScores(scoreMode);
    setScores(getScores(scoreMode));
  };

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  };

  const turnLabel = () => {
    if (winner) return `${mapEmoji(winner)} Wins! 🎉`;
    if (draw) return "It's a Draw! 🤝";
    if (aiThinking) return 'AI is thinking... 🤔';
    if (gameMode === 'ai' && currentTurn === 'O') return 'AI thinking...';
    const marker = mapEmoji(currentTurn);
    if (gameMode === 'local') return `${marker}'s Turn`;
    return `Your Turn (${marker})`;
  };

  const bg = themeConfig.bg;
  const isNeon = theme === 'neon';

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(12px, 3vw, 24px)',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Header */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(12px, 3vw, 20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: isNeon ? 'transparent' : themeConfig.accent,
            border: isNeon ? `2px solid ${themeConfig.accent}` : 'none',
            borderRadius: '10px',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isNeon ? themeConfig.glowX : 'none',
          }}>
            <Hash size={20} style={{ color: isNeon ? themeConfig.accent : '#fff' }} />
          </div>
          <div>
            <h1 style={{
              color: themeConfig.text,
              fontWeight: 900,
              fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
              margin: 0,
              letterSpacing: '-0.02em',
              textShadow: isNeon ? `0 0 10px ${themeConfig.text}` : 'none',
            }}>
              Tic-Tac-Toe <span style={{ color: themeConfig.accent }}>Pro</span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            background: themeConfig.surface,
            border: `1px solid ${themeConfig.border}`,
            borderRadius: '12px',
            padding: '8px',
            cursor: 'pointer',
            color: themeConfig.textMuted,
            display: 'flex',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            boxShadow: themeConfig.shadow,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = themeConfig.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = themeConfig.textMuted)}
        >
          <Settings2 size={20} />
        </button>
      </motion.header>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2.5vw, 16px)',
        }}
      >
        {/* Mode Tabs */}
        <div style={{
          background: themeConfig.surface,
          border: `1px solid ${themeConfig.border}`,
          borderRadius: '16px',
          padding: '6px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: themeConfig.shadow,
        }}>
          {([
            { mode: 'local' as GameMode, icon: <Users size={14} />, label: 'Local' },
            { mode: 'ai' as GameMode, icon: <Bot size={14} />, label: 'vs AI' },
            { mode: 'online' as GameMode, icon: <Globe size={14} />, label: 'Online' },
          ]).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              style={{
                background: gameMode === mode ? themeConfig.accent : 'transparent',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 6px',
                cursor: 'pointer',
                color: gameMode === mode ? '#fff' : themeConfig.textMuted,
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.2s',
                boxShadow: gameMode === mode && isNeon ? themeConfig.glowX : 'none',
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* AI Difficulty */}
        <AnimatePresence>
          {gameMode === 'ai' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                background: themeConfig.surface,
                border: `1px solid ${themeConfig.border}`,
                borderRadius: '14px',
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                backdropFilter: 'blur(12px)',
              }}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => { setAiDifficulty(d); resetGame(); }}
                    style={{
                      background: aiDifficulty === d ? `${themeConfig.accent}33` : 'transparent',
                      border: `2px solid ${aiDifficulty === d ? themeConfig.accent : themeConfig.border}`,
                      borderRadius: '10px',
                      padding: '7px',
                      cursor: 'pointer',
                      color: aiDifficulty === d ? themeConfig.accent : themeConfig.textMuted,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                    }}
                  >
                    {d === 'easy' ? '😊' : d === 'medium' ? '🤔' : '🤖'} {d}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Online Mode */}
        {gameMode === 'online' ? (
          <Multiplayer
            theme={themeConfig}
            emojiX={emojiSet.x}
            emojiO={emojiSet.o}
            soundEnabled={soundEnabled}
          />
        ) : (
          <>
            {/* Turn indicator */}
            <div style={{
              background: themeConfig.surface,
              border: `1px solid ${themeConfig.border}`,
              borderRadius: '14px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: themeConfig.shadow,
            }}>
              <motion.div
                key={turnLabel()}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                  color: winner ? '#22c55e' : draw ? '#f59e0b' : themeConfig.text,
                  fontWeight: 700,
                  fontSize: 'clamp(0.9rem, 3vw, 1.05rem)',
                }}
              >
                {turnLabel()}
              </motion.div>
              <button
                onClick={resetGame}
                style={{
                  background: themeConfig.cellBg,
                  border: `1px solid ${themeConfig.border}`,
                  borderRadius: '10px',
                  padding: '7px',
                  cursor: 'pointer',
                  color: themeConfig.textMuted,
                  display: 'flex',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = themeConfig.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = themeConfig.textMuted)}
                title="New Game"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* AI Commentary */}
            <AnimatePresence>
              {gameMode === 'ai' && commentary && (
                <motion.div
                  key={commentary}
                  initial={{ opacity: 0, y: -8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.9 }}
                  style={{
                    background: `${themeConfig.accent}22`,
                    border: `1px solid ${themeConfig.accent}44`,
                    borderRadius: '14px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>🤖</span>
                  <span style={{ color: themeConfig.accent, fontWeight: 600, fontSize: '0.9rem', fontStyle: 'italic' }}>
                    "{commentary}"
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Board */}
            <div style={{
              background: themeConfig.surface,
              border: `1px solid ${themeConfig.border}`,
              borderRadius: '20px',
              padding: 'clamp(12px, 3vw, 20px)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: themeConfig.shadow,
            }}>
              <GameBoard
                board={displayBoard}
                onCellClick={handleCellClick}
                disabled={!!winner || draw || aiThinking || (gameMode === 'ai' && currentTurn === 'O')}
                theme={themeConfig}
                gameOver={!!winner || draw}
              />
            </div>

            {/* Win/Draw overlay message */}
            <AnimatePresence>
              {(winner || draw) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  style={{
                    background: winner ? '#22c55e22' : '#f59e0b22',
                    border: `1px solid ${winner ? '#22c55e' : '#f59e0b'}44`,
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>
                    {winner ? '🏆' : '🤝'}
                  </div>
                  <div style={{
                    color: winner ? '#22c55e' : '#f59e0b',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    marginBottom: '10px',
                  }}>
                    {winner
                      ? `${mapEmoji(winner)} Wins!`
                      : "It's a Draw!"}
                  </div>
                  <button
                    onClick={resetGame}
                    style={{
                      background: themeConfig.accent,
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 20px',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RotateCcw size={14} /> Play Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scoreboard */}
            <Scoreboard
              mode={scoreMode}
              scores={scores}
              onReset={handleResetScores}
              theme={themeConfig}
            />
          </>
        )}
      </motion.div>

      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        themeConfig={themeConfig}
        onThemeChange={setTheme}
        emojiSet={emojiSetIndex}
        onEmojiChange={setEmojiSetIndex}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(s => !s)}
      />
    </div>
  );
}
