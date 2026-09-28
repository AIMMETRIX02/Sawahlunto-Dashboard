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

-- 3. TABEL SYSTEM SETTINGS (Standar Kelulusan)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    passing_threshold INT NOT NULL DEFAULT 35,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert nilai awal standar lulus jika belum ada
INSERT INTO public.system_settings (id, passing_threshold)
VALUES (1, 35)
ON CONFLICT (id) DO NOTHING;

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
