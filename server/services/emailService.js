const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Создаем транспортер для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: true, // true для 465, false для других портов
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Генерация токена подтверждения
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Отправка email для подтверждения
const sendVerificationEmail = async (email, username, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Sabotage Group" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Подтверждение регистрации - Sabotage Group',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #232526; color: #ffb347; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Sabotage Group</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Добро пожаловать, ${username}!</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Спасибо за регистрацию на сайте Sabotage Group. Для завершения регистрации необходимо подтвердить ваш email адрес.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #ffb347; color: #232526; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Подтвердить Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Если кнопка не работает, скопируйте и вставьте следующую ссылку в браузер:
          </p>
          <p style="color: #999; font-size: 12px; word-break: break-all;">
            ${verificationUrl}
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Ссылка действительна в течение 24 часов.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    return false;
  }
};

// Отправка email для сброса пароля
const sendPasswordResetEmail = async (email, username, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Sabotage Group" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Сброс пароля - Sabotage Group',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #232526; color: #ffb347; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Sabotage Group</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Сброс пароля</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Здравствуйте, ${username}! Вы запросили сброс пароля для вашего аккаунта.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #ffb347; color: #232526; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Сбросить пароль
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Ссылка действительна в течение 1 часа.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    return false;
  }
};

// Экспортируем отдельную функцию для воркера
const sendVerificationEmailTask = async ({ email, username, token }) => {
  return sendVerificationEmail(email, username, token);
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendVerificationEmailTask,
  sendPasswordResetEmail
}; 