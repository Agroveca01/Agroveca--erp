
-- 1. Drop trigger and function if they exist (safe for re-runs)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

-- 2. Create the function to handle new user insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, email, full_name, is_active, created_at, updated_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    true,
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create the trigger to call the function after insert on auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
