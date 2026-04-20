import { AuthProviderProps } from 'react-oidc-context';

export type ClientConfig =
  | { provider: 'oidc'; oidcProps: AuthProviderProps }
  | { provider: 'github'; loginUrl: string };

interface BackendAuthConfig {
  provider: 'oidc' | 'github';
  oidc?: {
    authority: string;
    client_id: string;
    scope: string;
  };
  github?: {
    login_url: string;
  };
}

function getRedirectUri() {
  const parsedUrl = new URL(window.location.href);
  return `${parsedUrl.origin}/callback`;
}

export async function fetchClientConfig(): Promise<ClientConfig> {
  const res = await fetch('/v1/config');
  if (!res.ok) {
    throw new Error(`GET /v1/config failed with status ${res.status}`);
  }
  const body = (await res.json()) as BackendAuthConfig;
  if (body.provider === 'oidc' && body.oidc) {
    return {
      provider: 'oidc',
      oidcProps: {
        authority: body.oidc.authority,
        client_id: body.oidc.client_id,
        scope: body.oidc.scope,
        redirect_uri: getRedirectUri(),
        automaticSilentRenew: true,
        prompt: 'select_account',
      },
    };
  }
  if (body.provider === 'github' && body.github) {
    return {
      provider: 'github',
      loginUrl: body.github.login_url,
    };
  }
  throw new Error(`Unsupported auth provider: ${JSON.stringify(body)}`);
}
