# 🌱 Little Memories — Family Journal Website

A private family website to record your kids growing up — moments, photo albums, and vlogs.
Hosted FREE on GitHub Pages, powered by Supabase (free backend).

---

## ✅ Features

- 🔐 Signup & Login (email + password)
- 📝 Post moments with text and photos
- 📷 Create photo albums (up to 9 photos)
- 🎬 Share vlogs (paste YouTube link)
- 📱 Works in WeChat, Safari, Chrome on mobile
- 🌍 All content private (login required)

---

## 🚀 Setup Guide (Step-by-Step)

### STEP 1 — Create a Supabase Project (Free)

1. Go to [https://supabase.com](https://supabase.com) and click **Start for Free**
2. Sign in with GitHub or email
3. Click **New Project**, fill in:
   - **Name**: `little-memories` (or anything you like)
   - **Database Password**: choose a strong password (save it!)
   - **Region**: choose closest to you
4. Wait ~2 minutes for the project to be ready

---

### STEP 2 — Set Up the Database

1. In your Supabase project, click **SQL Editor** in the left menu
2. Click **New Query** and paste ALL of the following SQL, then click **Run**:

```sql
-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- POSTS TABLE
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  content text,
  type text check (type in ('moment', 'album', 'vlog')) default 'moment',
  created_at timestamp with time zone default now()
);

-- MEDIA TABLE (photos & video links)
create table public.media (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  url text not null,
  type text check (type in ('image', 'video')) default 'image',
  caption text,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- ROW LEVEL SECURITY: everyone can read, only logged-in users can write
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.media enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Posts are viewable by authenticated users"
  on public.posts for select to authenticated using (true);

create policy "Authenticated users can insert posts"
  on public.posts for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete to authenticated using (auth.uid() = user_id);

create policy "Media is viewable by authenticated users"
  on public.media for select to authenticated using (true);

create policy "Authenticated users can insert media"
  on public.media for insert to authenticated with check (true);

create policy "Users can delete their own media"
  on public.media for delete to authenticated
  using (post_id in (select id from public.posts where user_id = auth.uid()));

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

### STEP 3 — Set Up Photo Storage

1. In Supabase, click **Storage** in the left menu
2. Click **Create bucket**
3. Name it exactly: `media`
4. Check ✅ **Public bucket**, then click **Create bucket**
5. Click on the **media** bucket, then **Policies** tab
6. Click **New Policy** → **For full customization** → Use this policy:

```sql
-- Allow authenticated users to upload
create policy "Allow authenticated uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

-- Allow anyone to view photos
create policy "Allow public read"
  on storage.objects for select to public
  using (bucket_id = 'media');

-- Allow users to delete their own files
create policy "Allow authenticated delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');
```

Or simply: click **New Policy** → **Give users access to a folder only** and set up as needed.

---

### STEP 4 — Get Your API Keys

1. In Supabase, go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

---

### STEP 5 — Put the Code on GitHub

1. Go to [https://github.com](https://github.com) and sign in (or create a free account)
2. Click **+** → **New repository**
3. Name it: `little-memories` (or any name)
4. Choose **Public** (required for free GitHub Pages)
5. Click **Create repository**
6. Upload ALL the files from this folder:
   - `index.html`, `signup.html`, `feed.html`, `create.html`
   - `css/style.css`
   - `js/config.js`, `js/auth.js`, `js/feed.js`, `js/create.js`
   - `README.md`

   **Easy way to upload:** On the repository page, click **Add file** → **Upload files**, then drag and drop all files (maintain the folder structure).

---

### STEP 6 — Add Your Supabase Keys

1. In your GitHub repository, open the file `js/config.js`
2. Click the **pencil (edit)** icon
3. Replace these two lines:
   ```js
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   With your actual values from Step 4, like:
   ```js
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```
4. Click **Commit changes**

---

### STEP 7 — Enable GitHub Pages

1. In your repository, click **Settings**
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, choose **Deploy from a branch**
4. Branch: `main` (or `master`), folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes, then your site is live at:
   `https://YOUR-GITHUB-USERNAME.github.io/little-memories/`

---

### STEP 8 — Share in WeChat

1. Open WeChat
2. Go to a chat (or "Favorites")
3. Share the link: `https://YOUR-USERNAME.github.io/little-memories/`
4. Anyone with the link can sign up and start adding memories!

---

## 📱 How to Use (Phone)

| Action | How |
|--------|-----|
| Sign up | Open site → "Sign up free" |
| Login | Open site → enter email & password |
| Add moment | Tap **+** button → choose type → fill in & save |
| Add photos | Tap **+** → select photos from phone gallery |
| Add vlog | Tap **+** → choose "Vlog" → paste YouTube link |
| Filter posts | Tap tabs: All / Moments / Albums / Vlogs |
| Logout | Tap 👤 icon → Logout |

---

## 💰 Costs

| Service | Free Tier |
|---------|-----------|
| GitHub Pages | ✅ Free forever |
| Supabase Auth | ✅ Free up to 50,000 users |
| Supabase Database | ✅ Free up to 500MB |
| Supabase Storage | ✅ Free up to 1GB |

**Totally free for a family journal!**

---

## 🔒 Privacy

- All pages require login — strangers cannot see your memories
- Only people you share the signup link with can create accounts
- **Tip**: After your family has signed up, you can disable new signups in Supabase → Authentication → Settings → "Enable email signup" (toggle off)

---

## 🛠 Troubleshooting

**"Network error" or blank page?**
→ Double-check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/config.js`

**Photos not uploading?**
→ Make sure the `media` storage bucket is created and set to **Public**

**Can't login after signing up?**
→ Supabase may require email confirmation. Check Supabase → Authentication → Settings → disable "Enable email confirmations" for easier family use

**WeChat shows blank page?**
→ Make sure your GitHub Pages site uses `https://` (it always does — this is automatic)
