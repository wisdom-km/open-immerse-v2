CREATE TABLE set_providers (
  vendor_id TEXT NOT NULL,
  format TEXT NOT NULL,
  base_url TEXT NOT NULL,
  model_id TEXT NOT NULL,
  allowed_hosts TEXT NOT NULL,
  purpose TEXT NOT NULL,
  credential_slot TEXT NOT NULL
);

CREATE UNIQUE INDEX set_providers_one_parse
ON set_providers (purpose)
WHERE purpose = 'parse';
