import { ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider as OidcAuthProvider } from "react-oidc-context";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";
import { AppProvider } from "./contexts/AppContext.tsx";
import {
  GithubAuthProvider,
  OidcAuthBridge,
} from "./contexts/AuthContext.tsx";
import { fetchClientConfig } from "./authConfig.ts";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

function appTree(): ReactNode {
  return (
    <UserProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </UserProvider>
  );
}

fetchClientConfig()
  .then((cfg) => {
    const contents =
      cfg.provider === "oidc" ? (
        <OidcAuthProvider {...cfg.oidcProps}>
          <OidcAuthBridge>{appTree()}</OidcAuthBridge>
        </OidcAuthProvider>
      ) : (
        <GithubAuthProvider loginUrl={cfg.loginUrl}>{appTree()}</GithubAuthProvider>
      );

    root.render(
      <StrictMode>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {contents}
        </ThemeProvider>
      </StrictMode>,
    );
  })
  .catch((err) => {
    root.render(
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 640 }}>
        <h1 style={{ fontSize: 20 }}>DevPulse couldn't load its configuration</h1>
        <p>
          The frontend fetches its auth settings from <code>/v1/config</code> at startup,
          but that request failed. Make sure the backend is running, reachable, and has a
          supported <code>AUTH_PROVIDER</code> configured.
        </p>
        <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 6, overflow: "auto" }}>
          {String(err)}
        </pre>
      </div>,
    );
  });
