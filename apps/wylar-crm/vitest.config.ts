import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
            // 'server-only' lanza un error fuera de Next; en las pruebas se sustituye por un módulo vacío.
            'server-only': path.resolve(import.meta.dirname, 'tests/empty.ts'),
        },
    },
    test: { include: ['tests/**/*.test.ts'] },
});
