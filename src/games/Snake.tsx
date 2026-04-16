import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameShell from '../components/GameShell';

const W = 20, H = 20, TICK = 120;
type Pt = { x: number; y: number };
const rand = () => ({ x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) });

export default function Snake() {
  const [snake, setSnake] = useState<Pt[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Pt>({ x: 5, y: 5 });
  const [dir, setDir] = useState<Pt>({ x: 1, y: 0 });
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('snake-best') || 0));
  const [started, setStarted] = useState(false);
  const dirRef = useRef(dir);
  const snakeRef = useRef(snake);
  dirRef.current = dir; snakeRef.current = snake;

  const reset = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]); setDir({ x: 1, y: 0 });
    setFood(rand()); setDead(false); setScore(0); setStarted(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const d = dirRef.current;
      if (e.key === 'ArrowUp'    && d.y === 0) { setDir({ x: 0, y: -1 }); setStarted(true); }
      if (e.key === 'ArrowDown'  && d.y === 0) { setDir({ x: 0, y: 1 });  setStarted(true); }
      if (e.key === 'ArrowLeft'  && d.x === 0) { setDir({ x: -1, y: 0 }); setStarted(true); }
      if (e.key === 'ArrowRight' && d.x === 0) { setDir({ x: 1, y: 0 });  setStarted(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (dead || !started) return;
    const id = setInterval(() => {
      setSnake(prev => {
        const d = dirRef.current;
        const head = { x: (prev[0].x + d.x + W) % W, y: (prev[0].y + d.y + H) % H };
        if (prev.some(p => p.x === head.x && p.y === head.y)) { setDead(true); return prev; }
        const ate = head.x === food.x && head.y === food.y;
        const next = [head, ...prev.slice(0, ate ? undefined : -1)];
        if (ate) {
          let nf: Pt;
          do { nf = rand(); } while (next.some(p => p.x === nf.x && p.y === nf.y));
          setFood(nf);
          setScore(s => { const ns = s + 10; if (ns > best) { setBest(ns); localStorage.setItem('snake-best', String(ns)); } return ns; });
        }
        return next;
      });
    }, TICK);
    return () => clearInterval(id);
  }, [dead, started, food, best]);

  const cellSize = Math.min(Math.floor((Math.min(window.innerWidth - 40, 420)) / W), 22);

  return (
    <GameShell title="Snake" emoji="🐍" onReset={reset} scores={[
      { label: 'Score', value: score, color: '#22c55e' },
      { label: 'Best', value: best, color: '#fbbf24' },
    ]}>
      {!started && !dead && (
        <div style={{ textAlign: 'center', marginBottom: '12px', color: '#22c55e', fontWeight: 700 }}>
          Press arrow keys or swipe to start!
        </div>
      )}
      {dead && (
        <div style={{ textAlign: 'center', marginBottom: '12px', color: '#ef4444', fontWeight: 800, fontSize: '1.1rem' }}>
          💀 Game Over! Score: {score}
        </div>
      )}

      {/* Board */}
      <div style={{ position: 'relative', width: W * cellSize, height: H * cellSize, background: '#0f172a', borderRadius: '12px', overflow: 'hidden', border: '2px solid #22c55e33', margin: '0 auto' }}>
        {/* Grid dots */}
        {Array(H).fill(0).map((_, r) => Array(W).fill(0).map((__, c) => (
          <div key={`${r}-${c}`} style={{ position: 'absolute', left: c * cellSize + cellSize / 2 - 1, top: r * cellSize + cellSize / 2 - 1, width: 2, height: 2, borderRadius: '50%', background: '#1e293b' }} />
        )))}
        {/* Snake */}
        {snake.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.x * cellSize + 1, top: p.y * cellSize + 1,
            width: cellSize - 2, height: cellSize - 2,
            background: i === 0 ? '#4ade80' : `hsl(${140 - i * 2},70%,${50 - i * 0.5}%)`,
            borderRadius: i === 0 ? '6px' : '4px',
            transition: 'left 0.08s, top 0.08s',
            boxShadow: i === 0 ? '0 0 8px #22c55e' : 'none',
          }}>
            {i === 0 && <div style={{ fontSize: cellSize * 0.55, lineHeight: 1, textAlign: 'center', marginTop: '1px' }}>🐍</div>}
          </div>
        ))}
        {/* Food */}
        <div style={{ position: 'absolute', left: food.x * cellSize, top: food.y * cellSize, width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: cellSize * 0.7 }}>🍎</div>
      </div>

      {/* Mobile controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '16px', maxWidth: '150px', margin: '16px auto 0' }}>
        {[['','⬆️',''],['⬅️','','➡️'],['','⬇️','']].flat().map((btn, i) => (
          <button key={i} onClick={() => {
            if (!btn) return;
            setStarted(true);
            if (btn === '⬆️' && dirRef.current.y === 0) setDir({ x: 0, y: -1 });
            if (btn === '⬇️' && dirRef.current.y === 0) setDir({ x: 0, y: 1 });
            if (btn === '⬅️' && dirRef.current.x === 0) setDir({ x: -1, y: 0 });
            if (btn === '➡️' && dirRef.current.x === 0) setDir({ x: 1, y: 0 });
          }}
            style={{ height: '40px', background: btn ? '#1e293b' : 'transparent', border: btn ? '1px solid #334155' : 'none', borderRadius: '8px', cursor: btn ? 'pointer' : 'default', fontSize: '1.1rem' }}
          >{btn}</button>
        ))}
      </div>
    </GameShell>
  );
}
