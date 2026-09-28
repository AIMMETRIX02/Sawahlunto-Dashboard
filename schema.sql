-- ==============================================================================
-- SCHEMA SQL BARU SUPABASE - BALAI DIKLAT TAMBANG BAWAH TANAH (BDTBT ESDM)
-- Perubahan: 'stambuk' diganti menjadi 'id_peserta' + penambahan kolom 'instansi'
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- OPSION A: JIKA INGIN MERENAMA KOLOM PADA DATABASE YANG SUDAH ADA (MIGRATION)
-- ------------------------------------------------------------------------------

-- 1. Tabel hasil_ujian
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS instansi TEXT DEFAULT 'BDTBT ESDM';
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'Simulasi';
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS delay_image TEXT;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS delay_data JSONB;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS safety BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS scaling BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS primer BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS tie_in BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS cord_cable BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS charging BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS blasting_cap BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS cap_line BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS ignite_blastbox BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS blasting BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hasil_ujian ADD COLUMN IF NOT EXISTS motor_fan BOOLEAN DEFAULT FALSE;

-- 2. Tabel profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instansi TEXT DEFAULT 'Balai Diklat Tambang Bawah Tanah';

-- 3. Tabel system_settings (Info Penandatangan Sertifikat: 2 Penandatangan Kiri & Kanan)
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS signer1_jabatan TEXT DEFAULT 'Instruktur / Pengajar Praktik';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS signer1_nama TEXT DEFAULT 'Ir. Bambang Trihatmojo, S.T., M.T.';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS signer1_nip TEXT DEFAULT '19820314 200801 1 007';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS signer2_jabatan TEXT DEFAULT 'Kepala Balai Diklat Tambang Bawah Tanah';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS signer2_nama TEXT DEFAULT 'Drs. H. Hendra Gunawan, M.T.';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS signer2_nip TEXT DEFAULT '19780515 200312 1 002';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS kepala_nama TEXT DEFAULT 'Drs. H. Hendra Gunawan, M.T.';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS kepala_nip TEXT DEFAULT '19780515 200312 1 002';

-- 4. Tabel landing_posts (Artikel, Blok Kustom & Dokumentasi Landing Page)
CREATE TABLE IF NOT EXISTS public.landing_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT DEFAULT 'article', -- 'article', 'block', 'gallery'
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT DEFAULT 'Berita Diklat',
    content TEXT,
    image_url TEXT,
    author TEXT DEFAULT 'Super Admin',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.landing_posts DISABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- OPSION B: SKRIP LENGKAP UTUH (JIKA MEMBUAT TABEL DARI AWAL / FRESH INSTALL)
-- ------------------------------------------------------------------------------

-- 1. TABEL PROFILES (Akun Peserta & Pengguna)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    id_peserta TEXT UNIQUE,
    instansi TEXT DEFAULT 'Balai Diklat Tambang Bawah Tanah',
    role TEXT DEFAULT 'peserta' CHECK (role IN ('superadmin', 'admin', 'peserta', 'mahasiswa')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL HASIL UJIAN (Data Evaluasi Ujian & Nilai Peserta)
CREATE TABLE IF NOT EXISTS public.hasil_ujian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    id_peserta TEXT NOT NULL,
    instansi TEXT DEFAULT 'BDTBT ESDM',
    modul TEXT NOT NULL DEFAULT 'Tambang Bawah Tanah',
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu TIME NOT NULL DEFAULT CURRENT_TIME,
    benar INT NOT NULL DEFAULT 0,
    salah INT NOT NULL DEFAULT 0,
    safety BOOLEAN DEFAULT FALSE,
    scaling BOOLEAN DEFAULT FALSE,
    primer BOOLEAN DEFAULT FALSE,
    tie_in BOOLEAN DEFAULT FALSE,
    cord_cable BOOLEAN DEFAULT FALSE,
    charging BOOLEAN DEFAULT FALSE,
    blasting_cap BOOLEAN DEFAULT FALSE,
    cap_line BOOLEAN DEFAULT FALSE,
    ignite_blastbox BOOLEAN DEFAULT FALSE,
    blasting BOOLEAN DEFAULT FALSE,
    motor_fan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL SYSTEM SETTINGS (Standar Kelulusan & Info 2 Penandatangan Sertifikat)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    passing_threshold INT NOT NULL DEFAULT 35,
    signer1_jabatan TEXT DEFAULT 'Instruktur / Pengajar Praktik',
    signer1_nama TEXT DEFAULT 'Ir. Bambang Trihatmojo, S.T., M.T.',
    signer1_nip TEXT DEFAULT '19820314 200801 1 007',
    signer2_jabatan TEXT DEFAULT 'Kepala Balai Diklat Tambang Bawah Tanah',
    signer2_nama TEXT DEFAULT 'Drs. H. Hendra Gunawan, M.T.',
    signer2_nip TEXT DEFAULT '19780515 200312 1 002',
    kepala_nama TEXT DEFAULT 'Drs. H. Hendra Gunawan, M.T.',
    kepala_nip TEXT DEFAULT '19780515 200312 1 002',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert nilai awal standar lulus dan 2 penandatangan jika belum ada
INSERT INTO public.system_settings (
    id, passing_threshold,
    signer1_jabatan, signer1_nama, signer1_nip,
    signer2_jabatan, signer2_nama, signer2_nip,
    kepala_nama, kepala_nip
)
VALUES (
    1, 35,
    'Instruktur / Pengajar Praktik', 'Ir. Bambang Trihatmojo, S.T., M.T.', '19820314 200801 1 007',
    'Kepala Balai Diklat Tambang Bawah Tanah', 'Drs. H. Hendra Gunawan, M.T.', '19780515 200312 1 002',
    'Drs. H. Hendra Gunawan, M.T.', '19780515 200312 1 002'
)
ON CONFLICT (id) DO NOTHING;

-- 4. TABEL LANDING POSTS (Artikel & Blok Kustom Landing Page)
CREATE TABLE IF NOT EXISTS public.landing_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT DEFAULT 'article', -- 'article', 'block', 'gallery'
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT DEFAULT 'Berita Diklat',
    content TEXT,
    image_url TEXT,
    author TEXT DEFAULT 'Super Admin',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.landing_posts DISABLE ROW LEVEL SECURITY;

-- 4. FUNGSI & TRIGGER OTOMATIS SAAT USER REGISTRASI
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, id_peserta, instansi, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'id_peserta', NEW.raw_user_meta_data->>'stambuk'),
        COALESCE(NEW.raw_user_meta_data->>'instansi', 'BDTBT ESDM'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'peserta')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. FUNGSI RPC LOGIN DENGAN ID PESERTA / NIP
CREATE OR REPLACE FUNCTION public.get_email_by_id_peserta(p_id_peserta TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.profiles
    WHERE UPPER(id_peserta) = UPPER(p_id_peserta) OR UPPER(stambuk) = UPPER(p_id_peserta)
    LIMIT 1;

    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi legacy get_email_by_stambuk (Alias kompatibilitas)
CREATE OR REPLACE FUNCTION public.get_email_by_stambuk(p_stambuk TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN public.get_email_by_id_peserta(p_stambuk);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PENGATURAN AKSES PUBLIC (DISABLE RLS)
ALTER TABLE public.hasil_ujian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
