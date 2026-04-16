type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
};

type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, options?: GoogleButtonOptions) => void;
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export const startGoogleLogin = async (
  clientId: string,
  onSuccess: (credential: string) => void,
  onError: (error: Error) => void
) => {
  if (!clientId) {
    onError(new Error("Google client ID is not configured"));
    return;
  }

  await loadGoogleScript();
  if (!window.google?.accounts?.id) {
    onError(new Error("Google sign-in is unavailable"));
    return;
  }

  let finished = false;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (finished) return;
      finished = true;
      if (!response?.credential) {
        onError(new Error("Google did not return a credential"));
        return;
      }
      onSuccess(response.credential);
    },
  });

  window.google.accounts.id.prompt((notification) => {
    if (finished) return;
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      finished = true;
      onError(new Error("Google sign-in was dismissed"));
    }
  });
};

export const renderGoogleButton = async ({
  clientId,
  container,
  onCredential,
  onError,
  options,
}: {
  clientId: string;
  container: HTMLElement;
  onCredential: (credential: string) => void;
  onError: (error: Error) => void;
  options?: GoogleButtonOptions;
}) => {
  if (!clientId) {
    onError(new Error("Google client ID is not configured"));
    return;
  }

  await loadGoogleScript();
  if (!window.google?.accounts?.id) {
    onError(new Error("Google sign-in is unavailable"));
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (!response?.credential) {
        onError(new Error("Google did not return a credential"));
        return;
      }
      onCredential(response.credential);
    },
  });

  window.google.accounts.id.renderButton(container, {
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    logo_alignment: "left",
    ...options,
  });
};
