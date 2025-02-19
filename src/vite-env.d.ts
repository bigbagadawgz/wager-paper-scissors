
/// <reference types="vite/client" />

interface Window {
  phantom?: {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      request: (args: any) => Promise<any>;
      on: (event: string, callback: any) => void;
      off: (event: string, callback: any) => void;
      removeAllListeners: () => void;
      publicKey: any;
      isConnected: boolean;
    };
  };
}
