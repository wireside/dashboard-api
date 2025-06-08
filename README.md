# Документация API
[![CI](https://github.com/wireside/dashboard-api/actions/workflows/github-ci.yml/badge.svg)](https://github.com/wireside/dashboard-api/actions/workflows/github-ci.yml)

## Обзор

`Dashboard-API` представляет собой RESTful сервер, разработанный на TypeScript и Express с использованием системы двухтокеновой JWT-аутентификации. API предназначено для аутентификации пользователей и обеспечения доступа к защищенным ресурсам.

## Технологический стек

- **TypeScript** - основной язык разработки
- **Express** - фреймворк для создания веб-сервера
- **Prisma** - ORM для работы с базой данных
- **JWT** - система токенов для авторизации
- **InversifyJS** - контейнер для инъекции зависимостей

## Инициализация проекта

### Предварительные требования
- Node.js (14.x или выше)
- npm/yarn
- PostgreSQL/MySQL/SQLite

### Шаги инициализации

1. **Установка зависимостей**
   ```bash
   npm install
   ```

2. **Настройка окружения**
   Создайте файл `.env` со следующими параметрами:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
   SALT=10
   JWT_SECRET_KEY="your_jwt_secret"
   JWT_REFRESH_SECRET_KEY="your_refresh_secret"
   PRODUCTION="false"
   ```

3. **Миграция базы данных**
   ```bash
   npx prisma migrate dev
   ```

4. **Запуск сервера**
   ```bash
   # Режим разработки
   npm run dev
   
   # Продакшн
   npm run build
   npm run start
   ```

## Система аутентификации

API использует двухтокеновую JWT-систему:

- **Access токен**
  - Срок жизни: 15 минут
  - Передаётся в заголовке `Authorization: Bearer {token}`
  - Используется для авторизации запросов к защищенным ресурсам

- **Refresh токен**
  - Срок жизни: 7 дней
  - Хранится в `HttpOnly` cookie
  - Используется для обновления access токена

### Алгоритм работы

1. Пользователь аутентифицируется через `/users/login`
2. Сервер возвращает access токен и устанавливает refresh токен в cookie
3. Клиент использует access токен для запросов
4. При истечении access токена клиент обращается к `/users/refresh` для получения нового токена
5. При истечении refresh токена требуется повторная аутентификация

## API Endpoints

### Аутентификация

#### Регистрация пользователя
```
POST /users/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Username",
  "password": "password123"
}
```

**Ответ (201 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Username"
    }
  }
}
```

#### Вход в систему
```
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ (200 OK)**
```json
{
  "success": true,
  "data": {
    "auth": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5..."
    }
  }
}
```

**Cookie**
```
refreshToken=eyJhbGciOiJIUzI1NiIsInR5...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

#### Обновление токена
```
POST /users/refresh
```

**Требуемые данные**:
- Валидный refresh токен в cookie

**Ответ (200 OK)**
```json
{
  "success": true,
  "data": {
    "auth": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5..."
    }
  }
}
```

**Cookie**
```
refreshToken=eyJhbGciOiJIUzI1NiIsInR5...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

#### Выход из системы
```
POST /users/logout
```

**Ответ (200 OK)**
```json
{
  "success": true,
  "data": {
    "auth": {
      "message": "Logged out successfully"
    }
  }
}
```

### Защищенные ресурсы

#### Получение информации о пользователе
```
GET /users/info
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
```

**Ответ (200 OK)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Username"
    }
  }
}
```

## Обработка ошибок

### Общий формат ответа с ошибкой
```json
{
	"success": false,
	"error": {
		"statusCode": 401,
		"errors": [
			{
				"message": "Invalid access token",
				"context": "auth"
			}
		],
		"stack": "Error: Invalid access..."
	}
}
```

### Общий формат ошибок
```json
{
  "statusCode": 401,
  "message": "Access token is expired",
  "context": "auth"
}
```

### Типичные коды ошибок

- **401** - Unauthorized (неавторизован)
  - "Access token is expired"
  - "Invalid access token"
  - "Refresh token expired, please login again"
  - "Invalid refresh token"

- **404** - Not Found (не найдено)
  - "User not found"

- **400** - Bad Request (неверный запрос)
  - "Email already exists"
  - "Invalid email or password"

## Рекомендации по интеграции на клиенте

1. **Хранение токенов**:
  - Access токен: хранить в памяти
  - Refresh токен: автоматически управляется через cookies

2. **Перехват ошибок**:
  - При получении 401 "Access token is expired" - запросить новый через `/users/refresh`
  - При ошибке refresh токена - перенаправить на страницу входа

3. **Пример интеграции**:
   ```javascript
   async function fetchWithAuth(url, options = {}) {
     // Добавляем токен
     const headers = {
       ...options.headers,
       'Authorization': `Bearer ${accessToken}`
     };
     
     const response = await fetch(url, { ...options, headers, credentials: 'include' });
     
     if (response.status === 401) {
       // Пробуем обновить токен
       const refreshed = await refreshTokens();
       if (refreshed) {
         // Повторяем запрос с новым токеном
         headers.Authorization = `Bearer ${accessToken}`;
         return fetch(url, { ...options, headers, credentials: 'include' });
       } else {
         // Перенаправляем на страницу входа
         window.location.href = '/login';
       }
     }
     
     return response;
   }
   ```

## Дополнительные настройки

### Изменение срока действия токенов

Для изменения срока действия токенов отредактируйте файл `src/auth/auth.service.ts`:
- Access токен: параметр `expiresIn: '15m'`
- Refresh токен: параметр `expiresIn: '7d'`

При изменении срока действия refresh токена также необходимо обновить параметр `maxAge` в cookie.
