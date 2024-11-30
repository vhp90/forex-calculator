declare namespace NodeJS {
  interface ProcessEnv {
    EXCHANGE_RATE_API_KEY: string;
    RENDER_EXTERNAL_URL?: string;
    PORT?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
