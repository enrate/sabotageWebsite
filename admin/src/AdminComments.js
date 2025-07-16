import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import CommentsTable from './components/CommentsTable';
import axios from 'axios';

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/comments', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setComments(res.data);
    } catch (e) {
      setError('Ошибка загрузки комментариев');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  return (
    <Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> :
        <CommentsTable comments={comments} refreshComments={fetchComments} />
      }
    </Box>
  );
};

export default AdminComments; 