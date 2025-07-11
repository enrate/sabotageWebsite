import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import SquadStats from '../components/SquadStats';
import PerformanceHistory from '../components/PerformanceHistory';
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
  Chip,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as StatsIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  ManageAccounts as ManageAccountsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';

const SquadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    logo: '',
    description: '',
    isJoinRequestOpen: true
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [touched, setTouched] = useState(false);
  const logoInputRef = React.useRef(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [tab, setTab] = useState('about');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [manageMemberDialog, setManageMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState(null);
  const [performanceScrollIndex, setPerformanceScrollIndex] = useState(0);
  const [performanceTab, setPerformanceTab] = useState(0);
  const [squadStats, setSquadStats] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Функция для сортировки участников
  const getSortedMembers = React.useMemo(() => {
    if (!squad || !Array.isArray(squad.members)) return [];
    
    return [...squad.members].sort((a, b) => {
      // 1. Лидер всегда первый
      if (a.squadRole === 'leader') return -1;
      if (b.squadRole === 'leader') return 1;
      
      // 2. Заместители по алфавиту
      if (a.squadRole === 'deputy' && b.squadRole === 'deputy') {
        return a.username.localeCompare(b.username);
      }
      if (a.squadRole === 'deputy') return -1;
      if (b.squadRole === 'deputy') return 1;
      
      // 3. Участники по алфавиту
      return a.username.localeCompare(b.username);
    });
  }, [squad?.members]);

  // Пример дополнительных данных
  const squadInfo = squad ? [
    { label: 'Тег', value: squad.tag || '—'},
    { label: 'Дата создания', value: squad.createdAt ? new Date(squad.createdAt).toLocaleDateString() : '—' },
    { label: 'Набор открыт?', value: squad.isJoinRequestOpen ? 'Да' : 'Нет' },
    { label: 'Участников', value: squad.members?.length || 0 },
    { 
      label: 'Активных предупреждений', 
      value: warningsLoading ? 'Загрузка...' : warnings.length,
      color: warnings.length > 0 ? '#f44336' : undefined
    }
  ] : [];

  // Проверка: состоит ли пользователь в этом отряде
  const isMember = currentUser && squad && Array.isArray(squad.members) && squad.members.some(m => m.id === currentUser?.id);
  const isLeader = currentUser && squad && squad.leaderId === currentUser?.id;
  // Новое: проверка заместителя в отряде
  const isDeputyInSquad = currentUser && squad && Array.isArray(squad.members) && squad.members.some(m => m.id === currentUser?.id && m.squadRole === 'deputy');

  useEffect(() => {
    const loadSquadData = async () => {
      try {
        const res = await axios.get(`/api/squads/${id}`);
        setSquad(res.data);
        setForm({
          logo: res.data.logo || '',
          description: res.data.description || '',
          isJoinRequestOpen: typeof res.data.isJoinRequestOpen === 'boolean' ? res.data.isJoinRequestOpen : true
        });
        setLogoPreview(res.data.logo || '');
        setTouched(false);
        setLoading(false);

        // Загрузка squad_stats
        try {
          const statsRes = await axios.get(`/api/squads/stats/${id}`);
          setSquadStats(statsRes.data);
        } catch {
          setSquadStats(null);
        }

        // Проверяем статус заявки пользователя
        if (currentUser && !res.data.members?.some(m => m.id === currentUser?.id) && res.data.leaderId !== currentUser?.id) {
          await checkUserJoinRequestStatus();
        }
        
        // Загружаем предупреждения отряда
        await loadSquadWarnings();
      } catch (err) {
        setError('Отряд не найден');
        setLoading(false);
      }
    };

    loadSquadData();
  }, [id, currentUser]);

  // Функция для проверки статуса заявки пользователя
  const checkUserJoinRequestStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/squads/${id}/join-request-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setJoinRequestStatus(response.data.status);
    } catch (err) {
      console.error('Ошибка проверки статуса заявки:', err);
      setJoinRequestStatus(null);
    }
  };

  // Функция для загрузки истории отряда
  const loadSquadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/squads/${id}/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setHistory(response.data);
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
      if (err.response?.status === 401) {
        setHistoryError('Для просмотра истории отряда необходимо авторизоваться');
      } else {
      setHistoryError('Ошибка загрузки истории отряда');
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // Функция для загрузки предупреждений отряда
  const loadSquadWarnings = async () => {
    setWarningsLoading(true);
    try {
      const response = await axios.get(`/api/squads/${id}/warnings`);
      setWarnings(response.data);
    } catch (err) {
      console.error('Ошибка загрузки предупреждений:', err);
      setWarnings([]);
    } finally {
      setWarningsLoading(false);
    }
  };

  // Функция для загрузки заявок на вступление
  const loadJoinRequests = async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/squads/${id}/join-requests`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setJoinRequests(response.data);
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err);
      setRequestsError('Ошибка загрузки заявок на вступление');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Функция для перехода к профилю пользователя
  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleJoinRequest = async () => {
    setJoinLoading(true);
    setJoinError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/${id}/join-request`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setJoinRequestStatus('pending');
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Ошибка подачи заявки');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    setJoinLoading(true);
    setJoinError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/squads/${id}/join-request`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setJoinRequestStatus(null);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Ошибка отмены заявки');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/join-request/${requestId}/handle`, 
        { action },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setJoinRequests(reqs => reqs.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Ошибка обработки заявки:', err);
      alert('Ошибка обработки заявки');
    }
  };

  // Функции для редактирования отряда
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'logo') setLogoPreview(value);
    setTouched(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('token');
      // Обрезаем описание, если оно состоит только из пробелов
      const cleanDescription = form.description.trim().length === 0 ? '' : form.description;
      await axios.patch(`/api/squads/${id}`, {
        logo: form.logo,
        description: cleanDescription,
        isJoinRequestOpen: form.isJoinRequestOpen
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // Обновить данные
      const res = await axios.get(`/api/squads/${id}`);
      setSquad(res.data);
      setForm({
        logo: res.data.logo || '',
        description: res.data.description || '',
        isJoinRequestOpen: typeof res.data.isJoinRequestOpen === 'boolean' ? res.data.isJoinRequestOpen : true
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setTouched(false);
    } catch (err) {
      if (err.response?.status === 413) {
        setSaveError('Изображение слишком большое. Попробуйте выбрать изображение меньшего размера или обрезать его.');
      } else {
        setSaveError('Ошибка сохранения');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (touched) {
      setConfirmCancel(true);
    } else {
      setEditMode(false);
    }
  };

  const confirmCancelYes = () => {
    setEditMode(false);
    setConfirmCancel(false);
    setTouched(false);
  };

  const confirmCancelNo = () => setConfirmCancel(false);

  // Drag & Drop logo
  const handleLogoDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setSaveError('Файл слишком большой. Максимальный размер: 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({ ...f, logo: ev.target.result }));
        setLogoPreview(ev.target.result);
        setTouched(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleLogoDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setSaveError('Файл слишком большой. Максимальный размер: 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropSrc(ev.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropSave = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(cropSrc, croppedAreaPixels);
    
    const base64Size = cropped.length * 0.75;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (base64Size > maxSize) {
      setSaveError('Изображение слишком большое после обрезки. Попробуйте выбрать изображение меньшего размера.');
      setShowCropper(false);
      setCropSrc(null);
      return;
    }
    
    setForm(f => ({ ...f, logo: cropped }));
    setLogoPreview(cropped);
    setTouched(true);
    setShowCropper(false);
    setCropSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropSrc(null);
  };

  const handleLeaveSquad = () => {
    setShowLeaveModal(true);
  };

  const confirmLeaveSquad = async () => {
    setLeaveLoading(true);
    setLeaveError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/${id}/leave`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setShowLeaveModal(false);
      navigate('/squads');
    } catch (err) {
      setLeaveError(err.response?.data?.message || 'Ошибка выхода из отряда');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleDeleteSquad = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/squads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      navigate('/squads');
    } catch (err) {
      console.error('Ошибка удаления отряда:', err);
      setDeleteError(err.response?.data?.message || 'Ошибка удаления отряда');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Функции для управления участниками
  const handleManageMember = (member) => {
    setSelectedMember(member);
    setManageMemberDialog(true);
    setManageError(null);
  };

  const handlePromoteMember = async () => {
    if (!selectedMember) return;
    
    setManageLoading(true);
    setManageError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/${id}/members/${selectedMember.id}/promote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Обновляем данные отряда
      const res = await axios.get(`/api/squads/${id}`);
      setSquad(res.data);
      
      setManageMemberDialog(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Ошибка повышения участника:', err);
      setManageError(err.response?.data?.message || 'Ошибка повышения участника');
    } finally {
      setManageLoading(false);
    }
  };

  const handleDemoteMember = async () => {
    if (!selectedMember) return;
    
    setManageLoading(true);
    setManageError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/${id}/members/${selectedMember.id}/demote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Обновляем данные отряда
      const res = await axios.get(`/api/squads/${id}`);
      setSquad(res.data);
      
      setManageMemberDialog(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Ошибка понижения участника:', err);
      setManageError(err.response?.data?.message || 'Ошибка понижения участника');
    } finally {
      setManageLoading(false);
    }
  };

  const handleKickMember = async () => {
    if (!selectedMember) return;
    
    setManageLoading(true);
    setManageError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/${id}/members/${selectedMember.id}/kick`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Обновляем данные отряда
      const res = await axios.get(`/api/squads/${id}`);
      setSquad(res.data);
      
      setManageMemberDialog(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Ошибка исключения участника:', err);
      setManageError(err.response?.data?.message || 'Ошибка исключения участника');
    } finally {
      setManageLoading(false);
    }
  };

  const closeManageDialog = () => {
    setManageMemberDialog(false);
    setSelectedMember(null);
    setManageError(null);
  };

  // Компонент ленты результативности с прокруткой
  const PerformanceTrophy = ({ performance }) => {
    if (!Array.isArray(performance) || performance.length === 0) return null;

    const itemsPerView = isMobile ? 3 : 5;
    const maxIndex = Math.max(0, performance.length - itemsPerView);
    
    const handleScrollLeft = () => {
      setPerformanceScrollIndex(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
      setPerformanceScrollIndex(prev => Math.min(maxIndex, prev + 1));
    };

    const getTrophyIcon = (place) => {
      switch (place) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏆';
      }
    };

    const getTrophyColor = (place) => {
      switch (place) {
        case 1: return '#ffd700';
        case 2: return '#e0e0e0';
        case 3: return '#cd7f32';
        default: return '#4f8cff';
      }
    };

    return (
      <Box sx={{ mt: 1.5, mb: 2 }}>
        <Typography variant="h5" sx={{ color: '#ffb347', mb: 2, textAlign: 'center' }}>
          Результаты сезонов
        </Typography>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: 90 }}>
          {/* Кнопка прокрутки влево */}
          {performanceScrollIndex > 0 && (
            <Button
              onClick={handleScrollLeft}
              sx={{
                position: 'absolute',
                left: -15,
                zIndex: 2,
                minWidth: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 179, 71, 0.2)',
                color: '#ffb347',
                '&:hover': {
                  bgcolor: 'rgba(255, 179, 71, 0.3)'
                }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </Button>
          )}

          {/* Контейнер с кубками */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mx: performanceScrollIndex > 0 ? 3 : 0,
              mr: performanceScrollIndex < maxIndex ? 3 : 0,
              transition: 'all 0.3s ease',
              minHeight: 90,
              py: 1,
              px: 0.5
            }}
          >
            {performance
              .slice(performanceScrollIndex, performanceScrollIndex + itemsPerView)
              .map((perf, idx) => (
                <Card
                  key={perf.season}
                  sx={{
                    minWidth: 64,
                    maxWidth: 70,
                    minHeight: 80,
                    maxHeight: 90,
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    border: `2px solid ${getTrophyColor(perf.place)}`,
                    borderRadius: 2,
                    textAlign: 'center',
                    p: 1,
                    position: 'relative',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      borderColor: getTrophyColor(perf.place),
                      boxShadow: `0 0 20px 4px ${getTrophyColor(perf.place)}60`,
                      transform: 'translateY(-2px)',
                      zIndex: 10
                    }
                  }}
                >
                  {/* Иконка кубка */}
                  <Typography variant="h5" sx={{ mb: 0.2, fontSize: '1.6rem', lineHeight: 1 }}>
                    {getTrophyIcon(perf.place)}
                  </Typography>
                  {/* Сезон */}
                  <Typography variant="body2" sx={{ color: '#ffb347', fontWeight: 600, mb: 0.2, fontSize: '0.85rem' }}>
                    S{perf.season}
                  </Typography>
                  {/* Место */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      color: getTrophyColor(perf.place),
                      textShadow: `0 0 6px ${getTrophyColor(perf.place)}40`,
                      fontSize: '1.15rem',
                      lineHeight: 1.1
                    }}
                  >
                    {perf.place}
                  </Typography>
                  {/* Подпись */}
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.65rem' }}>
                    место
                  </Typography>
                </Card>
              ))}
          </Box>

          {/* Кнопка прокрутки вправо */}
          {performanceScrollIndex < maxIndex && (
            <Button
              onClick={handleScrollRight}
              sx={{
                position: 'absolute',
                right: -15,
                zIndex: 2,
                minWidth: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 179, 71, 0.2)',
                color: '#ffb347',
                '&:hover': {
                  bgcolor: 'rgba(255, 179, 71, 0.3)'
                }
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </Button>
          )}
        </Box>
      </Box>
    );
  };

  if (loading) return <Loader />;
  if (error || !squad) return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" sx={{ color: '#ffb347' }}>
        {error || 'Отряд не найден'}
      </Typography>
    </Box>
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
      <Container 
        maxWidth="xl" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          py: 5,
          px: 3
        }}
      >
        {/* Баннер: напоминание про Arma ID */}
        {currentUser && !currentUser.armaId && (
          <Box sx={{
            bgcolor: 'rgba(255, 179, 71, 0.15)',
            border: '1px solid #ffb347',
            borderRadius: 2,
            p: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            maxWidth: 700,
            mx: 'auto',
          }}>
            <WarningAmberIcon sx={{ color: '#ffb347', fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: '#ffb347', fontWeight: 600, fontSize: '1.1rem' }}>
                Для полноценного участия в проекте укажите свой Arma ID в настройках профиля.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{ bgcolor: '#ffb347', color: '#232526', fontWeight: 600, '&:hover': { bgcolor: '#ffd580' } }}
              onClick={() => navigate('/settings')}
            >
              В настройки
            </Button>
          </Box>
        )}
        <Grid container spacing={4}>
          {/* Левая панель с вкладками и информацией */}
          <Grid item style={{width: 320, maxWidth: 320, flexShrink: 0}}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Вкладки */}
              <Paper
                elevation={8}
                sx={{
                  p: 2,
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 179, 71, 0.2)'
                }}
              >
                <Tabs
                  orientation="vertical"
                  value={tab}
                  onChange={(e, newValue) => {
                    setTab(newValue);
                    if (newValue === 'history') {
                      loadSquadHistory();
                    }
                    if (newValue === 'manage') {
                      loadJoinRequests();
                    }
                  }}
                  sx={{
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#ffb347',
                      width: 3,
                      left: 0
                    },
                    '& .MuiTab-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'left',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start', // Выравнивание по левой границе
                      minHeight: 48,
                      fontSize: '1rem',
                      fontWeight: 500,
                      paddingLeft: 3, // Добавляем отступ слева для текста
                      '&.Mui-selected': {
                        color: '#ffb347',
                        fontWeight: 600
                      }
                    }
                  }}
                >
                  <Tab 
                    label="Об отряде" 
                    value="about"
                    icon={<GroupIcon />}
                    iconPosition="start"
                  />

                  <Tab 
                    label="История" 
                    value="history"
                    icon={<HistoryIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Статистика" 
                    value="performance"
                    icon={<TrophyIcon />}
                    iconPosition="start"
                  />
                  {(isLeader || isDeputyInSquad) && (
                    <Tab 
                      label="Управление" 
                      value="manage"
                      icon={<SettingsIcon />}
                      iconPosition="start"
                    />
                  )}
                </Tabs>
              </Paper>

              {/* Информация об отряде */}
              <Paper
                elevation={8}
                sx={{
                  p: 3,
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 179, 71, 0.2)'
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#ffb347', mb: 2 }}>
                    Информация
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {squadInfo.map((item, idx) => (
                      <Grid
                        container
                        key={idx}
                        alignItems="center"
                        spacing={1}
                        sx={{
                          py: 0.5,
                          borderBottom: idx !== squadInfo.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                        }}
                      >
                        <Grid item xs={7} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}
                          >
                            {item.label}
                          </Typography>
                        </Grid>
                        <Grid item xs={5} sm={6}>
                          {item.link ? (
                            <Link to={item.link} style={{ color: '#ffb347', textDecoration: 'underline' }}>
                              {item.value}
                            </Link>
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{
                                color: item.color || '#fff',
                                fontWeight: 600,
                                textAlign: 'right',
                                wordBreak: 'break-all',
                              }}
                            >
                              {item.value}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                </Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 179, 71, 0.2)' }} />

                {/* Кнопки действий */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Кнопка вступить/отменить заявку */}
                  {squad.isJoinRequestOpen && !isMember && !isLeader && currentUser && currentUser.armaId && (
                    joinRequestStatus === 'pending' ? (
                      <Button
                        variant="contained"
                        onClick={handleCancelJoinRequest}
                        disabled={joinLoading}
                        startIcon={joinLoading ? <CircularProgress size={16} /> : <CloseIcon />}
                        sx={{
                          bgcolor: '#f44336',
                          color: '#fff',
                          '&:hover': {
                            bgcolor: '#d32f2f'
                          }
                        }}
                      >
                        {joinLoading ? 'Отмена...' : 'Отменить заявку'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleJoinRequest}
                        disabled={joinLoading}
                        startIcon={joinLoading ? <CircularProgress size={16} /> : <AddIcon />}
                        sx={{
                          bgcolor: '#4f8cff',
                          color: '#fff',
                          '&:hover': {
                            bgcolor: '#3b7ae8'
                          }
                        }}
                      >
                        {joinLoading ? 'Отправка...' : 'Вступить'}
                      </Button>
                    )
                  )}

                  {/* Кнопка выйти из отряда */}
                  {isMember && !isLeader && (
                    <Button
                      variant="contained"
                      onClick={handleLeaveSquad}
                      disabled={leaveLoading}
                      startIcon={leaveLoading ? <CircularProgress size={16} /> : <ExitToAppIcon />}
                      sx={{
                        bgcolor: '#b91c1c',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#a01818'
                        }
                      }}
                    >
                      {leaveLoading ? 'Выход...' : 'Выйти из отряда'}
                    </Button>
                  )}

                  {/* Кнопка распустить отряд для лидера */}
                  {isLeader && (
                    <Button
                      variant="contained"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={deleteLoading}
                      startIcon={deleteLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
                      sx={{
                        bgcolor: '#b91c1c',
                        color: '#fff',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: '#a01818',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {deleteLoading ? 'Роспуск...' : 'Распустить отряд'}
                    </Button>
                  )}

                  {/* Ошибки */}
                  {joinError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {joinError}
                    </Alert>
                  )}
                  {leaveError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {leaveError}
                    </Alert>
                  )}
                  {deleteError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {deleteError}
                    </Alert>
                  )}
                </Box>
              </Paper>

              {/* Кнопка возврата */}
              <Button
                variant="contained"
                component={Link}
                to="/squads"
                startIcon={<ArrowBackIcon />}
                sx={{
                  bgcolor: '#4f8cff',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#3b7ae8',
                    boxShadow: 'none'
                  }
                }}
              >
                К списку отрядов
              </Button>
            </Box>
          </Grid>

          {/* Основной контент */}
          <Grid item xs style={{flex: 1, minWidth: 0}}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 179, 71, 0.2)',
                minHeight: 600,
                width: '100%'
              }}
            >
              {/* Вкладка "Об отряде" */}
              {tab === 'about' && (
                <Box sx={{ minWidth: 800, maxWidth: 1100, mx: 'auto' }}>
                  {/* Логотип и название */}
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar
                      src={squad.logo}
                      alt="Логотип отряда"
                      sx={{
                        width: 160,
                        height: 160,
                        border: '3px solid #ffb347',
                        mb: 2,
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: squad.logo ? 'transparent' : '#ffb347',
                      }}
                    >
                      {!squad.logo && <GroupIcon sx={{ fontSize: 80, color: '#232526', mx: 'auto' }} />}
                    </Avatar>
                    <Typography variant="h3" sx={{ color: '#ffb347', fontWeight: 700, mb: 1 }}>
                      {squad.name}
                    </Typography>
                    <Divider sx={{ bgcolor: '#ffb347', height: 2, borderRadius: 1, mb: 3 }} />
                    
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4, wordBreak: 'break-word', whiteSpace: 'pre-line', maxWidth: 600, mx: 'auto' }}>
                      {squad.description || 'Нет описания'}
                    </Typography>
                  </Box>

                  {/* Участники */}
                  <Typography variant="h5" sx={{ color: '#ffb347', mb: 2, textAlign: 'center' }}>
                    Участники
                  </Typography>
                  {Array.isArray(squad.members) && squad.members.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: 3 }}>
                      {getSortedMembers.map((member, idx) => (
                        <Box key={member.id || idx} sx={{ width: { xs: '100%', sm: '48.5%' }, boxSizing: 'border-box', p: 1.5 }}>
                          <Box
                            sx={{
                              bgcolor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: 2,
                              border: '1px solid rgba(255, 179, 71, 0.2)',
                              cursor: member.id ? 'pointer' : 'default',
                              p: 2,
                              width: '100%',
                              '&:hover': member.id ? {
                                bgcolor: 'rgba(255, 179, 71, 0.1)',
                                borderColor: '#ffb347'
                              } : {}
                            }}
                            onClick={() => member.id && navigate(`/profile/${member.id}`)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={member.avatar}
                                sx={{
                                  bgcolor: member.avatar ? 'transparent' : '#ffb347',
                                  color: member.avatar ? undefined : '#232526',
                                  fontWeight: 700
                                }}
                              >
                                {!member.avatar && <PersonIcon sx={{ fontSize: 32 }} />}
                                {member.avatar && (member.username?.charAt(0)?.toUpperCase() || 'U')}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ color: '#ffb347', fontWeight: 600 }}>
                                  {member.username || member.name || '—'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={member.squadRole === 'deputy' ? 'Заместитель' : member.squadRole === 'member' ? 'Участник' : member.squadRole === 'leader' ? 'Лидер' : 'Участник'}
                                    size="small"
                                    sx={{
                                      bgcolor: member.squadRole === 'deputy' ? '#ffd700' : member.squadRole === 'leader' ? '#ff6b35' : 'rgba(255, 179, 71, 0.1)',
                                      color: member.squadRole === 'deputy' ? '#232526' : member.squadRole === 'leader' ? '#fff' : '#ffb347',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                  {(() => {
                                    const joinDate = member.joinDate ? new Date(member.joinDate) : null;
                                    const daysInSquad = joinDate ? Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24)) : null;
                                    return daysInSquad !== null && (
                                      <Chip
                                        label={`${daysInSquad} ${daysInSquad === 1 ? 'день в отряде' : daysInSquad < 5 ? 'дня в отряде' : 'дней в отряде'}`}
                                        size="small"
                                        sx={{
                                          bgcolor: 'rgba(79, 140, 255, 0.1)',
                                          color: '#4f8cff',
                                          fontSize: '0.75rem'
                                        }}
                                      />
                                    );
                                  })()}
                                </Box>
                              </Box>
                              {/* Кнопка управления для лидера и заместителя */}
                              {((isLeader && member.id !== currentUser?.id) || 
                                (isDeputyInSquad && member.id !== currentUser?.id && member.squadRole === 'member')) && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<ManageAccountsIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManageMember(member);
                                  }}
                                  sx={{
                                    color: '#ffb347',
                                    borderColor: '#ffb347',
                                    '&:hover': {
                                      borderColor: '#ffb347',
                                      bgcolor: 'rgba(255, 179, 71, 0.1)'
                                    }
                                  }}
                                >
                                  Управлять
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                      Нет участников
                    </Typography>
                  )}
                </Box>
              )}

              {/* Вкладка "История" */}
              {tab === 'history' && (
                <Box sx={{ minWidth: 800, maxWidth: 1100, mx: 'auto' }}>
                  <Typography variant="h4" sx={{ color: '#ffb347', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon />
                    История отряда
                  </Typography>
                  
                  {historyLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : historyError ? (
                    <Alert severity="error">
                      {historyError}
                    </Alert>
                  ) : history.length === 0 ? (
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                      История отряда пуста
                    </Typography>
                  ) : (
                    <List>
                      {history.map((event, idx) => {
                        const getEventIcon = () => {
                          switch (event.eventType) {
                            case 'join':
                              return <AddIcon sx={{ color: '#4caf50' }} />;
                            case 'leave':
                              return <ExitToAppIcon sx={{ color: '#f44336' }} />;
                            case 'kick':
                              return <DeleteIcon sx={{ color: '#f44336' }} />;
                            case 'promote':
                              return <SecurityIcon sx={{ color: '#ffd700' }} />;
                            case 'demote':
                              return <PersonIcon sx={{ color: '#ff9800' }} />;
                            case 'warning':
                              return <WarningIcon sx={{ color: '#f44336' }} />;
                            case 'warning_cancel':
                              return <CheckIcon sx={{ color: '#4caf50' }} />;
                            default:
                              return <HistoryIcon sx={{ color: '#4f8cff' }} />;
                          }
                        };

                        const getEventColor = () => {
                          switch (event.eventType) {
                            case 'join':
                              return 'rgba(76, 175, 80, 0.1)';
                            case 'leave':
                            case 'kick':
                              return 'rgba(244, 67, 54, 0.1)';
                            case 'promote':
                              return 'rgba(255, 215, 0, 0.1)';
                            case 'demote':
                              return 'rgba(255, 152, 0, 0.1)';
                            case 'warning':
                              return 'rgba(244, 67, 54, 0.1)';
                            case 'warning_cancel':
                              return 'rgba(76, 175, 80, 0.1)';
                            default:
                              return 'rgba(79, 140, 255, 0.1)';
                          }
                        };

                        return (
                          <ListItem
                            key={event.id}
                            sx={{
                              bgcolor: getEventColor(),
                              borderRadius: 2,
                              mb: 1,
                              border: '1px solid rgba(255, 179, 71, 0.2)'
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography sx={{ color: '#fff', fontWeight: 600, wordBreak: 'break-all' }}>
                                  {event.description}
                                  {event.metadata?.actionByUsername && (
                                    <Typography component="span" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', ml: 1 }}>
                                      {event.eventType === 'join' && '(одобрил: '}
                                      {event.eventType === 'kick' && '(исключил: '}
                                      {event.eventType === 'promote' && '(повысил: '}
                                      {event.eventType === 'demote' && '(понизил: '}
                                      {event.eventType === 'leave' && '(покинул: '}
                                      {event.metadata.actionByUsername})
                                    </Typography>
                                  )}
                                </Typography>
                              }
                              secondary={
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                                  {new Date(event.createdAt).toLocaleString('ru-RU', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              }
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getEventIcon()}
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </Box>
              )}

              {/* Вкладка "Производительность" */}
              {tab === 'performance' && (
                <Box sx={{ minWidth: 800, maxWidth: 1100, mx: 'auto' }}>
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <Tabs
                      value={performanceTab}
                      onChange={(_, v) => setPerformanceTab(v)}
                      centered
                      textColor="secondary"
                      indicatorColor="secondary"
                      sx={{
                        '& .MuiTabs-indicator': {
                          backgroundColor: '#ffb347',
                          height: 3,
                          borderRadius: 2
                        },
                        '& .MuiTab-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 500,
                          fontSize: '1rem',
                          minHeight: 44,
                          px: 3,
                          transition: 'color 0.2s',
                          '&.Mui-selected': {
                            color: '#ffb347',
                            fontWeight: 600
                          }
                        }
                      }}
                    >
                      <Tab label="Статистика отряда" />
                      <Tab label="Результаты сезонов" />
                    </Tabs>
                  </Box>
                  {performanceTab === 0 && (
                    <SquadStats stats={squadStats} performance={squad?.performance} squadId={squad?.id} />
                  )}
                  {performanceTab === 1 && (
                    <PerformanceHistory performance={squad.performance} />
                  )}
                </Box>
              )}

              {/* Вкладка "Управление" */}
              {tab === 'manage' && (isLeader || isDeputyInSquad) && (
                <Box sx={{ minWidth: 800, maxWidth: 1100, mx: 'auto' }}>
                  {/* Заявки на вступление */}
                  <Typography variant="h4" sx={{ color: '#ffb347', mb: 3 }}>
                    Заявки на вступление
                  </Typography>
                  {requestsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : requestsError ? (
                    <Alert severity="error">
                      {requestsError}
                    </Alert>
                  ) : joinRequests.length === 0 ? (
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                      Нет новых заявок
                    </Typography>
                  ) : (
                    <List>
                      {joinRequests.map(req => (
                        <ListItem
                          key={req.id}
                          sx={{
                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 2,
                            mb: 1,
                            border: '1px solid rgba(255, 179, 71, 0.2)'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar src={req.user?.avatar || '/logo.png'} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography
                                sx={{
                                  color: '#fff',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: '#4f8cff'
                                  }
                                }}
                                onClick={() => handleViewProfile(req.user?.id)}
                              >
                                {req.user?.username || 'Неизвестный пользователь'}
                              </Typography>
                            }
                            secondary={req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ''}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CheckIcon />}
                              onClick={() => handleRequestAction(req.id, 'approve')}
                              sx={{ bgcolor: '#4caf50' }}
                            >
                              Принять
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CloseIcon />}
                              onClick={() => handleRequestAction(req.id, 'reject')}
                              sx={{ bgcolor: '#f44336' }}
                            >
                              Отклонить
                            </Button>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Divider sx={{ my: 4, borderColor: 'rgba(255, 179, 71, 0.2)' }} />

                  {/* Редактирование отряда (только для лидера) */}
                  {isLeader && (
                    <>
                      <Typography variant="h4" sx={{ color: '#ffb347', mb: 3 }}>
                        Редактирование отряда
                      </Typography>
                  
                      <Box
                        component="form"
                        onSubmit={handleSave}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          p: 3,
                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 179, 71, 0.2)'
                        }}
                      >
                        {/* Логотип */}
                        <Box>
                          <Typography variant="h6" sx={{ mb: 2, color: '#ffb347' }}>
                            Логотип отряда
                          </Typography>
                          <Box
                            sx={{
                              border: dragActive ? '2px dashed #4caf50' : '2px dashed rgba(255, 179, 71, 0.3)',
                              borderRadius: 2,
                              p: 3,
                              textAlign: 'center',
                              cursor: 'pointer',
                              bgcolor: dragActive ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: '#ffb347',
                                bgcolor: 'rgba(255, 179, 71, 0.05)'
                              }
                            }}
                            onDrop={handleLogoDrop}
                            onDragOver={handleLogoDragOver}
                            onDragLeave={handleLogoDragLeave}
                            onClick={() => logoInputRef.current?.click()}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              ref={logoInputRef}
                              onChange={handleLogoFileChange}
                            />
                            <Avatar
                              src={logoPreview || '/logo.png'}
                              sx={{
                                width: 80,
                                height: 80,
                                mx: 'auto',
                                mb: 2,
                                opacity: logoPreview ? 1 : 0.4
                              }}
                            />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Перетащите изображение сюда или кликните для выбора
                            </Typography>
                          </Box>
                          <input
                            type="text"
                            name="logo"
                            value={form.logo}
                            onChange={handleFormChange}
                            placeholder="https://... или data:image..."
                            style={{
                              width: '100%',
                              padding: '12px',
                              marginTop: '8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 179, 71, 0.3)',
                              background: 'rgba(0, 0, 0, 0.3)',
                              color: '#fff',
                              fontSize: '14px'
                            }}
                          />
                          {!form.logo && (
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mt: 1 }}>
                              Будет использован дефолтный логотип
                            </Typography>
                          )}
                          {form.logo && !/^https?:\/\//.test(form.logo) && !form.logo.startsWith('data:image') && (
                            <Typography variant="caption" sx={{ color: '#f44336', display: 'block', mt: 1 }}>
                              Некорректный URL или data:image
                            </Typography>
                          )}
                        </Box>

                        {/* Набор в отряд */}
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.isJoinRequestOpen}
                              onChange={e => {
                                setForm(f => ({ ...f, isJoinRequestOpen: e.target.checked }));
                                setTouched(true);
                              }}
                              name="isJoinRequestOpen"
                              sx={{ '& .MuiSwitch-thumb': { bgcolor: '#ffb347' } }}
                            />
                          }
                          label={<Typography variant="body1" sx={{ color: '#fff' }}>Открыт набор в отряд</Typography>}
                        />

                        {/* Описание */}
                        <Box>
                          <Typography variant="h6" sx={{ mb: 2, color: '#ffb347' }}>
                            Описание отряда
                          </Typography>
                          <textarea
                            name="description"
                            value={form.description}
                            onChange={handleFormChange}
                            maxLength={500}
                            placeholder="Опишите ваш отряд..."
                            style={{
                              width: '100%',
                              minHeight: '120px',
                              padding: '12px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 179, 71, 0.3)',
                              background: 'rgba(0, 0, 0, 0.3)',
                              color: '#fff',
                              fontSize: '14px',
                              resize: 'vertical',
                              fontFamily: 'inherit'
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mt: 1 }}>
                            {form.description.length}/500 символов
                          </Typography>
                        </Box>

                        {/* Ошибки и успех */}
                        {saveError && (
                          <Alert severity="error">
                            {saveError}
                          </Alert>
                        )}
                        {saveSuccess && (
                          <Alert severity="success">
                            Изменения сохранены!
                          </Alert>
                        )}

                        {/* Кнопки */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={saving || !touched || (form.logo && !(/^https?:\/\//.test(form.logo) || form.logo.startsWith('data:image')))}
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                            sx={{
                              bgcolor: '#4caf50',
                              '&:hover': {
                                bgcolor: '#45a049'
                              }
                            }}
                          >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                          </Button>
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Правая панель */}
          <Grid item xs={12} md={3} lg={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Медаль за последний сезон (только для вкладки "Об отряде") */}
              {tab === 'about' && Array.isArray(squad.performance) && Array.isArray(squad.seasons) && squad.seasons.length > 0 && (() => {
                const lastSeason = squad.seasons[squad.seasons.length - 1];
                const perf = squad.performance.find(p => String(p.season) === String(lastSeason.id) || String(p.season) === String(lastSeason.name));
                if (!perf) return null;
                const place = perf.place;
                const points = perf.points;
                const trophy = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : null;
                return (
                  <Paper elevation={8} sx={{ p: 3, background: 'rgba(0, 0, 0, 0.3)', borderRadius: 3, backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 179, 71, 0.2)' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: '#ffb347', mb: 2 }}>
                        Последний сезон
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>{lastSeason.name}</Typography>
                      {trophy && <Typography variant="h2" sx={{ mb: 1 }}>{trophy}</Typography>}
                      <Typography variant="h5" sx={{ color: trophy ? '#ffb347' : '#fff', fontWeight: 700, mb: 1 }}>
                        {place} место
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{points} очков</Typography>
                    </Box>
                  </Paper>
                );
              })()}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Модальные окна */}
      {/* Модальное окно подтверждения отмены */}
      <Dialog open={confirmCancel} onClose={confirmCancelNo}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите отменить изменения? Все несохраненные изменения будут потеряны.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmCancelNo}>Нет</Button>
          <Button onClick={confirmCancelYes} variant="contained">
            Да, отменить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно подтверждения выхода из отряда */}
      <Dialog open={showLeaveModal} onClose={() => setShowLeaveModal(false)}>
        <DialogTitle>Подтверждение выхода</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите выйти из отряда "{squad.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveModal(false)}>Отмена</Button>
          <Button onClick={confirmLeaveSquad} variant="contained" color="error">
            Выйти
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно подтверждения удаления отряда */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s',
          }}
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
          }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 16,
              boxShadow: '0 6px 24px 0 rgba(255,179,71,0.16), 0 2px 10px rgba(0,0,0,0.14)',
              border: '2px solid #ffb347',
              padding: '32px 24px 24px 24px',
              minWidth: 320,
              maxWidth: '90vw',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              animation: 'slideDown 0.3s',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ 
              fontSize: '1.3rem', 
              marginBottom: '16px', 
              color: '#ffb347',
              textAlign: 'center'
            }}>
              Подтверждение удаления
            </h2>
            <Typography style={{ 
              color: '#fff', 
              marginBottom: '16px',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              Вы уверены, что хотите распустить отряд "{squad.name}"? Это действие нельзя отменить.
            </Typography>
            <Typography style={{ 
              color: '#fff', 
              marginBottom: '8px',
              fontSize: '0.9rem'
            }}>
              Для подтверждения введите название отряда:
            </Typography>
            <input
              type="text"
              placeholder={`Введите "${squad.name}"`}
              value={deleteConfirmText || ''}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              style={{
                width: '100%',
                marginBottom: '24px',
                borderRadius: 8,
                border: '1.5px solid #ffb347',
                padding: '8px 12px',
                background: '#232526',
                color: '#fff',
                fontSize: 16,
                outline: 'none'
              }}
            />
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                style={{
                  background: 'none',
                  border: '2px solid #ffb347',
                  color: '#ffb347',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  minWidth: '100px'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255, 179, 71, 0.1)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteSquad}
                disabled={deleteConfirmText !== squad.name}
                style={{
                  background: deleteConfirmText === squad.name ? '#f44336' : '#666',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: deleteConfirmText === squad.name ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                  minWidth: '100px',
                  opacity: deleteConfirmText === squad.name ? 1 : 0.6
                }}
                onMouseEnter={e => {
                  if (deleteConfirmText === squad.name) {
                    e.target.style.background = '#d32f2f';
                  }
                }}
                onMouseLeave={e => {
                  if (deleteConfirmText === squad.name) {
                    e.target.style.background = '#f44336';
                  }
                }}
              >
                Распустить
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideDown {
              from { transform: translateY(-40px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Модальное окно кроппера */}
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
              Обрезка логотипа отряда
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

      {/* Модальное окно управления участником */}
      {manageMemberDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s',
          }}
          onClick={() => {
            setManageMemberDialog(false);
            setSelectedMember(null);
          }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 16,
              boxShadow: '0 6px 24px 0 rgba(255,179,71,0.16), 0 2px 10px rgba(0,0,0,0.14)',
              border: '2px solid #ffb347',
              padding: '32px 24px 24px 24px',
              minWidth: 320,
              maxWidth: '90vw',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              animation: 'slideDown 0.3s',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ 
              fontSize: '1.3rem', 
              marginBottom: '16px', 
              color: '#ffb347',
              textAlign: 'center'
            }}>
              Управление участником: {selectedMember?.username}
            </h2>
            
            {manageError && (
              <div style={{
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid #f44336',
                borderRadius: 8,
                padding: '12px',
                marginBottom: '16px',
                color: '#f44336'
              }}>
                {manageError}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {/* Повысить до заместителя (только для лидера) */}
              {isLeader && selectedMember?.squadRole !== 'deputy' && (
                <button
                  type="button"
                  onClick={handlePromoteMember}
                  disabled={manageLoading}
                  style={{
                    background: 'none',
                    border: '2px solid #4caf50',
                    color: '#4caf50',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: manageLoading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    opacity: manageLoading ? 0.6 : 1
                  }}
                  onMouseEnter={e => {
                    if (!manageLoading) {
                      e.target.style.background = 'rgba(76, 175, 80, 0.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!manageLoading) {
                      e.target.style.background = 'none';
                    }
                  }}
                >
                  {manageLoading ? 'Повышение...' : 'Повысить до заместителя'}
                </button>
              )}
              
              {/* Понизить до участника (только для лидера) */}
              {isLeader && selectedMember?.squadRole === 'deputy' && (
                <button
                  type="button"
                  onClick={handleDemoteMember}
                  disabled={manageLoading}
                  style={{
                    background: 'none',
                    border: '2px solid #ff9800',
                    color: '#ff9800',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: manageLoading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    opacity: manageLoading ? 0.6 : 1
                  }}
                  onMouseEnter={e => {
                    if (!manageLoading) {
                      e.target.style.background = 'rgba(255, 152, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!manageLoading) {
                      e.target.style.background = 'none';
                    }
                  }}
                >
                  {manageLoading ? 'Понижение...' : 'Понизить до участника'}
                </button>
              )}
              
              {/* Исключить из отряда (для лидера и заместителя) */}
              <button
                type="button"
                onClick={handleKickMember}
                disabled={manageLoading}
                style={{
                  background: 'none',
                  border: '2px solid #f44336',
                  color: '#f44336',
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: manageLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  opacity: manageLoading ? 0.6 : 1
                }}
                onMouseEnter={e => {
                  if (!manageLoading) {
                    e.target.style.background = 'rgba(244, 67, 54, 0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!manageLoading) {
                    e.target.style.background = 'none';
                  }
                }}
              >
                {manageLoading ? 'Исключение...' : 'Исключить из отряда'}
              </button>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={() => {
                  setManageMemberDialog(false);
                  setSelectedMember(null);
                }}
                disabled={manageLoading}
                style={{
                  background: 'none',
                  border: '2px solid #ffb347',
                  color: '#ffb347',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: manageLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  minWidth: '100px',
                  opacity: manageLoading ? 0.6 : 1
                }}
                onMouseEnter={e => {
                  if (!manageLoading) {
                    e.target.style.background = 'rgba(255, 179, 71, 0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!manageLoading) {
                    e.target.style.background = 'none';
                  }
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default SquadDetailPage; 