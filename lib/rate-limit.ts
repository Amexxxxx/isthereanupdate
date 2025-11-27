type RateLimitStore = Map<string, { count: number; lastReset: number }>;

const rateLimits: Map<string, RateLimitStore> = new Map();

export function rateLimit(
  ip: string, 
  endpoint: string, 
  limit: number, 
  windowMs: number
): { success: boolean; remaining: number } {
  if (!rateLimits.has(endpoint)) {
    rateLimits.set(endpoint, new Map());
  }

  const endpointLimits = rateLimits.get(endpoint)!;
  const now = Date.now();
  
  const record = endpointLimits.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  endpointLimits.set(ip, record);

  return { success: true, remaining: limit - record.count };
}

