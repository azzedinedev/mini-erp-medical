-- MediFlow initial schema. Generated from prisma/schema.prisma and kept versioned.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "StaffType" AS ENUM ('DOCTOR', 'NURSE', 'TECHNICIAN', 'COORDINATOR', 'OTHER');
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'NON_BINARY', 'UNKNOWN');
CREATE TYPE "ReferenceKind" AS ENUM ('CONSULTATION', 'NURSING');
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "ConsultationStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'SIGNED', 'DISPENSED', 'CANCELLED');
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RETURN');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED');
CREATE TYPE "MissionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "FinancialStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
CREATE TYPE "DocumentEntityType" AS ENUM ('PATIENT', 'CONSULTATION', 'PRESCRIPTION', 'MISSION', 'DELIVERY', 'INVENTORY', 'FINANCIAL', 'STAFF', 'PARTNER', 'OTHER');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "email" VARCHAR(255) NOT NULL, "password_hash" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(100) NOT NULL, "last_name" VARCHAR(100) NOT NULL, "phone" VARCHAR(40), "avatar_url" VARCHAR(500),
  "locale" VARCHAR(5) NOT NULL DEFAULT 'fr', "theme" VARCHAR(40) NOT NULL DEFAULT 'light', "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "totp_secret" VARCHAR(255), "totp_enabled" BOOLEAN NOT NULL DEFAULT false, "last_login_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");
CREATE INDEX "users_last_name_first_name_idx" ON "users"("last_name", "first_name");

CREATE TABLE "roles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" VARCHAR(100) NOT NULL, "description" VARCHAR(500), "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE TABLE "role_permissions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "role_id" UUID NOT NULL, "module" VARCHAR(80) NOT NULL, "action" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "role_permissions_role_id_module_action_key" ON "role_permissions"("role_id", "module", "action");
CREATE INDEX "role_permissions_module_action_idx" ON "role_permissions"("module", "action");
CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL, "role_id" UUID NOT NULL, CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id"),
  CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "refresh_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL, "revoked_at" TIMESTAMPTZ(3), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id"), CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");

CREATE TABLE "patients" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "first_name" VARCHAR(100) NOT NULL, "last_name" VARCHAR(100) NOT NULL,
  "preferred_name" VARCHAR(100), "birth_date" DATE, "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN', "national_id" VARCHAR(100), "phone" VARCHAR(40), "email" VARCHAR(255),
  "address" JSONB, "emergency_contact" JSONB, "medical_history" JSONB, "allergies" JSONB, "notes" TEXT,
  "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE', "created_by_id" UUID, "updated_by_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(3), "archived_at" TIMESTAMPTZ(3), CONSTRAINT "patients_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "patients_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "patients_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "patients_code_key" ON "patients"("code");
CREATE INDEX "patients_last_name_first_name_idx" ON "patients"("last_name", "first_name");
CREATE INDEX "patients_status_deleted_at_idx" ON "patients"("status", "deleted_at");
CREATE INDEX "patients_phone_idx" ON "patients"("phone");
CREATE INDEX "patients_search_fts_idx" ON "patients" USING GIN (to_tsvector('simple', coalesce("first_name", '') || ' ' || coalesce("last_name", '') || ' ' || coalesce("notes", '')));

CREATE TABLE "patient_contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "patient_id" UUID NOT NULL, "kind" VARCHAR(40) NOT NULL, "name" VARCHAR(150) NOT NULL,
  "relationship" VARCHAR(80), "phone" VARCHAR(40), "email" VARCHAR(255), "is_primary" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "patient_contacts_pkey" PRIMARY KEY ("id"), CONSTRAINT "patient_contacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "patient_contacts_patient_id_is_primary_idx" ON "patient_contacts"("patient_id", "is_primary");
CREATE TABLE "care_locations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" VARCHAR(150) NOT NULL, "kind" VARCHAR(50) NOT NULL, "address" JSONB,
  "phone" VARCHAR(40), "notes" TEXT, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_locations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "care_locations_kind_name_idx" ON "care_locations"("kind", "name");
CREATE TABLE "patient_locations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "patient_id" UUID NOT NULL, "location_id" UUID NOT NULL, "started_at" TIMESTAMPTZ(3) NOT NULL,
  "ended_at" TIMESTAMPTZ(3), "is_current" BOOLEAN NOT NULL DEFAULT true, "notes" TEXT, CONSTRAINT "patient_locations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "patient_locations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "patient_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "care_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "patient_locations_patient_id_is_current_idx" ON "patient_locations"("patient_id", "is_current");

CREATE TABLE "medical_staff" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID, "staff_type" "StaffType" NOT NULL, "first_name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL, "specialty" VARCHAR(150), "license_number" VARCHAR(100), "phone" VARCHAR(40), "email" VARCHAR(255),
  "availability" JSONB, "coordinates" JSONB, "is_active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3), CONSTRAINT "medical_staff_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "medical_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "medical_staff_user_id_key" ON "medical_staff"("user_id");
CREATE UNIQUE INDEX "medical_staff_license_number_key" ON "medical_staff"("license_number");
CREATE INDEX "medical_staff_staff_type_is_active_idx" ON "medical_staff"("staff_type", "is_active");
CREATE INDEX "medical_staff_last_name_first_name_idx" ON "medical_staff"("last_name", "first_name");
CREATE TABLE "partners" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "name" VARCHAR(180) NOT NULL, "kind" VARCHAR(80) NOT NULL,
  "contact_name" VARCHAR(150), "email" VARCHAR(255), "phone" VARCHAR(40), "address" JSONB, "notes" TEXT, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "partners_code_key" ON "partners"("code");
CREATE INDEX "partners_name_idx" ON "partners"("name");
CREATE INDEX "partners_kind_is_active_idx" ON "partners"("kind", "is_active");

CREATE TABLE "reference_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "kind" "ReferenceKind" NOT NULL, "code" VARCHAR(50) NOT NULL, "labels" JSONB NOT NULL,
  "icon" VARCHAR(60), "color" VARCHAR(20), "description" TEXT, "default_duration" INTEGER, "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archived_at" TIMESTAMPTZ(3),
  CONSTRAINT "reference_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reference_types_code_key" ON "reference_types"("code");
CREATE INDEX "reference_types_kind_active_idx" ON "reference_types"("kind", "active");
CREATE TABLE "medications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(50) NOT NULL, "name" VARCHAR(180) NOT NULL, "molecule" VARCHAR(180),
  "form" VARCHAR(100), "dosage" VARCHAR(100), "unit" VARCHAR(40), "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archived_at" TIMESTAMPTZ(3),
  CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "medications_code_key" ON "medications"("code");
CREATE INDEX "medications_name_molecule_idx" ON "medications"("name", "molecule");
CREATE INDEX "medications_active_idx" ON "medications"("active");

CREATE TABLE "consultations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "patient_id" UUID NOT NULL, "type_id" UUID NOT NULL,
  "practitioner_id" UUID NOT NULL, "scheduled_at" TIMESTAMPTZ(3) NOT NULL, "ended_at" TIMESTAMPTZ(3), "status" "ConsultationStatus" NOT NULL DEFAULT 'PLANNED',
  "notes" TEXT, "structured_data" JSONB, CONSTRAINT "consultations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "consultations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "consultations_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "reference_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "consultations_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "medical_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "consultations_code_key" ON "consultations"("code");
CREATE INDEX "consultations_patient_id_scheduled_at_idx" ON "consultations"("patient_id", "scheduled_at");
CREATE INDEX "consultations_practitioner_id_scheduled_at_idx" ON "consultations"("practitioner_id", "scheduled_at");
CREATE INDEX "consultations_status_scheduled_at_idx" ON "consultations"("status", "scheduled_at");

CREATE TABLE "prescriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "patient_id" UUID NOT NULL, "prescriber_id" UUID NOT NULL,
  "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT', "issued_at" TIMESTAMPTZ(3), "valid_until" TIMESTAMPTZ(3), "instructions" TEXT,
  "structured_text" JSONB, "verification_token" VARCHAR(100), "signed_by_id" UUID, "signed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "prescriptions_prescriber_id_fkey" FOREIGN KEY ("prescriber_id") REFERENCES "medical_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "prescriptions_signed_by_id_fkey" FOREIGN KEY ("signed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "prescriptions_code_key" ON "prescriptions"("code");
CREATE UNIQUE INDEX "prescriptions_verification_token_key" ON "prescriptions"("verification_token");
CREATE INDEX "prescriptions_patient_id_created_at_idx" ON "prescriptions"("patient_id", "created_at");
CREATE INDEX "prescriptions_status_issued_at_idx" ON "prescriptions"("status", "issued_at");
CREATE TABLE "prescription_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "prescription_id" UUID NOT NULL, "medication_id" UUID, "manual_name" VARCHAR(180), "dosage" VARCHAR(100),
  "route" VARCHAR(100), "frequency" VARCHAR(100), "duration" VARCHAR(100), "instructions" TEXT, "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id"), CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "prescription_items_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "prescription_items_prescription_id_sort_order_idx" ON "prescription_items"("prescription_id", "sort_order");
CREATE TABLE "prescription_signatures" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "prescription_id" UUID NOT NULL, "signer_id" UUID NOT NULL, "image_key" VARCHAR(500) NOT NULL,
  "format" VARCHAR(20) NOT NULL, "signed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "prescription_signatures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prescription_signatures_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "prescription_signatures_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "prescription_signatures_prescription_id_signed_at_idx" ON "prescription_signatures"("prescription_id", "signed_at");

CREATE TABLE "missions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "title" VARCHAR(180) NOT NULL, "patient_id" UUID, "partner_id" UUID,
  "assigned_to_id" UUID, "scheduled_at" TIMESTAMPTZ(3) NOT NULL, "status" "MissionStatus" NOT NULL DEFAULT 'PLANNED', "address" JSONB, "coordinates" JSONB,
  "notes" TEXT, "estimated_cost" DECIMAL(14,2), "created_by_id" UUID, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3), CONSTRAINT "missions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "missions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "missions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "missions_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "medical_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "missions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "missions_code_key" ON "missions"("code");
CREATE INDEX "missions_scheduled_at_status_idx" ON "missions"("scheduled_at", "status");
CREATE INDEX "missions_assigned_to_id_scheduled_at_idx" ON "missions"("assigned_to_id", "scheduled_at");
CREATE INDEX "missions_patient_id_scheduled_at_idx" ON "missions"("patient_id", "scheduled_at");

CREATE TABLE "inventory_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "sku" VARCHAR(80), "name" VARCHAR(180) NOT NULL, "category" VARCHAR(100), "description" TEXT,
  "unit" VARCHAR(30) NOT NULL, "quantity" DECIMAL(14,3) NOT NULL DEFAULT 0, "min_quantity" DECIMAL(14,3) NOT NULL DEFAULT 0, "location" VARCHAR(120),
  "barcode" VARCHAR(120), "active" BOOLEAN NOT NULL DEFAULT true, "metadata" JSONB, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3), CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_items_code_key" ON "inventory_items"("code");
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");
CREATE UNIQUE INDEX "inventory_items_barcode_key" ON "inventory_items"("barcode");
CREATE INDEX "inventory_items_name_category_idx" ON "inventory_items"("name", "category");
CREATE INDEX "inventory_items_quantity_min_quantity_idx" ON "inventory_items"("quantity", "min_quantity");
CREATE TABLE "stock_movements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "inventory_item_id" UUID NOT NULL, "type" "StockMovementType" NOT NULL, "quantity" DECIMAL(14,3) NOT NULL,
  "reason" VARCHAR(255), "reference" VARCHAR(100), "performed_by_id" UUID, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "stock_movements_inventory_item_id_created_at_idx" ON "stock_movements"("inventory_item_id", "created_at");

CREATE TABLE "deliveries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "partner_id" UUID, "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "scheduled_at" TIMESTAMPTZ(3), "delivered_at" TIMESTAMPTZ(3), "address" JSONB, "tracking_note" TEXT, "qr_token" VARCHAR(100),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id"), CONSTRAINT "deliveries_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "deliveries_code_key" ON "deliveries"("code");
CREATE UNIQUE INDEX "deliveries_qr_token_key" ON "deliveries"("qr_token");
CREATE INDEX "deliveries_status_scheduled_at_idx" ON "deliveries"("status", "scheduled_at");
CREATE TABLE "delivery_missions" (
  "delivery_id" UUID NOT NULL, "mission_id" UUID NOT NULL, CONSTRAINT "delivery_missions_pkey" PRIMARY KEY ("delivery_id", "mission_id"),
  CONSTRAINT "delivery_missions_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "delivery_missions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "patient_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "patient_id" UUID NOT NULL, "type_id" UUID, "practitioner_id" UUID, "consultation_id" UUID,
  "mission_id" UUID, "prescription_id" UUID, "occurred_at" TIMESTAMPTZ(3) NOT NULL, "status" VARCHAR(40) NOT NULL, "summary" TEXT NOT NULL, "details" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_by_id" UUID,
  CONSTRAINT "patient_actions_pkey" PRIMARY KEY ("id"), CONSTRAINT "patient_actions_consultation_id_key" UNIQUE ("consultation_id"), CONSTRAINT "patient_actions_prescription_id_key" UNIQUE ("prescription_id"),
  CONSTRAINT "patient_actions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "patient_actions_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "reference_types"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "patient_actions_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "medical_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "patient_actions_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "patient_actions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "patient_actions_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "patient_actions_patient_id_occurred_at_idx" ON "patient_actions"("patient_id", "occurred_at");
CREATE INDEX "patient_actions_type_id_occurred_at_idx" ON "patient_actions"("type_id", "occurred_at");
CREATE TABLE "documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "entity_type" "DocumentEntityType" NOT NULL, "category" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL, "file_name" VARCHAR(255) NOT NULL, "mime_type" VARCHAR(120) NOT NULL, "storage_key" VARCHAR(500) NOT NULL,
  "size_bytes" BIGINT NOT NULL, "checksum" VARCHAR(128), "metadata" JSONB, "content_text" TEXT, "patient_id" UUID, "consultation_id" UUID,
  "prescription_id" UUID, "mission_id" UUID, "delivery_id" UUID, "inventory_item_id" UUID, "partner_id" UUID, "financial_document_id" UUID, "expense_id" UUID,
  "created_by_id" UUID NOT NULL, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id"), CONSTRAINT "documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "documents_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "documents_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "documents_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "documents_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "documents_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "documents_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "documents_code_key" ON "documents"("code");
CREATE INDEX "documents_entity_type_category_created_at_idx" ON "documents"("entity_type", "category", "created_at");
CREATE INDEX "documents_patient_id_created_at_idx" ON "documents"("patient_id", "created_at");
CREATE INDEX "documents_prescription_id_idx" ON "documents"("prescription_id");
CREATE INDEX "documents_search_fts_idx" ON "documents" USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("category", '') || ' ' || coalesce("content_text", '')));
CREATE TABLE "document_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "document_id" UUID NOT NULL, "version" INTEGER NOT NULL, "storage_key" VARCHAR(500) NOT NULL,
  "size_bytes" BIGINT NOT NULL, "checksum" VARCHAR(128), "change_note" TEXT, "created_by_id" UUID NOT NULL, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id"), CONSTRAINT "document_versions_document_id_version_key" UNIQUE ("document_id", "version"),
  CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "financial_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(30) NOT NULL, "kind" VARCHAR(40) NOT NULL, "partner_id" UUID, "patient_id" UUID,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR', "status" "FinancialStatus" NOT NULL DEFAULT 'DRAFT', "subtotal_ht" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "discount_rate" DECIMAL(6,3) NOT NULL DEFAULT 0, "discount_value" DECIMAL(14,2) NOT NULL DEFAULT 0, "vat_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_ttc" DECIMAL(14,2) NOT NULL DEFAULT 0, "amount_in_words" TEXT, "issued_at" TIMESTAMPTZ(3), "due_at" TIMESTAMPTZ(3), "paid_at" TIMESTAMPTZ(3),
  "notes" TEXT, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "financial_documents_pkey" PRIMARY KEY ("id"), CONSTRAINT "financial_documents_code_key" UNIQUE ("code"),
  CONSTRAINT "financial_documents_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "financial_documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "financial_documents_status_issued_at_idx" ON "financial_documents"("status", "issued_at");
CREATE INDEX "financial_documents_partner_id_created_at_idx" ON "financial_documents"("partner_id", "created_at");
CREATE TABLE "financial_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "financial_document_id" UUID NOT NULL, "label" VARCHAR(255) NOT NULL, "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
  "unit_price_ht" DECIMAL(14,2) NOT NULL, "discount_rate" DECIMAL(6,3) NOT NULL DEFAULT 0, "discount_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "base_ht" DECIMAL(14,2) NOT NULL, "vat_rate" DECIMAL(6,3) NOT NULL DEFAULT 0, "vat_base" DECIMAL(14,2) NOT NULL DEFAULT 0, "vat_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_ttc" DECIMAL(14,2) NOT NULL, "reference_type_id" UUID, "patient_id" UUID, "consultation_id" UUID, "mission_id" UUID, "delivery_id" UUID,
  CONSTRAINT "financial_lines_pkey" PRIMARY KEY ("id"), CONSTRAINT "financial_lines_consultation_id_key" UNIQUE ("consultation_id"), CONSTRAINT "financial_lines_mission_id_key" UNIQUE ("mission_id"), CONSTRAINT "financial_lines_delivery_id_key" UNIQUE ("delivery_id"),
  CONSTRAINT "financial_lines_financial_document_id_fkey" FOREIGN KEY ("financial_document_id") REFERENCES "financial_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "financial_lines_reference_type_id_fkey" FOREIGN KEY ("reference_type_id") REFERENCES "reference_types"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "financial_lines_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "financial_lines_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "financial_lines_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "financial_lines_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "financial_lines_financial_document_id_idx" ON "financial_lines"("financial_document_id");
CREATE TABLE "expenses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "category" VARCHAR(100) NOT NULL, "label" VARCHAR(255) NOT NULL, "amount_ht" DECIMAL(14,2) NOT NULL,
  "vat_rate" DECIMAL(6,3) NOT NULL DEFAULT 0, "vat_base" DECIMAL(14,2) NOT NULL DEFAULT 0, "vat_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "amount_ttc" DECIMAL(14,2) NOT NULL, "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR', "incurred_at" DATE NOT NULL, "financial_document_id" UUID,
  "notes" TEXT, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deleted_at" TIMESTAMPTZ(3), CONSTRAINT "expenses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "expenses_financial_document_id_fkey" FOREIGN KEY ("financial_document_id") REFERENCES "financial_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "expenses_category_incurred_at_idx" ON "expenses"("category", "incurred_at");
ALTER TABLE "documents" ADD CONSTRAINT "documents_financial_document_id_fkey" FOREIGN KEY ("financial_document_id") REFERENCES "financial_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "system_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "key" VARCHAR(150) NOT NULL, "value" JSONB NOT NULL, "description" TEXT, "is_secret" BOOLEAN NOT NULL DEFAULT false,
  "updated_by_id" UUID, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
CREATE TABLE "audit_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "actor_id" UUID, "patient_id" UUID, "action" VARCHAR(80) NOT NULL, "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" VARCHAR(80) NOT NULL, "before" JSONB, "after" JSONB, "metadata" JSONB, "ip_address" VARCHAR(64), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"), CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "audit_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "audit_events_patient_id_created_at_idx" ON "audit_events"("patient_id", "created_at");
CREATE INDEX "audit_events_entity_type_entity_id_created_at_idx" ON "audit_events"("entity_type", "entity_id", "created_at");
CREATE TABLE "code_sequences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "prefix" VARCHAR(12) NOT NULL, "next_value" INTEGER NOT NULL DEFAULT 1, "padding" INTEGER NOT NULL DEFAULT 6,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "code_sequences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "code_sequences_prefix_key" ON "code_sequences"("prefix");

-- Immutable patient workflow: application code only appends AuditEvent rows.
CREATE OR REPLACE FUNCTION prevent_audit_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_events are append-only'; END; $$;
CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();
