-- CreateEnum
CREATE TYPE "role" AS ENUM ('Medic', 'Manager', 'Admin', 'SuperAdmin');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "record_status" AS ENUM ('Active', 'Archived');

-- CreateEnum
CREATE TYPE "shift" AS ENUM ('Morning', 'Afternoon', 'Night');

-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Custom');

-- CreateEnum
CREATE TYPE "export_format" AS ENUM ('PDF', 'Excel');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('Pending', 'Sent', 'Failed');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('Active', 'Inactive', 'PastDue', 'Cancelled');

-- CreateEnum
CREATE TYPE "sync_operation" AS ENUM ('CREATE', 'UPDATE', 'ARCHIVE');

-- CreateTable
CREATE TABLE "medic_profiles" (
    "medic_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone_number" TEXT,
    "role" "role" NOT NULL DEFAULT 'Medic',
    "company_name" TEXT NOT NULL,
    "site_location" TEXT,
    "license_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "medic_profiles_pkey" PRIMARY KEY ("medic_id")
);

-- CreateTable
CREATE TABLE "patient_records" (
    "patient_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "staff_code" TEXT NOT NULL,
    "serial_number" TEXT,
    "age" INTEGER NOT NULL,
    "gender" "gender" NOT NULL,
    "department" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "date_of_visit" TIMESTAMP(3) NOT NULL,
    "time_of_visit" TIMESTAMP(3) NOT NULL,
    "vital_signs" JSONB,
    "complaints" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "drugs_dispensed" JSONB NOT NULL DEFAULT '[]',
    "attending_medic_id" TEXT NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'Active',
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_records_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "drug_inventory" (
    "drug_id" TEXT NOT NULL,
    "drug_name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "quantity_in_stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "cost_per_unit" INTEGER,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "expiry_date" TIMESTAMP(3),
    "supplier_name" TEXT,
    "last_restocked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_inventory_pkey" PRIMARY KEY ("drug_id")
);

-- CreateTable
CREATE TABLE "consultation_logs" (
    "log_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "medic_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "shift" "shift" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_drugs_used" JSONB DEFAULT '[]',
    "notes" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "report_id" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "report_type" "report_type" NOT NULL,
    "date_from" TIMESTAMP(3) NOT NULL,
    "date_to" TIMESTAMP(3) NOT NULL,
    "company_name" TEXT NOT NULL,
    "total_patients_seen" INTEGER NOT NULL DEFAULT 0,
    "total_drugs_used" JSONB DEFAULT '[]',
    "medic_breakdown" JSONB DEFAULT '[]',
    "export_format" "export_format" NOT NULL,
    "sent_via_email" BOOLEAN NOT NULL DEFAULT false,
    "recipient_email" TEXT,
    "status" "report_status" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "audit_id" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_record_id" TEXT,
    "target_record_type" TEXT,
    "ip_address" TEXT,
    "device_info" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "queue_id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "operation" "sync_operation" NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("queue_id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "subscription_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'Inactive',
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "flutterwave_tx_ref" TEXT,
    "flutterwave_transaction_id" TEXT,
    "amount_paid" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "event_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "tx_ref" TEXT,
    "transaction_id" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "status" TEXT NOT NULL,
    "customer_email" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medic_profiles_email_hash_key" ON "medic_profiles"("email_hash");

-- CreateIndex
CREATE INDEX "medic_profiles_company_name_idx" ON "medic_profiles"("company_name");

-- CreateIndex
CREATE INDEX "medic_profiles_role_idx" ON "medic_profiles"("role");

-- CreateIndex
CREATE INDEX "patient_records_company_name_idx" ON "patient_records"("company_name");

-- CreateIndex
CREATE INDEX "patient_records_attending_medic_id_idx" ON "patient_records"("attending_medic_id");

-- CreateIndex
CREATE INDEX "patient_records_date_of_visit_idx" ON "patient_records"("date_of_visit");

-- CreateIndex
CREATE INDEX "patient_records_status_idx" ON "patient_records"("status");

-- CreateIndex
CREATE INDEX "patient_records_company_name_date_of_visit_idx" ON "patient_records"("company_name", "date_of_visit");

-- CreateIndex
CREATE INDEX "patient_records_synced_idx" ON "patient_records"("synced");

-- CreateIndex
CREATE INDEX "drug_inventory_company_name_idx" ON "drug_inventory"("company_name");

-- CreateIndex
CREATE INDEX "drug_inventory_expiry_date_idx" ON "drug_inventory"("expiry_date");

-- CreateIndex
CREATE INDEX "drug_inventory_company_name_quantity_in_stock_idx" ON "drug_inventory"("company_name", "quantity_in_stock");

-- CreateIndex
CREATE INDEX "consultation_logs_company_name_idx" ON "consultation_logs"("company_name");

-- CreateIndex
CREATE INDEX "consultation_logs_medic_id_idx" ON "consultation_logs"("medic_id");

-- CreateIndex
CREATE INDEX "consultation_logs_date_idx" ON "consultation_logs"("date");

-- CreateIndex
CREATE INDEX "consultation_logs_synced_idx" ON "consultation_logs"("synced");

-- CreateIndex
CREATE INDEX "consultation_logs_company_name_date_idx" ON "consultation_logs"("company_name", "date");

-- CreateIndex
CREATE INDEX "reports_company_name_idx" ON "reports"("company_name");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_generated_by_idx" ON "reports"("generated_by");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_target_record_id_target_record_type_idx" ON "audit_logs"("target_record_id", "target_record_type");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "sync_queue_synced_at_idx" ON "sync_queue"("synced_at");

-- CreateIndex
CREATE INDEX "sync_queue_created_at_idx" ON "sync_queue"("created_at");

-- CreateIndex
CREATE INDEX "sync_queue_locked_at_idx" ON "sync_queue"("locked_at");

-- CreateIndex
CREATE INDEX "sync_queue_expires_at_idx" ON "sync_queue"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_company_name_key" ON "subscriptions"("company_name");

-- CreateIndex
CREATE INDEX "subscriptions_company_name_idx" ON "subscriptions"("company_name");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_flutterwave_tx_ref_idx" ON "subscriptions"("flutterwave_tx_ref");

-- CreateIndex
CREATE INDEX "payment_events_company_name_idx" ON "payment_events"("company_name");

-- CreateIndex
CREATE INDEX "payment_events_tx_ref_idx" ON "payment_events"("tx_ref");

-- CreateIndex
CREATE INDEX "payment_events_transaction_id_idx" ON "payment_events"("transaction_id");

-- CreateIndex
CREATE INDEX "payment_events_created_at_idx" ON "payment_events"("created_at");

-- AddForeignKey
ALTER TABLE "patient_records" ADD CONSTRAINT "patient_records_attending_medic_id_fkey" FOREIGN KEY ("attending_medic_id") REFERENCES "medic_profiles"("medic_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_logs" ADD CONSTRAINT "consultation_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient_records"("patient_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_logs" ADD CONSTRAINT "consultation_logs_medic_id_fkey" FOREIGN KEY ("medic_id") REFERENCES "medic_profiles"("medic_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "medic_profiles"("medic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "medic_profiles"("medic_id") ON DELETE RESTRICT ON UPDATE CASCADE;
