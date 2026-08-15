import { FinanceData } from '../types';

const GIST_FILENAME = 'finance-tracker-data.json';

interface GistResponse {
  id: string;
  updated_at: string;
  description: string;
  files: {
    [key: string]: {
      filename: string;
      content: string;
      raw_url: string;
    };
  };
}

/**
 * Validate token by fetching user profile
 */
export async function testGistToken(token: string): Promise<{ login: string; name: string }> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Неверный токен GitHub (401 Unauthorized)');
    throw new Error(`Ошибка проверки токена (HTTP ${res.status})`);
  }

  const json = await res.json();
  return { login: json.login, name: json.name || json.login };
}

/**
 * Create a new private Gist for backup
 */
export async function createPrivateGist(
  token: string,
  data: FinanceData
): Promise<{ gistId: string; updatedAt: string }> {
  const payload = {
    ...data,
    lastModified: new Date().toISOString(),
  };

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: '🔒 Finance Tracker - Приватный бэкап данных',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Ошибка создания Gist (HTTP ${res.status})`);
  }

  const gist: GistResponse = await res.json();
  return { gistId: gist.id, updatedAt: gist.updated_at };
}

/**
 * Push local data to an existing private Gist
 */
export async function pushToGist(
  token: string,
  gistId: string,
  data: FinanceData
): Promise<{ updatedAt: string }> {
  const payload = {
    ...data,
    lastModified: new Date().toISOString(),
  };

  const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: '🔒 Finance Tracker - Приватный бэкап данных',
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Ошибка сохранения в Gist (HTTP ${res.status})`);
  }

  const gist: GistResponse = await res.json();
  return { updatedAt: gist.updated_at };
}

/**
 * Pull latest data from private Gist
 */
export async function pullFromGist(
  token: string,
  gistId: string
): Promise<{ data: FinanceData; updatedAt: string }> {
  const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('Gist не найден (проверьте Gist ID)');
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Ошибка получения Gist (HTTP ${res.status})`);
  }

  const gist: GistResponse = await res.json();
  const file = gist.files[GIST_FILENAME] || Object.values(gist.files)[0];

  if (!file || !file.content) {
    throw new Error('В выбранном Gist нет файла с данными');
  }

  try {
    const parsed = JSON.parse(file.content) as FinanceData;
    return { data: parsed, updatedAt: gist.updated_at };
  } catch {
    throw new Error('Не удалось прочитать JSON из Gist');
  }
}
