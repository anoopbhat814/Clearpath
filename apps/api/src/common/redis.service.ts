import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  });

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  /** Cache-aside helper used for directory and analytics lookups. */
  async remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const hit = await this.getJson<T>(key).catch(() => null);
    if (hit !== null) return hit;
    const value = await loader();
    await this.setJson(key, value, ttlSeconds).catch(() => undefined);
    return value;
  }

  async enqueue(queue: string, payload: unknown): Promise<void> {
    await this.client.rpush(`queue:${queue}`, JSON.stringify({ ...(payload as object), enqueuedAt: Date.now() }));
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }
}
