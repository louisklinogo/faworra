-- Ensure required extensions (uuid + pgvector)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- FX rates table (Midday parity)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base text,
  rate numeric(10,2),
  target text,
  updated_at timestamptz
);

-- Indexes and constraints
CREATE INDEX IF NOT EXISTS exchange_rates_base_target_idx
  ON public.exchange_rates USING btree (base, target);
CREATE UNIQUE INDEX IF NOT EXISTS unique_rate
  ON public.exchange_rates (base, target);

-- Document tag embeddings (pgvector)
CREATE TABLE IF NOT EXISTS public.document_tag_embeddings (
  slug text PRIMARY KEY,
  embedding vector(768),
  name text NOT NULL,
  model text NOT NULL DEFAULT 'gemini-embedding-001'
);

-- HNSW index for cosine similarity
CREATE INDEX IF NOT EXISTS document_tag_embeddings_idx
  ON public.document_tag_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Transaction category embeddings (pgvector)
CREATE TABLE IF NOT EXISTS public.transaction_category_embeddings (
  name text PRIMARY KEY,
  embedding vector(768),
  model text NOT NULL DEFAULT 'gemini-embedding-001',
  system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HNSW vector index and system flag index
CREATE INDEX IF NOT EXISTS transaction_category_embeddings_vector_idx
  ON public.transaction_category_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS transaction_category_embeddings_system_idx
  ON public.transaction_category_embeddings (system);
