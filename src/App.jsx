

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import './style.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedName = Cookies.get('chat_name');
    if (savedName) {
      setName(savedName);
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // WebSocket 연결
  useEffect(() => {
    if (!name) return;
    const socket = new window.WebSocket('ws://' + window.location.hostname + ':80');
    setWs(socket);

    socket.onopen = () => {
      // 연결 성공 시
    };
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init') {
          setMessages(data.messages || []);
        } else if (data.type === 'chat') {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (e) {}
    };
    socket.onclose = () => {};
    return () => socket.close();
  }, [name]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !ws || ws.readyState !== 1) return;
    const msg = {
      type: 'chat',
      name,
      text: input,
      time: new Date().toLocaleTimeString(),
    };
    ws.send(JSON.stringify(msg));
    setInput('');
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setName(nameInput);
    Cookies.set('chat_name', nameInput, { expires: 30 });
  };

  if (!name) {
    return (
      <div className="chat-container">
        <form className="name-form" onSubmit={handleNameSubmit}>
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="이름을 입력하세요"
            autoFocus
          />
          <button type="submit">입장</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-log">
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message">
            <span className="chat-time">[{msg.time}]</span>
            {msg.name ? <b className="chat-name">{msg.name}</b> : null} {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          autoFocus
        />
        <button type="submit">전송</button>
      </form>
    </div>
  );
}
