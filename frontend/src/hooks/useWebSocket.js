import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for WebSocket chat with streaming support.
 * Handles connection, reconnection, and message streaming.
 */
export function useWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);
  const streamBufferRef = useRef('');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`ws://localhost:8000/api/chat/ws/${sessionId}`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'start':
          setIsStreaming(true);
          streamBufferRef.current = '';
          // Add empty assistant message that we'll stream into
          setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
          break;

        case 'token':
          streamBufferRef.current += data.content;
          // Update the last message with new content
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: streamBufferRef.current,
              };
            }
            return updated;
          });
          break;

        case 'done':
          setIsStreaming(false);
          // Mark streaming as complete
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0) {
              updated[lastIdx] = { ...updated[lastIdx], streaming: false };
            }
            return updated;
          });
          break;

        case 'error':
          setIsStreaming(false);
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: `Error: ${data.content}`, error: true },
          ]);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [sessionId]);

  const sendMessage = useCallback((message, displayMessage = null) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: displayMessage || message }]);

    // Send to server
    wsRef.current.send(JSON.stringify({ message }));
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    messages,
    isConnected,
    isStreaming,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  };
}
