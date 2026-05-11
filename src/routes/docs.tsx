import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "Install & API — BayTasks" }] }),
  component: Docs,
});

const TABS = ["Install (Windows + XAMPP)", "MySQL schema", "Laravel API", "Telegram bot"] as const;

function Docs() {
  const [tab, setTab] = useState<typeof TABS[number]>(TABS[0]);
  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Install &amp; API spec</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drop-in spec to wire BayTasks to a Laravel + MySQL backend running on XAMPP / Laragon.
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${tab === t ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="glass rounded-2xl p-5">
        {tab === "Install (Windows + XAMPP)" && <Install />}
        {tab === "MySQL schema" && <Schema />}
        {tab === "Laravel API" && <Api />}
        {tab === "Telegram bot" && <Telegram />}
      </div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return <pre className="bg-secondary/60 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed border border-border whitespace-pre">{children}</pre>;
}

function Install() {
  return (
    <div className="prose prose-invert max-w-none text-sm space-y-3">
      <h3 className="font-medium">Server requirements</h3>
      <ul className="list-disc pl-5 text-muted-foreground space-y-1">
        <li>Windows PC server with XAMPP or Laragon</li>
        <li>PHP ≥ 8.2, Composer, Node 20+, MySQL 8 / MariaDB 10.6</li>
        <li>Apache (XAMPP) or Nginx (Laragon)</li>
      </ul>
      <h3 className="font-medium mt-4">1. Database (phpMyAdmin)</h3>
      <Code>{`# In phpMyAdmin → New → Database name: baytasks (utf8mb4_unicode_ci)
# Then import the schema from the "MySQL schema" tab.`}</Code>
      <h3 className="font-medium mt-4">2. Laravel backend</h3>
      <Code>{`composer create-project laravel/laravel baytasks-api
cd baytasks-api
composer require laravel/sanctum guzzlehttp/guzzle
# Edit .env:
#   DB_DATABASE=baytasks
#   DB_USERNAME=root
#   DB_PASSWORD=
#   TELEGRAM_BOT_TOKEN=...
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000`}</Code>
      <h3 className="font-medium mt-4">3. Scheduler (Windows Task Scheduler)</h3>
      <Code>{`# Create a Basic Task → Trigger: Daily, Repeat every 1 minute
# Action: Start a program
#   Program: C:\\xampp\\php\\php.exe
#   Arguments: C:\\xampp\\htdocs\\baytasks-api\\artisan schedule:run
# This runs reminders, recurring tasks, and the daily Telegram briefing.`}</Code>
      <h3 className="font-medium mt-4">4. Frontend</h3>
      <Code>{`# This BayTasks UI persists to localStorage out of the box.
# To wire it to your Laravel API, replace src/lib/store.ts persistence
# with fetch() calls to the routes documented in "Laravel API".`}</Code>
    </div>
  );
}

function Schema() {
  return (
    <Code>{`-- baytasks schema (MySQL 8 / MariaDB 10.6)
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
);

CREATE TABLE projects (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  emoji VARCHAR(8) DEFAULT '📋',
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE boards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  board_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  notes TEXT,
  column_key ENUM('backlog','todo','in_progress','review','done') DEFAULT 'todo',
  priority ENUM('low','med','high','urgent') DEFAULT 'med',
  tags JSON,
  due_at DATETIME NULL,
  reminder ENUM('10m','1h','1d') NULL,
  recurring ENUM('none','daily','weekly','monthly') DEFAULT 'none',
  position INT NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  reminded TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (due_at), INDEX (column_key)
);

CREATE TABLE subtasks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  done TINYINT(1) DEFAULT 0,
  position INT DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE attachments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  size INT,
  path VARCHAR(512),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE reminders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  fire_at DATETIME NOT NULL,
  channel ENUM('inapp','telegram') DEFAULT 'inapp',
  sent TINYINT(1) DEFAULT 0,
  INDEX (fire_at, sent),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE telegram_settings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED UNIQUE NOT NULL,
  chat_id VARCHAR(64) NOT NULL,
  enabled TINYINT(1) DEFAULT 1,
  daily_briefing TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);`}</Code>
  );
}

function Api() {
  return (
    <Code>{`# Auth (Sanctum)
POST   /api/register             { name, email, password }
POST   /api/login                { email, password }       -> { token }
POST   /api/logout
GET    /api/me

# Projects & boards
GET    /api/projects
POST   /api/projects             { name, emoji }
GET    /api/projects/{id}/boards
POST   /api/projects/{id}/boards { name }

# Tasks
GET    /api/boards/{id}/tasks
POST   /api/tasks                { board_id, title, column_key, priority, tags[], due_at, reminder, recurring, description }
PATCH  /api/tasks/{id}           (any field)
DELETE /api/tasks/{id}
POST   /api/tasks/{id}/move      { column_key, position }

# Subtasks / attachments / activity
POST   /api/tasks/{id}/subtasks      { title }
PATCH  /api/subtasks/{id}            { done }
POST   /api/tasks/{id}/attachments   (multipart)
GET    /api/tasks/{id}/activity

# Reminders + Telegram
GET    /api/telegram               -> settings
PUT    /api/telegram               { chat_id, enabled, daily_briefing }
POST   /api/telegram/test

# Analytics
GET    /api/analytics/summary?board_id=...
GET    /api/analytics/series?days=14

# All non-auth routes use Authorization: Bearer <token>
# Standard JSON envelope: { data, meta?, error? }`}</Code>
  );
}

function Telegram() {
  return (
    <div className="text-sm space-y-3">
      <p>1. Talk to <span className="font-mono text-primary">@BotFather</span> → <span className="font-mono">/newbot</span> → save the token.</p>
      <p>2. Add <span className="font-mono">TELEGRAM_BOT_TOKEN</span> to Laravel <span className="font-mono">.env</span>.</p>
      <p>3. Send any message to your bot, then visit <span className="font-mono">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span> to find your <span className="font-mono">chat_id</span>. Paste it in BayTasks → Settings.</p>
      <Code>{`// Laravel: app/Services/Telegram.php
public function send(string $chatId, string $text): void {
  Http::post("https://api.telegram.org/bot".env('TELEGRAM_BOT_TOKEN')."/sendMessage", [
    'chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML',
  ]);
}

// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void {
  $schedule->call(fn() => app(ReminderDispatcher::class)->tick())->everyMinute();
  $schedule->call(fn() => app(DailyBriefing::class)->run())->dailyAt('08:00');
  $schedule->call(fn() => app(RecurringTasks::class)->roll())->dailyAt('00:05');
}`}</Code>
      <p className="text-muted-foreground">Daily briefing message format:</p>
      <Code>{`☀️ <b>Morning, {name}</b>
You have <b>{open}</b> open tasks, <b>{due_today}</b> due today, <b>{overdue}</b> overdue.
🔥 Streak: {streak} days. Let's ship it.`}</Code>
    </div>
  );
}
