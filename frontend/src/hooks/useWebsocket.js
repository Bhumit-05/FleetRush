import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url, onMessageReceived) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setSocketConnected(true);
      console.log('⚡ WebSocket Connection established with core engine.');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        if (type === 'CONNECTED') {
          setSocketId(payload.socketId);
        }

        if (onMessageReceived) {
          onMessageReceived(type, payload);
        }
      } catch (err) {
        console.error('Error parsing incoming WS frame:', err);
      }
    };

    ws.onclose = () => {
      setSocketConnected(false);
      console.log('Disconnected from backend socket stream.');
    };

    return () => {
      if (ws) ws.close();
    };
  }, [url]);

  const sendMessage = (type, payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.error('Cannot transmit message: WebSocket pipeline is closed.');
    }
  };

  return { socketConnected, socketId, sendMessage };
}