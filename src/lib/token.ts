export interface AuthToken {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  createdAt: number;
}

export interface TokenStore {
  save(token: AuthToken): Promise<void>;
  load(): Promise<AuthToken | null>;
  clear(): Promise<void>;
  isValid(token: AuthToken | null): boolean;
}

export function createTokenStore(): TokenStore {
  if (Deno.build.os === "darwin") {
    return new FileTokenStore("copilot", getDenoDir());
  }
  if (Deno.build.os === "windows") {
    return new FileTokenStore("copilot", getDenoDir());
  }
  return new FileTokenStore("copilot", getDenoDir());
}

function getDenoDir(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";
  return `${home}/.claudio`;
}

class FileTokenStore implements TokenStore {
  private path: string;

  constructor(
    private service: string,
    private dir: string,
  ) {
    this.path = `${this.dir}/tokens.json`;
  }

  async save(token: AuthToken): Promise<void> {
    await Deno.mkdir(this.dir, { recursive: true });
    const data = await this.readAll();
    data[this.service] = token;
    await Deno.writeTextFile(this.path, JSON.stringify(data, null, 2));
  }

  async load(): Promise<AuthToken | null> {
    try {
      const data = await this.readAll();
      return data[this.service] || null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      const data = await this.readAll();
      delete data[this.service];
      await Deno.writeTextFile(this.path, JSON.stringify(data, null, 2));
    } catch {
      // Ignore
    }
  }

  isValid(token: AuthToken | null): boolean {
    if (!token) return false;
    return token.expiresAt > Date.now();
  }

  private async readAll(): Promise<Record<string, AuthToken>> {
    try {
      const content = await Deno.readTextFile(this.path);
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
}
