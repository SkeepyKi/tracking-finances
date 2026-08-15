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

function cleanToken(token: string): string {
  return token.trim().replace(/^["']|["']$/g, '');
}

function getHeaders(token: string, isJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cleanToken(token)}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

/**
 * Validate token by fetching user profile
 */
export async function testGistToken(token: string): Promise<{ login: string; name: string }> {
  const tokenStr = cleanToken(token);
  if (!tokenStr) throw new Error('Токен не указан');

  const res = await fetch('https://api.github.com/user', {
    headers: getHeaders(tokenStr),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Неверный токен GitHub (401 Bad credentials). Убедитесь, что скопировали токен полностью.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Ошибка проверки токена (HTTP ${res.status})`);
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
  const tokenStr = cleanToken(token);
  const payload = {
    ...data,
    lastModified: new Date().toISOString(),
  };

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: getHeaders(tokenStr, true),
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
    if (res.status === 401) {
      throw new Error('Неверный токен GitHub (401 Bad credentials). Проверьте правильность токена.');
    }
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
  const tokenStr = cleanToken(token);
  const gistIdStr = gistId.trim();
  const payload = {
    ...data,
    lastModified: new Date().toISOString(),
  };

  const res = await fetch(`https://api.github.com/gists/${gistIdStr}`, {
    method: 'PATCH',
    headers: getHeaders(tokenStr, true),
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
    if (res.status === 401) {
      throw new Error('Неверный токен GitHub (401 Bad credentials). Проверьте токен.');
    }
    if (res.status === 404) {
      throw new Error('Gist не найден (404). Проверьте Gist ID или создайте новый Gist.');
    }
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
  const tokenStr = cleanToken(token);
  const gistIdStr = gistId.trim();

  const res = await fetch(`https://api.github.com/gists/${gistIdStr}`, {
    headers: getHeaders(tokenStr),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Неверный токен GitHub (401 Bad credentials).');
    }
    if (res.status === 404) {
      throw new Error('Gist не найден (404). Проверьте Gist ID.');
    }
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
