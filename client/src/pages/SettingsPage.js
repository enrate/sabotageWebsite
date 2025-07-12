import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
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
  useMediaQuery
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
  const avatarInputRef = React.useRef(null);

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
        isLookingForSquad: currentUser.isLookingForSquad || false
      });
      setAvatarPreview(currentUser.avatar || '');
    }
  }, [currentUser]);

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

  const handleDiscordLink = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/discord/start', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.redirected) {
        window.location.href = res.url;
      } else if (res.status === 200) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        setError('Ошибка при попытке привязать Discord');
      }
    } catch (err) {
      setError('Ошибка при попытке привязать Discord');
    }
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

  const handleYoutubeLink = () => {
    // Здесь будет логика привязки YouTube (заглушка)
    window.open('https://www.youtube.com/', '_blank');
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

      {/* Секция Discord */}
      <Box sx={{ width: '100%', mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(88,101,242,0.08)', borderRadius: 2, p: 2, border: '1px solid #5865f2' }}>
        <img src="/discord-icon.png" alt="Discord" style={{ width: 32, height: 32 }} />
        {currentUser?.discordId ? (
          <>
            <Typography sx={{ color: '#fff', fontWeight: 500 }}>
              Discord: {currentUser.discordUsername || 'Привязан'}
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleDiscordUnlink} sx={{ borderColor: '#5865f2', color: '#5865f2', ml: 2, '&:hover': { borderColor: '#7a88fa', color: '#7a88fa' } }}>
              Отвязать
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={handleDiscordLink} sx={{ bgcolor: '#5865f2', color: '#fff', fontWeight: 600, ml: 2, '&:hover': { bgcolor: '#7a88fa' } }}>
            Привязать Discord
          </Button>
        )}
      </Box>

      {/* Секция YouTube */}
      <Box sx={{ width: '100%', mb: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,0,0,0.08)', borderRadius: 2, p: 2, border: '1px solid #ff0000' }}>
        <img src="/youtube-icon.png" alt="YouTube" style={{ width: 32, height: 32 }} />
        <img src="/youtube-logo.png" alt="YouTube Logo" style={{ height: 28, marginLeft: 4 }} />
        <Button variant="contained" onClick={handleYoutubeLink} sx={{ bgcolor: '#ff0000', color: '#fff', fontWeight: 600, ml: 2, '&:hover': { bgcolor: '#ff4444' } }}>
          Привязать YouTube
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPage; 