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
requests.http, screenshot/
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

Jalankan skenario dalam `requests.http` lewat REST Client atau Postman. Gunakan SKU baru untuk POST 201, ulangi SKU yang sama untuk 409, kirim harga negatif untuk 400, dan cek ID tidak ada untuk 404. Untuk order, bandingkan jumlah baris dan stok di phpMyAdmin sebelum/sesudah POST berhasil serta setelah 409 stok tidak cukup. Pilih produk **tanpa order** untuk uji DELETE 204; foreign key menolak penghapusan produk yang sudah punya order.

**13 screenshot asli** hasil pengujian Postman dan phpMyAdmin disimpan di folder [`screenshot/`](screenshot/). Gambar Postman memperlihatkan request, status dan data demo beridentitas; gambar phpMyAdmin memperlihatkan SKU `BKT-F1D02410080-001`, stok setelah order, dan order ber-NIM. Tidak ada status HTTP yang diedit.

| File di `screenshot/` | Bukti yang ditampilkan |
|---|---|
| [`01-get-products-200.png`](screenshot/01-get-products-200.png) | daftar produk dan identitas di data |
| [`02-get-products-pagination-filter-200.png`](screenshot/02-get-products-pagination-filter-200.png) | query halaman/ukuran/category/cari dan meta |
| [`03-post-product-201.png`](screenshot/03-post-product-201.png) | body POST beridentitas dan status 201 |
| [`04-post-validation-error.png`](screenshot/04-post-validation-error.png) | harga negatif ditolak Joi, status 400 |
| [`05-post-duplicate-sku-409.png`](screenshot/05-post-duplicate-sku-409.png) | SKU beridentitas dikirim ulang, status 409 |
| [`06-get-product-not-found-404.png`](screenshot/06-get-product-not-found-404.png) | ID tak ada dan status 404 |
| [`07-put-product-200.png`](screenshot/07-put-product-200.png) | PUT produk demo ID 19, status 200 |
| [`08-delete-product-204.png`](screenshot/08-delete-product-204.png) | DELETE produk demo ID 19 tanpa order, status 204 tanpa body |
| [`09-get-orders-include-200.png`](screenshot/09-get-orders-include-200.png) | order demo dan objek product terkait |
| [`10-post-order-transaction-201.png`](screenshot/10-post-order-transaction-201.png) | order ID 5 dibuat, totalPrice 350000, status 201 |
| [`11-order-stock-conflict-409.png`](screenshot/11-order-stock-conflict-409.png) | quantity 999999 ditolak, status 409 |
| [`12a-phpmyadmin-products.png`](screenshot/12a-phpmyadmin-products.png) | tabel products, SKU ber-NIM dan stok 8 sesudah order |
| [`12b-phpmyadmin-orders.png`](screenshot/12b-phpmyadmin-orders.png) | tabel orders, dua order demo termasuk ID 5 ber-NIM |

**Hasil pengujian lokal:** migrasi MySQL berhasil, seed diulang dua kali tanpa duplikasi (12 produk). Postman dan phpMyAdmin membuktikan POST produk 201, validasi 400, SKU duplikat 409, detail tidak ada 404, PUT 200, DELETE 204, serta order 201 dan stok tidak cukup 409. Pada screenshot, order ID 5 berjumlah 2 dengan total 350000 dan stok produk ID 1 turun dari 10 menjadi 8. Kode transaksi juga diuji dengan dua request order bersamaan: satu berhasil dan satu ditolak, tanpa stok negatif. Video diunggah mahasiswa; suara, durasi, dan isi akhir perlu diperiksa sendiri sebelum pengumpulan. **Catatan dependensi:** `npm audit` pernah melaporkan empat advisory high pada dependensi transitif Prisma CLI 6; jangan jalankan pembaruan major otomatis tanpa menyesuaikan konfigurasi Prisma.

## Video dan pengumpulan

Video presentasi mahasiswa: **[Live Coding ETS — YouTube](https://youtu.be/cFsAMzIipPo)**. Untuk NIM berakhiran 0, fungsi live coding adalah `POST /products` (route → validasi → controller → service → data). Transaksi `POST /orders` merupakan fitur proyek, bukan fungsi yang harus ditulis ulang di video.

- [x] MySQL tugas lokal berjalan; migrasi dan seed dua kali berhasil.
- [x] Mahasiswa menjalankan tes Postman dan memeriksa tabel di phpMyAdmin; hasilnya disimpan sebagai screenshot asli.
- [x] Screenshot asli beridentitas masuk `screenshot/` dan diperiksa di GitHub.
- [x] Tautan video YouTube tersedia di README.
- [ ] Periksa ulang video: satu rekaman ≤15 menit, suara sendiri terdengar, live coding POST lengkap, Postman, phpMyAdmin, error sengaja dan pemulihan, serta akses Unlisted bagi siapa saja yang memiliki tautan.
- [x] GitHub repository **Public** bernama `pwl26-mini-project`, termasuk `prisma/migrations`, tanpa `.env` atau `node_modules`.
- [ ] Dua tautan (repo dan video) dikumpulkan via Berajah, keduanya dapat diakses sampai akhir semester.

Kode dan screenshot asli mahasiswa diunggah ke repo Public [ripkiiuu/pwl26-mini-project](https://github.com/ripkiiuu/pwl26-mini-project) pada branch `main`; `.env` dan `node_modules` tidak ikut. Postman dan phpMyAdmin sudah dipakai mahasiswa untuk bukti di atas. Mahasiswa mengunggah video sendiri; periksa ulang akses, suara, durasi dan judulnya sebelum pengumpulan. Perhatikan tenggat dan kebijakan keterlambatan di halaman dosen.

### Deklarasi penggunaan AI

Saya menggunakan OpenCode/AI untuk membantu merancang struktur proyek, memahami konsep, menulis dan meninjau kode, menyiapkan skenario uji, dan menyusun dokumentasi. Saya wajib meninjau, menjalankan, menguji, melatih penjelasan, serta memastikan seluruh hasil dan video live coding benar-benar saya pahami dan kerjakan sendiri. Bagian yang belum saya uji tidak saya klaim sudah berhasil.
