-- Migration: seed initial roles
-- Inserts roles with specific IDs if they don't exist and advances the roles sequence.

BEGIN;

INSERT INTO public.roles (role_id, role_name)
SELECT 1, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'admin');

INSERT INTO public.roles (role_id, role_name)
SELECT 2, 'finance'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'finance');

INSERT INTO public.roles (role_id, role_name)
SELECT 3, 'encoder'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'encoder');

INSERT INTO public.roles (role_id, role_name)
SELECT 4, 'viewer'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'viewer');

INSERT INTO public.roles (role_id, role_name)
SELECT 5, 'auditor'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'auditor');

INSERT INTO public.roles (role_id, role_name)
SELECT 11, 'editor'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'editor');

INSERT INTO public.roles (role_id, role_name)
SELECT 12, 'donor'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'donor');

-- Ensure the roles sequence is at least the max(role_id) to avoid future conflicts
SELECT pg_catalog.setval('public.roles_role_id_seq', GREATEST(
  (SELECT COALESCE(MAX(role_id), 1) FROM public.roles),
  (SELECT COALESCE(nextval('public.roles_role_id_seq'::regclass), 1))
), true);

COMMIT;

-- Idempotent: running multiple times won't insert duplicates.
