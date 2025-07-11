const { createClient } = require('redis');
const { sendVerificationEmailTask } = require('../services/emailService');

const redis = createClient({ url: 'redis://localhost:6379' });

async function startWorker() {
  await redis.connect();
  await redis.subscribe('send_verification_email', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[EmailWorker] Получена задача на отправку email:', data);
      await sendVerificationEmailTask(data);
      console.log('[EmailWorker] Email отправлен:', data.email);
    } catch (err) {
      console.error('[EmailWorker] Ошибка при отправке email:', err);
    }
  });
}

startWorker(); 