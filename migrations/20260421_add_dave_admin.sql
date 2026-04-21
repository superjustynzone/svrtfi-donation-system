-- Migration: add or update admin user 'dave.dc@svrtv.com'
-- Sets the password using Postgres' crypt() with bcrypt (gen_salt('bf')).
-- Idempotent: will insert user+auth if missing, update password if auth exists, and assign admin role if not assigned.

BEGIN;

DO $$
DECLARE
  v_user_id bigint;
BEGIN
  -- Check if an auth_users record already exists
  SELECT user_id INTO v_user_id FROM public.auth_users WHERE email = 'dave.dc@svrtv.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Create a users row and capture the new user_id
    INSERT INTO public.users (first_name, last_name, created_at, updated_at, is_active)
    VALUES ('Dave', 'DC', now(), now(), true)
    RETURNING user_id INTO v_user_id;

    -- Create an auth_users row with bcrypt-hashed password
    INSERT INTO public.auth_users (user_id, email, hash_password, created_at, updated_at)
    VALUES (v_user_id, 'dave.dc@svrtv.com', crypt('AdminPass123!', gen_salt('bf')), now(), now());
  ELSE
    -- Update existing auth_users password to the provided password
    UPDATE public.auth_users
    SET hash_password = crypt('AdminPass123!', gen_salt('bf')), updated_at = now()
    WHERE email = 'dave.dc@svrtv.com';
  END IF;

  -- Ensure the admin role (role_id = 1) is assigned to this user
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_user_id AND ur.role_id = 1
  ) THEN
    INSERT INTO public.user_roles (user_id, role_id, assigned_at)
    VALUES (v_user_id, 1, now());
  END IF;
END
$$ LANGUAGE plpgsql;

COMMIT;

-- WARNING: This migration includes the plaintext password 'AdminPass123!'.
-- The password is hashed using bcrypt on the database server. After running,
-- consider forcing a password reset or changing the password to a value only
-- you control and store securely.
