# NextSound фронтенд — кратко по деплою

> Полное руководство (сервер, бэкенд, база, Caddy, траблшутинг) — в репозитории **nextsound-backend**, файл `DEPLOY.md`.

## Локальная разработка
```bash
npm install
npm run dev          # http://localhost:5173
```
Чтобы ходить в локальный бэкенд, создай `.env.local`:
```
VITE_API_URL=http://localhost:3000
```

## Деплой на прод
Сборка делается локально, потом `dist` заливается на сервер.

1. Собрать (подхватит `VITE_API_URL=/api` из `.env.production`, он уже в репо):
   ```bash
   npm run build
   ```
2. Залить на сервер — **в Git Bash**:
   ```bash
   cd dist
   tar czf - . | ssh root@85.193.80.7 'rm -rf /var/www/nextsound && mkdir -p /var/www/nextsound && tar xzf - -C /var/www/nextsound'
   ```
3. Открыть https://nextsound.pro и нажать **Ctrl+F5**.

## Релиз
1. Поднять `version` в `package.json` (синхронно с бэкендом).
2. Дописать `CHANGELOG.md`.
3. `git add . && git commit -m "vX.Y.Z: ..." && git push origin master`.

Версионирование — SemVer: PATCH — фиксы, MINOR — фичи, MAJOR — ломающие изменения. В коммитах не упоминать нейросеть.
