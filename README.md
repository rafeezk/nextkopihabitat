# Kopi Habitat — Sudah Disambungkan ke Supabase

**Konfigurasi URL dan publishable key dari screenshot sudah dimasukkan ke file `.env`.**

**PENTING: publishable key tidak bisa membuat tabel. Anda HARUS menjalankan SQL lewat Supabase SQL Editor sebelum menggunakan katalog, keranjang, admin, dan checkout.**

## LANGKAH CEPAT (WINDOWS)

1. Ekstrak ZIP ini, jangan jalankan langsung dari dalam ZIP.
2. Di dashboard Supabase untuk project `vrhdlmtigaikitqndxqh`, buka **SQL Editor → New query**.
3. Tempel seluruh isi `supabase/schema.sql`, lalu tekan **Run**. Ini membuat tabel, policy RLS, function checkout, dan bucket gambar. Pastikan tidak ada error sebelum lanjut.
4. Untuk contoh 8 produk, jalankan isi `supabase/seed.sql` **satu kali** (gambar dapat diunggah nanti dari `/admin`).
5. Klik dua kali **`JALANKAN_WINDOWS.bat`**. Pertama kali akan memasang package lewat npm; komputer memerlukan Node.js dan internet.
6. Buka `http://localhost:5173` (atau alamat yang ditampilkan Vite).
7. Daftar akun melalui `/register` dan konfirmasi email bila pengaturan Auth mewajibkan email confirmation.
8. Untuk mengaktifkan dashboard admin, lihat UUID akun di **Authentication → Users** dan jalankan di SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = 'UUID_AKUN_ANDA';
   ```
   Logout dan login lagi, lalu buka `/admin`.

> Jika project Supabase lama sudah mempunyai tabel dengan nama sama, **backup lebih dulu**. SQL dirancang untuk struktur baru. `CREATE TABLE IF NOT EXISTS` tidak mengubah skema tabel lama yang sudah ada. Tidak ada proses reset / hapus database otomatis dalam ZIP.

## Konfigurasi yang sudah terisi

`VITE_SUPABASE_URL=https://vrhdlmtigaikitqndxqh.supabase.co`  
`VITE_SUPABASE_ANON_KEY` berisi **publishable key** yang Anda berikan, bukan secret key.

Key `sb_publishable_...` aman berada di frontend dengan RLS yang benar. Jangan sekali-kali memasukkan `sb_secret_...` atau `service_role` ke `.env` Vite.

## Perintah manual (VS Code)

```bash
npm install
npm run dev
```

## Pengujian

Sumber berhasil diperiksa secara statis. Build dan akses langsung ke Supabase milik Anda **tidak diverifikasi di sini** (lingkungan ini gagal mengunduh dependency npm). Semua URL/keys dimasukkan sesuai screenshot dan pesan Anda; verifikasi hasil penggunaan memerlukan menjalankan SQL dan aplikasi di komputer Anda.

---

# Kopi Habitat — React + Supabase

Project dari ZIP asli disesuaikan agar data **profil, minuman kopi, biji kopi, keranjang, checkout, dan riwayat** memakai Supabase. Tidak memakai API fake-coffee lagi.

## Cara menjalankan

1. Buat **project Supabase baru** (atau backup database lama sebelum migrasi).
2. Buka **Supabase Dashboard → SQL Editor → New query** dan jalankan seluruh isi `supabase/schema.sql`.
3. Opsional: jalankan `supabase/seed.sql` untuk contoh 4 minuman dan 4 biji kopi (tanpa foto; unggah lewat halaman admin).
4. Buka **Project Settings → API Keys / Connect**. Salin **Project URL** dan **publishable key / legacy anon key**. Jangan gunakan `service_role` atau secret key.
5. Di root project, salin `.env.example` menjadi `.env`, lalu isi kedua nilai:
   ```env
   VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```
6. Jalankan `npm install` lalu `npm run dev`, buka URL localhost Vite.
7. Register akun pengguna. Jika **Confirm email** di Supabase Auth aktif, klik link verifikasi email dahulu. Profil otomatis dibuat melalui trigger database.
8. Untuk memberi hak admin: cari UUID akun di **Authentication → Users** dan jalankan query di SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = 'GANTI_DENGAN_UUID_AKUN_ANDA';
   ```
   Logout dan login ulang agar state role diperbarui.
9. Buka `/admin` untuk CRUD minuman kopi dan biji kopi serta upload foto (bucket `coffee_images` otomatis disiapkan SQL).
10. Coba alur: daftar → login → halaman utama → tambah kopi ke keranjang → checkout → riwayat.

## Struktur database

- `profiles`: data user, username, dan role; otomatis dibuat setelah signup.
- `coffees`: katalog minuman kopi.
- `beans`: katalog biji kopi.
- `coffeecart`: item keranjang tiap user (`id_user`, `id_product`, `cart_total`). Nama/harga/gambar diperoleh lewat relasi ke `coffees`.
- `coffeecheckout`: transaksi yang menyimpan daftar item snapshot, harga, username, tanggal checkout.
- `storage.buckets`: bucket public `coffee_images` untuk gambar minuman dan biji kopi.

## Catatan penting

- SQL ini ditujukan untuk **database baru**. `CREATE TABLE IF NOT EXISTS` tidak mengubah struktur tabel lama yang namanya sama. Jika sebelumnya sudah ada tabel `coffees`/`coffeecart`/`coffeecheckout`, data perlu dimigrasikan sesuai skema baru, bukan asal jalankan SQL. Backup terlebih dahulu.
- Row Level Security (RLS) mengamankan pembacaan cart/riwayat per pengguna. CRUD produk dan upload gambar hanya boleh dilakukan admin. Role admin **tidak bisa** ditentukan pada formulir register.
- Checkout dihitung di **database** melalui RPC `kopi_checkout_cart` dalam satu transaksi, bukan `insert` checkout + `delete` keranjang terpisah.
- Jika memilih harga yang tampil dan terjadi perubahan harga sebelum checkout, nilai final di database adalah harga terbaru ketika checkout.
- `VITE_` environment variables akan ikut ke bundle browser, jadi gunakan hanya Supabase **publishable/anon key**, bukan service role.
- Jika project lama memiliki RLS policies yang permisif, policies tersebut perlu diaudit karena PostgreSQL akan menggabungkan policies dengan logika OR.
- Foto lama yang tersimpan sebagai nama file tetap didukung (`images/nama-file`), sedangkan upload baru disimpan sebagai path `coffee/...` atau `beans/...`.

## File kode per file

Lihat `KODE_PER_FILE.md` untuk kode lengkap setiap file yang diubah dan `supabase/schema.sql` untuk SQL siap ditempel.
