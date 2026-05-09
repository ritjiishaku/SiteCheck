-- CreateTable
CREATE TABLE "subscriptions" (
    "subscription_id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Inactive',
    "current_period_start" DATETIME,
    "current_period_end" DATETIME,
    "flutterwave_tx_ref" TEXT,
    "flutterwave_transaction_id" TEXT,
    "amount_paid" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payment_events" (
    "event_id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "tx_ref" TEXT,
    "transaction_id" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "status" TEXT NOT NULL,
    "customer_email" TEXT,
    "meta" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
