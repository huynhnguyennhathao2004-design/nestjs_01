import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

migrations: {
  path: 'prisma/migrations',
  seed: 'ts-node prisma/seed.ts',
},

  datasource: {
    url: env('DIRECT_DATABASE_URL'),
  },
});