import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Paper, TextField, Button, CircularProgress, IconButton, Snackbar, Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useLocation } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useSocket } from '../context/SocketContext';

const DirectMessages = () => {
  const { currentUser } = useAuth();
  const [dialogs, setDialogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingDialogs, setLoadingDialogs] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const location = useLocation();
  const messagesEndRef = React.useRef(null);
  const justOpened = React.useRef(false);
  const socketRef = React.useRef(null);
  const messagesBoxRef = React.useRef(null);
  const lastSelectedUserId = React.useRef(null);
  const selectedUserRef = React.useRef(selectedUser);
  const currentUserRef = React.useRef(currentUser);
  const pendingReadIds = React.useRef(new Set());
  const [inputError, setInputError] = useState(false);
  const [inputHelper, setInputHelper] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const socket = useSocket();

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Загрузка диалогов
  useEffect(() => {
    const fetchDialogs = async () => {
      setLoadingDialogs(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/messages/dialogs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDialogs(res.data);
        
        // Загружаем количество непрочитанных сообщений для каждого диалога
        const unreadData = {};
        for (const dialog of res.data) {
          const otherId = dialog.sender.id === currentUser.id ? dialog.receiver.id : dialog.sender.id;
          try {
            const unreadRes = await axios.get(`/api/messages/unread/${otherId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            unreadData[otherId] = unreadRes.data.count;
          } catch (err) {
            unreadData[otherId] = 0;
          }
        }
        setUnreadCounts(unreadData);
      } catch (err) {
        setDialogs([]);
      } finally {
        setLoadingDialogs(false);
      }
    };
    fetchDialogs();
  }, [currentUser.id]);

  // Открыть диалог по query-параметру user
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('user');
    console.log('[DM] useEffect: userId from query =', userId, 'dialogs.length =', dialogs.length);
    if (userId) {
      if (dialogs.length > 0) {
        const dialog = dialogs.find(d => d.sender.id == userId || d.receiver.id == userId);
        console.log('[DM] useEffect: found dialog =', dialog);
        if (dialog) {
          const other = dialog.sender.id == userId ? dialog.sender : dialog.receiver;
          openChat(other);
          return;
        }
      }
      // Если диалога нет или dialogs еще не загрузились, подгружаем пользователя и открываем пустой чат
      (async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('[DM] useEffect: fetched user for new chat =', res.data);
          openChat(res.data);
        } catch (e) {
          console.error('[DM] useEffect: error fetching user', e);
        }
      })();
    }
  }, [location.search, dialogs]);

  // Загрузка чата с выбранным пользователем
  const openChat = async (user) => {
    console.log('[DM] openChat: user =', user);
    setSelectedUser(user);
    setLoadingChat(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/messages/chat/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[DM] openChat: messages =', res.data);
      justOpened.current = true;
      setMessages(res.data);
      // Пометить как прочитанные
      await axios.post(`/api/messages/read/${user.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Обновить isRead у входящих сообщений
      setMessages(prev => prev.map(m =>
        m.receiverId === currentUser.id ? { ...m, isRead: true } : m
      ));
      // Сбросить счетчик непрочитанных для этого пользователя
      setUnreadCounts(prev => ({
        ...prev,
        [user.id]: 0
      }));
    } catch (err) {
      console.error('[DM] openChat: error loading chat', err);
      setMessages([]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Отправка сообщения
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/messages', {
        receiverId: selectedUser.id,
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([...messages, res.data]);
      setNewMessage('');
      // Если диалога с этим пользователем не было, добавляем его в dialogs
      if (!dialogs.some(d => (d.sender.id === selectedUser.id || d.receiver.id === selectedUser.id))) {
        setDialogs([
          {
            id: res.data.id, // временно, id сообщения
            sender: currentUser,
            receiver: selectedUser,
            content: res.data.content,
            createdAt: res.data.createdAt
          },
          ...dialogs
        ]);
      }
    } catch (err) {}
    setSending(false);
  };

  // --- Вставка изображения из буфера обмена ---
  const handlePaste = async (e) => {
    if (!selectedUser) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const base64 = ev.target.result;
            setSending(true);
            try {
              const token = localStorage.getItem('token');
              const res = await axios.post('/api/messages', {
                receiverId: selectedUser.id,
                content: base64,
                type: 'image'
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setMessages([...messages, res.data]);
            } catch (err) {}
            setSending(false);
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  };

  // --- SOCKET.IO ---
  useEffect(() => {
    if (!socket) return;
    socket.on('connect', () => {
      console.log('[SOCKET] connected', socket.id);
    });
    // Получение нового сообщения
    socket.on('new_message', (msg) => {
      const selectedUser = selectedUserRef.current;
      const currentUser = currentUserRef.current;
      console.log('[SOCKET] new_message', msg, 'selectedUser:', selectedUser, 'currentUser:', currentUser);
      // Если чат с этим пользователем открыт и сообщение адресовано нам — сразу помечаем как прочитанное
      if (
        selectedUser &&
        msg.senderId === selectedUser.id &&
        msg.receiverId === currentUser.id
      ) {
        axios.post(`/api/messages/read/${selectedUser.id}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        // Сбрасываем счетчик непрочитанных для открытого чата
        setUnreadCounts(prev => ({
          ...prev,
          [msg.senderId]: 0
        }));
      }
      // Обновлять только если сообщение связано с текущим пользователем
      if (
        msg.senderId === currentUser?.id ||
        msg.receiverId === currentUser?.id
      ) {
        // Добавлять в сообщения только если это текущий открытый диалог
        if (
          selectedUser &&
          (
            (msg.senderId === selectedUser.id && msg.receiverId === currentUser.id) ||
            (msg.receiverId === selectedUser.id && msg.senderId === currentUser.id)
          )
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        // Обновить диалоги (если новый диалог — добавить или обновить)
        setDialogs(prev => {
          const otherId = msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
          const exists = prev.some(d => (d.sender.id === otherId || d.receiver.id === otherId));
          if (exists) {
            return prev.map(d => {
              if (d.sender.id === otherId || d.receiver.id === otherId) {
                // Всегда брать isRead из последнего сообщения
                return {
                  ...d,
                  content: msg.content,
                  createdAt: msg.createdAt,
                  isRead: msg.isRead
                };
              }
              return d;
            });
          } else {
            return [
              {
                id: msg.id,
                sender: msg.sender,
                receiver: msg.receiver,
                content: msg.content,
                createdAt: msg.createdAt,
                isRead: msg.isRead
              },
              ...prev
            ];
          }
        });
        
        // Обновить счетчики непрочитанных сообщений
        if (msg.receiverId === currentUser?.id && !msg.isRead) {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.senderId]: (prev[msg.senderId] || 0) + 1
          }));
        }
      }
    });
    // Реактивное обновление статуса прочтения
    socket.on('messages_read', ({ readerId, senderId, messageIds }) => {
      console.log('[SOCKET] messages_read', { readerId, senderId, messageIds }, messages);
      if (senderId == currentUserRef.current?.id && Array.isArray(messageIds)) {
        // Проверяем, есть ли все эти id в messages
        const missingIds = messageIds.filter(
          id => !messages.some(m => m.id === id || m.id === String(id))
        );
        if (missingIds.length > 0) {
          missingIds.forEach(id => pendingReadIds.current.add(id));
        }
        // Обновляем те, что уже есть
        setMessages(prev => prev.map(m =>
          messageIds.includes(m.id) || messageIds.includes(String(m.id))
            ? { ...m, isRead: true }
            : m
        ));
      }
    });
    
    // Обновление счетчиков непрочитанных при прочтении
    socket.on('messages_read', ({ readerId, senderId, messageIds }) => {
      if (readerId === currentUserRef.current?.id && messageIds.length > 0) {
        setUnreadCounts(prev => {
          const newCounts = { ...prev };
          if (newCounts[senderId] !== undefined) {
            newCounts[senderId] = Math.max(0, newCounts[senderId] - messageIds.length);
          }
          return newCounts;
        });
      }
    });
    return () => {
      socket.off('connect');
      socket.off('new_message');
      socket.off('messages_read');
    };
  }, [socket]);

  useEffect(() => {
    if (pendingReadIds.current.size > 0 && messages.length > 0) {
      setMessages(prev => prev.map(m =>
        pendingReadIds.current.has(m.id) || pendingReadIds.current.has(String(m.id))
          ? { ...m, isRead: true }
          : m
      ));
      // Очищаем только те id, которые теперь есть в messages
      messages.forEach(m => {
        pendingReadIds.current.delete(m.id);
        pendingReadIds.current.delete(String(m.id));
      });
    }
  }, [messages]);

  // Скролл вниз при изменении сообщений или открытии диалога (только если selectedUser сменился)
  useEffect(() => {
    if (
      selectedUser &&
      selectedUser.id !== lastSelectedUserId.current &&
      messagesBoxRef.current
    ) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
      lastSelectedUserId.current = selectedUser.id;
    }
  }, [messages, selectedUser]);

  // Скролл вниз при любом обновлении сообщений
  useEffect(() => {
    if (justOpened.current && messagesBoxRef.current) {
      let attempts = 0;
      const maxAttempts = 20; // ~400ms
      function tryScroll() {
        const box = messagesBoxRef.current;
        if (box && box.scrollHeight > box.clientHeight + 10) {
          box.scrollTop = box.scrollHeight;
          justOpened.current = false;
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryScroll, 20);
        } else {
          justOpened.current = false;
        }
      }
      tryScroll();
    } else if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTo({ top: messagesBoxRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length > 256) {
      setInputError(true);
      setInputHelper('Максимум 256 символов');
      setTimeout(() => setInputError(false), 1500);
      setTimeout(() => setInputHelper(''), 2000);
      return;
    }
    setNewMessage(val);
  };

  return (
    <Box sx={{
      display: 'flex',
      height: 500,
      bgcolor: 'rgba(35,37,38,0.98)',
      background: 'none',
      borderRadius: 3,
      overflow: 'hidden',
      boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
      border: '2px solid #ffb347',
      position: 'relative',
    }}>
      {/* Список диалогов */}
      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <Paper sx={{
          width: 300,
          bgcolor: 'rgba(35,37,38,0.98)',
          background: 'none',
          p: 0,
          overflowY: 'auto',
          boxShadow: 'none',
          borderRadius: 0,
          border: 'none',
          height: '100%',
          zIndex: 1,
        }}>
          <Box sx={{
            p: '16px',
            minHeight: 56,
            bgcolor: 'rgba(255,179,71,0.10)',
            borderBottom: '1px solid #ffd580',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 1, fontSize: '1.25rem', m: 0 }}>Диалоги</Typography>
            {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
              <Box sx={{
                bgcolor: '#ffb347',
                color: '#000',
                borderRadius: '50%',
                minWidth: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                px: 0.5
              }}>
                {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
              </Box>
            )}
          </Box>
          {loadingDialogs ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box> :
            <List>
              {dialogs.length === 0 && !selectedUser && <Typography sx={{ color: '#fff', p: 2 }}>Нет диалогов</Typography>}
              {/* Показываем выбранного пользователя, если его нет в dialogs */}
              {selectedUser && !dialogs.some(d => (d.sender.id === selectedUser.id || d.receiver.id === selectedUser.id)) && (
                <React.Fragment key={selectedUser.id}>
                  <ListItem button selected={true} onClick={() => openChat(selectedUser)} alignItems="flex-start"
                    sx={{
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'rgba(255, 179, 71, 0.10)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={selectedUser.avatar} sx={{ bgcolor: selectedUser.avatar ? 'transparent' : '#ffb347' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={<span style={{ color: '#ffb347', fontWeight: 600 }}>{selectedUser.username}</span>}
                      secondary={<span style={{ color: '#fff', opacity: 0.7 }}>Нет сообщений</span>}
                    />
                  </ListItem>
                  <Divider component="li" sx={{ borderColor: 'rgba(255, 179, 71, 0.2)' }} />
                </React.Fragment>
              )}
              {dialogs.map(dialog => {
                const other = dialog.sender.id === currentUser.id ? dialog.receiver : dialog.sender;
                const unreadCount = unreadCounts[other.id] || 0;
                return (
                  <React.Fragment key={other.id}>
                    <ListItem button selected={selectedUser?.id === other.id} onClick={() => openChat(other)} alignItems="flex-start"
                      sx={{
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          background: 'rgba(255, 179, 71, 0.10)',
                        },
                        ...(unreadCount > 0 && {
                          background: 'rgba(255, 179, 71, 0.15)',
                          borderLeft: '3px solid #ffb347',
                        }),
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={other.avatar} sx={{ bgcolor: other.avatar ? 'transparent' : '#ffb347' }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#ffb347', fontWeight: 600 }}>{other.username}</span>
                            {unreadCount > 0 && (
                              <Box sx={{
                                bgcolor: '#ffb347',
                                color: '#000',
                                borderRadius: '50%',
                                minWidth: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                px: 0.5
                              }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </Box>
                            )}
                          </Box>
                        }
                        secondary={dialog.content.length > 10 ? dialog.content.slice(0, 10) + '...' : dialog.content}
                        secondaryTypographyProps={{ style: { color: '#fff' } }}
                      />
                    </ListItem>
                    <Divider component="li" sx={{ borderColor: 'rgba(255, 179, 71, 0.2)' }} />
                  </React.Fragment>
                );
              })}
            </List>
          }
        </Paper>
        {/* Вертикальный разделитель */}
        <Box sx={{ width: '1px', bgcolor: '#ffd580', height: '100%', alignSelf: 'stretch', zIndex: 2 }} />
      </Box>
      {/* Окно чата */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'rgba(35,37,38,0.98)',
        background: 'none',
        borderRadius: 0,
      }}>
        {selectedUser ? (
          <>
            <Box sx={{
              p: '16px',
              minHeight: 56,
              bgcolor: 'rgba(255,179,71,0.10)',
              borderBottom: '1px solid #ffd580',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}>
              <Typography variant="subtitle1" sx={{ color: '#ffb347', fontWeight: 700, fontSize: '1.15rem', m: 0 }}>{selectedUser.username}</Typography>
            </Box>
            <Box
              ref={messagesBoxRef}
              sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              {loadingChat ? <CircularProgress /> :
                messages.length === 0 ? <Typography sx={{ color: '#fff', mt: 2 }}>Нет сообщений</Typography> :
                  messages.map(msg => {
                    const isOwn = msg.senderId === currentUser.id;
                    if (msg.type === 'image' && msg.content.startsWith('data:image/')) {
                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            flexDirection: isOwn ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            mb: 1.5,
                            animation: 'fadeInMsg 0.4s',
                          }}
                        >
                          {!isOwn && (
                            <Avatar
                              src={selectedUser?.avatar}
                              sx={{ width: 32, height: 32, mr: 1, bgcolor: selectedUser?.avatar ? 'transparent' : '#ffb347' }}
                            />
                          )}
                          <Paper
                            sx={{
                              p: 1.5,
                              bgcolor: isOwn ? 'rgba(255,179,71,0.95)' : 'rgba(40,40,45,0.95)',
                              color: isOwn ? '#232526' : '#fff',
                              borderRadius: isOwn ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                              boxShadow: isOwn ? '0 2px 12px rgba(255,179,71,0.18)' : '0 2px 12px rgba(0,0,0,0.18)',
                              maxWidth: '70%',
                              minWidth: 60,
                              wordBreak: 'break-word',
                              position: 'relative',
                              transition: 'background 0.2s',
                            }}
                          >
                            <img src={msg.content} alt="Вложение" style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }} />
                            <Typography variant="caption" sx={{ color: isOwn ? 'rgba(35,37,38,0.5)' : 'rgba(255,255,255,0.5)', display: 'block', textAlign: isOwn ? 'right' : 'left', mt: 0.5 }}>
                              {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              {isOwn && msg.isRead && (
                                <DoneAllIcon 
                                  sx={{ 
                                    color: '#fff', 
                                    fontSize: 16, 
                                    marginLeft: 6, 
                                    verticalAlign: 'middle' 
                                  }} 
                                />
                              )}
                            </Typography>
                          </Paper>
                        </Box>
                      );
                    }
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          flexDirection: isOwn ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          mb: 1.5,
                          animation: 'fadeInMsg 0.4s',
                        }}
                      >
                        {/* Аватар только у чужих сообщений */}
                        {!isOwn && (
                          <Avatar
                            src={selectedUser?.avatar}
                            sx={{ width: 32, height: 32, mr: 1, bgcolor: selectedUser?.avatar ? 'transparent' : '#ffb347' }}
                          />
                        )}
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: isOwn ? 'rgba(255,179,71,0.95)' : 'rgba(40,40,45,0.95)',
                            color: isOwn ? '#232526' : '#fff',
                            borderRadius: isOwn ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                            boxShadow: isOwn ? '0 2px 12px rgba(255,179,71,0.18)' : '0 2px 12px rgba(0,0,0,0.18)',
                            maxWidth: '70%',
                            minWidth: 60,
                            wordBreak: 'break-word',
                            position: 'relative',
                            transition: 'background 0.2s',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.08rem', mb: 0.5 }}>{msg.content}</Typography>
                          <Typography variant="caption" sx={{ color: isOwn ? 'rgba(35,37,38,0.5)' : 'rgba(255,255,255,0.5)', display: 'block', textAlign: isOwn ? 'right' : 'left', mt: 0.5 }}>
                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            {/* Галочка прочтения */}
                            {isOwn && msg.isRead && (
                              <DoneAllIcon 
                                sx={{ 
                                  color: '#fff', 
                                  fontSize: 16, 
                                  marginLeft: 6, 
                                  verticalAlign: 'middle' 
                                }} 
                              />
                            )}
                          </Typography>
                        </Paper>
                      </Box>
                    );
                  })
              }
              <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ p: 2, borderTop: '1px solid #ffb347', display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'rgba(255,179,71,0.07)' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  inputProps={{ maxLength: 256 }}
                  error={inputError}
                  helperText={inputHelper}
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.18)',
                    input: { color: '#fff' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: inputError ? '#f44336' : '#ffb347' },
                      '&:hover fieldset': { borderColor: inputError ? '#f44336' : '#ffd580' },
                      '&.Mui-focused fieldset': { borderColor: inputError ? '#f44336' : '#ffb347' }
                    }
                  }}
                  disabled={sending}
                  onPaste={handlePaste}
                />
                <IconButton color="primary" onClick={handleSend} disabled={sending || !newMessage.trim()} sx={{ bgcolor: '#ffb347', color: '#000', '&:hover': { bgcolor: '#ffd580' } }}>
                  <SendIcon />
                </IconButton>
              </Box>
              <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                <Typography variant="caption" sx={{
                  color:
                    newMessage.length === 256 ? '#f44336'
                    : newMessage.length >= 236 ? '#ff9800'
                    : 'rgba(255,255,255,0.7)'
                }}>
                  {newMessage.length}/256 символов
                </Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', opacity: 0.7 }}>Выберите диалог</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Добавить keyframes для fadeInMsg
const style = document.createElement('style');
style.innerHTML = `@keyframes fadeInMsg { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }`;
document.head.appendChild(style);

export default DirectMessages; 