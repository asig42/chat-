

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import './style.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [ws, setWs] = useState(null);
  const [dmInput, setDmInput] = useState('');
  const [dmTarget, setDmTarget] = useState('');
  const [unreadDM, setUnreadDM] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  // 새 메시지 수(전체) 알림: 포커스가 아닐 때만 증가
  useEffect(() => {
    const handleFocus = () => setUnreadCount(0);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (document.hasFocus()) {
      setUnreadCount(0);
    }
  }, [messages]);

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) 간단 채팅앱`;
    } else {
      document.title = '간단 채팅앱';
    }
  }, [unreadCount]);

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

  // 미확인 DM 카운트 계산
  useEffect(() => {
    if (!name) return;
    const count = messages.filter(
      (msg) => msg.type === 'dm' && msg.nameTo === name && !msg.read
    ).length;
    setUnreadDM(count);
  }, [messages, name]);

  // WebSocket 연결
  useEffect(() => {
    if (!name) return;
    const socket = new window.WebSocket('ws://' + window.location.hostname + ':8080');
    setWs(socket);

    socket.onopen = () => {
      // 연결 성공 시
    };
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init') {
          setMessages(data.messages || []);
        } else if (data.type === 'chat' || data.type === 'dm') {
          setMessages(prev => {
            // 새 메시지 수 증가(포커스 아닐 때만)
            if (!document.hasFocus()) setUnreadCount(c => c + 1);
            return [...prev, data.message];
          });
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

  // DM 전송
  const sendDM = (e) => {
    e.preventDefault();
    if (!dmInput.trim() || !dmTarget.trim() || !ws || ws.readyState !== 1) return;
    const msg = {
      type: 'dm',
      name,
      nameTo: dmTarget,
      text: dmInput,
      time: new Date().toLocaleTimeString(),
      read: false,
    };
    ws.send(JSON.stringify(msg));
    setDmInput('');
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
      <div className="chat-header" style={{padding:'8px 16px',borderBottom:'1px solid #eee',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span><b>채팅앱</b></span>
        <span style={{position:'relative'}}>
          <span>DM</span>
          {unreadDM > 0 && (
            <span style={{background:'#d32f2f',color:'#fff',borderRadius:'50%',padding:'2px 7px',fontSize:'13px',marginLeft:'6px',verticalAlign:'middle'}}>
              {unreadDM}
            </span>
          )}
        </span>
      </div>
      <div className="chat-log">
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message" style={msg.type==='dm' && msg.nameTo===name ? {background:'#fffbe6'} : {}}>
            <span className="chat-time">[{msg.time}]</span>
            {msg.name ? <b className="chat-name">{msg.name}</b> : null} {msg.text}
            {msg.type==='dm' && msg.nameTo===name && <span style={{color:'#d32f2f',fontSize:'12px',marginLeft:'8px'}}>(DM)</span>}
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
      {/* DM 입력 폼 제거됨 */}
    </div>
  );
}
