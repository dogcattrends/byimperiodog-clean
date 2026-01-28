declare global {
  interface Window {
    track?: {
      event?: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

export {};
