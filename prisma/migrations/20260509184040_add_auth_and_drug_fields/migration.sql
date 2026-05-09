-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_drug_inventory" (
    "drug_id" TEXT NOT NULL PRIMARY KEY,
    "drug_name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "quantity_in_stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "cost_per_unit" INTEGER,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "expiry_date" DATETIME,
    "supplier_name" TEXT,
    "last_restocked_at" DATETIME,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_drug_inventory" ("category", "company_name", "cost_per_unit", "drug_id", "drug_name", "expiry_date", "last_restocked_at", "low_stock_threshold", "quantity_in_stock", "supplier_name", "unit", "updated_at") SELECT "category", "company_name", "cost_per_unit", "drug_id", "drug_name", "expiry_date", "last_restocked_at", "low_stock_threshold", "quantity_in_stock", "supplier_name", "unit", "updated_at" FROM "drug_inventory";
DROP TABLE "drug_inventory";
ALTER TABLE "new_drug_inventory" RENAME TO "drug_inventory";
CREATE INDEX "drug_inventory_company_name_idx" ON "drug_inventory"("company_name");
CREATE INDEX "drug_inventory_expiry_date_idx" ON "drug_inventory"("expiry_date");
CREATE INDEX "drug_inventory_company_name_quantity_in_stock_idx" ON "drug_inventory"("company_name", "quantity_in_stock");
CREATE TABLE "new_medic_profiles" (
    "medic_id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone_number" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Medic',
    "company_name" TEXT NOT NULL,
    "site_location" TEXT,
    "license_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" DATETIME
);
INSERT INTO "new_medic_profiles" ("company_name", "created_at", "email", "email_hash", "full_name", "is_active", "last_login", "license_number", "medic_id", "password_hash", "phone_number", "role", "site_location") SELECT "company_name", "created_at", "email", "email_hash", "full_name", "is_active", "last_login", "license_number", "medic_id", "password_hash", "phone_number", "role", "site_location" FROM "medic_profiles";
DROP TABLE "medic_profiles";
ALTER TABLE "new_medic_profiles" RENAME TO "medic_profiles";
CREATE UNIQUE INDEX "medic_profiles_email_key" ON "medic_profiles"("email");
CREATE UNIQUE INDEX "medic_profiles_email_hash_key" ON "medic_profiles"("email_hash");
CREATE INDEX "medic_profiles_company_name_idx" ON "medic_profiles"("company_name");
CREATE INDEX "medic_profiles_role_idx" ON "medic_profiles"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
