declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      MONGODB_URI?: string;
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      NODE_ENV?: string;
    }
  }
}

export {};
