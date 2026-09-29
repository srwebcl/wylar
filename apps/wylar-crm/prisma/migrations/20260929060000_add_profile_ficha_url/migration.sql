-- Ficha Ocupacional en PDF, opcional (si existe, wylar.cl muestra un botón de
-- descarga en la ficha del perfil). Sin esta migración, el modelo Prisma
-- declara la columna pero no existe en la base real: cualquier consulta al
-- modelo Profile (incluida /api/public/catalog) falla y devuelve 500.
ALTER TABLE "profiles" ADD COLUMN "fichaUrl" TEXT;
