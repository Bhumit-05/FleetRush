// src/components/GameBoard.js
'use client';
import { useState, useEffect } from 'react';
import BattleLog from './BattleLog';

export default function GameBoard({ socketId, roomId, opponentId, sendMessage, socketMessages, onReturnToMenu }) {
  const [gameStatus, setGameStatus] = useState('SETUP'); // SETUP, PLAYING, FINISHED
  const [myBoard, setMyBoard] = useState(Array(6).fill(null).map(() => Array(6).fill(0)));
  const [radarBoard, setRadarBoard] = useState(Array(6).fill(null).map(() => Array(6).fill(0)));
  const [cooldowns, setCooldowns] = useState({}); // Tracks locked-out tile coordinates
  const [placedShipTiles, setPlacedShipTiles] = useState(0);
  const [alertMsg, setAlertMsg] = useState('Place 6 ship tiles on your board to prepare for battle!');

  const TOTAL_REQUIRED_SHIPS = 6;

  useEffect(() => {
    if (!socketMessages) return;
    const { type, payload } = socketMessages;

    switch (type) {
      case 'WAITING_FOR_OPPONENT':
        setGameStatus('SETUP');
        setAlertMsg(payload.msg);
        break;
      case 'GAME_START':
        setGameStatus('PLAYING');
        setAlertMsg('💥 BATTLE COMMENCED! Fire torpedoes at the enemy radar grid!');
        break;
      case 'TORPEDO_LANDED':
        handleIncomingStrike(payload);
        break;
      case 'GAME_OVER':
        setGameStatus('FINISHED');
        setAlertMsg(payload.winnerId === socketId ? '🏆 VICTORY! You destroyed the enemy fleet!' : '💀 DEFEAT! Your fleet was completely sunk.');
        break;
      default:
        break;
    }
  }, [socketMessages]);

  const handlePlacementClick = (row, col) => {
    if (gameStatus !== 'SETUP' || alertMsg.includes('Waiting')) return;

    const updatedBoard = [...myBoard.map(r => [...r])];
    if (updatedBoard[row][col] === 0 && placedShipTiles < TOTAL_REQUIRED_SHIPS) {
      updatedBoard[row][col] = 1;
      setPlacedShipTiles(prev => prev + 1);
    } else if (updatedBoard[row][col] === 1) {
      updatedBoard[row][col] = 0;
      setPlacedShipTiles(prev => prev - 1);
    }

    setMyBoard(updatedBoard);
  };

  const submitFleetConfiguration = () => {
    if (placedShipTiles !== TOTAL_REQUIRED_SHIPS) return;
    sendMessage('SUBMIT_BOARD', { roomId, board: myBoard });
  };

  const handleIncomingStrike = (payload) => {
    const { attackerId, row, col, result } = payload;
    const isMeAttacking = attackerId === socketId;

    if (isMeAttacking) {
      const updatedRadar = [...radarBoard.map(r => [...r])];
      updatedRadar[row][col] = result === 'HIT' ? 3 : 2; // 3 = Hit, 2 = Miss
      setRadarBoard(updatedRadar);
    } else {
      const updatedMyBoard = [...myBoard.map(r => [...r])];
      updatedMyBoard[row][col] = result === 'HIT' ? 3 : 2;
      setMyBoard(updatedMyBoard);
    }
  };

  const fireTorpedoStrike = (row, col) => {
    if (gameStatus !== 'PLAYING') return;
    if (radarBoard[row][col] !== 0) return;

    const coordKey = `${row}-${col}`;
    if (cooldowns[coordKey]) return;

    setCooldowns(prev => ({ ...prev, [coordKey]: true }));
    setTimeout(() => {
      setCooldowns(prev => {
        const copy = { ...prev };
        delete copy[coordKey];
        return copy;
      });
    }, 2000);

    sendMessage('FIRE_TORPEDO', { row, col });
  };

  const getCellStyles = (value, isRadar, row, col) => {
    const coordKey = `${row}-${col}`;
    if (isRadar && cooldowns[coordKey]) return 'bg-amber-600/50 border border-amber-500 animate-pulse cursor-not-allowed';
    
    switch (value) {
      case 1: return 'bg-zinc-600 border border-zinc-400'; // Ship
      case 2: return 'bg-blue-950/40 border border-blue-800/60 text-blue-500 flex items-center justify-center font-bold'; // Miss
      case 3: return 'bg-red-950/50 border border-red-500 text-red-500 flex items-center justify-center font-bold animate-bounce'; // Hit
      default: return 'bg-zinc-950 border border-zinc-900 hover:bg-zinc-800/40 transition-colors'; // Empty
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 max-w-4xl w-full p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
      <div className="w-full text-center p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
        <p className="text-sm font-mono tracking-wide text-zinc-300 font-semibold">{alertMsg}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center w-full">
        <div className="flex flex-col items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">🛡️ Your Defenses</h3>
          <div className="grid grid-cols-6 gap-1 p-1.5 bg-black border border-zinc-800 rounded-xl w-72 h-72">
            {myBoard.map((rowArr, rIdx) =>
              rowArr.map((cellVal, cIdx) => (
                <button
                  key={`my-${rIdx}-${cIdx}`}
                  disabled={gameStatus !== 'SETUP' || alertMsg.includes('Waiting')}
                  onClick={() => handlePlacementClick(rIdx, cIdx)}
                  className={`w-full h-full text-[10px] rounded-sm transition-all ${getCellStyles(cellVal, false)}`}>
                  {cellVal === 2 && '•'}
                  {cellVal === 3 && '✕'}
                </button>
              ))
            )}
          </div>
          {gameStatus === 'SETUP' && !alertMsg.includes('Waiting') && (
            <button
              onClick={submitFleetConfiguration}
              disabled={placedShipTiles !== TOTAL_REQUIRED_SHIPS}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-md disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors cursor-pointer">
              LOCK IN FLEET ({placedShipTiles}/{TOTAL_REQUIRED_SHIPS})
            </button>
          )}
        </div>

        {/* ENEMY RADAR GRID */}
        <div className="flex flex-col items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">🎯 Enemy Tracking Radar</h3>
          <div className="grid grid-cols-6 gap-1 p-1.5 bg-black border border-zinc-800 rounded-xl w-72 h-72">
            {radarBoard.map((rowArr, rIdx) =>
              rowArr.map((cellVal, cIdx) => (
                <button
                  key={`radar-${rIdx}-${cIdx}`}
                  disabled={gameStatus !== 'PLAYING' || cooldowns[`${rIdx}-${cIdx}`]}
                  onClick={() => fireTorpedoStrike(rIdx, cIdx)}
                  className={`w-full h-full text-[10px] rounded-sm transition-all cursor-crosshair ${getCellStyles(cellVal, true, rIdx, cIdx)}`}
                >
                  {cellVal === 2 && '•'}
                  {cellVal === 3 && '💥'}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {gameStatus !== 'SETUP' && (
        <BattleLog socketMessages={socketMessages} socketId={socketId} />
      )}

      {gameStatus === 'FINISHED' && (
        <button
          onClick={onReturnToMenu}
          className="mt-6 px-8 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-sm font-bold uppercase tracking-widest text-emerald-400 rounded-lg shadow-md hover:shadow-emerald-500/5 transition-all cursor-pointer animate-fade-in">
          Return to Main Menu
        </button>
      )}
    </div>
  );
}