# WorkTrack

Корпоративный портал управления задачами и проектами. Разработан в рамках производственной практики (6 недель, апрель–май 2026).

Живой деплой: **[work-track.ru](https://work-track.ru)**

---

## О проекте

WorkTrack — многопользовательская система управления задачами для корпоративной среды. Поддерживает несколько организаций с изолированными данными, ролевую модель доступа, управление проектами и задачами, аналитику.

Ключевые особенности:
- Мультитенантность — каждая организация полностью изолирована
- RBAC с иерархией ролей: owner / admin / manager / employee
- История изменений задач
- Аналитика нагрузки, статусов и приоритетов
- Загрузка вложений с валидацией magic bytes (защита от подмены типа файла)
- Два клиента: web (React) и мобильный (React Native / Expo)

---

## Стек

**Backend**
- Python 3.12, FastAPI, SQLAlchemy (async), Alembic
- PostgreSQL, Redis
- fastapi-users, Pillow, uv

**Auth**
- JWT, два транспорта: httpOnly Cookie (web) / Bearer (мобилка)
- Redis как блэклист инвалидированных токенов
- Поддержка logout-all через версионирование токенов

**Frontend**
- React, TypeScript, Zustand, React Router
- TanStack Query, recharts, react-beautiful-dnd

**Mobile**
- React Native, Expo, React Navigation
- SecureStore для хранения токена

**Инфраструктура**
- Docker, Docker Compose, Nginx (rate limiting, gzip, security headers)
- Let's Encrypt / Certbot, UFW, Fail2ban
- VPS, домен work-track.ru

---

## Архитектура

```
Client (Web / Mobile)
        │
        ▼
     Nginx
   ┌──────────────────────────────┐
   │  rate limit · gzip · SSL     │
   └──────────────────────────────┘
        │
        ▼
   FastAPI (uvicorn, 2 workers)
   ┌──────────────────────────────┐
   │  JWT auth · RBAC · CORS      │
   └──────────────────────────────┘
        │              │
        ▼              ▼
   PostgreSQL        Redis
  (основные        (блэклист
    данные)          токенов)
```

---

## API

Все эндпоинты доступны по `/api/`. Документация: [work-track.ru/docs](https://work-track.ru/docs)

| Модуль | Эндпоинты |
|--------|-----------|
| Auth | register, login (cookie/bearer), logout, logout-all, refresh |
| Профиль | GET/PATCH /users/me, аватар |
| Организации | CRUD, приглашения, участники, заявки на выход |
| Проекты | CRUD, управление составом проекта |
| Задачи | CRUD, фильтры, позиция, история изменений |
| Комментарии | CRUD с RBAC |
| Вложения | загрузка с валидацией, скачивание, удаление |
| Аналитика | overview, нагрузка по участникам, timeline, приоритеты |

---

## Тесты

Интеграционные тесты на pytest + httpx (реальная БД, без моков).

```
app/tests/
├── test_auth.py
├── test_organizations.py
├── test_projects.py
├── test_tasks.py
├── test_comments.py
├── test_attachments.py
├── test_analytics.py
└── test_security.py
```
