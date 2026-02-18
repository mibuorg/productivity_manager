import { randomUUID } from 'node:crypto';
import dns from 'node:dns/promises';
import { promises as fs } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';
import type { Board, CustomFieldDefinition, Task } from '../src/types/kanban';

type LocalKanbanState = {
  schemaVersion: 1;
  updatedAt: string;
  board: Board;
  tasks: Task[];
  customFields: CustomFieldDefinition[];
};

const API_PATH = '/api/local-state';
const INTERNET_STATUS_PATH = '/api/internet-status';
const DEFAULT_BOARD_NAME = 'Tasks to Complete';
const INTERNET_CHECK_CACHE_MS = 15000;

const nowIso = () => new Date().toISOString();

const createId = () => {
  try {
    return randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

const createDefaultState = (): LocalKanbanState => {
  const timestamp = nowIso();
  return {
    schemaVersion: 1,
    updatedAt: timestamp,
    board: {
      id: createId(),
      name: DEFAULT_BOARD_NAME,
      created_at: timestamp,
      updated_at: timestamp,
    },
    tasks: [],
    customFields: [],
  };
};

const normalizeState = (candidate: unknown): LocalKanbanState => {
  const fallback = createDefaultState();
  if (!candidate || typeof candidate !== 'object') {
    return fallback;
  }

  const maybeState = candidate as Partial<LocalKanbanState>;
  const board = maybeState.board as Board | undefined;
  if (!board || typeof board !== 'object' || typeof board.id !== 'string') {
    return fallback;
  }

  return {
    schemaVersion: 1,
    updatedAt: typeof maybeState.updatedAt === 'string' ? maybeState.updatedAt : nowIso(),
    board: {
      id: board.id,
      name: typeof board.name === 'string' && board.name.trim() ? board.name : DEFAULT_BOARD_NAME,
      created_at: typeof board.created_at === 'string' ? board.created_at : nowIso(),
      updated_at: nowIso(),
    },
    tasks: Array.isArray(maybeState.tasks) ? (maybeState.tasks as Task[]) : [],
    customFields: Array.isArray(maybeState.customFields)
      ? (maybeState.customFields as CustomFieldDefinition[])
      : [],
  };
};

const resolveDataFilePath = (root: string) => {
  const configuredPath = process.env.KANBAN_LOCAL_STATE_FILE;
  if (!configuredPath) {
    return path.join(root, 'local-data', 'kanban-state.json');
  }
  return path.isAbsolute(configuredPath) ? configuredPath : path.join(root, configuredPath);
};

const readState = async (filePath: string): Promise<LocalKanbanState> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      console.error('Failed to read local kanban state; recreating file.', error);
    }
    const fallback = createDefaultState();
    await writeState(filePath, fallback);
    return fallback;
  }
};

const writeState = async (filePath: string, state: LocalKanbanState): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
};

const parseBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : null;
};

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const checkInternetConnectivity = async () => {
  try {
    await dns.resolve('example.com');
    return true;
  } catch {
    return false;
  }
};

const attachMiddleware = (
  use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void,
  root: string
) => {
  const dataFilePath = resolveDataFilePath(root);
  let lastInternetCheckAt = 0;
  let lastInternetCheckResult = false;

  use(async (req, res, next) => {
    const requestPath = req.url?.split('?')[0] || '';
    if (requestPath !== API_PATH && requestPath !== INTERNET_STATUS_PATH) {
      next();
      return;
    }

    if (requestPath === INTERNET_STATUS_PATH) {
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Allow', 'GET, OPTIONS');
        res.end();
        return;
      }

      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }

      const now = Date.now();
      if (now - lastInternetCheckAt > INTERNET_CHECK_CACHE_MS) {
        lastInternetCheckResult = await checkInternetConnectivity();
        lastInternetCheckAt = now;
      }

      sendJson(res, 200, {
        online: lastInternetCheckResult,
        checkedAt: new Date(lastInternetCheckAt).toISOString(),
      });
      return;
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Allow', 'GET, PUT, OPTIONS');
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const state = await readState(dataFilePath);
      sendJson(res, 200, state);
      return;
    }

    if (req.method === 'PUT') {
      try {
        const body = await parseBody(req);
        const nextState = normalizeState(body);
        nextState.updatedAt = nowIso();
        nextState.board.updated_at = nowIso();
        await writeState(dataFilePath, nextState);
        sendJson(res, 200, nextState);
      } catch (error) {
        console.error('Failed to write local kanban state', error);
        sendJson(res, 400, { error: 'Invalid local state payload' });
      }
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  });
};

export const localApiPlugin = (): Plugin => ({
  name: 'local-kanban-api',
  configureServer(server) {
    attachMiddleware(server.middlewares.use.bind(server.middlewares), server.config.root);
  },
  configurePreviewServer(server) {
    attachMiddleware(server.middlewares.use.bind(server.middlewares), server.config.root);
  },
});
