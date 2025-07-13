import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import YouTubeLinkModal from '../components/YouTubeLinkModal';
import '../components/CreateSquadModal.css';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser, verified } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const avatarInputRef = React.useRef(null);
  const [userAwards, setUserAwards] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [form, setForm] = useState({
    username: '',
    email: '',
    description: '',
    avatar: '',
    armaId: '',
    isLookingForSquad: false
  });

  useEffect(() => {
    if (currentUser) {
      setForm({
        username: currentUser.username || '',
        email: currentUser.email || '',
        description: currentUser.description || '',
        avatar: currentUser.avatar || '',
        armaId: currentUser.armaId || '',
        isLookingForSquad: currentUser.isLookingForSquad || false,
        activeAwardId: currentUser.activeAwardId || ''
      });
      setAvatarPreview(currentUser.avatar || '');
      // Загружаем награды пользователя
      axios.get(`/api/awards/user/${currentUser.id}`)
        .then(res => setUserAwards(res.data.map(ua => ua.Award)))
        .catch(() => setUserAwards([]));
    }
  }, [currentUser]);

  // Обработка URL параметров для OAuth2
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const discordStatus = urlParams.get('discord');
    const twitchStatus = urlParams.get('twitch');
    const youtubeStatus = urlParams.get('youtube');
    
    if (discordStatus === 'success') {
      setSuccess('Discord успешно привязан!');
      // Обновляем пользователя
      if (currentUser) {
        updateUser({ ...currentUser, discordId: 'temp', discordUsername: 'temp' });
      }
    } else if (discordStatus === 'error') {
      setError('Ошибка привязки Discord');
    }
    
    if (twitchStatus === 'success') {
      setSuccess('Twitch успешно привязан!');
      // Обновляем пользователя
      if (currentUser) {
        updateUser({ ...currentUser, twitchId: 'temp', twitchUsername: 'temp' });
      }
    } else if (twitchStatus === 'error') {
      setError('Ошибка привязки Twitch');
    }
    
    if (youtubeStatus === 'success') {
      setSuccess('YouTube успешно привязан!');
      // Обновляем пользователя
      if (currentUser) {
        updateUser({ ...currentUser, youtubeId: 'temp', youtubeUsername: 'temp' });
      }
    } else if (youtubeStatus === 'error') {
      setError('Ошибка привязки YouTube');
    } else if (youtubeStatus === 'no-channel') {
      setError('YouTube канал не найден. Убедитесь, что у вас есть YouTube канал.');
    }
  }, [currentUser, updateUser]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleAvatarFile(files[0]);
    }
  };

  const handleAvatarDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleAvatarDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleAvatarFile(file);
    }
  };

  const handleAvatarFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropSave = async () => {
    try {
      const cropped = await getCroppedImg(cropSrc, croppedAreaPixels);
      setForm(prev => ({ ...prev, avatar: cropped }));
      setAvatarPreview(cropped);
      setShowCropper(false);
      setCropSrc(null);
    } catch (err) {
      setError('Ошибка при обработке изображения');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropSrc(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch('/api/users/profile', form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      updateUser(response.data);
      setSuccess('Профиль успешно обновлен');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      description: currentUser?.description || '',
      avatar: currentUser?.avatar || '',
      armaId: currentUser?.armaId || '',
      isLookingForSquad: currentUser?.isLookingForSquad || false
    });
    setAvatarPreview(currentUser?.avatar || '');
    setError(null);
    setSuccess(null);
  };

  const handleDiscordLink = () => {
    window.location.href = '/discord/start';
  };
  const handleDiscordUnlink = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/discord/unlink', {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      updateUser({ ...currentUser, discordId: null, discordUsername: null });
      setSuccess('Discord отвязан');
    } catch (err) {
      setError('Ошибка при отвязке Discord');
    }
  };

  const handleTwitchLink = () => {
    window.location.href = '/twitch/start';
  };

  const handleTwitchUnlink = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/twitch/unlink', {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      updateUser({ ...currentUser, twitchId: null, twitchUsername: null });
      setSuccess('Twitch отвязан');
    } catch (err) {
      setError('Ошибка при отвязке Twitch');
    }
  };

  const handleYoutubeLink = () => {
    setShowYouTubeModal(true);
  };

  const handleYoutubeUnlink = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/youtube/unlink', {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      updateUser({ ...currentUser, youtubeId: null, youtubeUsername: null, youtubeUrl: null });
      setSuccess('YouTube отвязан');
    } catch (err) {
      setError('Ошибка при отвязке YouTube');
    }
  };

  const handleYouTubeSuccess = (data) => {
    updateUser({ 
      ...currentUser, 
      youtubeId: data.youtubeId || 'temp', 
      youtubeUsername: data.channelName || 'temp',
      youtubeUrl: data.channelUrl || null
    });
    setSuccess(data.message || 'YouTube канал успешно привязан!');
  };

  if (loading) return (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </Container>
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100%',
        color: '#fff',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 0
        }
      }}
    >
      <Box sx={{ 
        position: 'relative', 
        zIndex: 1 
      }}>
        <Container maxWidth="sm" sx={{ py: 5 }}>
          <Box sx={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 179, 71, 0.2)',
        boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
        px: { xs: 2, sm: 5 },
        py: { xs: 3, sm: 5 },
        maxWidth: 440,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Уведомления */}
        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        {/* Аватар, имя, email */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <Avatar
              src={avatarPreview}
              sx={{ width: 110, height: 110, border: '3px solid #ffb347', bgcolor: avatarPreview ? 'transparent' : '#ffb347', fontSize: '2.7rem' }}
            >
              {!avatarPreview && <PersonIcon sx={{ fontSize: '2.7rem' }} />}
              {avatarPreview && (currentUser?.username?.charAt(0)?.toUpperCase() || 'U')}
            </Avatar>
            <Button
              variant="contained"
              size="small"
              startIcon={<PhotoCameraIcon />}
              onClick={() => avatarInputRef.current?.click()}
              sx={{ position: 'absolute', bottom: -10, right: -10, bgcolor: '#ffb347', color: '#232526', minWidth: 'auto', px: 1, boxShadow: 1, '&:hover': { bgcolor: '#ffd580' } }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </Button>
          </Box>
          <Typography variant="h5" sx={{ color: '#ffb347', fontWeight: 700, mb: 0.5 }}>{form.username}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 2 }}>{form.email}</Typography>
          <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarFileChange} style={{ display: 'none' }} />
        </Box>
        {/* Форма */}
        <Box component="form" onSubmit={handleSave} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Имя пользователя"
            name="username"
            value={form.username}
            onChange={handleFormChange}
            required
            sx={{ mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255, 179, 71, 0.3)' },
                '&:hover fieldset': { borderColor: '#ffb347' },
                '&.Mui-focused fieldset': { borderColor: '#ffb347' }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': { color: '#ffb347' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Arma ID (UUID)"
            name="armaId"
            value={form.armaId}
            onChange={handleFormChange}
            sx={{ mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255, 179, 71, 0.3)' },
                '&:hover fieldset': { borderColor: '#ffb347' },
                '&.Mui-focused fieldset': { borderColor: '#ffb347' },
                '&.Mui-disabled': { color: '#fff !important' }
              },
              '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 179, 71, 0.3) !important'
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': { color: '#ffb347' },
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.7)' }
              },
              '& .MuiOutlinedInput-input.Mui-disabled': { color: '#fff !important', WebkitTextFillColor: '#fff !important' },
              '& .MuiInputBase-input.Mui-disabled': { color: '#fff !important', WebkitTextFillColor: '#fff !important' },
              '& .MuiInputLabel-root.Mui-disabled': { color: '#fff !important' },
              '& .MuiFormHelperText-root': { color: '#fff !important' },
            }}
            disabled={!!currentUser?.armaId}
            helperText="Внимание: изменить Arma ID после сохранения будет невозможно!"
          />
          {!currentUser?.armaId && (
            <Box sx={{
              bgcolor: 'rgba(255, 179, 71, 0.15)',
              border: '1px solid #ffb347',
              borderRadius: 2,
              p: 1.5,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <SecurityIcon sx={{ color: '#ffb347', fontSize: 22 }} />
              <Typography sx={{ color: '#ffb347', fontWeight: 500, fontSize: '1rem' }}>
                Укажите свой Arma ID для верификации и доступа ко всем функциям сайта.
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Описание"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            multiline
            minRows={2}
            maxRows={5}
            sx={{ mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255, 179, 71, 0.3)' },
                '&:hover fieldset': { borderColor: '#ffb347' },
                '&.Mui-focused fieldset': { borderColor: '#ffb347' }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': { color: '#ffb347' }
              }
            }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Активная награда</InputLabel>
            <Select
              name="activeAwardId"
              value={form.activeAwardId || ''}
              onChange={handleFormChange}
              label="Активная награда"
            >
              <MenuItem value="">Нет</MenuItem>
              {userAwards.map(award => (
                <MenuItem key={award.id} value={award.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={award.image} sx={{ width: 24, height: 24 }} />
                    <Tooltip title={award.description || award.name} placement="right">
                      <span>{award.name}</span>
                    </Tooltip>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={form.isLookingForSquad}
                onChange={handleFormChange}
                name="isLookingForSquad"
                sx={{ '& .MuiSwitch-thumb': { bgcolor: '#ffb347' } }}
                disabled={!verified}
              />
            }
            label={<Typography sx={{ color: '#fff' }}>Ищу отряд</Typography>}
            sx={{ mb: 1 }}
          />
          {!verified && (
            <Typography variant="caption" sx={{ color: '#ffb347', mb: 2, display: 'block' }}>
              Для активации функции необходимо пройти верификацию (указать Arma ID)
            </Typography>
          )}
          <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.12)' }} />
          <Box sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Discord */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(88,101,242,0.08)', borderRadius: 2, p: 1.5, border: '1px solid #5865f2', width: '100%' }}>
              <img src="/discord-icon.png" alt="Discord" style={{ width: 28, height: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 16 }}>Discord</Typography>
                {currentUser?.discordId ? (
                  <Typography sx={{ color: '#b5baff', fontSize: 14 }}>Привязан: {currentUser.discordUsername}</Typography>
                ) : (
                  <Typography sx={{ color: '#b5baff', fontSize: 14 }}>Не привязан</Typography>
                )}
              </Box>
              {currentUser?.discordId ? (
                <Button variant="outlined" color="secondary" onClick={handleDiscordUnlink} sx={{ borderColor: '#5865f2', color: '#5865f2', minWidth: 120, '&:hover': { borderColor: '#7a88fa', color: '#7a88fa' } }}>
                  Отвязать
                </Button>
              ) : (
                <Button variant="contained" onClick={handleDiscordLink} sx={{ bgcolor: '#5865f2', color: '#fff', fontWeight: 600, minWidth: 120, '&:hover': { bgcolor: '#7a88fa' } }}>
                  Привязать
                </Button>
              )}
            </Box>
            {/* Twitch */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(147,51,234,0.08)', borderRadius: 2, p: 1.5, border: '1px solid #9333ea', width: '100%' }}>
              <img src="/twitch-icon.png" alt="Twitch" style={{ width: 28, height: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 16 }}>Twitch</Typography>
                {currentUser?.twitchId ? (
                  <Typography sx={{ color: '#c4b5fd', fontSize: 14 }}>Привязан: {currentUser.twitchUsername}</Typography>
                ) : (
                  <Typography sx={{ color: '#c4b5fd', fontSize: 14 }}>Не привязан</Typography>
                )}
              </Box>
              {currentUser?.twitchId ? (
                <Button variant="outlined" color="secondary" onClick={handleTwitchUnlink} sx={{ borderColor: '#9333ea', color: '#9333ea', minWidth: 120, '&:hover': { borderColor: '#a855f7', color: '#a855f7' } }}>
                  Отвязать
                </Button>
              ) : (
                <Button variant="contained" onClick={handleTwitchLink} sx={{ bgcolor: '#9333ea', color: '#fff', fontWeight: 600, minWidth: 120, '&:hover': { bgcolor: '#a855f7' } }}>
                  Привязать
                </Button>
              )}
            </Box>
            {/* YouTube */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,0,0,0.08)', borderRadius: 2, p: 1.5, border: '1px solid #ff0000', width: '100%' }}>
              <img src="/youtube-icon.png" alt="YouTube" style={{ width: 28, height: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 16 }}>YouTube</Typography>
                {currentUser?.youtubeId ? (
                  <Typography sx={{ color: '#ffb3b3', fontSize: 14 }}>Привязан: {currentUser.youtubeUsername}</Typography>
                ) : (
                  <Typography sx={{ color: '#ffb3b3', fontSize: 14 }}>Не привязан</Typography>
                )}
              </Box>
              {currentUser?.youtubeId ? (
                <Button variant="outlined" color="secondary" onClick={handleYoutubeUnlink} sx={{ borderColor: '#ff0000', color: '#ff0000', minWidth: 120, '&:hover': { borderColor: '#ff4444', color: '#ff4444' } }}>
                  Отвязать
                </Button>
              ) : (
                <Button variant="contained" onClick={handleYoutubeLink} sx={{ bgcolor: '#ff0000', color: '#fff', fontWeight: 600, minWidth: 120, '&:hover': { bgcolor: '#ff4444' } }}>
                  Привязать
                </Button>
              )}
            </Box>
          </Box>
          <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.12)' }} />
          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary" type="submit" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />} disabled={saving} sx={{ bgcolor: '#ffb347', color: '#232526', '&:hover': { bgcolor: '#ffd580' } }}>
              Сохранить
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleCancel} startIcon={<CancelIcon />} sx={{ borderColor: '#ffb347', color: '#ffb347', '&:hover': { borderColor: '#ffd580', color: '#ffd580' } }}>
              Отмена
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Диалог кроппера */}
      {showCropper && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <Box sx={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 179, 71, 0.2)',
            boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
            px: { xs: 2, sm: 5 },
            py: { xs: 3, sm: 5 },
            maxWidth: 600,
            minWidth: 400,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff'
          }}>
            <Button
              onClick={handleCropCancel}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                minWidth: 'auto',
                p: 1,
                color: '#ffb347',
                '&:hover': {
                  bgcolor: 'rgba(255, 179, 71, 0.1)'
                }
              }}
            >
              &times;
            </Button>
            <Typography variant="h5" sx={{ color: '#ffb347', fontWeight: 700, mb: 3, textAlign: 'center' }}>
              Обрезка аватара
            </Typography>
            <Box sx={{ position: 'relative', height: 400, mb: 3, width: '100%' }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', width: '100%' }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleCropCancel}
                sx={{ 
                  borderColor: '#ffb347', 
                  color: '#ffb347', 
                  '&:hover': { 
                    borderColor: '#ffd580', 
                    color: '#ffd580' 
                  } 
                }}
              >
                Отмена
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleCropSave}
                sx={{ 
                  bgcolor: '#ffb347', 
                  color: '#232526', 
                  '&:hover': { 
                    bgcolor: '#ffd580' 
                  } 
                }}
              >
                Обрезать
              </Button>
            </Box>
          </Box>
        </div>
      )}
        </Container>
      </Box>

      {/* YouTube Link Modal */}
      <YouTubeLinkModal
        open={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        onSuccess={handleYouTubeSuccess}
      />
    </Box>
  );
};

export default SettingsPage; 