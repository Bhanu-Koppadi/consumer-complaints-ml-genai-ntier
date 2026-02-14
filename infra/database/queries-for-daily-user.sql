SELECT id,
       username,
       email,
       password_hash,
       role,
       created_at
FROM public.users
LIMIT 1000;