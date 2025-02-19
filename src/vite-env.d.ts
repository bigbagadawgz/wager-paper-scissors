
/// <reference types="vite/client" />

interface Window {
  phantom?: {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      request: (args: any) => Promise<any>;
      on: (event: string, callback: any) => void;
      publicKey: any;
      isConnected: boolean;
    };
  };
}
