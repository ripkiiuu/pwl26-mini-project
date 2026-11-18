# Latihan live coding POST /products — F1D02410080

Digit terakhir NIM Muhammad Rifqy Habibi adalah **0**: fungsi wajib ialah **POST (tambah data)**. Rekaman satu kali tanpa potongan/percepatan, suara sendiri, bukan pemutaran kode otomatis. Berlatih dulu hingga dapat menerangkan setiap baris. Baca [rubrik dosen](https://pahrulirfan.github.io/pwl/ets-mini-proyek-api.html).

## Persiapan aman

1. Pastikan proyek final berjalan, MySQL khusus ETS aktif, `npm test`, migrasi dan seed selesai. Simpan semua pekerjaan; jangan menghapus file secara destruktif.
2. Buat **checkpoint Git lokal** jika Anda sudah menginisialisasi repo: `git add .` lalu `git commit -m "Checkpoint proyek final sebelum latihan POST"`. Periksa `git status`; `.env` dan `node_modules` tidak boleh masuk. Tidak perlu push tanpa izin. Jika belum ingin Git, salin lima file POST ke folder cadangan **di luar proyek** secara manual, beri nama jelas.
3. Buat branch latihan `git switch -c latihan-post` setelah commit. Di branch itu kosongkan **hanya baris/fungsi POST** yang akan ditulis ulang (route, validator terkait, controller, service, data). Jangan `git reset --hard`, jangan hapus seluruh file/route lain. Rekam keadaan awal yang jujur, bukan klaim bahwa proyek ditulis tanpa AI. Setelah latihan, kembalikan file dari checkpoint/branch dengan prosedur Git biasa setelah memastikan tidak ada perubahan lain yang perlu disimpan. Untuk rekaman, ulangi dari checkpoint latihan yang aman.
4. Buka editor, terminal server, Postman, phpMyAdmin. Siapkan SKU baru setiap latihan (`BKT-F1D02410080-VIDEO-01`, lalu nomor lain) agar POST pertama 201. Lihat `GET /products` untuk memastikan belum dipakai.

## Urutan pengetikan yang realistis (sekitar 5–6 menit)

1. **`src/validators/product.validator.js`**: Joi adalah penjaga bentuk. Jelaskan `sku`, `name`, `category` string wajib tidak kosong; `price` positif dengan 2 desimal; `stock` integer ≥0; `description` opsional. `productBody = Joi.object(kolom)` sudah dipakai PUT, jadi saat latihan jangan menghapus validasi PUT. Tunjukkan `validate()` di `src/middleware/validate.js`: jika salah, panggil `next(AppError(400, ...))`; jika benar, hasil pada `res.locals.body`. Mengapa? Request tidak boleh sampai service bila bentuknya salah.
2. **`src/data/product.data.js`**: ketik `export function simpan(input) { return prisma.product.create({ data: input }); }`. Jelaskan bahwa ini satu query INSERT melalui Prisma dan indeks SKU unik dijamin MySQL.
3. **`src/services/product.service.js`**: ketik `export async function buat(input) { return data.simpan(input); }`. Jelaskan service sebagai aturan bisnis; SKU ganda ditangkap oleh constraint database (`P2002` → 409 di error handler), bukan pre-check yang rentan balapan. Tunjukkan service lain memeriksa ID dan transaksi order terpisah.
4. **`src/controllers/product.controller.js`**: ketik `export async function buat(req, res) { res.status(201).json({ data: await service.buat(res.locals.body) }); }`. Jelaskan status 201, data terverifikasi, dan Express 5 meneruskan penolakan Promise ke error handler.
5. **`src/routes/product.routes.js`**: ketik `router.post('/', validate(productBody), ctrl.buat);` sebelum `export default router`. Jelaskan prefix `app.use('/products', productRoutes)` sehingga route `/` menjadi POST `/products`.
6. Periksa import yang ada; jalankan/restart server. Alur verbal: **Postman → route → Joi → controller → service → data → Prisma → MySQL → JSON 201**. Middleware error ditaruh sesudah route, logger membaca status pada event `finish`.

Potongan ini adalah **peta belajar**, bukan skrip untuk paste otomatis. Untuk latihan mengetik ulang dari keadaan kosong, pertahankan simbol lain yang dipakai GET/PUT/DELETE; jangan membuat file lain gagal import. `price` decimal menjadi string pada JSON respons.

## Uji Postman dan phpMyAdmin

- POST `http://localhost:3000/products`, Body → raw → JSON, header `Content-Type: application/json`:
  ```json
  {"sku":"BKT-F1D02410080-VIDEO-01","name":"Buket Wisuda Muhammad Rifqy Habibi","category":"Wisuda","description":"Live coding ETS F1D02410080","price":175000,"stock":8}
  ```
  Harapkan **201** dan simpan `id` respons yang benar-benar muncul.
- Klik Send lagi tanpa mengganti SKU: **409** `SKU_DUPLICATE`. Kesalahan sengaja yang aman: jelaskan unique index SKU, pemetaan `P2002`, dan cara memperbaiki **gunakan SKU baru**, bukan menonaktifkan constraint. Jangan klaim perbaikan kode bila memang hanya memperbaiki input; uji lagi dengan SKU baru untuk 201.
- Kirim `{}` atau body dengan `"price": -10`: **400** `VALIDATION_ERROR`; perbaiki body dan uji lagi.
- Buka phpMyAdmin → database `ets_pwl_rifqy` → tabel `products` → Browse/Search SKU `BKT-F1D02410080-VIDEO-01`. Cocokkan `id`, SKU, nama, price, stock dengan respons. Buka tabel `orders` jika menjelaskan relasi/order. Screenshot identitas harus terlihat.
- Bila diminta **kesalahan kode** sengaja: di branch latihan saja ubah sementara `router.post('/', validate(productBody), ctrl.buat)` menjadi route yang **tidak mendaftarkan POST**, restart, coba POST untuk 404 `ROUTE_NOT_FOUND`; jelaskan salah urutan/pemasangan route, lalu kembalikan baris yang benar dan buktikan 201 dengan SKU baru. Jangan tinggalkan bug ini pada final. Lebih sederhana gunakan SKU duplikat sebagai error wajib.

## Tanya-jawab cepat

- **Kenapa 201?** Ada resource baru, berbeda dari GET/PUT 200.
- **Kenapa 409?** Unik SKU dilanggar; database tetap sumber kebenaran bahkan pada request paralel.
- **Kenapa Joi dan service terpisah?** Joi memeriksa bentuk/tipe; service menangani aturan domain dan memanggil data.
- **Kenapa Decimal?** Harga tidak disimpan dalam float biner; total order dihitung dengan `.mul(quantity)` dari harga DB.
- **Kenapa `res.locals.body`?** Middleware menyimpan nilai Joi yang tervalidasi; Express 5 tidak mengizinkan mengganti getter `req.query` untuk query.
- **Kenapa `tx` pada order?** Semua query dalam satu transaksi; stok bersyarat dan order harus berhasil bersama atau rollback.
- **Kenapa DELETE bisa 409?** Foreign key `ON DELETE RESTRICT` menjaga order historis.
- **Bagaimana membuktikan?** Status asli Postman, baris SKU yang sama di phpMyAdmin, bukan screenshot buatan.

Latihan mandiri 2–3 kali dengan SKU berbeda, ukur waktu, jelaskan tanpa membaca naskah, dan periksa `git diff`/`npm test` setelah mengembalikan checkpoint. Jangan mengaku merekam sebelum benar-benar merekam.
