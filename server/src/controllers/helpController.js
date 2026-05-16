const nodemailer = require('nodemailer')

const TOPICS = [
  'Технические проблемы',
  'Вопрос по функционалу',
  'Предложение по улучшению',
  'Ошибка в данных',
  'Другое',
]

exports.sendHelp = async (req, res) => {
  const { topic, email, description } = req.body

  if (!email || !description) {
    return res.status(400).json({ message: 'Email и описание обязательны' })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })

    await transporter.sendMail({
      from:    `"KrispManager" <${process.env.MAIL_USER}>`,
      to:      'krispmanage@yandex.ru',
      subject: `Обращение: ${topic || 'Без темы'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#037247">Новое обращение через KrispManager</h2>
          <p><strong>Тема:</strong> ${topic || '—'}</p>
          <p><strong>Адрес для ответа:</strong> ${email}</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0"/>
          <p><strong>Описание:</strong></p>
          <p style="white-space:pre-wrap">${description}</p>
        </div>
      `,
    })

    res.json({ message: 'Обращение отправлено' })
  } catch (err) {
    console.error('Help email error:', err)
    res.status(500).json({ message: 'Не удалось отправить письмо', error: err.message })
  }
}
