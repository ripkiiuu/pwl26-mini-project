# Bouquet Products REST API

**Muhammad Rifqy Habibi — F1D02410080**

Teknik Informatika, Universitas Mataram · ETS Pemrograman Web Lanjut 2026

API ini mengelola produk buket dan pesanan sederhana. Satu pesanan hanya berisi satu produk. Semua data di sini untuk tugas kuliah, bukan data toko sungguhan.

## Teknologi dan alur

Node.js, Express 5, JavaScript ES Modules, MySQL, Prisma ORM 6.19, Joi, dan dotenv.

Proyek ini untuk lingkungan lokal. `npm audit` masih menandai beberapa dependensi transitif Prisma 6, jadi paketnya perlu ditinjau lagi sebelum dipakai sebagai layanan publik.

```text
Postman → route → validasi Joi → controller → service → data → Prisma → MySQL

src/
  routes/       alamat endpoint
  controllers/  menerima request dan mengirim respons
  services/     aturan bisnis
  data/         query Prisma
  validators/   aturan input Joi
  middleware/   logger, validasi, error handler
  lib/          Prisma Client
prisma/         schema, migrasi, seed
```

Tabel `products` menyimpan SKU unik, nama, kategori, deskripsi, harga `DECIMAL(12,2)`, stok, serta tanggal pembuatan dan perubahan. Tabel `orders` menyimpan produk yang dipesan, nama pelanggan demo, jumlah, total harga, dan waktu pesanan. Relasinya **satu product → banyak order**, melalui `orders.productId`. Produk yang sudah punya order tidak bisa dihapus (`ON DELETE RESTRICT`).

## Menjalankan proyek

Siapkan MySQL lokal dan buat database khusus tugas bernama `ets_pwl_rifqy`. Jangan gunakan database usaha. Di phpMyAdmin, database bisa dibuat lewat tab SQL:

```sql
CREATE DATABASE ets_pwl_rifqy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` memakai akun MySQL lokal Anda. File `.env` dan `node_modules` tidak disertakan di GitHub.

```powershell
npm ci
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm start
```

API berjalan di `http://localhost:3000`. Migrasi ada di `prisma/migrations/`. Seed berisi 12 produk dengan SKU berbeda dan aman dijalankan ulang: produk/order yang sudah ada tidak dihapus atau di-reset. Jika mengubah schema saat pengembangan, gunakan `npx prisma migrate dev` untuk membuat migrasi baru.

## Endpoint

| Metode | URL | Hasil utama |
|---|---|---|
| GET | `/products` | Daftar produk, paginasi dan filter (200) |
| GET | `/products/:id` | Detail produk (200/404) |
| POST | `/products` | Tambah produk (201; input salah 400; SKU duplikat 409) |
| PUT | `/products/:id` | Ubah seluruh field utama produk (200/404/409) |
| DELETE | `/products/:id` | Hapus produk tanpa order (204; tidak ada 404; terkait order 409) |
| GET | `/orders` | Daftar order beserta produk terkait lewat `include` (200) |
| POST | `/orders` | Buat order dan kurangi stok (201/404/409) |

Daftar produk menerima `halaman` (default 1), `ukuran` (default 10, maksimal 100), `category`, dan `cari` untuk nama. Semuanya bisa digabung, misalnya:

```http
GET /products?halaman=1&ukuran=5&category=Wisuda&cari=Rifqy
```

Respons berisi `data` dan `meta` (`halaman`, `ukuran`, `total`, `totalHalaman`). Di Prisma, daftar memakai `where`, `skip`, dan `take`; jumlahnya dihitung dengan `count` menggunakan filter yang sama.

Contoh dari pengujian `POST /products` (header `Content-Type: application/json`):

```json
{
  "sku": "BKT-F1D02410080-SS-01",
  "name": "Buket Screenshot Muhammad Rifqy Habibi",
  "category": "Wisuda",
  "description": "Bukti ETS F1D02410080",
  "price": 179000,
  "stock": 10
}
```

Respons **201** (dipersingkat; respons lengkap ada di screenshot 03):

```json
{
  "data": {
    "id": 19,
    "sku": "BKT-F1D02410080-SS-01",
    "name": "Buket Screenshot Muhammad Rifqy Habibi",
    "price": "179000",
    "stock": 10
  }
}
```

ID dan tanggal dibuat oleh database; harga Decimal tampil sebagai string dalam JSON. Produk ID 19 kemudian diubah dan dihapus pada screenshot 07 dan 08. Bila SKU yang sama dikirim lagi sebelum dihapus, responsnya **409**:

```json
{"error":{"kode":"SKU_DUPLICATE","pesan":"SKU sudah digunakan"}}
```

Joi menolak body, ID, atau query yang tidak valid dengan **400**. Service memeriksa apakah produk ada dan stok cukup. Error handler memetakan konflik SKU (`P2002`) ke 409, konflik foreign key (`P2003`) ke 409, dan error tak terduga ke 500 tanpa mengirim stack trace ke client. Logger mencatat method, URL, dan status respons.

Saat `POST /orders`, server membaca harga dari tabel produk dan menghitung `totalPrice` sendiri. Pembuatan order dan pengurangan stok berada dalam `prisma.$transaction(...)` dengan objek `tx`. Stok dikurangi hanya jika `stock >= quantity`; jika tidak cukup, respons **409** dan tidak ada order baru maupun stok negatif.

## Bukti pengujian

Request bisa dicoba melalui `requests.http` (REST Client) atau Postman. Screenshot berikut diambil dari Postman dan phpMyAdmin dengan data demo ber-NIM:

| Screenshot | Yang diuji |
|---|---|
| [01 — Daftar produk](screenshot/01-get-products-200.png) | GET produk, 200 |
| [02 — Paginasi dan filter](screenshot/02-get-products-pagination-filter-200.png) | Query gabungan dan `meta`, 200 |
| [03 — Tambah produk](screenshot/03-post-product-201.png) | POST produk baru, 201 |
| [04 — Validasi](screenshot/04-post-validation-error.png) | Harga negatif ditolak, 400 |
| [05 — SKU duplikat](screenshot/05-post-duplicate-sku-409.png) | SKU yang sama dikirim ulang, 409 |
| [06 — Produk tidak ada](screenshot/06-get-product-not-found-404.png) | GET ID tidak ada, 404 |
| [07 — Ubah produk](screenshot/07-put-product-200.png) | PUT produk, 200 |
| [08 — Hapus produk](screenshot/08-delete-product-204.png) | DELETE produk tanpa order, 204 |
| [09 — Relasi order](screenshot/09-get-orders-include-200.png) | GET order dengan objek `product`, 200 |
| [10 — Order berhasil](screenshot/10-post-order-transaction-201.png) | POST order, 201; stok produk berkurang |
| [11 — Stok kurang](screenshot/11-order-stock-conflict-409.png) | Pesanan ditolak, 409 |
| [12a — Tabel products](screenshot/12a-phpmyadmin-products.png) | SKU ber-NIM dan stok 8 setelah order |
| [12b — Tabel orders](screenshot/12b-phpmyadmin-orders.png) | Order ID 5, quantity 2, total 350000 |

Pada pengujian lokal, migrasi berhasil dan seed dua kali tetap menghasilkan 12 SKU. Produk ID 1 memiliki stok 10 sebelum order pada screenshot 10 dan stok 8 sesudahnya. Pesanan dengan jumlah melebihi stok ditolak tanpa mengubah data.

## Video dan pengumpulan

Video presentasi: [Live Coding ETS di YouTube](https://youtu.be/cFsAMzIipPo). Karena NIM saya berakhiran 0, bagian yang saya tulis ulang adalah **POST /products** dari route sampai data layer, lalu saya uji di Postman dan phpMyAdmin. Transaksi `POST /orders` adalah fitur lain di proyek ini.

Repo: [github.com/ripkiiuu/pwl26-mini-project](https://github.com/ripkiiuu/pwl26-mini-project). Sebelum mengumpulkan dua tautan itu di Berajah, saya perlu memastikan video bersuara, berdurasi maksimal 15 menit, dan dapat dibuka oleh orang yang memiliki tautan (YouTube Unlisted). Repo dan video harus tetap bisa diakses sampai akhir semester.

## Penggunaan AI

Saya menggunakan OpenCode untuk membantu rancangan proyek, penulisan kode, skenario uji, dan draf README. Saya menguji API lewat Postman dan phpMyAdmin serta menjelaskan alur POST sendiri dalam video.
