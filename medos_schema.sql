-- ============================================================================
-- MedOS — Production PostgreSQL Schema
-- Version 1.0 | Lagos · London · Toronto
-- Compliant: NDPR (NG) · UK GDPR (GB) · PIPEDA (CA)
-- ============================================================================
-- DEPLOYMENT CHECKLIST:
--   □ Run as superuser on a fresh database
--   □ Set DB-level encryption key before first INSERT
--   □ Configure pg_cron for scheduled jobs
--   □ Enable connection pooling (PgBouncer recommended)
--   □ Set up read replica for dashboard queries
-- ============================================================================

-- ── 0. EXTENSIONS ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- AES-256 encryption
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- Compound GiST indexes
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";      -- Uncomment if pg_cron available

-- Global settings
ALTER DATABASE medos SET row_security = on;
ALTER DATABASE medos SET timezone = 'UTC';
ALTER DATABASE medos SET statement_timeout = '30s';
ALTER DATABASE medos SET lock_timeout = '5s';

-- ── 1. ORGANISATIONS (Multi-Tenant Root) ──────────────────────────────────────
CREATE TABLE organisations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    slug                TEXT UNIQUE NOT NULL,          -- URL-safe identifier: 'lagos-central-clinic'
    country             TEXT NOT NULL CHECK (country IN ('NG','GB','CA','AU','ZA','GH','OTHER')),
    timezone            TEXT NOT NULL DEFAULT 'UTC',   -- IANA timezone: 'Africa/Lagos'
    compliance_flags    TEXT[] DEFAULT '{}',           -- ['NDPR','GDPR','PIPEDA','PHIPA']
    plan                TEXT NOT NULL DEFAULT 'starter'
                            CHECK (plan IN ('starter','pro','enterprise')),
    active_formulary_id UUID,                          -- FK added after formularies table
    settings            JSONB NOT NULL DEFAULT '{}',
    -- settings schema: {
    --   session_timeout_seconds: number,
    --   mfa_required: boolean,
    --   pearl_auto_suggest: boolean,
    --   sms_provider: 'twilio' | 'termii',   -- Termii: Africa-optimised
    --   whatsapp_enabled: boolean,
    --   data_residency_region: string
    -- }
    max_users           INTEGER DEFAULT 10,
    subscription_expires_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_orgs_country ON organisations(country);
CREATE INDEX idx_orgs_slug    ON organisations(slug);


-- ── 2. USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

    -- Credentials (NEVER plaintext)
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,               -- bcrypt, cost >= 12
    
    -- Identity
    full_name           TEXT NOT NULL,
    display_name        TEXT,
    role                TEXT NOT NULL DEFAULT 'doctor'
                            CHECK (role IN ('doctor','nurse','admin','registrar','pharmacist','super_admin')),
    speciality          TEXT,
    
    -- Professional registration numbers (per country)
    registration_number TEXT UNIQUE,                 -- GMC (GB) | MDCN (NG) | CPSO (CA)
    registration_country TEXT,
    
    -- MFA (Time-based OTP)
    mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret          TEXT,                        -- TOTP seed, AES-encrypted before storage
    mfa_backup_codes    TEXT[],                      -- Hashed backup codes
    
    -- Session config
    session_timeout     INTEGER NOT NULL DEFAULT 900, -- seconds; 900 = 15 min
    last_login_at       TIMESTAMPTZ,
    last_login_ip       INET,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,                 -- Account lockout after N failures
    
    -- Preferences (non-PII; stored in cleartext)
    preferences         JSONB NOT NULL DEFAULT '{}',
    -- preferences schema: {
    --   theme: 'dark'|'light', default_template: string,
    --   voice_language: string, notifications_enabled: boolean
    -- }
    
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deactivated_at      TIMESTAMPTZ,
    deactivated_reason  TEXT
);

-- Row-Level Security: users only see their org
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_org_isolation ON users
    AS PERMISSIVE FOR ALL
    USING (organisation_id = current_setting('app.current_org_id', TRUE)::UUID);

CREATE INDEX idx_users_org      ON users(organisation_id);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(organisation_id, role);


-- ── 3. AUTH: REFRESH TOKENS ───────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,            -- SHA-256 of the token
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,            -- 7 days default
    revoked_at      TIMESTAMPTZ,
    revoked_reason  TEXT,                            -- 'logout'|'rotation'|'suspicious'
    ip_address      INET,
    user_agent      TEXT
);

CREATE INDEX idx_refresh_user    ON refresh_tokens(user_id, expires_at);
CREATE INDEX idx_refresh_hash    ON refresh_tokens(token_hash);

-- Auto-cleanup expired tokens
-- SELECT cron.schedule('clean-tokens', '0 3 * * *',
--   $$DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '1 day'$$);


-- ── 4. PATIENTS ───────────────────────────────────────────────────────────────
-- CRITICAL: All PII is encrypted using pgcrypto with a per-org key
-- Key management: AWS KMS or HashiCorp Vault (NOT stored in this DB)
-- Encrypt: SELECT pgp_sym_encrypt('plaintext', current_setting('app.org_enc_key'))
-- Decrypt: SELECT pgp_sym_decrypt(ciphertext, current_setting('app.org_enc_key'))

CREATE TABLE patients (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id         UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    created_by              UUID NOT NULL REFERENCES users(id),

    -- ── PII: AES-256 encrypted (BYTEA) ───────────────────────────
    -- Decrypt ONLY at the API layer, never in SQL queries or logs
    name_enc                BYTEA NOT NULL,
    dob_enc                 BYTEA NOT NULL,          -- Date of birth
    phone_enc               BYTEA,
    email_enc               BYTEA,
    address_enc             BYTEA,
    next_of_kin_enc         BYTEA,                   -- Name + phone of next-of-kin
    national_id_enc         BYTEA,                   -- NIN (NG) | NHS No (GB) | SIN (CA)
    -- ─────────────────────────────────────────────────────────────
    
    -- Non-PII: safe for queries, indexes, and analytics
    mrn                     TEXT UNIQUE,             -- Medical Record Number (clinic-assigned)
    sex                     TEXT CHECK (sex IN ('M','F','Other','Unknown')),
    year_of_birth           SMALLINT,                -- Year ONLY — not full DOB — for analytics
    blood_group             TEXT,

    -- Clinical profile (non-identifiable)
    chronic_codes           TEXT[] DEFAULT '{}',     -- ICD-10: ['I10','E11.9']
    allergy_codes           TEXT[] DEFAULT '{}',     -- Drug allergy classifications
    risk_score              SMALLINT DEFAULT 0
                                CHECK (risk_score BETWEEN 0 AND 100),
    risk_last_computed_at   TIMESTAMPTZ,

    -- Consent management (GDPR Article 7 | NDPR Section 2.1 | PIPEDA Principle 3)
    consent_data_processing     BOOLEAN NOT NULL DEFAULT FALSE,
    consent_sms_reminders       BOOLEAN NOT NULL DEFAULT FALSE,
    consent_whatsapp_reminders  BOOLEAN NOT NULL DEFAULT FALSE,
    consent_email               BOOLEAN NOT NULL DEFAULT FALSE,
    consent_anonymised_research BOOLEAN NOT NULL DEFAULT FALSE,
    consent_recorded_by         UUID REFERENCES users(id),
    consent_updated_at          TIMESTAMPTZ,

    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete (never hard-delete patient records — clinical-legal requirement)
    is_archived             BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at             TIMESTAMPTZ,
    archived_reason         TEXT
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY patients_org_isolation ON patients
    AS PERMISSIVE FOR ALL
    USING (organisation_id = current_setting('app.current_org_id', TRUE)::UUID);

CREATE INDEX idx_patients_org        ON patients(organisation_id);
CREATE INDEX idx_patients_mrn        ON patients(organisation_id, mrn);
CREATE INDEX idx_patients_chronic    ON patients USING GIN(chronic_codes);
CREATE INDEX idx_patients_allergies  ON patients USING GIN(allergy_codes);
CREATE INDEX idx_patients_risk       ON patients(organisation_id, risk_score DESC)
    WHERE is_archived = FALSE;


-- ── 5. CLINICAL NOTES ─────────────────────────────────────────────────────────
CREATE TABLE clinical_notes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id),
    patient_id          UUID NOT NULL REFERENCES patients(id),
    author_id           UUID NOT NULL REFERENCES users(id),

    -- Status machine (enforced — cannot skip states)
    -- draft → extracted → verified → signed
    -- A note can be voided after signing (not deleted; legal requirement)
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','extracted','verified','signed','voided')),
    void_reason         TEXT,
    voided_by           UUID REFERENCES users(id),
    voided_at           TIMESTAMPTZ,

    -- Voice input
    raw_transcript      TEXT,                        -- Whisper output (may be large)
    transcript_lang     TEXT DEFAULT 'en-GB',
    audio_s3_key        TEXT,                        -- Pointer to encrypted audio in S3
    audio_deleted_at    TIMESTAMPTZ,                 -- Audio purged after 30 days

    -- SOAP structured fields (cleartext — not PII; medically useful)
    soap_data           JSONB NOT NULL DEFAULT '{}',
    -- Schema: {
    --   cc:   string,  -- Chief Complaint
    --   hx:   string,  -- History of presenting complaint
    --   exam: string,  -- Examination findings
    --   imp:  string,  -- Impression / working diagnosis
    --   plan: string   -- Management plan (raw, pre-extraction)
    -- }

    -- Post-NLP structured extraction
    structured_data     JSONB DEFAULT '{}',
    -- Schema: {
    --   diagnoses:  [{ icd10: string, description: string, certainty: string }],
    --   medications:[{ name, dose, unit, freq, route, duration, status, confirmed }],
    --   vitals:     { bp_sys, bp_dia, hr, rr, temp_c, spo2, weight_kg, height_cm, bmi },
    --   follow_up:  { description, target_date, priority },
    --   referrals:  [{ specialty, urgency, reason }],
    --   investigations: [{ test, rationale, urgency }]
    -- }

    -- Template metadata
    template_used       TEXT,
    template_version    TEXT,

    -- ICD-10 codes (denormalised for fast indexing)
    icd10_codes         TEXT[] DEFAULT '{}',

    -- Mandatory: all confirmed meds before signing
    -- This is checked by the API on PATCH /notes/:id/sign
    -- If medication_safety_log has any unconfirmed meds for this note → 403
    all_meds_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,

    -- Signing (creates immutable clinical record)
    signed_at           TIMESTAMPTZ,
    signed_by           UUID REFERENCES users(id),
    signature_hash      TEXT,    -- SHA-256(note_id || signed_at || structured_data || author_id)

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_org_isolation ON clinical_notes
    AS PERMISSIVE FOR ALL
    USING (organisation_id = current_setting('app.current_org_id', TRUE)::UUID);

CREATE INDEX idx_notes_patient     ON clinical_notes(patient_id, created_at DESC);
CREATE INDEX idx_notes_author      ON clinical_notes(author_id, created_at DESC);
CREATE INDEX idx_notes_org_status  ON clinical_notes(organisation_id, status);
CREATE INDEX idx_notes_icd10       ON clinical_notes USING GIN(icd10_codes);
CREATE INDEX idx_notes_date        ON clinical_notes(organisation_id, created_at DESC);

-- Full-text search (trigram)
CREATE INDEX idx_notes_fts ON clinical_notes USING GIN(
    to_tsvector('english',
        COALESCE(soap_data->>'cc',  '') || ' ' ||
        COALESCE(soap_data->>'imp', '') || ' ' ||
        COALESCE(soap_data->>'plan','')
    )
);


-- ── 6. MEDICATION SAFETY LOG (Immutable) ─────────────────────────────────────
-- Records every extracted medication and every clinician action on the Confirmation Loop
-- APPEND-ONLY — no UPDATE or DELETE permitted (enforced below)

CREATE TABLE medication_safety_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id             UUID NOT NULL REFERENCES clinical_notes(id) ON DELETE CASCADE,
    organisation_id     UUID NOT NULL REFERENCES organisations(id),

    -- Extracted medication entity
    drug_name           TEXT NOT NULL,
    drug_name_normalised TEXT NOT NULL,              -- Lowercase, alias-resolved
    dose_value          NUMERIC(12,3) NOT NULL,
    dose_unit           TEXT NOT NULL
                            CHECK (dose_unit IN ('mg','mcg','g','IU','units','mL','mmol')),
    frequency           TEXT NOT NULL,               -- 'OD'|'BD'|'TDS'|'QDS'|'PRN'|'STAT'|'nocte'
    route               TEXT DEFAULT 'oral'
                            CHECK (route IN ('oral','IV','IM','SC','topical','inhaled','sublingual','PR','other')),

    -- Formulary cross-reference result
    validation_status   TEXT NOT NULL
                            CHECK (validation_status IN ('amber','danger','unknown')),
    formulary_id        UUID,                        -- Which formulary version was used
    formulary_version   TEXT,                        -- e.g. 'BNF-2024-Q4'
    is_high_alert       BOOLEAN NOT NULL DEFAULT FALSE,
    safe_range_min      NUMERIC(12,3),
    safe_range_max      NUMERIC(12,3),
    renal_flag          BOOLEAN DEFAULT FALSE,        -- True if renal adjustment indicated
    interaction_flags   JSONB DEFAULT '[]',           -- Drug-drug interaction alerts

    -- Clinician decision (the Dead-Man's Switch outcome)
    action              TEXT
                            CHECK (action IN ('confirmed','overridden','redictated','pending')),
    override_reason     TEXT,                        -- Mandatory if action = 'overridden'
    acted_by            UUID REFERENCES users(id),
    acted_at            TIMESTAMPTZ,

    -- Timestamps
    extracted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce immutability at the database layer
CREATE RULE medication_log_no_update AS
    ON UPDATE TO medication_safety_log DO INSTEAD NOTHING;
CREATE RULE medication_log_no_delete AS
    ON DELETE TO medication_safety_log DO INSTEAD NOTHING;

CREATE INDEX idx_medlog_note       ON medication_safety_log(note_id);
CREATE INDEX idx_medlog_drug       ON medication_safety_log(drug_name_normalised, acted_at);
CREATE INDEX idx_medlog_alerts     ON medication_safety_log(is_high_alert) WHERE is_high_alert = TRUE;
CREATE INDEX idx_medlog_overrides  ON medication_safety_log(organisation_id, action)
    WHERE action = 'overridden';
CREATE INDEX idx_medlog_pending    ON medication_safety_log(note_id, action)
    WHERE action = 'pending';


-- ── 7. FOLLOW-UP ENGINE ───────────────────────────────────────────────────────
CREATE TABLE follow_ups (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id),
    patient_id          UUID NOT NULL REFERENCES patients(id),
    source_note_id      UUID REFERENCES clinical_notes(id),
    created_by          UUID NOT NULL REFERENCES users(id),
    assigned_to         UUID REFERENCES users(id),   -- Can be delegated to nurse/admin

    -- Clinical content
    description         TEXT NOT NULL,
    clinical_reason     TEXT,                        -- Why this follow-up matters
    priority            TEXT NOT NULL DEFAULT 'normal'
                            CHECK (priority IN ('urgent','high','normal','low')),
    icd10_context       TEXT[],                      -- Linked diagnoses for context

    -- Scheduling
    target_date         DATE NOT NULL,
    target_date_window  INTEGER DEFAULT 3,           -- ±days flexibility
    
    -- Auto-computed (triggers on target_date change)
    days_overdue        INTEGER GENERATED ALWAYS AS (
                            GREATEST(0, CURRENT_DATE - target_date)
                        ) STORED,
    risk_level          TEXT NOT NULL DEFAULT 'low'
                            CHECK (risk_level IN ('high','medium','low')),

    -- Reminder engine
    reminder_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_channel    TEXT NOT NULL DEFAULT 'whatsapp'
                            CHECK (reminder_channel IN ('sms','whatsapp','email','in_app')),
    reminder_sent_at    TIMESTAMPTZ[] DEFAULT '{}',  -- Full history of all reminders
    next_reminder_at    TIMESTAMPTZ,
    escalation_level    SMALLINT NOT NULL DEFAULT 0  -- 0=none, 1=first, 2=second, 3=escalated
                            CHECK (escalation_level BETWEEN 0 AND 3),
    escalated_to        UUID REFERENCES users(id),
    escalated_at        TIMESTAMPTZ,

    -- Resolution
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','completed','missed','cancelled','rescheduled')),
    completed_at        TIMESTAMPTZ,
    completed_note_id   UUID REFERENCES clinical_notes(id),
    outcome_summary     TEXT,
    rescheduled_to      UUID,                        -- FK to new follow_up.id if rescheduled

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY follow_ups_org_isolation ON follow_ups
    AS PERMISSIVE FOR ALL
    USING (organisation_id = current_setting('app.current_org_id', TRUE)::UUID);

CREATE INDEX idx_fu_patient_date ON follow_ups(patient_id, target_date);
CREATE INDEX idx_fu_pending      ON follow_ups(organisation_id, status, target_date)
    WHERE status = 'pending';
CREATE INDEX idx_fu_overdue      ON follow_ups(organisation_id, days_overdue DESC, risk_level)
    WHERE status = 'pending' AND days_overdue > 0;
CREATE INDEX idx_fu_upcoming     ON follow_ups(organisation_id, next_reminder_at)
    WHERE status = 'pending' AND reminder_enabled = TRUE;


-- ── 8. FORMULARIES (Versioned Drug Safety Database) ──────────────────────────
CREATE TABLE formularies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,             -- 'BNF-2024-Q4' | 'NAFDAC-NG-2024' | 'HC-CA-2024'
    country     TEXT NOT NULL,
    version     TEXT NOT NULL,
    release_date DATE,
    source_url  TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (country, version)
);

-- Add FK from organisations
ALTER TABLE organisations
    ADD CONSTRAINT fk_org_formulary
    FOREIGN KEY (active_formulary_id) REFERENCES formularies(id);

CREATE TABLE formulary_drugs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formulary_id        UUID NOT NULL REFERENCES formularies(id) ON DELETE CASCADE,
    
    -- Drug identification
    drug_name           TEXT NOT NULL,               -- Normalised: 'amoxicillin'
    drug_aliases        TEXT[] DEFAULT '{}',          -- ['amoxil','flemoxin','amoxi']
    brand_names         TEXT[] DEFAULT '{}',          -- ['Augmentin','Amoxil']
    category            TEXT,                        -- 'antibiotic'|'antihypertensive'|'antidiabetic'
    atc_code            TEXT,                        -- WHO ATC: 'J01CA04'
    
    -- Safety classification
    is_high_alert       BOOLEAN NOT NULL DEFAULT FALSE,
    controlled_drug     TEXT,                        -- NULL | 'schedule_2' | 'schedule_3' | 'cd_pom'
    
    -- Dose ranges (adults)
    adult_min_dose      NUMERIC(12,3),
    adult_max_dose      NUMERIC(12,3),
    dose_unit           TEXT NOT NULL,               -- 'mg'|'mcg'|'g'|'IU'
    valid_frequencies   TEXT[] DEFAULT '{}',
    valid_routes        TEXT[] DEFAULT '{}',
    
    -- Paediatric
    paed_dose_per_kg    NUMERIC(12,3),               -- mg/kg
    paed_max_single     NUMERIC(12,3),               -- max single paed dose
    paed_min_age_months SMALLINT,                    -- minimum age for this drug
    
    -- Renal adjustment (Cockcroft-Gault CrCl in mL/min)
    renal_caution_crcl  NUMERIC(8,2),                -- Caution below this value
    renal_reduce_crcl   NUMERIC(8,2),                -- Reduce dose below this
    renal_avoid_crcl    NUMERIC(8,2),                -- Avoid below this value
    renal_note          TEXT,
    
    -- Hepatic adjustment
    hepatic_caution     BOOLEAN DEFAULT FALSE,
    hepatic_note        TEXT,
    
    -- Drug-drug interactions (Phase 1: curated top-200)
    interaction_pairs   JSONB DEFAULT '[]',
    -- Schema: [{
    --   drug: 'warfarin',
    --   severity: 'major'|'moderate'|'minor',
    --   mechanism: 'CYP2C9 inhibition',
    --   clinical_note: 'Monitor INR closely',
    --   guideline_ref: string
    -- }]
    
    -- Clinical guidance
    clinical_note       TEXT,
    prescribing_note    TEXT,
    guideline_ref       TEXT,                        -- 'NICE NG238 2023'
    guideline_url       TEXT,
    
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (formulary_id, drug_name)
);

CREATE INDEX idx_fdrugs_aliases    ON formulary_drugs USING GIN(drug_aliases);
CREATE INDEX idx_fdrugs_brands     ON formulary_drugs USING GIN(brand_names);
CREATE INDEX idx_fdrugs_atc        ON formulary_drugs(atc_code);
CREATE INDEX idx_fdrugs_alert      ON formulary_drugs(formulary_id, is_high_alert)
    WHERE is_high_alert = TRUE;
CREATE INDEX idx_fdrugs_fts        ON formulary_drugs USING GIN(
    to_tsvector('english', drug_name || ' ' || COALESCE(clinical_note,''))
);

-- ── Seed: Active Formularies
INSERT INTO formularies (name, country, version, source_url, is_active) VALUES
    ('BNF 2024 Q4',      'GB', '2024-Q4', 'https://bnf.nice.org.uk', TRUE),
    ('NAFDAC NG 2024',   'NG', '2024',    'https://www.nafdac.gov.ng', TRUE),
    ('Health Canada 2024','CA', '2024',   'https://www.canada.ca/health', TRUE);


-- ── 9. CLINICAL SCORING RULES (Versioned Backend Logic) ──────────────────────
CREATE TABLE clinical_score_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,           -- 'CURB-65'|'CHA2DS2-VASc'|'WELLS-DVT'|'MEWS'
    display_name    TEXT NOT NULL,
    description     TEXT,
    guideline_source TEXT,
    guideline_url   TEXT,
    version         TEXT NOT NULL,           -- 'BTS-2023'|'ESC-2020'
    applicable_countries TEXT[],            -- ['GB','NG','CA']
    
    -- Score components (versioned JSON — not hardcoded in frontend)
    components      JSONB NOT NULL,
    -- Schema: [{
    --   id: 'confusion',
    --   label: 'New-onset confusion (AMT ≤8)',
    --   description: 'Confusion new at time of presentation',
    --   points: 1,
    --   input_type: 'checkbox'|'number'|'select'
    -- }]
    
    -- Risk interpretation bands
    risk_bands      JSONB NOT NULL,
    -- Schema: [{
    --   min: 0, max: 1,
    --   risk_label: 'Low',
    --   colour: 'teal',
    --   action: 'Outpatient treatment appropriate',
    --   mortality_30d: '0.6%'
    -- }]
    
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_scores_active_name ON clinical_score_definitions(name)
    WHERE is_active = TRUE;

-- ── Seed: CURB-65 v BTS-2023
INSERT INTO clinical_score_definitions
    (name, display_name, description, guideline_source, guideline_url, version, applicable_countries, components, risk_bands)
VALUES (
    'CURB-65', 'CURB-65', 'Community-acquired pneumonia severity score',
    'British Thoracic Society CAP Guidelines 2023',
    'https://www.brit-thoracic.org.uk/guidelines/cap-guideline-2023',
    'BTS-2023', ARRAY['GB','NG','CA'],
    '[
        {"id":"confusion","label":"New-onset confusion (AMT ≤8)","points":1,"input_type":"checkbox"},
        {"id":"urea","label":"Blood urea > 7 mmol/L","points":1,"input_type":"checkbox"},
        {"id":"rr","label":"Respiratory rate ≥ 30/min","points":1,"input_type":"checkbox"},
        {"id":"bp","label":"SBP < 90 mmHg or DBP ≤ 60 mmHg","points":1,"input_type":"checkbox"},
        {"id":"age","label":"Age ≥ 65 years","points":1,"input_type":"checkbox"}
    ]'::JSONB,
    '[
        {"min":0,"max":1,"risk_label":"Low","colour":"teal","action":"Consider outpatient treatment","mortality_30d":"<1%"},
        {"min":2,"max":2,"risk_label":"Moderate","colour":"amber","action":"Consider short admission or hospital-at-home","mortality_30d":"9%"},
        {"min":3,"max":5,"risk_label":"High","colour":"rose","action":"Urgent hospital admission; ICU if CURB-65 ≥4","mortality_30d":"22%"}
    ]'::JSONB
);

-- ── Seed: CHA₂DS₂-VASc v ESC-2020
INSERT INTO clinical_score_definitions
    (name, display_name, description, guideline_source, guideline_url, version, applicable_countries, components, risk_bands)
VALUES (
    'CHA2DS2-VASc', 'CHA₂DS₂-VASc', 'Stroke risk in non-valvular atrial fibrillation',
    'ESC Guidelines for the Management of Atrial Fibrillation 2020',
    'https://www.escardio.org/guidelines/clinical-practice-guidelines/atrial-fibrillation',
    'ESC-2020', ARRAY['GB','NG','CA'],
    '[
        {"id":"chf","label":"Congestive Heart Failure (or LVEF <40%)","points":1,"input_type":"checkbox"},
        {"id":"htn","label":"Hypertension","points":1,"input_type":"checkbox"},
        {"id":"age75","label":"Age ≥ 75 years","points":2,"input_type":"checkbox"},
        {"id":"dm","label":"Diabetes Mellitus","points":1,"input_type":"checkbox"},
        {"id":"stroke","label":"Prior Stroke / TIA / Thromboembolism","points":2,"input_type":"checkbox"},
        {"id":"vasc","label":"Vascular disease (prior MI, PAD, aortic plaque)","points":1,"input_type":"checkbox"},
        {"id":"age65","label":"Age 65–74","points":1,"input_type":"checkbox"},
        {"id":"female","label":"Female sex","points":1,"input_type":"checkbox"}
    ]'::JSONB,
    '[
        {"min":0,"max":0,"risk_label":"Low","colour":"teal","action":"Anticoagulation not recommended","stroke_rate_yr":"0%"},
        {"min":1,"max":1,"risk_label":"Low-Moderate","colour":"amber","action":"Consider anticoagulation; discuss with patient","stroke_rate_yr":"1.3%"},
        {"min":2,"max":9,"risk_label":"High","colour":"rose","action":"Anticoagulate: DOAC preferred over Warfarin","stroke_rate_yr":">2.2%"}
    ]'::JSONB
);


-- ── 10. KNOWLEDGE NODES (Layer 3: Knowledge Graph) ───────────────────────────
CREATE TABLE knowledge_nodes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id),
    created_by          UUID REFERENCES users(id),
    verified_by         UUID REFERENCES users(id),

    -- Classification
    node_type           TEXT NOT NULL
                            CHECK (node_type IN ('pearl','disease','drug','guideline','case_pattern')),
    title               TEXT NOT NULL,
    content             TEXT NOT NULL,
    
    -- Tagging and categorisation
    tags                TEXT[] DEFAULT '{}',
    specialty           TEXT,                       -- 'cardiology'|'respiratory'|'endocrinology'
    icd10_codes         TEXT[] DEFAULT '{}',        -- Related diagnoses
    drug_names          TEXT[] DEFAULT '{}',        -- Related drugs (for graph edges)
    
    -- Evidence grading
    evidence_level      TEXT CHECK (evidence_level IN ('A','B','C','GPP','Expert')),
    source_ref          TEXT,                       -- 'NICE NG238 2023'
    source_url          TEXT,
    last_guideline_check TIMESTAMPTZ,              -- When was this last verified against guidelines?
    
    -- Auto-link triggers (for patient profile matching)
    trigger_conditions  JSONB DEFAULT '[]',
    -- Schema: [{
    --   field: 'chronic_codes',
    --   operator: 'contains',
    --   value: 'I10',                  -- Hypertension → show HTN pearls
    --   action: 'suggest'              -- 'suggest'|'alert'
    -- }]
    
    -- Usage analytics
    linked_case_count   INTEGER NOT NULL DEFAULT 0,
    view_count          INTEGER NOT NULL DEFAULT 0,
    last_viewed_at      TIMESTAMPTZ,
    
    -- Quality control
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged          BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason         TEXT,
    
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE knowledge_edges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_node   UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    to_node     UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    edge_type   TEXT NOT NULL
                    CHECK (edge_type IN ('treats','causes','contraindicates','see_also','derived_from','linked_case')),
    weight      NUMERIC(4,2) NOT NULL DEFAULT 1.0,  -- For future PageRank-style ranking
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (from_node, to_node, edge_type)
);

-- Linking table: note → pearl (created on note sign)
CREATE TABLE note_pearl_links (
    note_id     UUID NOT NULL REFERENCES clinical_notes(id) ON DELETE CASCADE,
    pearl_id    UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    auto_linked BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE if suggested by system
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, pearl_id)
);

ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_org_isolation ON knowledge_nodes
    AS PERMISSIVE FOR ALL
    USING (organisation_id = current_setting('app.current_org_id', TRUE)::UUID);

CREATE INDEX idx_nodes_tags     ON knowledge_nodes USING GIN(tags);
CREATE INDEX idx_nodes_icd10    ON knowledge_nodes USING GIN(icd10_codes);
CREATE INDEX idx_nodes_drugs    ON knowledge_nodes USING GIN(drug_names);
CREATE INDEX idx_nodes_type     ON knowledge_nodes(organisation_id, node_type);
CREATE INDEX idx_nodes_fts      ON knowledge_nodes USING GIN(
    to_tsvector('english', title || ' ' || content)
);
CREATE INDEX idx_edges_from     ON knowledge_edges(from_node, edge_type);
CREATE INDEX idx_edges_to       ON knowledge_edges(to_node, edge_type);


-- ── 11. AUDIT LOG (Immutable) ─────────────────────────────────────────────────
-- COMPLIANCE BACKBONE: Every data interaction is logged here
-- Used for: NDPR breach reports | GDPR Article 30 records | PIPEDA accountability
-- Retention: 7 years (NG) | 8 years (GB) | 10 years (CA) — archive old rows, never delete

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,           -- Sequential for chronological ordering
    organisation_id UUID NOT NULL,
    user_id         UUID,                            -- NULL for system actions
    patient_id      UUID,
    note_id         UUID,

    -- Action classification
    action          TEXT NOT NULL,
    -- Enumerated values:
    -- Auth:      auth.login | auth.logout | auth.fail | auth.mfa_setup | auth.mfa_verify
    -- Notes:     note.create | note.update | note.extract | note.sign | note.void | note.view
    -- Meds:      medication.extract | medication.confirm | medication.override | medication.redictate
    -- Patients:  patient.create | patient.view | patient.update | patient.archive
    -- Follow-up: follow_up.create | follow_up.complete | follow_up.miss | follow_up.escalate
    -- Knowledge: pearl.create | pearl.view | pearl.link
    -- Data:      data.export | data.download | data.bulk_view
    -- Admin:     admin.user_create | admin.user_deactivate | admin.formulary_update

    -- Context
    entity_type     TEXT,                            -- 'note'|'patient'|'medication'|'follow_up'|'pearl'
    entity_id       UUID,
    change_summary  TEXT NOT NULL,                   -- Human-readable: 'Confirmed Amoxicillin 500mg TDS'
    previous_state  JSONB,                           -- Snapshot before change (for update events)
    new_state       JSONB,                           -- Snapshot after change
    metadata        JSONB DEFAULT '{}',

    -- Network context (for breach investigation)
    ip_address      INET,
    user_agent      TEXT,
    session_id      TEXT,

    -- Timestamp (immutable)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IMMUTABLE — audit log rows can never be modified
CREATE RULE audit_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Indexes optimised for compliance queries
CREATE INDEX idx_audit_org_time    ON audit_log(organisation_id, created_at DESC);
CREATE INDEX idx_audit_user        ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_patient     ON audit_log(patient_id, created_at DESC);
CREATE INDEX idx_audit_action      ON audit_log(action, created_at DESC);
CREATE INDEX idx_audit_entity      ON audit_log(entity_type, entity_id);

-- ── Trigger: auto-audit note status changes
CREATE OR REPLACE FUNCTION audit_note_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO audit_log
            (organisation_id, user_id, note_id, action, entity_type, entity_id, change_summary, previous_state, new_state)
        VALUES (
            NEW.organisation_id,
            current_setting('app.current_user_id', TRUE)::UUID,
            NEW.id,
            'note.' || NEW.status,
            'note', NEW.id,
            'Note status changed from ' || OLD.status || ' to ' || NEW.status,
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status, 'signed_at', NEW.signed_at)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_note_status
    AFTER UPDATE OF status ON clinical_notes
    FOR EACH ROW EXECUTE FUNCTION audit_note_status_change();


-- ── 12. PERFORMANCE METRICS (Dashboard Layer 5) ───────────────────────────────
-- Materialized view: pre-aggregated nightly to avoid scanning production tables
-- Refresh schedule: pg_cron at 02:00 UTC daily

CREATE MATERIALIZED VIEW doctor_daily_metrics AS
SELECT
    cn.organisation_id,
    cn.author_id                                                         AS doctor_id,
    DATE(cn.created_at)                                                   AS metric_date,

    -- Volume metrics
    COUNT(DISTINCT cn.id)                                                 AS total_notes,
    COUNT(DISTINCT cn.id)    FILTER (WHERE cn.status = 'signed')          AS signed_notes,
    COUNT(DISTINCT cn.id)    FILTER (WHERE cn.status = 'voided')          AS voided_notes,
    COUNT(DISTINCT cn.patient_id)                                         AS unique_patients,

    -- Template breakdown
    MODE() WITHIN GROUP (ORDER BY cn.template_used)                       AS most_used_template,

    -- Safety loop metrics
    COUNT(DISTINCT msl.id)   FILTER (WHERE msl.is_high_alert = TRUE)      AS high_alert_triggers,
    COUNT(DISTINCT msl.id)   FILTER (WHERE msl.action = 'confirmed')      AS meds_confirmed,
    COUNT(DISTINCT msl.id)   FILTER (WHERE msl.action = 'overridden')     AS safety_overrides,
    COUNT(DISTINCT msl.id)   FILTER (WHERE msl.action = 'redictated')     AS redictations,

    -- Follow-up creation rate
    COUNT(DISTINCT fu.id)                                                  AS follow_ups_created,

    -- Pearl activity
    COUNT(DISTINCT npl.pearl_id)                                           AS pearls_linked,

    -- Diagnosis distribution (top 5 ICD codes)
    (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
            SELECT icd_code, COUNT(*) AS count
            FROM clinical_notes cn2
            CROSS JOIN LATERAL unnest(cn2.icd10_codes) AS icd_code
            WHERE cn2.author_id = cn.author_id
              AND DATE(cn2.created_at) = DATE(cn.created_at)
            GROUP BY icd_code
            ORDER BY count DESC
            LIMIT 5
        ) t
    )                                                                       AS top_icd_codes

FROM clinical_notes cn
LEFT JOIN medication_safety_log msl  ON msl.note_id = cn.id
LEFT JOIN follow_ups fu              ON fu.source_note_id = cn.id
LEFT JOIN note_pearl_links npl       ON npl.note_id = cn.id
WHERE cn.created_at >= NOW() - INTERVAL '90 days'
GROUP BY cn.organisation_id, cn.author_id, DATE(cn.created_at);

CREATE UNIQUE INDEX ON doctor_daily_metrics(organisation_id, doctor_id, metric_date);

-- Nightly refresh (requires pg_cron):
-- SELECT cron.schedule('refresh-metrics', '0 2 * * *',
--   $$REFRESH MATERIALIZED VIEW CONCURRENTLY doctor_daily_metrics$$);


-- ── 13. RENAL FUNCTION & DOSE ADJUSTMENT ─────────────────────────────────────
-- Stores Cockcroft-Gault results per patient per note for audit and trend analysis
CREATE TABLE renal_assessments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id),
    patient_id          UUID NOT NULL REFERENCES patients(id),
    note_id             UUID REFERENCES clinical_notes(id),
    performed_by        UUID NOT NULL REFERENCES users(id),

    -- Inputs
    age                 SMALLINT NOT NULL,
    weight_kg           NUMERIC(6,2) NOT NULL,
    serum_creatinine    NUMERIC(8,3) NOT NULL,
    creatinine_unit     TEXT NOT NULL DEFAULT 'umol_L'
                            CHECK (creatinine_unit IN ('umol_L','mg_dL')),
    sex                 TEXT NOT NULL CHECK (sex IN ('M','F')),

    -- Output
    crcl_ml_min         NUMERIC(8,2) NOT NULL,      -- Cockcroft-Gault result
    ckd_stage           TEXT,                        -- 'G1'|'G2'|'G3a'|'G3b'|'G4'|'G5'
    eGFR                NUMERIC(8,2),                -- If CKD-EPI used instead

    -- Drug adjustment recommendations (JSON from formulary lookup)
    drug_adjustments    JSONB DEFAULT '[]',
    -- Schema: [{
    --   drug: string,
    --   action: 'normal'|'reduce_dose'|'extend_interval'|'avoid',
    --   recommended_dose: string,
    --   note: string
    -- }]

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_renal_patient ON renal_assessments(patient_id, created_at DESC);


-- ── 14. UTILITY FUNCTIONS ─────────────────────────────────────────────────────

-- Cockcroft-Gault CrCl Calculator
CREATE OR REPLACE FUNCTION calculate_crcl(
    p_age       INTEGER,
    p_weight_kg NUMERIC,
    p_creatinine_umol_L NUMERIC,
    p_sex       TEXT   -- 'M' or 'F'
)
RETURNS NUMERIC AS $$
DECLARE
    creatinine_mg_dl NUMERIC;
    sex_factor       NUMERIC;
    crcl             NUMERIC;
BEGIN
    -- Convert µmol/L to mg/dL
    creatinine_mg_dl := p_creatinine_umol_L / 88.4;
    sex_factor       := CASE WHEN p_sex = 'F' THEN 0.85 ELSE 1.0 END;
    
    crcl := ((140 - p_age) * p_weight_kg * sex_factor) / (72 * creatinine_mg_dl);
    
    RETURN ROUND(crcl, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- CKD Stage from eGFR
CREATE OR REPLACE FUNCTION ckd_stage_from_egfr(egfr NUMERIC)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN egfr >= 90              THEN 'G1 (≥90)'
        WHEN egfr BETWEEN 60 AND 89  THEN 'G2 (60-89)'
        WHEN egfr BETWEEN 45 AND 59  THEN 'G3a (45-59)'
        WHEN egfr BETWEEN 30 AND 44  THEN 'G3b (30-44)'
        WHEN egfr BETWEEN 15 AND 29  THEN 'G4 (15-29)'
        WHEN egfr < 15               THEN 'G5 (<15) — Kidney Failure'
        ELSE 'Unknown'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ── 15. UPDATED_AT TRIGGER ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all mutable tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['organisations','users','patients','clinical_notes','follow_ups','formulary_drugs','knowledge_nodes'] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            tbl
        );
    END LOOP;
END;
$$;


-- ============================================================================
-- SCHEMA COMPLETE
-- 
-- Tables:        organisations, users, refresh_tokens, patients, clinical_notes,
--                medication_safety_log, follow_ups, formularies, formulary_drugs,
--                clinical_score_definitions, knowledge_nodes, knowledge_edges,
--                note_pearl_links, audit_log, renal_assessments
--
-- Views:         doctor_daily_metrics (materialized)
--
-- Functions:     calculate_crcl(), ckd_stage_from_egfr(), set_updated_at()
--
-- Triggers:      trg_audit_note_status, trg_updated_at (all mutable tables)
--
-- RLS Policies:  All patient-facing tables: org_isolation
--
-- Next steps:
--   1. Seed formulary_drugs from BNF/NAFDAC/Health Canada source files
--   2. Configure pg_cron for metrics refresh and token cleanup
--   3. Set up per-org encryption keys in KMS
--   4. Deploy Supabase instances per region (Lagos, London, Toronto)
--   5. Run EXPLAIN ANALYZE on all indexed queries under synthetic load
-- ============================================================================
