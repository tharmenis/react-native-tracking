import { apiConfig } from './config';
import { getAccessToken } from '../../auth/authClient';

type MessageHandler = (data: unknown) => void;

function nowMs() {
  return Date.now();
}

function toWsUrl(base: string, path: string) {
  const trimmed = base.replace(/\/+$/, '');
  // convert http(s) to ws(s)
  if (trimmed.startsWith('https://')) {
    return `wss://${trimmed.slice(8)}${path.startsWith('/') ? path : `/${path}`}`;
  }

  if (trimmed.startsWith('http://')) {
    return `ws://${trimmed.slice(7)}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // fallback: assume https
  return `wss://${trimmed}${path.startsWith('/') ? path : `/${path}`}`;
}

export class WebSocketManager {
  private path: string;
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private backoffMs = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(path = '/ws') {
    this.path = path;
  }

  private buildUrl() {
    return toWsUrl(apiConfig.baseUrl, this.path);
  }

  async connect() {
    if (this.ws) return;

    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const url = this.buildUrl();

    // In React Native WebSocket we can pass headers in the third arg
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.ws = new WebSocket(url, undefined, { headers: { Authorization: `Bearer ${token}` } });

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.backoffMs = 1000;
    };

    this.ws.onmessage = (ev: any) => {
      let parsed: unknown = ev.data;
      try {
        parsed = JSON.parse(ev.data);
      } catch {
        // keep raw
      }

      for (const h of Array.from(this.handlers)) {
        try {
          h(parsed);
        } catch (e) {
          // ignore handler errors
        }
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // allow onclose to handle reconnect
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts += 1;
    const wait = Math.min(this.backoffMs * Math.pow(2, this.reconnectAttempts - 1), 30_000);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // swallow — scheduleReconnect will be called again on failure
      });
    }, wait);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  send(payload: unknown) {
    if (!this.ws || this.ws.readyState !== 1) return false;
    try {
      this.ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  addHandler(h: MessageHandler) {
    this.handlers.add(h);
  }

  removeHandler(h: MessageHandler) {
    this.handlers.delete(h);
  }

  subscribeToAssetType(assetType: string) {
    const payload = {
      subscribed: false,
      type: 'SUBSCRIBE',
      body: {
        eventType: 'attribute',
        filter: {
          filterType: 'asset-type',
          assetType,
        },
      },
    };

    return this.send(payload);
  }
}

export const wsManager = new WebSocketManager('/ws');
