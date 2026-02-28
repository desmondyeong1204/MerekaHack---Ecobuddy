
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

class GoogleFitService {
  private tokens: GoogleTokens | null = null;

  constructor() {
    const saved = localStorage.getItem('google_fit_tokens');
    if (saved) {
      this.tokens = JSON.parse(saved);
    }

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        this.tokens = event.data.tokens;
        localStorage.setItem('google_fit_tokens', JSON.stringify(this.tokens));
      }
    });
  }

  async connect(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'google_auth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      return new Promise((resolve) => {
        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            resolve(!!this.tokens);
          }
        }, 1000);

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            resolve(true);
          }
        };
        window.addEventListener('message', handleMessage);
      });
    } catch (error) {
      console.error('Failed to connect to Google Fit:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return !!this.tokens?.access_token;
  }

  async getCurrentSteps(): Promise<number> {
    if (!this.tokens?.access_token) {
      throw new Error('Not connected to Google Fit');
    }

    try {
      const response = await fetch('/api/google/fit/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: this.tokens.access_token })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch steps');
      }

      const data = await response.json();
      return data.steps || 0;
    } catch (error) {
      console.error('Error fetching steps:', error);
      return 0;
    }
  }

  disconnect() {
    this.tokens = null;
    localStorage.removeItem('google_fit_tokens');
  }
}

export const googleFitService = new GoogleFitService();
