
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Movies
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  poster_url text not null,
  banner_url text,
  genres text[] not null default '{}',
  language text not null,
  duration_min int not null,
  rating numeric(2,1) not null default 0,
  description text not null,
  trailer_url text,
  released_on date,
  created_at timestamptz not null default now()
);
alter table public.movies enable row level security;
create policy "movies public read" on public.movies for select using (true);

-- Theaters
create table public.theaters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  location text
);
alter table public.theaters enable row level security;
create policy "theaters public read" on public.theaters for select using (true);

-- Shows
create table public.shows (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  theater_id uuid not null references public.theaters(id) on delete cascade,
  screen text not null default 'Screen 1',
  start_at timestamptz not null,
  price_cents int not null default 25000,
  rows int not null default 8,
  cols int not null default 10
);
create index on public.shows(movie_id);
create index on public.shows(start_at);
alter table public.shows enable row level security;
create policy "shows public read" on public.shows for select using (true);

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  show_id uuid not null references public.shows(id) on delete cascade,
  seats text[] not null,
  total_cents int not null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "own bookings select" on public.bookings for select using (auth.uid() = user_id);

-- Booking seats: PK guarantees no double booking
create table public.booking_seats (
  show_id uuid not null references public.shows(id) on delete cascade,
  seat text not null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  primary key (show_id, seat)
);
alter table public.booking_seats enable row level security;
create policy "seats public read" on public.booking_seats for select using (true);

-- Atomic booking function
create or replace function public.book_seats(_show_id uuid, _seats text[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user uuid := auth.uid();
  _price int;
  _booking_id uuid;
  _seat text;
begin
  if _user is null then raise exception 'Not authenticated'; end if;
  if array_length(_seats, 1) is null then raise exception 'No seats selected'; end if;

  select price_cents into _price from public.shows where id = _show_id;
  if _price is null then raise exception 'Show not found'; end if;

  insert into public.bookings (user_id, show_id, seats, total_cents)
  values (_user, _show_id, _seats, _price * array_length(_seats, 1))
  returning id into _booking_id;

  foreach _seat in array _seats loop
    insert into public.booking_seats (show_id, seat, booking_id)
    values (_show_id, _seat, _booking_id);
  end loop;

  return _booking_id;
exception when unique_violation then
  raise exception 'One or more seats are already booked';
end; $$;

grant execute on function public.book_seats(uuid, text[]) to authenticated;

-- Seed data
insert into public.movies (title, poster_url, banner_url, genres, language, duration_min, rating, description, trailer_url, released_on) values
('Neon Horizon', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600', array['Sci-Fi','Action'], 'English', 142, 8.6, 'A rogue pilot races across a dying galaxy to deliver the last seed of humanity before time itself collapses.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-03-14'),
('Velvet Midnight', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600', array['Thriller','Drama'], 'English', 118, 7.9, 'A reclusive jazz pianist becomes entangled in a midnight conspiracy that reshapes her sense of memory.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-02-02'),
('The Last Cartographer', 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600', 'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=1600', array['Adventure','Mystery'], 'English', 134, 8.2, 'An aging mapmaker undertakes one final journey into uncharted lands rumored to bend the rules of time.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-01-20'),
('Ember & Frost', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600', array['Romance','Drama'], 'English', 109, 7.4, 'Two strangers from opposite hemispheres trade letters across a winter that will redefine their lives.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-02-14'),
('Iron Verdict', 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600', array['Action','Crime'], 'English', 127, 7.7, 'A disgraced prosecutor uncovers a conspiracy that reaches every level of the city she swore to protect.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-04-04'),
('Paper Suns', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600', array['Animation','Family'], 'English', 96, 8.9, 'A young inventor folds paper into living machines, sparking a revolution in a city that forgot how to dream.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-05-01');

insert into public.theaters (name, city, location) values
('Aurora IMAX', 'Mumbai', 'Bandra West'),
('Velvet Cinemas', 'Bengaluru', 'Indiranagar'),
('Skyline Multiplex', 'Delhi', 'Connaught Place');

-- Showtimes: 3 per movie across theaters
insert into public.shows (movie_id, theater_id, screen, start_at, price_cents)
select m.id, t.id, 'Screen ' || ((row_number() over (partition by m.id order by t.name)) % 3 + 1),
  (current_date + interval '1 day' + (row_number() over (partition by m.id order by t.name) || ' hours')::interval + interval '14 hours'),
  case t.name when 'Aurora IMAX' then 35000 when 'Velvet Cinemas' then 28000 else 22000 end
from public.movies m cross join public.theaters t;
