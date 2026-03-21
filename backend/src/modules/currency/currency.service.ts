import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

const FRANKFURTER_LATEST =
  'https://api.frankfurter.dev/v1/latest?from=THB';

export type CurrencyRatesPayload = {
  base: 'THB';
  date: string;
  /** 1 THB = rates[currency] units of that currency (Frankfurter format) */
  rates: Record<string, number>;
  source: 'frankfurter';
  cachedAt: string;
};

interface FrankfurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cache: { payload: CurrencyRatesPayload; expiresAt: number } | null =
    null;
  private staleFallback: CurrencyRatesPayload | null = null;
  private readonly ttlMs = 60 * 60 * 1000; // 1 hour — Frankfurter is daily-ish
  private readonly fetchTimeoutMs = 12_000;

  /**
   * Latest rates: base THB. Conversion: amountInTarget = amountThb * rates[target].
   * THB is always 1.
   */
  async getRates(): Promise<CurrencyRatesPayload> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.payload;
    }

    try {
      const payload = await this.fetchFromFrankfurter();
      this.staleFallback = payload;
      this.cache = {
        payload,
        expiresAt: Date.now() + this.ttlMs,
      };
      return payload;
    } catch (err) {
      this.logger.warn(
        `Frankfurter fetch failed: ${err instanceof Error ? err.message : err}`,
      );
      if (this.staleFallback) {
        this.logger.warn('Serving stale cached FX rates');
        return this.staleFallback;
      }
      if (this.cache?.payload) {
        return this.cache.payload;
      }
      throw new ServiceUnavailableException(
        'Currency rates unavailable — try again later',
      );
    }
  }

  private async fetchFromFrankfurter(): Promise<CurrencyRatesPayload> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.fetchTimeoutMs);
    try {
      const res = await fetch(FRANKFURTER_LATEST, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as FrankfurterLatestResponse;
      if (json.base !== 'THB' || !json.rates || typeof json.rates !== 'object') {
        throw new Error('Unexpected Frankfurter response shape');
      }
      const rates: Record<string, number> = { THB: 1, ...json.rates };
      return {
        base: 'THB',
        date: json.date,
        rates,
        source: 'frankfurter',
        cachedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
