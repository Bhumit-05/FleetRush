// src/components/BattleLog.js
'use client';
import { useState, useEffect, useRef } from 'react';

export default function BattleLog({ socketMessages, socketId }) {
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  const formatCoordinates = (row, col) => {
    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    return `${rowLetters[row]}${col + 1}`;
  };

  const getTimestamp = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  const appendLog = (text, type = 'system') => {
    const colorClasses = {
      system: 'text-zinc-500',
      success: 'text-emerald-400 font-medium',
      danger: 'text-rose-500 font-medium',
      hit: 'text-amber-400 font-bold tracking-wide animate-pulse',
      miss: 'text-blue-400'
    };

    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: getTimestamp(),
      message: text,
      style: colorClasses[type] || colorClasses.system
    };

    setLogs((prev) => [...prev, newEntry]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  useEffect(() => {
    if (!socketMessages) return;
    const { type, payload } = socketMessages;

    switch (type) {
      case 'GAME_START':
        setLogs([]);
        appendLog('SECURE GRID ENCRYPTION LINK ESTABLISHED.', 'system');
        appendLog('BATTLE ENGAGED! ALL BATTERIES ONLINE. FIRE AT WILL.', 'success');
        break;

      case 'TORPEDO_LANDED':
        const { attackerId, row, col, result } = payload;
        const coord = formatCoordinates(row, col);
        const isMe = attackerId === socketId;

        if (result === 'HIT') {
          if (isMe) {
            appendLog(`CRITICAL DIRECT HIT! Your torpedo struck the enemy at tactical zone ${coord}!`, 'hit');
          } else {
            appendLog(`HULL BREACH! Enemy torpedo scored a direct hit against your fleet at zone ${coord}!`, 'danger');
          }
        } else if (result === 'MISS') {
          if (isMe) {
            appendLog(`Kinetic splash. Shot at tactical zone ${coord} registered as a MISS.`, 'miss');
          } else {
            appendLog(`Defensive check passed. Incoming enemy projectile missed your fleet at zone ${coord}.`, 'success');
          }
        }
        break;

      case 'OPPONENT_DISCONNECTED':
        appendLog('WARNING: Enemy communication link dropped out entirely.', 'danger');
        appendLog('Match aborted by system protocol.', 'system');
        break;

      default:
        break;
    }
  }, [socketMessages, socketId]);

  return (
    <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-900 rounded-xl p-4 mt-4 shadow-inner flex flex-col h-40">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2 text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-bold">
        <span>COMBAT LOG</span>
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>STREAMING ACTIVE</span>
        </span>
      </div>

      {/* Scrolling Text Window Frame */}
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {logs.length === 0 ? (
          <p className="text-zinc-600 italic animate-pulse">Initializing telemetry feeds... Awaiting fleet lock verification status...</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-zinc-600 font-semibold selection:bg-zinc-800">[{log.time}]</span>
              <span className={log.style}>{log.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}