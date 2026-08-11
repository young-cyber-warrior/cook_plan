# План: синхронизация данных между пользователями (Supabase + PowerSync)

## Краткая сводка

**Куда движемся:** превращаем приложение (недели планирования, рецепты, грocery-списки) в offline-first приложение с шарингом данных между пользователями и видимостью чужих изменений в рантайме.

**Как:** стек **Supabase (Postgres + Auth) + PowerSync (sync engine + локальный SQLite)**. Выбран в диалоге как «вариант 2» вместо Firestore и WatermelonDB.

**Зачем именно так:**
- Пользователь заполняет данные офлайн → они сразу в локальном SQLite → при появлении сети PowerSync выгружает очередь на сервер.
- Чужие изменения прилетают через логическую репликацию Postgres → sync-стрим → локальный SQLite → reactive-запрос → UI. Отдельный WebSocket-слой не нужен.
- Шаринг и права доступа задаются в одном месте — Sync Streams («синкать запись, если юзер владелец ИЛИ участник»).
- MobX добавляем как реактивный слой над SQLite: стор-классы = единая точка чтения (watch → observable, `computed`) и записи (actions → SQLite). Источник правды — локальный SQLite, не MobX.

**Ключевые решения по данным (заложить с самого начала):**
- ID — только UUID, генерируемые на клиенте (не автоинкремент).
- LWW-разрешение конфликтов **по полям**: у каждого поля свой `updated_at`, сравнение по серверному времени, не по часам устройства.
- Удаление — только soft-delete (флаг `deleted`), иначе офлайн-удалённые записи «воскресают».

---

## Разделение ответственности

- **Sergey** — всё, что требует аккаунтов, дашбордов, секретов и реального устройства: регистрация сервисов, конфигурация в веб-консолях, ключи в `.env`, сборка dev-клиента, ручное тестирование на телефонах.
- **Claude** — весь код и конфиги в репозитории: SQL-миграции, схемы, sync-правила (черновики), клиентская интеграция, `uploadData()` с LWW, MobX-слой, UI статуса синка.

---

## Шаги

### Этап 0. Инфраструктура (Sergey)

| # | Шаг | Ответственный | Статус |
|---|-----|---------------|--------|
| 0.1 | Создать проект в [Supabase](https://supabase.com) (Postgres + Auth из коробки) | **Sergey** | ✅ |
| 0.2 | Создать инстанс [PowerSync Cloud](https://powersync.com) (или решить self-host) | **Sergey** | ✅ |
| 0.3 | В дашборде Supabase включить логическую репликацию и создать публикацию для PowerSync (Claude подготовит SQL — выполнить его) | **Sergey** (SQL — Claude) | ✅ |
| 0.4 | В дашборде PowerSync подключить Supabase-базу (connection string) | **Sergey** | ✅ |
| 0.5 | Включить Supabase Auth в PowerSync (`Client Auth`, JWT Secret пустой) | **Sergey** | ✅ |
| 0.6 | Положить ключи в `.env`: Supabase URL + anon key, PowerSync endpoint | **Sergey** → **Claude** | ✅ |

**0.1 — Supabase.** Проект `meal-planner` в орге `young-cyber-warrior's Org` (Free), регион Central EU (Frankfurt) `eu-central-1`, compute NANO, ref `mwcrhmzjwkrepwzbkgtm`, URL `https://mwcrhmzjwkrepwzbkgtm.supabase.co`. GitHub-интеграция не подключена, веток и миграций нет.

Галки Security при создании и их последствия:

- `Enable Data API` — **вкл**. `supabase-js` пишет через PostgREST, туда льётся очередь из `uploadData()`.
- `Automatically expose new tables` — **выкл** → в миграциях Этапа 1 обязателен явный `grant select, insert, update, delete on <table> to authenticated`, иначе запись упадёт.
- `Enable automatic RLS` — **вкл** → у новой таблицы RLS включается триггером, без политики она закрыта наглухо. Политики пишем в тех же миграциях.

**0.2 — PowerSync.** Cloud (не self-host), проект `meal-planner`, инстанс `Production`, регион EU. Development-инстанс не заводили намеренно: Supabase-проект один, оба инстанса смотрели бы в ту же БД → изоляции нет, а слотов логической репликации на одном Postgres два → лишний рост WAL. Понадобится stage — сначала второй Supabase-проект, только потом второй инстанс.

**0.3 — Репликация.** Выполнено в SQL Editor (`Success. No rows returned`):

```sql
create role powersync_role with replication bypassrls login password '<сохранён у Sergey>';
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;
create publication powersync for all tables;
```

`bypassrls` — чтобы репликация не резалась политиками RLS. `alter default privileges` — чтобы таблицы Этапа 1 автоматом получали `select` для реплики. Публикация `for all tables` — новые таблицы попадают в поток без правок публикации.

**0.4 — Связка.** Postgres-коннект: host `db.mwcrhmzjwkrepwzbkgtm.supabase.co`, port `5432` (direct connection, **не** pooler — через pooler логическая репликация не работает), database `postgres`, username `powersync_role`, SSL `verify-full` без ручного сертификата. `Test Connection` успешно, деплой завершён.

**0.5 — Auth.** Включён `Use Supabase Auth`. Пустыми оставлены `Supabase JWT Secret (Legacy)`, `JWKS`, `JWKS URI`, `JWT Audience`, `HS256 tokens`. `Development tokens` выключены.

Секрет пустой намеренно: legacy-проекты Supabase подписывали JWT общим HS256-секретом, новые используют асимметричные ключи — приватный не выдаётся, PowerSync сам ходит за публичным по JWKS. Заполнить это поле = сломать проверку подписи. `Development tokens` включим точечно, если понадобится дёргать `Sync Test` до готовых экранов входа.

**0.6 — Ключи.** В репозитории готово: `.gitignore` дополнен голым `.env` (раньше игнорился только `.env*.local`), создан `.env.example` с заполненным `EXPO_PUBLIC_SUPABASE_URL`. Префикс `EXPO_PUBLIC_` обязателен — Expo подставляет в бандл только такие переменные.

Осталось от Sergey: `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Supabase → `Project Settings` → `API Keys` → publishable, `sb_publishable_…`) и `EXPO_PUBLIC_POWERSYNC_URL` (PowerSync → инстанс → кнопка `Connect`). Ключ `service_role` в приложение не попадает — он игнорирует RLS.

### Этап 1. Модель данных (Claude, ревью — Sergey)

| # | Шаг | Ответственный | Статус |
|---|-----|---------------|--------|
| 1.1 | Спроектировать таблицы под текущие сущности приложения: недели/дни, рецепты, grocery-списки | **Claude** | ✅ |
| 1.2 | В каждую таблицу заложить: `id UUID`, per-field `updated_at` (для field-level LWW), `deleted` (tombstone), `owner_id` | **Claude** | ✅ |
| 1.3 | Таблица участников шаринга (`shares`: запись, user_id, роль владелец/редактор/читатель) — решить механику приглашения (по ссылке / по email) | **Claude** (механику приглашения выбирает **Sergey**) | ✅ таблица; ⬜ механика приглашения — за Sergey |
| 1.4 | Написать SQL-миграции, Sergey применяет их в Supabase | **Claude** → выполняет **Sergey** | ✅ применена в SQL Editor 2026-08-10 |

**Миграция:** `supabase/migrations/20260810120000_init_sync_schema.sql` — выполнить целиком в Supabase SQL Editor. Публикация `powersync` создана `for all tables`, а `alter default privileges` уже выдаёт реплике `select` (этап 0.3) — для новых таблиц ничего дополнительно делать не нужно.

**Схема — 8 таблиц:**

- `categories` — категории рецептов юзера: `slug` (у дефолтных — `breakfast`/`lunch`/`dinner`/`snack`, у новых — слагифицированный label), `label`, `position`. Дефолтные категории сидирует клиент при первом входе (этап 4), в БД их нет.
- `recipes` — объединяет два текущих драфт-типа `Recipe` (day-card и recipes): `category_id → categories`, `title`, `description`, `photos jsonb` (массив URL), макросы на порцию четырьмя колонками `calories/protein/fat/carbs` — у каждой свой таймстемп в `field_times`, правки разных макросов не конфликтуют.
- `recipe_ingredients` — ингредиенты отдельной таблицей, не jsonb: два юзера офлайн правят разные ингредиенты одного рецепта → обе правки выживают (LWW на уровне строк/полей, а не всего блоба).
- `weeks` — только `start_date`, `end_date` (+ check ≤ 7 дней). Таблицы `days` нет: день восстанавливается из диапазона недели, а слоты еды висят на `meals.day`.
- `meals` — `week_id`, `day date`, `title`, `category` (check по 4 слотам — как текущий `MealCategory`), `servings` (check 1–20), `recipe_id` (nullable — пустой слот), `position` (порядок слотов внутри дня; порядок массива в SQL не существует).
- `grocery_lists` — `week_ids jsonb` (снапшот выбранных недель, junction-таблица тут избыточна), `source_hash`, `recipe_count`.
- `grocery_items` — позиции списка: `name`, `amount`, `unit`, `checked`, `edited`.
- `shares` — generic: `resource_type` (`week` | `recipe` | `grocery_list`), `resource_id`, `user_id` (кому расшарено), `role` (`editor` | `viewer`; владелец — это `owner_id`, ему строка не нужна). Уникальность `(resource_type, resource_id, user_id)` среди неудалённых.

**Сквозные колонки (шаг 1.2):** `id uuid` (default `gen_random_uuid()`, но клиент генерирует сам), `owner_id` (default `auth.uid()`), `deleted` (tombstone), `created_at`, `updated_at`, `field_times jsonb`.

**Per-field LWW — `field_times` + триггер `lww_touch`,** а не колонка-на-поле: при каждом UPDATE триггер сравнивает old/new и проставляет изменившимся полям `now()` **сервера** — часы устройства не участвуют, клиент эти таймстемпы не пишет вообще. Схема расширяется без новых `*_updated_at`-колонок. Триггер же замораживает `id`, `owner_id`, `created_at`. Разрешение конфликтов при этом — порядок прибытия на сервер: `uploadData()` (этап 4.3) шлёт PATCH только изменённых полей, поэтому правки разных полей не затирают друг друга, а по одному полю побеждает последняя долетевшая; `field_times` — аудит и материал для будущего «твоя правка перезаписана».

**RLS:** чтение — владелец или участник `shares`; запись — владелец или `editor`. Дочерние таблицы (`recipe_ingredients`, `meals`, `grocery_items`) проверяют доступ через родителя, и их `owner_id` обязан совпадать с родительским. В `shares` участник может только «выйти» (soft-delete своей строки) — поднять себе роль RLS не даст. PostgREST-чтение почти не используется (чтение идёт из локального SQLite), но политики select — гигиена на будущее.

**`delete` не выдан роли `authenticated` намеренно** (grant только `select, insert, update`): удаление — исключительно tombstone `deleted = true`, hard delete невозможен на уровне прав → офлайн-«воскрешение» исключено и по данным, и по правам.

**Решения за Sergey (не блокируют этапы 2–4):**
- 1.3 — механика приглашения: по email (ищем юзера по email → вставляем в `shares`) или по ссылке (понадобится таблица `invites` с токеном — добавим отдельной миграцией на этапе 5).
- Если шарить всё «одним махом» (семейный режим) окажется основным сценарием — расширим `resource_type` значением `all` или перейдём на space-модель; текущая схема этому не мешает.

### Этап 2. Auth (Claude + Sergey)

| # | Шаг | Ответственный | Статус |
|---|-----|---------------|--------|
| 2.1 | Включить нужные способы входа в Supabase Auth (email / OAuth-провайдеры) в дашборде | **Sergey** | ✅ Email вкл, Confirm email выкл (на время разработки), OAuth не подключали |
| 2.2 | Экраны входа/регистрации в RN, Supabase JS-клиент | **Claude** | ✅ |
| 2.3 | Передача Supabase JWT в PowerSync (нативная интеграция) | **Claude** | ⬜ (коннектор — вместе с SDK на этапе 4.1) |

**2.2 — сделано:** `src/lib/supabase.ts` (клиент по официальному RN-рецепту: AsyncStorage, autoRefresh по AppState, processLock), `src/features/auth/context/auth-context.tsx` (сессия + signIn/signUp/signOut), экран `src/app/sign-in.tsx`, guard в `src/app/_layout.tsx` через `Stack.Protected` (без сессии — только sign-in, навбар скрыт), кнопка «Выйти» и email в настройках. Пакеты: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`.

Попутно: `app.json` → `web.output: "static"` заменён на `"single"` — SSR-рендер падал на unistyles, веб нужен только как dev-проверка. Проверено в браузере полным циклом: регистрация → приложение → выход → вход (тест-аккаунт `w87075275+test1@gmail.com`, юзер виден в Supabase → Authentication → Users).

### Этап 3. Sync Streams — шаринг + realtime (Claude, деплой — Sergey)

| # | Шаг | Ответственный |
|---|-----|---------------|
| 3.1 | Написать Sync Streams: «запись синкается юзеру, если он владелец ИЛИ есть строка в `shares`» | **Claude** |
| 3.2 | Задеплоить правила в PowerSync-дашборд | **Sergey** |

### Этап 4. Клиент RN (Claude)

| # | Шаг | Ответственный |
|---|-----|---------------|
| 4.1 | Поставить PowerSync RN SDK. **Важно:** нативный модуль — Expo Go не подойдёт, нужен dev client (`npx expo run` / EAS build) | **Claude** (сборка на устройстве — **Sergey**) |
| 4.2 | Описать клиентскую схему (SQLite-вьюхи поверх синк-данных) | **Claude** |
| 4.3 | Написать `uploadData()`: заливка очереди в Supabase + field-level LWW по `updated_at` (серверное время), обработка tombstones | **Claude** |
| 4.4 | Добавить MobX в проект (сейчас его нет — стейт на React-контекстах). Стор-классы как единая точка работы с SQLite: watch-запрос PowerSync → observable, производные значения через `computed`, запись только через actions → SQLite (не напрямую в observable) | **Claude** |
| 4.5 | Перевести существующие фичи (weeks, recipes, grocery) с контекстов/useState на MobX-сторы поверх PowerSync; компоненты становятся `observer`, UI-стейт (аккордеоны, черновики, модалки) не трогаем | **Claude** |

### Этап 5. UX синхронизации (Claude)

| # | Шаг | Ответственный |
|---|-----|---------------|
| 5.1 | Индикатор статуса синка в UI: idle / syncing / offline / ошибка (SDK отдаёт состояние соединения и размер очереди) | **Claude** |
| 5.2 | UI шаринга: пригласить участника, список участников, роли | **Claude** |

### Этап 6. Тестирование (Sergey + Claude)

| # | Шаг | Ответственный |
|---|-----|---------------|
| 6.1 | Сценарий: два устройства онлайн — изменения видны в рантайме | **Sergey** (устройства), сценарии — **Claude** |
| 6.2 | Сценарий: заполнить офлайн → включить сеть → данные долетели, ничего не потерялось | **Sergey** |
| 6.3 | Сценарий: конфликт — два юзера правят одну запись, разные поля офлайн → оба изменения сохранились (field-level LWW) | **Sergey** |
| 6.4 | Сценарий: офлайн-удаление не «воскресает» после синка | **Sergey** |

---

## ⚠️ Главный конфликтный сценарий: два юзера правили одни данные офлайн

Что происходит при появлении сети: оба клиента выгружают свои очереди изменений → сервер получает две версии → конфликт разрешает наш код в `uploadData()` (этап 4.3).

**Фикс — field-level LWW:**
- Разные поля одной записи → **оба изменения выживают** (у каждого поля свой `updated_at`).
- Одно и то же поле → побеждает более поздний `updated_at` **по серверному времени**; проигравшая правка теряется молча, у проигравшего после синка отобразится победившее значение.
- Обязательное условие: LWW именно по полям, не по всей записи — иначе правка соседнего поля затрёт чужую.

Если молчаливая потеря станет проблемой — эскалация (не делать заранее): уведомление «твоя правка перезаписана» или история версий.

## Подводные камни (из диалога, держать в голове)

- **Конфликты — наша зона:** PowerSync даёт очередь/ретраи/чекпоинты, но `uploadData()` и LWW пишем сами.
- **WAL на Supabase:** на простаивающих инстансах логическая репликация может раздуть WAL → мониторить диск, настроить `archive_timeout`.
- **Серверное время для LWW:** сравнивать по `now()` базы, не по часам телефона.
- **Латентность:** near-realtime (доли секунды — секунды) через WAL-репликацию; для совместного заполнения форм достаточно, Supabase Realtime сверху не городим.

## Источники из диалога

- https://docs.powersync.com/integrations/supabase/guide
- https://supabase.com/partners/powersync
- https://ignitecookbook.com/docs/recipes/LocalFirstDataWithPowerSync/
- https://queryplane.com/docs/blog/write-patterns-for-powersync
