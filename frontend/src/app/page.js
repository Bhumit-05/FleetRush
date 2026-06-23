'use client';
import { useEffect, useState } from 'react';
import AuthForm from '../components/AuthForm';
import MainMenu from '../components/MainMenu';
import MatchmakerQueue from '../components/MatchmakerQueue';
import GameBoard from '../components/GameBoard'; 
import { useWebSocket } from '../hooks/useWebsocket';

export default function Home() {
  const [user, setUser] = useState(null); 
  const [matchStatus, setMatchStatus] = useState('LOBBY');
  const [roomId, setRoomId] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [latestSocketMessage, setLatestSocketMessage] = useState(null); 

  useEffect(() => {
    const savedUser = localStorage.getItem('fleetrush_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('fleetrush_user');
      }
    }
  }, []);

  const handleAuthSuccess = (authPayload) => {
    localStorage.setItem('fleetrush_token', authPayload.token);
    localStorage.setItem('fleetrush_user', JSON.stringify(authPayload.user)); 
    setUser(authPayload.user);
  };

  const fetchFreshStats = async () => {
    if (!user) return;
    const token = localStorage.getItem('fleetrush_token');

    try {
      const res = await fetch(`http://localhost:4000/api/user/${user.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const freshData = await res.json();
      if (res.ok) {
        setUser(freshData); 
        localStorage.setItem('fleetrush_user', JSON.stringify(freshData));
      }
    } catch (err) {
      console.error('Failed to pull fresh user stats:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fleetrush_user');
    localStorage.removeItem('fleetrush_token');
    setUser(null);
    setMatchStatus('LOBBY');
  };

  const handleSocketMessage = (type, payload) => {
    setLatestSocketMessage({ type, payload });

    switch (type) {
      case 'MATCH_FOUND':
        setRoomId(payload.roomId);
        setOpponentId(payload.opponentId);
        setMatchStatus('PLAYING');
        break;
      case 'OPPONENT_DISCONNECTED':
        alert(payload.msg || 'Opponent abandoned the game.');
        setMatchStatus('LOBBY');
        setRoomId(null);
        setOpponentId(null);
        setLatestSocketMessage(null); 
        break;
      default:
        break;
    }
  };

  const { socketConnected, socketId, sendMessage } = useWebSocket(
    'ws://localhost:4000',
    handleSocketMessage
  );

  const handleEnterQueue = () => {
    if (!user) return;
    setMatchStatus('QUEUED');
    sendMessage('JOIN_QUEUE', { username: user.username });
  };

  const handleCancelMatchmaking = () => {
    sendMessage('LEAVE_QUEUE', {});
    setMatchStatus('LOBBY');
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      {/* Network Connection Indicator & Persistent Logout Tag */}
      <div className="absolute top-4 right-4 flex items-center space-x-4 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-zinc-400 font-medium">
            {socketConnected ? `WS CONNECTED: ${socketId?.slice(0, 6)}...` : 'WS OFFLINE'}
          </span>
        </div>
        
        {user && (
          <button 
            onClick={handleLogout}
            className="text-zinc-500 hover:text-rose-400 font-bold transition-colors cursor-pointer border-l border-zinc-800 pl-3 uppercase tracking-wider text-[10px]">
            Logout
          </button>
        )}
      </div>

      {!user ? (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      ) : matchStatus === 'LOBBY' ? (
        <MainMenu user={user} onEnterQueue={handleEnterQueue} />
      ) : matchStatus === 'QUEUED' ? (
        <MatchmakerQueue onCancel={handleCancelMatchmaking} />
      ) : (
        <GameBoard
          socketId={socketId}
          roomId={roomId}
          opponentId={opponentId}
          sendMessage={sendMessage}
          socketMessages={latestSocketMessage}
          onReturnToMenu={async () => {
            await fetchFreshStats(); 
            setMatchStatus('LOBBY');
            setRoomId(null);
            setOpponentId(null);
            setLatestSocketMessage(null);
          }}
        />
      )}
    </main>
  );
}