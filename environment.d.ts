export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      BOT_OWNER_USER_ID: string;
      DATABASE_URL: string;
    }
  }
}
