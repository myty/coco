import { CopilotClient } from "@github/copilot-sdk";
import {
  AuthToken,
  DeviceFlowTimeoutError,
  NetworkError,
  RateLimitError,
  SubscriptionRequiredError,
  TokenExpiredError,
  TokenInvalidError,
  createTokenStore,
} from "../auth/mod.ts";
import type { TokenStore } from "../lib/token.ts";

let client: CopilotClient | null = null;
let tokenStore: TokenStore | null = null;

function getTokenStore(): TokenStore {
  if (!tokenStore) {
    tokenStore = createTokenStore();
  }
  return tokenStore;
}

export async function getStoredToken(): Promise<AuthToken | null> {
  const store = getTokenStore();
  return await store.load();
}

export function isTokenValid(token: AuthToken | null): boolean {
  const store = getTokenStore();
  return store.isValid(token);
}

export async function authenticate(): Promise<AuthToken> {
  client = new CopilotClient();

  try {
    const state = await client.authenticate();
    
    console.log(`To authenticate, visit: ${state.verificationUri}`);
    console.log(`Enter code: ${state.userCode}`);

    const token = await pollForToken(state);

    const store = getTokenStore();
    await store.save(token);

    return token;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new DeviceFlowTimeoutError();
      }
      if (error.message.includes("rate limit")) {
        throw new RateLimitError();
      }
      if (error.message.includes("network") || error.message.includes("connection")) {
        throw new NetworkError();
      }
      if (error.message.includes("subscription")) {
        throw new SubscriptionRequiredError();
      }
    }
    throw error;
  }
}

async function pollForToken(state: {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresAt: number;
  interval: number;
}): Promise<AuthToken> {
  const maxTime = state.expiresAt * 1000;

  while (Date.now() < maxTime) {
    await new Promise((resolve) => setTimeout(resolve, state.interval * 1000));

    try {
      const result = await client!.completeDeviceFlow(state.deviceCode);
      
      return {
        accessToken: result.token,
        expiresAt: Date.now() + 3600 * 1000,
        createdAt: Date.now(),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("pending")) {
        continue;
      }
      throw error;
    }
  }

  throw new DeviceFlowTimeoutError();
}

export async function validateToken(token: AuthToken): Promise<boolean> {
  if (!token || !isTokenValid(token)) {
    return false;
  }

  try {
    const testClient = new CopilotClient({ token: token.accessToken });
    await testClient.getModels();
    return true;
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof TokenInvalidError) {
      return false;
    }
    throw error;
  }
}
