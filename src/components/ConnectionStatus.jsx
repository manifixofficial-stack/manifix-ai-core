import React, { useState, useEffect } from 'react';
import { socket } from '../socket';

function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Synchronize initial component local variables state
    setIsConnected(socket.connected);

    const handleConnectEvent = () => setIsConnected(true);
    const handleDisconnectEvent = () => setIsConnected(false);

    // Register primary core transport layer event listeners
    socket.on('connect', handleConnectEvent);
    socket.on('disconnect', handleDisconnectEvent);

    // Clean up connections on unmount to prevent background processing loops
    return () => {
      socket.off('connect', handleConnectEvent);
      socket.off('disconnect', handleDisconnectEvent);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: isConnected ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 51, 51, 0.1)',
        border: isConnected ? '1px solid rgba(255, 202, 40, 0.3)' : '1px solid #ff3333',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        fontFamily: 'monospace',
        zIndex: 999,
        pointerEvents: 'none',
        boxShadow: isConnected ? '0 0 10px rgba(255, 202, 40, 0.05)' : '0 0 15px rgba(255, 51, 51, 0.2)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* The glowing signal element */}
      <span 
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: isConnected ? '#ffca28' : '#ff3333',
          boxShadow: isConnected ? '0 0 8px #ffca28' : '0 0 8px #ff3333',
          display: 'inline-block',
          animation: isConnected ? 'none' : 'blinkAnimation 1s infinite'
        }}
      />
      
      <span style={{ color: isConnected ? '#f5f5f7' : '#ff3333' }}>
        {isConnected ? 'GRID LINKED' : 'OFFLINE - ENGINE SEARCHING'}
      </span>

      {/* Global CSS animation rules injected inline safely */}
      <style>{`
        @keyframes blinkAnimation {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ConnectionStatus;
