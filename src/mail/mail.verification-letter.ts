export const getVerificationLetter = (verificationUrl: string): string => {
	return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение регистрации</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      background-color: #f8f9fa;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      padding: 15px; /* Добавляем внешние отступы для всего тела письма */
    }
    .email-wrapper {
      max-width: 100%;
      padding: 15px; /* Дополнительный внешний отступ */
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto; /* Изменено с 20px auto на 0 auto */
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn-activate {
      background-color: #0d6efd;
      border-color: #0d6efd;
      padding: 10px 24px;
      font-weight: 500;
      transition: all 0.3s;
    }
    .btn-activate:hover {
      background-color: #0b5ed7;
      transform: translateY(-2px);
    }
    .header-image {
      height: 120px;
      background: linear-gradient(135deg, #13547a 0%, #80d0c7 100%);
      position: relative;
    }
    .logo-container {
      width: 80px;
      height: 80px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .content-section {
      padding-top: 50px;
    }
    .text-small {
      font-size: 0.875rem;
    }
    .footer-section {
      background-color: #f1f3f5;
    }
    @media (max-width: 576px) {
      body { padding: 10px; }
      .email-wrapper { padding: 5px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container bg-white" style="padding-inline: 20px">
      <div class="header-image">
        <div class="logo-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#0d6efd" class="bi bi-envelope-check" viewBox="0 0 16 16">
            <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/>
            <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686"/>
          </svg>
        </div>
      </div>
      
      <div class="content-section px-4 py-4 text-center">
        <h1 class="fw-bold mb-4 text-primary">Подтверждение регистрации</h1>
        <p class="mb-4 fs-5">Спасибо за регистрацию! Для активации вашего аккаунта, пожалуйста, нажмите на кнопку ниже:</p>
        
        <div class="d-grid gap-2 col-md-8 mx-auto mb-4">
          <a href="${verificationUrl}" class="btn btn-primary btn-lg btn-activate" style="color: white; text-decoration: none;">
            Активировать аккаунт
          </a>
        </div>
        
        <p class="text-muted mb-0 text-small">Если кнопка не работает, скопируйте и вставьте следующую ссылку в ваш браузер:</p>
        <p class="mb-4">
          <a href="${verificationUrl}" class="text-break text-small">
            ${verificationUrl}
          </a>
        </p>
        
        <div class="alert alert-secondary text-small py-2 mb-0">
          Если вы не регистрировались на нашем сайте, пожалуйста, проигнорируйте это письмо.
        </div>
      </div>
      
      <div class="footer-section p-4 text-center">
        <p class="text-muted mb-1 text-small">© 2024 Wireside's fake company. Все права защищены.</p>
        <p class="text-muted mb-0 text-small">Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
      </div>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
};
