UPDATE "roles"
SET "permissions" = array_append("permissions", 'USE_INVENTORY'::"Permission")
WHERE "name" IN ('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN')
  AND NOT ('USE_INVENTORY'::"Permission" = ANY("permissions"));
