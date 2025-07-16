import React from 'react';
import Sheet from '@mui/joy/Sheet';
import TypographyJoy from '@mui/joy/Typography';
import BoxJoy from '@mui/joy/Box';
import ButtonJoy from '@mui/joy/Button';
import DividerJoy from '@mui/joy/Divider';
import ListJoy from '@mui/joy/List';
import ListItemJoy from '@mui/joy/ListItem';
import ListItemButtonJoy from '@mui/joy/ListItemButton';
import ListItemDecoratorJoy from '@mui/joy/ListItemDecorator';
import NewsIcon from '@mui/icons-material/Article';
import UsersIcon from '@mui/icons-material/Group';
import AwardIcon from '@mui/icons-material/EmojiEvents';
import SquadIcon from '@mui/icons-material/Groups';
import SeasonIcon from '@mui/icons-material/CalendarMonth';
import AdminNews from '../components/admin/AdminNews';
import AdminUsers from '../components/admin/AdminUsers';
import AdminAwards from '../components/admin/AdminAwards';
import AdminSquads from '../components/admin/AdminSquads';
import AdminSeasons from '../components/admin/AdminSeasons';
import Loader from '../components/Loader';
import axios from 'axios';
import TextField from '@mui/joy/TextField';
import Alert from '@mui/joy/Alert';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [section, setSection] = React.useState('news');
  const [news, setNews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [squads, setSquads] = React.useState([]);
  const [token, setToken] = React.useState(localStorage.getItem('adminToken') || '');
  const [tokenValid, setTokenValid] = React.useState(false);
  const [tokenCheckLoading, setTokenCheckLoading] = React.useState(false);
  const [tokenError, setTokenError] = React.useState('');
  const [showToken, setShowToken] = React.useState(false);
  const [generateLoading, setGenerateLoading] = React.useState(false);
  const [generatedToken, setGeneratedToken] = React.useState('');
  const [generateError, setGenerateError] = React.useState('');

  React.useEffect(() => {
    if (token) {
      setTokenCheckLoading(true);
      axios.post('/api/admin/verify-token', { token })
        .then(res => {
          if (res.data.valid) {
            setTokenValid(true);
            setTokenError('');
            localStorage.setItem('adminToken', token);
          } else {
            setTokenValid(false);
            setTokenError('Неверный токен');
          }
        })
        .catch(() => {
          setTokenValid(false);
          setTokenError('Неверный токен');
        })
        .finally(() => setTokenCheckLoading(false));
    } else {
      setTokenValid(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (!tokenValid) return;
    if (section === 'news') {
      setLoading(true);
      axios.get('/api/news')
        .then(res => {
          setNews(res.data);
          setError(null);
        })
        .catch(() => setError('Ошибка загрузки новостей'))
        .finally(() => setLoading(false));
    } else if (section === 'users') {
      setLoading(true);
      const tokenJwt = localStorage.getItem('token');
      axios.get('/api/admin/users', { headers: tokenJwt ? { Authorization: `Bearer ${tokenJwt}` } : {} })
        .then(res => {
          setUsers(res.data);
          setError(null);
        })
        .catch(() => setError('Ошибка загрузки пользователей'))
        .finally(() => setLoading(false));
    } else if (section === 'squads') {
      setLoading(true);
      axios.get('/api/squads')
        .then(res => {
          setSquads(res.data);
          setError(null);
        })
        .catch(() => setError('Ошибка загрузки сквадов'))
        .finally(() => setLoading(false));
    }
  }, [section, tokenValid]);

  const handleGenerateToken = async () => {
    setGenerateLoading(true);
    setGenerateError('');
    try {
      const tokenJwt = localStorage.getItem('token');
      const res = await axios.post('/api/admin/generate-token', {}, {
        headers: tokenJwt ? { Authorization: `Bearer ${tokenJwt}` } : {}
      });
      setGeneratedToken(res.data.adminToken);
      setShowToken(true);
    } catch (e) {
      setGenerateError('Ошибка генерации токена');
    } finally {
      setGenerateLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <Sheet variant="outlined" sx={{ p: 4, borderRadius: 4, bgcolor: 'background.body', minHeight: 300, maxWidth: 400, mx: 'auto', mt: 8 }}>
        <TypographyJoy level="h3" sx={{ color: 'primary.plainColor', mb: 2 }}>Вход в админ-панель</TypographyJoy>
        <TypographyJoy level="body-lg" sx={{ mb: 2 }}>
          Для доступа к админке введите ваш уникальный токен администратора.
        </TypographyJoy>
        <form onSubmit={e => { e.preventDefault(); setToken(token); }}>
          <TextField
            label="Admin Token"
            value={token}
            onChange={e => setToken(e.target.value)}
            fullWidth
            disabled={tokenCheckLoading}
            sx={{ mb: 2 }}
          />
          {tokenError && <Alert color="danger" sx={{ mb: 2 }}>{tokenError}</Alert>}
          <ButtonJoy type="submit" variant="solid" color="primary" loading={tokenCheckLoading} fullWidth>
            Войти
          </ButtonJoy>
        </form>
        {currentUser?.role === 'admin' && (
          <BoxJoy sx={{ mt: 4 }}>
            <ButtonJoy variant="soft" color="primary" onClick={handleGenerateToken} loading={generateLoading}>
              Сгенерировать новый токен
            </ButtonJoy>
            {generateError && <Alert color="danger" sx={{ mt: 2 }}>{generateError}</Alert>}
            {showToken && generatedToken && (
              <Alert color="success" sx={{ mt: 2, wordBreak: 'break-all' }}>
                Ваш новый токен: <b>{generatedToken}</b>
              </Alert>
            )}
          </BoxJoy>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet variant="outlined" sx={{ p: 0, borderRadius: 4, bgcolor: 'background.body', minHeight: 400, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <BoxJoy sx={{ minWidth: 220, borderRight: { md: '1px solid #eee' }, bgcolor: 'background.level1', p: 2 }}>
        <TypographyJoy level="h4" sx={{ color: 'primary.plainColor', mb: 2 }}>Админ-панель</TypographyJoy>
        <ListJoy>
          <ListItemJoy>
            <ListItemButtonJoy selected={section === 'news'} onClick={() => setSection('news')}>
              <ListItemDecoratorJoy><NewsIcon /></ListItemDecoratorJoy>
              Новости
            </ListItemButtonJoy>
          </ListItemJoy>
          <ListItemJoy>
            <ListItemButtonJoy selected={section === 'users'} onClick={() => setSection('users')}>
              <ListItemDecoratorJoy><UsersIcon /></ListItemDecoratorJoy>
              Пользователи
            </ListItemButtonJoy>
          </ListItemJoy>
          <ListItemJoy>
            <ListItemButtonJoy selected={section === 'awards'} onClick={() => setSection('awards')}>
              <ListItemDecoratorJoy><AwardIcon /></ListItemDecoratorJoy>
              Награды
            </ListItemButtonJoy>
          </ListItemJoy>
          <ListItemJoy>
            <ListItemButtonJoy selected={section === 'squads'} onClick={() => setSection('squads')}>
              <ListItemDecoratorJoy><SquadIcon /></ListItemDecoratorJoy>
              Сквады
            </ListItemButtonJoy>
          </ListItemJoy>
          <ListItemJoy>
            <ListItemButtonJoy selected={section === 'seasons'} onClick={() => setSection('seasons')}>
              <ListItemDecoratorJoy><SeasonIcon /></ListItemDecoratorJoy>
              Сезоны
            </ListItemButtonJoy>
          </ListItemJoy>
        </ListJoy>
      </BoxJoy>
      <DividerJoy orientation={"vertical"} flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
      <BoxJoy sx={{ flex: 1, p: 3 }}>
        {section === 'news' && (
          loading ? <Loader /> :
          error ? <TypographyJoy color="danger">{error}</TypographyJoy> :
          <AdminNews news={news} setNews={setNews} />
        )}
        {section === 'users' && (
          loading ? <Loader /> :
          error ? <TypographyJoy color="danger">{error}</TypographyJoy> :
          <AdminUsers users={users} setUsers={setUsers} />
        )}
        {section === 'awards' && (
          <AdminAwards />
        )}
        {section === 'squads' && (
          loading ? <Loader /> :
          error ? <TypographyJoy color="danger">{error}</TypographyJoy> :
          <AdminSquads squads={squads} setSquads={setSquads} />
        )}
        {section === 'seasons' && (
          <AdminSeasons />
        )}
      </BoxJoy>
    </Sheet>
  );
} 