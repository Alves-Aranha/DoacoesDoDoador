-- Adiciona coluna data_cancelamento na tabela doacoes
ALTER TABLE doacoes ADD COLUMN IF NOT EXISTS data_cancelamento DATE;
