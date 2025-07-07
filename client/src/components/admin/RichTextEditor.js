import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  EmojiEmotions as EmojiIcon,
  Link as LinkIcon
} from '@mui/icons-material';

const RichTextEditor = ({ value, onChange, placeholder = "Введите текст..." }) => {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const quillRef = useRef(null);

  // Настройки редактора
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

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

  const handleImageInsert = () => {
    if (imageUrl.trim() && quillRef.current) {
      try {
        const range = quillRef.current.getSelection();
        if (range) {
          quillRef.current.insertEmbed(range.index, 'image', imageUrl);
        }
        setImageUrl('');
        setShowImageDialog(false);
      } catch (error) {
        console.error('Ошибка вставки изображения:', error);
      }
    }
  };

  const handleVideoInsert = () => {
    if (videoUrl.trim() && quillRef.current) {
      try {
        const range = quillRef.current.getSelection();
        if (range) {
          quillRef.current.insertEmbed(range.index, 'video', videoUrl);
        }
        setVideoUrl('');
        setShowVideoDialog(false);
      } catch (error) {
        console.error('Ошибка вставки видео:', error);
      }
    }
  };

  const handleEmojiClick = (emoji) => {
    if (quillRef.current) {
      try {
        const range = quillRef.current.getSelection();
        if (range) {
          quillRef.current.insertText(range.index, emoji);
        }
        setShowEmojiPicker(false);
      } catch (error) {
        console.error('Ошибка вставки эмодзи:', error);
      }
    }
  };

  return (
    <Box>
      {/* Кастомные кнопки */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Tooltip title="Вставить изображение">
          <IconButton 
            onClick={() => setShowImageDialog(true)}
            sx={{ color: '#ffb347' }}
          >
            <ImageIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Вставить видео">
          <IconButton 
            onClick={() => setShowVideoDialog(true)}
            sx={{ color: '#ffb347' }}
          >
            <VideoIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Эмодзи">
          <IconButton 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            sx={{ color: '#ffb347' }}
          >
            <EmojiIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Эмодзи панель */}
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

      {/* Редактор */}
      <Box sx={{
        '& .ql-container': {
          borderColor: 'rgba(255, 179, 71, 0.3)',
          borderRadius: '0 0 4px 4px',
          bgcolor: 'rgba(0, 0, 0, 0.2)',
          color: '#fff',
          minHeight: '200px'
        },
        '& .ql-toolbar': {
          borderColor: 'rgba(255, 179, 71, 0.3)',
          borderRadius: '4px 4px 0 0',
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          '& .ql-stroke': {
            stroke: '#ffb347'
          },
          '& .ql-fill': {
            fill: '#ffb347'
          },
          '& .ql-picker': {
            color: '#ffb347'
          },
          '& .ql-picker-options': {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            borderColor: 'rgba(255, 179, 71, 0.3)'
          },
          '& .ql-picker-label': {
            color: '#ffb347'
          },
          '& .ql-picker-item': {
            color: '#fff'
          }
        },
        '& .ql-editor': {
          minHeight: '200px',
          color: '#fff',
          fontSize: '14px',
          lineHeight: '1.6',
          '& img': {
            maxWidth: '100%',
            height: 'auto'
          },
          '& video': {
            maxWidth: '100%',
            height: 'auto'
          },
          '& p': {
            margin: '0 0 8px 0'
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            margin: '16px 0 8px 0',
            color: '#ffb347'
          }
        },
        '& .ql-editor.ql-blank::before': {
          color: 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }
      }}>
        <ReactQuill
          ref={quillRef}
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          theme="snow"
          preserveWhitespace
        />
      </Box>

      {/* Диалог вставки изображения */}
      <Dialog open={showImageDialog} onClose={() => setShowImageDialog(false)}>
        <DialogTitle sx={{ color: '#ffb347' }}>Вставить изображение</DialogTitle>
        <DialogContent>
          <TextField
            label="URL изображения"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            fullWidth
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImageDialog(false)}>
            Отмена
          </Button>
          <Button onClick={handleImageInsert} variant="contained" sx={{ bgcolor: '#ffb347', color: '#000' }}>
            Вставить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог вставки видео */}
      <Dialog open={showVideoDialog} onClose={() => setShowVideoDialog(false)}>
        <DialogTitle sx={{ color: '#ffb347' }}>Вставить видео</DialogTitle>
        <DialogContent>
          <TextField
            label="URL видео"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            fullWidth
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVideoDialog(false)}>
            Отмена
          </Button>
          <Button onClick={handleVideoInsert} variant="contained" sx={{ bgcolor: '#ffb347', color: '#000' }}>
            Вставить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RichTextEditor; 