# Bouquet Products REST API

**Muhammad Rifqy Habibi · F1D02410080**  
Teknik Informatika, Universitas Mataram · ETS Pemrograman Web Lanjut 2026

REST API lokal untuk mengelola produk buket dan pesanan **satu produk per order**. Ini data demo akademik, bukan database usaha atau sistem keranjang belanja. Tidak ada frontend/autentikasi; jangan buka server ini ke internet tanpa pengamanan tambahan.

## Teknologi dan arsitektur

Node.js 20+, Express 5, ES Modules, MySQL, Prisma ORM **6.19.0** (dipin), Joi 17.13.9, dotenv. Prisma 6 menggunakan `url = env("DATABASE_URL")` di `schema.prisma`, generator `prisma-client-js` ke `node_modules`; **jangan mencampur konfigurasi Prisma 7** (`prisma.config.ts` dan adapter) tanpa migrasi versi yang menyeluruh.

```text
Client → routes → validate (Joi) → controllers → services → data → Prisma → MySQL
src/
  app.js, server.js
  routes/{product,order}.routes.js
  controllers/{product,order}.controller.js
  services/{product,order}.service.js
  data/{product,order}.data.js
  validators/{product,order}.validator.js
  middleware/{logger,validate,errorHandler}.js
  lib/prisma.js, utils/AppError.js
prisma/schema.prisma, prisma/migrations/, prisma/seed.js
test/, scripts/, docs/, requests.http, screenshot/
```

Relasi: `products.id (1) ─── (N) orders.productId` (foreign key, `ON DELETE RESTRICT`). Produk memiliki SKU unik, harga `DECIMAL(12,2)`, stok integer, `createdAt`/`updatedAt`; order menyimpan harga total saat transaksi dibuat, sehingga riwayat tidak berubah bila harga produk kelak berubah.

## Menjalankan di Windows (PowerShell)

1. Siapkan **MySQL lokal khusus tugas** (MySQL 8 dianjurkan), nyalakan servicenya, dan buka phpMyAdmin bila tersedia. Di tab SQL, buat database kosong: `CREATE DATABASE ets_pwl_rifqy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`. Buat akun lokal dengan hak migrasi pada database ini; jangan gunakan database penjualan sebenarnya. MySQL dan phpMyAdmin adalah aplikasi terpisah; phpMyAdmin memerlukan server web/PHP dan MySQL.
2. `Copy-Item .env.example .env`. Edit `DATABASE_URL` memakai user/password lokal milik Anda; URL-encode karakter khusus dalam password (misalnya `@` menjadi `%40`). Jangan bagikan `.env`.
3. `npm ci` (atau `npm install` bila belum ada lockfile).
4. `npx prisma validate` lalu `npx prisma migrate deploy` untuk **menerapkan SQL migrasi yang disertakan**. Alternatif pengembangan: `npx prisma migrate dev` (mungkin memerlukan izin membuat shadow database). Jangan gunakan `prisma db push` sebagai pengganti migrasi.
5. `npx prisma generate`.
6. `npm run db:seed` (jalankan ulang untuk memeriksa idempotensi; stok/order yang telah berubah **tidak di-reset**).
7. `npm start` atau `npm run dev`. Buka `http://localhost:3000/products` atau kirim `requests.http` dengan REST Client/Postman. Default port 3000.

Migrasi `prisma/migrations/20261118000000_init/migration.sql` dihasilkan dengan Prisma 6 `migrate diff --from-empty --to-schema-datamodel ... --script`; pada lingkungan pengembangan proyek ini telah diterapkan ke **database tugas terpisah** dengan `migrate deploy` dan `migrate status` menyatakan *up to date*. Verifikasi kembali di komputer Anda dan tab Structure phpMyAdmin. Jika database sudah punya tabel bernama sama, jangan menjalankan migrasi pada database itu; buat database tugas baru.

## Endpoint

| Metode | URL | Hasil |
|---|---|---|
| GET | `/products?halaman=1&ukuran=5&category=Wisuda&cari=Buket` | 200; data + meta. Semua filter opsional. |
| GET | `/products/:id` | 200, 400 ID invalid, 404 tidak ada |
| POST | `/products` | 201, 400 body invalid, 409 SKU duplikat |
| PUT | `/products/:id` | 200, 400, 404, 409; **semua** field wajib (full replacement) |
| DELETE | `/products/:id` | 204 tanpa body, 404, 409 jika ada order |
| GET | `/orders` | 200; `include: { product: true }` |
| POST | `/orders` | 201, 400, 404 produk tidak ada, 409 stok kurang |

Contoh POST `/products`, header `Content-Type: application/json`:

```json
{"sku":"BKT-F1D02410080-LIVE","name":"Buket Demo Muhammad Rifqy Habibi","category":"Wisuda","description":"Latihan ETS","price":179000,"stock":10}
```

Respons sukses: HTTP **201** `{ "data": { "id": 13, "sku": "BKT-F1D02410080-LIVE", "name": "...", "price": "179000", "stock": 10, "createdAt": "...", "updatedAt": "..." } }` (ID, tanggal, dan nilai aktual bergantung database). Prisma menyerialisasi Decimal sebagai **string**, bukan float. Respons gagal contoh: HTTP **409** `{ "error": { "kode": "SKU_DUPLICATE", "pesan": "SKU sudah digunakan" } }`.

Contoh GET `/products?halaman=1&ukuran=5&category=Wisuda` mengembalikan `{ "data": [...], "meta": { "halaman": 1, "ukuran": 5, "total": 4, "totalHalaman": 1 } }` **jika** empat produk Wisuda ada; angka aktual mengikuti isi database. `skip=(halaman-1)*ukuran`, `take=ukuran`, filter `where` dipakai pada `findMany` **dan** `count`; ukuran maksimal 100. Filter `cari` memakai `contains` pada nama; sensitivitas huruf mengikuti collation MySQL.

Contoh POST `/orders`: `{ "productId": 1, "customerName": "Pelanggan Demo F1D02410080", "quantity": 2 }`; harga tidak boleh dikirim klien. `totalPrice = price database × quantity` (Decimal). Service memulai `prisma.$transaction(async tx => ...)`, membaca produk dengan `tx`, mengurangi stok dengan `tx.product.updateMany` **bersyarat** `stock >= quantity`, lalu membuat order dengan `tx`. Bila count bukan 1, lempar 409 dan rollback. UPDATE bersyarat menjaga stok nonnegatif pada dua request bersamaan; pemeriksaan `if (produk.stock >= quantity)` saja tidak cukup. Bila INSERT gagal, decrement juga rollback.

Joi memeriksa **bentuk** input (required, string kosong, tipe, rentang, ID, halaman); service memeriksa **aturan bisnis** (keberadaan produk dan stok). Error handler terpusat setelah semua route memetakan `P2002` → 409 SKU, `P2003` → 409 relasi, `P2025` → 404, JSON rusak → 400, dan error tak dikenal → 500 generik. Detail error 500 hanya di terminal, bukan respons. Logger mencatat method, URL, status respons nyata. Tidak ada route debug 500 pada aplikasi final.

## Pengujian dan screenshot

`npm test` menguji validasi/error dan **integrasi MySQL** jika `.env` tersedia; tanpa `DATABASE_URL`, tes integrasi dilewati. Tes integrasi membuat data ber-SKU unik lalu membersihkan **hanya data buatannya**, tidak menghapus seed/order demo. Jalankan `requests.http` atau impor [`postman/Bouquet-Products-ETS.postman_collection.json`](postman/Bouquet-Products-ETS.postman_collection.json) ke Postman; cek status dan perubahan pada phpMyAdmin. Sesuaikan `productId` dan SKU agar PUT/DELETE pada produk demo yang benar dan **tanpa order**. Uji rollback khusus: `node scripts/verify-rollback.js 1` setelah seed (ganti id jika perlu). Skrip ini sengaja melempar error setelah INSERT dalam transaksi dan memverifikasi jumlah order/stok tetap; **bukan endpoint debug**. Uji 500 terkontrol ada pada `npm test` memakai aplikasi mini terpisah, tidak menambahkan jalur debug pada server final.

Ambil **screenshot asli** sendiri dengan nama berikut. Semua screenshot Postman sebaiknya memperlihatkan request SKU/nama/NIM atau request/query yang mengarah ke data demo beridentitas; untuk phpMyAdmin tampilkan baris SKU `BKT-F1D02410080-001` dan order demo. Jangan mengedit status HTTP pada gambar. Folder awal hanya berisi `.gitkeep`, **belum ada bukti screenshot**.

| File di `screenshot/` | Bukti yang ditampilkan |
|---|---|
| `01-get-products-200.png` | daftar produk dan identitas di data |
| `02-get-products-pagination-filter-200.png` | query halaman/ukuran/category dan meta |
| `03-post-product-201.png` | body POST beridentitas dan status 201 |
| `04-post-validation-error.png` | body invalid, status 400 |
| `05-post-duplicate-sku-409.png` | SKU beridentitas dikirim ulang, status 409 |
| `06-get-product-not-found-404.png` | ID tak ada dan status 404; sertakan konteks identitas di koleksi/request |
| `07-put-product-200.png` | PUT produk demo, status 200 |
| `08-delete-product-204.png` | DELETE produk demo tanpa order, status 204 |
| `09-get-orders-include-200.png` | order demo dan objek product |
| `10-post-order-transaction-201.png` | order demo, status 201, stok sesudah |
| `11-order-stock-conflict-409.png` | quantity terlalu besar, status 409 |
| `12-phpmyadmin-products-orders.png` | dua tabel asli dan identitas SKU/order |

**Status verifikasi teknis lokal oleh OpenCode:** MySQL Laragon 8.4.3, migrasi diterapkan dan status sinkron, seed dua kali menghasilkan **12 SKU** tanpa duplikasi, **8 tes lulus** (7 validasi/error termasuk POST tanpa JSON, 1 integrasi CRUD/filter/order/relasi/dua pesanan bersamaan). POST tanpa body yang semula menimbulkan 500 sudah diperbaiki menjadi 400 dan diuji. Dua order untuk satu stok menghasilkan tepat **201 dan 409**, stok akhirnya 0; tes membersihkan data sementara. Skrip rollback lulus: order **0 → 0**, stok **12 → 12**. Satu order demo beridentitas `Pelanggan Demo F1D02410080` sengaja disimpan pada produk seed id 1: total `350000`, stok **12 → 10** untuk pembuktian manual. Ini **bukan** klaim bahwa mahasiswa telah menguji seluruh skenario di Postman atau memeriksa phpMyAdmin; screenshot dan video masih menunggu. `npm audit` melaporkan empat advisory high pada dependensi transitif Prisma CLI 6 (`@prisma/config`, `effect`, `deepmerge-ts`); Joi sudah dinaikkan ke 17.13.9. Jangan `npm audit fix --force` karena akan memindahkan Prisma ke major lain dan perlu perubahan konfigurasi/client. Tinjau pembaruan versi dan advisories sebelum deployment; proyek ini untuk lokal akademik.

## Video dan pengumpulan

Video: **[ISI URL YouTube Unlisted / Google Drive dengan akses siapa saja yang punya tautan setelah merekam]**. Panduan: [`docs/PANDUAN_LIVE_CODING_POST.md`](docs/PANDUAN_LIVE_CODING_POST.md) dan [`docs/SCRIPT_VIDEO_ETS.md`](docs/SCRIPT_VIDEO_ETS.md).

- [x] MySQL tugas lokal berjalan; migrasi, seed dua kali, tes API otomatis dan rollback dijalankan OpenCode.
- [ ] Mahasiswa menjalankan sendiri tes Postman dan memeriksa tabel di phpMyAdmin untuk memahami hasilnya.
- [ ] Screenshot asli beridentitas masuk `screenshot/` dan diperiksa di GitHub.
- [ ] Video satu rekaman ≤15 menit dengan suara sendiri, live coding POST lengkap, Postman, phpMyAdmin, error sengaja dan pemulihan; tautannya di README.
- [ ] GitHub repository **Public** bernama `pwl26-mini-project`, termasuk `prisma/migrations`, tanpa `.env` atau `node_modules`.
- [ ] Dua tautan (repo dan video) dikumpulkan via Berajah, keduanya dapat diakses sampai akhir semester.

Kode telah diunggah ke repo Public [ripkiiuu/pwl26-mini-project](https://github.com/ripkiiuu/pwl26-mini-project) pada branch `main`; `.env` dan `node_modules` tidak ikut. Belum ada video atau screenshot asli yang dibuat/diklaim oleh OpenCode. Di lingkungan saat pemeriksaan ini tersedia **Adminer**, tetapi phpMyAdmin dan Postman belum terdeteksi; siapkan keduanya bila diperlukan untuk bukti/video sesuai instruksi dosen. Perhatikan tenggat dan kebijakan keterlambatan di halaman dosen.

### Deklarasi penggunaan AI

Saya menggunakan OpenCode/AI untuk membantu merancang struktur proyek, memahami konsep, menulis dan meninjau kode, menyiapkan skenario uji, dan menyusun dokumentasi. Saya wajib meninjau, menjalankan, menguji, melatih penjelasan, serta memastikan seluruh hasil dan video live coding benar-benar saya pahami dan kerjakan sendiri. Bagian yang belum saya uji tidak saya klaim sudah berhasil.
