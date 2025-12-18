const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
let chatLog = [];

wss.on('connection', function connection(ws) {
  // 새 클라이언트에게 기존 채팅 로그 전송
  ws.send(JSON.stringify({ type: 'init', messages: chatLog }));

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'chat') {
        const msg = {
          name: data.name,
          text: data.text,
          time: data.time,
        };
        chatLog.push(msg);
        // 모든 클라이언트에게 새 메시지 전송
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'chat', message: msg }));
          }
        });
      }
    } catch (e) {
      // 무시
    }
  });
});

console.log('WebSocket chat server running on ws://localhost:8080');
