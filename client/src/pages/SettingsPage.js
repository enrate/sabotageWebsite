import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
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
  const { currentUser, updateUser } = useAuth();
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

  if (loading) return (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </Container>
  );

  return (
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
            control={<Switch checked={form.isLookingForSquad} onChange={handleFormChange} name="isLookingForSquad" sx={{ '& .MuiSwitch-thumb': { bgcolor: '#ffb347' } }} />}
            label={<Typography sx={{ color: '#fff' }}>Ищу отряд</Typography>}
            sx={{ mb: 3 }}
          />
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
      <Dialog 
        open={showCropper} 
        onClose={handleCropCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#ffb347' }}>
          Обрезка аватара
        </DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', height: 400 }}>
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCropCancel} sx={{ color: '#ffb347' }}>
            Отмена
          </Button>
          <Button 
            onClick={handleCropSave} 
            variant="contained"
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
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SettingsPage; 