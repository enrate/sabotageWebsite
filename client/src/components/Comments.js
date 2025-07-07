import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import {
  Send as SendIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEmotions as EmojiIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import Loader from './Loader';

const Comments = ({ newsId }) => {
  const { currentUser } = useAuth();
  console.log('Comments rendered', currentUser, newsId);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Эмодзи для быстрого вставки
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
    '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀',
    '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽',
    '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💌', '💘', '💝', '💖',
    '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛',
    '💚', '💙', '💜', '🖤', '💯', '💢', '💥', '💫', '💦', '💨',
    '🕳️', '💬', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋',
    '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
    '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾',
    '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷',
    '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '💧', '💦', '💨',
    '💩', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '🗨️',
    '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌',
    '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
    '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌',
    '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
    '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️',
    '👅', '👄', '💋', '🩸', '💧', '💦', '💨', '💩', '💯', '💢',
    '💥', '💫', '💦', '💨', '🕳️', '💬', '🗨️', '🗯️', '💭', '💤'
  ];

  useEffect(() => {
    setLoading(true);
    fetchComments();
  }, [newsId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comments/news/${newsId}`);
      setComments(response.data);
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', err);
      setError('Ошибка загрузки комментариев');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/comments', {
        content: newComment,
        newsId,
        parentId: replyTo?.id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (replyTo) {
        setComments(prevComments => prevComments.map(comment =>
          comment.id === replyTo.id
            ? { ...comment, replies: [...(comment.replies || []), response.data] }
            : comment
        ));
      } else {
        setComments(prevComments => [response.data, ...prevComments]);
      }

      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при добавлении комментария');
    }
  };

  const handleEditComment = async () => {
    if (!editContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/comments/${editingComment.id}`, {
        content: editContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (editingComment.parentId) {
        setComments(prevComments => prevComments.map(comment => {
          if (comment.replies && comment.replies.some(r => r.id === editingComment.id)) {
            return {
              ...comment,
              replies: comment.replies.map(r => r.id === editingComment.id ? response.data : r)
            };
          }
          return comment;
        }));
      } else {
        setComments(prevComments => prevComments.map(comment =>
          comment.id === editingComment.id ? response.data : comment
        ));
      }

      setEditingComment(null);
      setEditContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при редактировании комментария');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Удалить этот комментарий?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments(prevComments => prevComments
        .map(comment => {
          if (comment.replies && comment.replies.some(r => r.id === commentId)) {
            return {
              ...comment,
              replies: comment.replies.filter(r => r.id !== commentId)
            };
          }
          return comment;
        })
        .filter(comment => comment.id !== commentId)
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении комментария');
    }
  };

  const handleEmojiClick = (emoji) => {
    if (editingComment) {
      setEditContent(editContent + emoji);
    } else {
      setNewComment(newComment + emoji);
    }
    setShowEmojiPicker(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditComment = (comment) => {
    return currentUser && (comment.user.id === currentUser.id || currentUser.role === 'admin');
  };

  const canDeleteComment = (comment) => {
    return currentUser && (comment.user.id === currentUser.id || currentUser.role === 'admin');
  };

  return (
    <Paper
      elevation={8}
      sx={{
        p: 4,
        mb: 4,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 179, 71, 0.2)'
      }}
    >
      <Typography variant="h6" sx={{ color: '#ffb347', mb: 3 }}>
        Комментарии ({comments.length})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && comments.length === 0 ? (
        <Loader />
      ) : <>
      {/* Форма добавления комментария (только если не replyTo) */}
      {currentUser && !replyTo && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 179, 71, 0.2)' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <IconButton 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              sx={{ color: '#ffb347' }}
            >
              <EmojiIcon />
            </IconButton>
          </Box>
          {showEmojiPicker && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: 2,
              border: '1px solid rgba(255, 179, 71, 0.2)',
              maxHeight: 200,
              overflow: 'auto'
            }}>
              <Typography variant="subtitle2" sx={{ color: '#ffb347', mb: 1 }}>
                Выберите эмодзи:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {emojis.map((emoji, index) => (
                  <Chip
                    key={index}
                    label={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      '&:hover': {
                        bgcolor: 'rgba(255, 179, 71, 0.2)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 179, 71, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: '#ffb347',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffb347',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmitComment}
              disabled={loading || !newComment.trim()}
              startIcon={<SendIcon />}
              sx={{
                bgcolor: '#ffb347',
                color: '#000',
                '&:hover': {
                  bgcolor: '#ffd580'
                }
              }}
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </Button>
          </Box>
        </Paper>
      )}
      {/* Список комментариев */}
      {comments.map((comment) => (
        <Paper key={comment.id} sx={{ p: 3, mb: 2, bgcolor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 179, 71, 0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              src={comment.user.avatar}
              sx={{
                bgcolor: comment.user.avatar ? 'transparent' : '#ffb347',
                width: 40,
                height: 40
              }}
            >
              {!comment.user.avatar && <PersonIcon />}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#ffb347', fontWeight: 600 }}>
                  {comment.user.username}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {formatDate(comment.createdAt)}
                </Typography>
              </Box>

              {editingComment?.id === comment.id ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 179, 71, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#ffb347',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffb347',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#fff',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      onClick={handleEditComment}
                      disabled={loading}
                      sx={{ bgcolor: '#ffb347', color: '#000' }}
                    >
                      Сохранить
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      Отмена
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
                  {comment.content}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentUser && (
                  <Button
                    size="small"
                    startIcon={<ReplyIcon />}
                    onClick={() => setReplyTo(comment)}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    Ответить
                  </Button>
                )}

                {canEditComment(comment) && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setEditingComment(comment);
                      setEditContent(comment.content);
                    }}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    Редактировать
                  </Button>
                )}

                {canDeleteComment(comment) && (
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteComment(comment.id)}
                    sx={{
                      color: '#f44336',
                      '&:hover': {
                        bgcolor: 'rgba(244, 67, 54, 0.1)'
                      }
                    }}
                  >
                    Удалить
                  </Button>
                )}
              </Box>

              {/* Форма для ответа под этим комментарием */}
              {currentUser && replyTo?.id === comment.id && (
                <Paper sx={{ p: 2, mb: 2, mt: 2, bgcolor: 'rgba(255, 179, 71, 0.07)', border: '1px solid rgba(255, 179, 71, 0.2)' }}>
                  <Typography variant="body2" sx={{ color: '#ffb347', mb: 1 }}>
                    Ответ на комментарий {replyTo.user.username}:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                    {replyTo.content}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Написать ответ..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 179, 71, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#ffb347',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffb347',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiInputBase-input': {
                        color: '#fff',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmitComment}
                      disabled={loading || !newComment.trim()}
                      startIcon={<SendIcon />}
                      sx={{
                        bgcolor: '#ffb347',
                        color: '#000',
                        '&:hover': {
                          bgcolor: '#ffd580'
                        }
                      }}
                    >
                      {loading ? 'Отправка...' : 'Ответить'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setReplyTo(null)}
                      sx={{
                        borderColor: 'rgba(255, 179, 71, 0.5)',
                        color: '#ffb347',
                        '&:hover': {
                          borderColor: '#ffb347',
                          bgcolor: 'rgba(255, 179, 71, 0.1)'
                        }
                      }}
                    >
                      Отмена
                    </Button>
                  </Box>
                </Paper>
              )}

              {/* Ответы на комментарий */}
              {comment.replies && comment.replies.length > 0 && (
                <Box sx={{ mt: 2, ml: 3 }}>
                  {comment.replies.map((reply) => (
                    <Paper key={reply.id} sx={{ p: 2, mb: 1, bgcolor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 179, 71, 0.1)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                          src={reply.user.avatar}
                          sx={{
                            bgcolor: reply.user.avatar ? 'transparent' : '#ffb347',
                            width: 32,
                            height: 32
                          }}
                        >
                          {!reply.user.avatar && <PersonIcon />}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" sx={{ color: '#ffb347', fontWeight: 600 }}>
                              {reply.user.username}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {formatDate(reply.createdAt)}
                            </Typography>
                          </Box>

                          {editingComment?.id === reply.id ? (
                            <Box>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                      borderColor: 'rgba(255, 179, 71, 0.3)',
                                    },
                                    '&:hover fieldset': {
                                      borderColor: '#ffb347',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#ffb347',
                                    },
                                  },
                                  '& .MuiInputBase-input': {
                                    color: '#fff',
                                  },
                                }}
                              />
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                  size="small"
                                  onClick={handleEditComment}
                                  disabled={loading}
                                  sx={{ bgcolor: '#ffb347', color: '#000' }}
                                >
                                  Сохранить
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setEditingComment(null);
                                    setEditContent('');
                                  }}
                                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                >
                                  Отмена
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 1 }}>
                              {reply.content}
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {canEditComment(reply) && (
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => {
                                  setEditingComment(reply);
                                  setEditContent(reply.content);
                                }}
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '0.75rem'
                                }}
                              >
                                Редактировать
                              </Button>
                            )}

                            {canDeleteComment(reply) && (
                              <Button
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteComment(reply.id)}
                                sx={{
                                  color: '#f44336',
                                  fontSize: '0.75rem'
                                }}
                              >
                                Удалить
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      ))}
      {comments.length === 0 && !loading && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 179, 71, 0.2)' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Пока нет комментариев. Будьте первым!
          </Typography>
        </Paper>
      )}
      </>}
    </Paper>
  );
};

export default Comments; 