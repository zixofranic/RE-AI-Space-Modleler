/**
 * Request queue system to handle API rate limiting
 * Ensures we don't exceed Gemini API quota (10 requests/minute)
 */

type QueuedRequest<T> = {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private requestsThisMinute = 0;
  private maxRequestsPerMinute = 8; // Conservative limit (under 10)
  private minDelayBetweenRequests = 6000; // 6 seconds between requests
  private lastRequestTime = 0;

  async add<T>(execute: () => Promise<T>, id?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: id || `req-${Date.now()}-${Math.random()}`,
        execute,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Check if we've hit the rate limit
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Wait if we need to throttle
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request...`);
        await this.sleep(waitTime);
      }

      // Reset counter every minute
      if (now - this.lastRequestTime > 60000) {
        this.requestsThisMinute = 0;
      }

      // Check if we've exceeded quota
      if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
        console.log(`⏸️ Hit rate limit (${this.maxRequestsPerMinute} requests/minute), waiting 60s...`);
        await this.sleep(60000);
        this.requestsThisMinute = 0;
      }

      // Process next request
      const request = this.queue.shift();
      if (!request) break;

      try {
        console.log(`🚀 Processing request ${request.id} (${this.queue.length} remaining in queue)`);
        const result = await request.execute();
        this.lastRequestTime = Date.now();
        this.requestsThisMinute++;
        request.resolve(result);
      } catch (error) {
        console.error(`❌ Request ${request.id} failed:`, error);
        request.reject(error);
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.processing = false;
  }
}

// Global singleton instance
export const requestQueue = new RequestQueue();
