-- Adiciona a coluna codigo_item à tabela itens_doacao
-- Necessário porque o código tenta inserir esse campo, mas a coluna não foi criada

ALTER TABLE itens_doacao ADD COLUMN IF NOT EXISTS codigo_item TEXT DEFAULT '';
