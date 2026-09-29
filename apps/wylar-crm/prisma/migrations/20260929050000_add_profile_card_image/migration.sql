-- Imagen vertical opcional para la tarjeta del catálogo (si es null, el sitio
-- usa `image`, la del banner, como respaldo). Este archivo documenta un cambio
-- que ya estaba aplicado en producción (se agregó con `prisma db push` en vez
-- de una migración) para que la historia de migraciones quede completa y
-- cualquier base nueva creada desde cero también la tenga.
ALTER TABLE "profiles" ADD COLUMN "cardImage" TEXT;
