# Panduan lengkap latihan & rekaman ETS — POST /products

**Muhammad Rifqy Habibi · F1D02410080.** Digit terakhir **0** berarti fungsi live coding adalah **POST (tambah produk)**, bukan POST order. Ini **contekan untuk latihan**, bukan kode yang diputar/ditempel otomatis dalam video. Pahami dan ketik sendiri sambil menjelaskan, satu rekaman kontinu tanpa potongan/percepatan, suara sendiri, maksimal 15 menit.

## 0. Persiapan sebelum menekan Record

1. Pastikan kode/screenshot final pada `main` sudah aman di GitHub. Jangan mengubah atau menghapus screenshot.
2. Pastikan Laragon MySQL dan Apache berjalan, Postman serta phpMyAdmin dapat dibuka, dan kamera/mikrofon siap. `npm test` lulus pada `main`; pada branch latihan tes POST **memang gagal** sampai Anda mengetik ulang. Server lama sudah dihentikan; jangan memakai server yang masih memuat kode lama di memori.
3. **Pada komputer ini branch lokal `latihan-video-post` sudah disiapkan.** Ketik `git branch --show-current`; jika belum berada di sana, gunakan `git switch latihan-video-post`. Jangan membuat ulang branch bernama sama dan jangan melakukan latihan pada `main`. Branch latihan belum di-push.
4. **Lima bagian POST sudah dikosongkan pada branch latihan**: Joi `productBody` saat ini adalah ekspor sementara `Joi.object({})` agar modul tetap bisa dimuat; fungsi `simpan`, service `buat`, controller `buat`, dan route POST diganti komentar penanda. Jangan hapus bagian GET/PUT/DELETE atau menghapus ulang seluruh file. GET masih 200, POST masih 404 sebelum diketik. Setelah ketik ulang, ganti schema sementara (jangan membuat ekspor `productBody` ganda), lalu jalankan server baru.
5. Pastikan SKU `BKT-F1D02410080-VIDEO-01` belum ada. Jangan gunakan `SS-01` dari screenshot. Jika sudah pernah latihan menggunakan VIDEO-01, pilih nomor baru dan konsisten pada semua request video.
6. Siapkan tab editor urut: validator → data → service → controller → routes → app → errorHandler. Buka Postman dan phpMyAdmin, tetapi **jangan** menampilkan hasil request/video yang belum Anda lakukan seolah-olah baru saja dikerjakan.

> Anda boleh latihan berkali-kali **sebelum** merekam. Saat rekaman, tunjukkan keadaan awal latihan yang jujur, ketik bagian POST sendiri, jalankan server, uji request, buktikan database. Setelah rekaman, bandingkan branch latihan dengan `main` dan simpan perubahan jika diperlukan; jangan menimpa pekerjaan lain tanpa pemeriksaan. Jika ingin mengulang dari titik awal, mintalah bantuan untuk mengembalikan **hanya branch latihan** setelah hasil latihan sebelumnya dicadangkan.

## 1. Pembukaan dan konsep (ucapkan dengan kata Anda sendiri)

> “Assalamualaikum warahmatullahi wabarakatuh. Perkenalkan, saya Muhammad Rifqy Habibi, NIM F1D02410080, dari Program Studi Teknik Informatika, Universitas Mataram. Proyek ETS saya adalah Bouquet Products REST API untuk produk buket dan pesanan satu produk per order. Digit terakhir NIM saya 0, jadi live coding saya adalah POST /products. Saya akan mengetik ulang alur lengkapnya, menguji di Postman, lalu membuktikan di phpMyAdmin.”

Tunjukkan `prisma/schema.prisma`: `Product` mempunyai SKU unik, `price Decimal(12,2)`, stok, tanggal; `Order` punya `productId` sebagai foreign key. `prisma/migrations` berisi SQL migrasi. Ucapkan: **“Ini database lokal khusus tugas, bukan database usaha.”**

## 2. Ketik ulang POST — lima file, urutan realistis

Kode di bawah cocok dengan proyek yang sudah berjalan. **Jangan ganti seluruh isi file**: rekatkan secara mental ke posisi semula, pertahankan ekspor lain yang dipakai endpoint GET/PUT/DELETE. Dalam video **ketik**, bukan paste otomatis.

### A. Joi — `src/validators/product.validator.js`

Import `Joi` sudah ada di bagian atas. Ketik kembali:

```js
const kolom = {
  sku: Joi.string().trim().min(1).max(100).required(),
  name: Joi.string().trim().min(1).max(191).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow('').max(5000).optional(),
  price: Joi.number().positive().precision(2).max(9999999999.99).required(),
  stock: Joi.number().integer().min(0).max(2147483647).required(),
};

export const productBody = Joi.object(kolom);
```

**Penjelasan:** “Joi mengecek bentuk masukan: teks wajib tidak kosong, harga positif maksimal dua desimal, stok bilangan bulat nonnegatif, deskripsi boleh tidak ada. Middleware `validate(productBody)` menolak input salah dengan 400 sebelum menyentuh database. Ini berbeda dengan aturan bisnis seperti SKU unik yang dijamin indeks database.” Jangan menghapus `productId`/`productQuery` di bawahnya.

### B. Data — `src/data/product.data.js`

Import `prisma` sudah ada. Ketik di antara fungsi data lain:

```js
export function simpan(input) {
  return prisma.product.create({ data: input });
}
```

**Penjelasan:** “Data layer satu-satunya bagian POST yang melakukan query INSERT melalui Prisma ke tabel products. `input` berisi field yang lolos validasi.”

### C. Service — `src/services/product.service.js`

Import `* as data` sudah ada. Ketik:

```js
export async function buat(input) {
  return data.simpan(input);
}
```

**Penjelasan:** “Service mengatur alur operasi tambah. Kita tidak melakukan pre-check SKU lalu INSERT, sebab dua request bersamaan bisa sama-sama lolos pengecekan. Indeks unik MySQL tetap penentu akhir; kode `P2002` diterjemahkan oleh errorHandler menjadi 409.”

### D. Controller — `src/controllers/product.controller.js`

Import `* as service` sudah ada. Ketik:

```js
export async function buat(req, res) {
  const produk = await service.buat(res.locals.body);
  res.status(201).json({ data: produk });
}
```

**Penjelasan:** “Controller mengambil body yang disimpan middleware Joi di `res.locals.body`, bukan query database sendiri. 201 berarti resource baru berhasil dibuat. Jika `await` gagal, Express 5 meneruskan error ke handler terpusat.”

### E. Route — `src/routes/product.routes.js`

Import `ctrl`, `validate`, dan `productBody` sudah ada. Tambahkan sebelum `export default router`:

```js
router.post('/', validate(productBody), ctrl.buat);
```

**Penjelasan:** “Urutannya penting: route POST memanggil validator dulu, lalu controller. Di `src/app.js`, router ini dipasang pada `/products`, sehingga `/` di file route menjadi POST `/products`. Alur akhirnya: Postman → route → Joi → controller → service → data → Prisma → MySQL.” Tunjukkan bahwa `app.use(notFound); app.use(errorHandler);` berada **setelah** routes dan `P2002` dipetakan 409. Jangan mengubah middleware saat rekaman kecuali perlu memperbaiki kesalahan yang benar-benar terjadi.

## 3. Jalankan dan buktikan di Postman

Setelah lima bagian selesai, **start server baru** dengan `npm start`. Tunggu teks “API berjalan”. Jika error import/sintaks, baca errornya, koreksi baris yang salah secara terbuka; jangan potong rekaman.

**POST berhasil 201** — `http://localhost:3000/products`, Body → raw → JSON:

```json
{
  "sku": "BKT-F1D02410080-VIDEO-01",
  "name": "Buket Live Coding Muhammad Rifqy Habibi",
  "category": "Wisuda",
  "description": "Demonstrasi ETS F1D02410080",
  "price": 185000,
  "stock": 7
}
```

Ucapkan: “Status 201, respons mengandung ID, SKU, harga Decimal sebagai string, dan tanggal otomatis. ID aktual saya catat dari respons; saya tidak menebaknya.”

**Kesalahan sengaja 409:** klik Send lagi dengan SKU **sama**. Jelaskan: “Constraint unik `sku` menolak data ganda, errorHandler memetakan `P2002` menjadi 409. Tidak ada baris kedua.” **Perbaikan yang jujur:** ubah SKU menjadi `BKT-F1D02410080-VIDEO-02`, kirim, tunjukkan 201; ini memperbaiki *input*, bukan bug kode.

**Validasi gagal 400:** ubah harga produk baru menjadi `-10` dan gunakan SKU lain yang jelas ber-NIM. Tunjukkan `VALIDATION_ERROR`; jelaskan Joi menghentikan request sebelum service/data. Jangan mengulang SKU yang sudah ada untuk kasus validasi, agar penyebabnya tidak ambigu.

**phpMyAdmin:** buka `http://localhost/phpmyadmin` → database `ets_pwl_rifqy` → tabel `products` → Browse atau Search SKU VIDEO-01/VIDEO-02. Cocokkan ID, SKU, nama, harga, stok dengan respons Postman. Jangan klik Empty/Drop. Jangan tampilkan kredensial `.env` atau data usaha.

## 4. Fitur lain di proyek (bukan tugas mengetik ulang Anda)

**Tegas: NIM 0 hanya mengetik ulang `POST /products`.** Dosen tetap meminta proyek mempunyai relasi dan satu transaksi yang mengubah dua tabel; `POST /orders` sudah diimplementasikan dalam kode final. Anda **tidak perlu menulis ulang route/controller/service/data order** pada video.

- Tunjukkan sebentar `GET /products?halaman=1&ukuran=5&category=Wisuda&cari=Rifqy`: ada `data` dan `meta` dari `skip`, `take`, `where`, `count`.
- Tunjukkan `GET /orders`: objek `product` muncul karena Prisma `include`. Cukup gunakan data/screenshot asli yang sudah diuji.
- Jelaskan **tanpa mengetik** di `src/services/order.service.js`: `prisma.$transaction(async tx => ...)`, seluruh query di transaksi memakai `tx`, pengurangan stok bersyarat `stock >= quantity`, gagal berarti rollback. Ini memenuhi fitur proyek, bukan live coding khusus NIM 0.
- Sebutkan GET detail, PUT, DELETE dan error 404/409 secara ringkas. Hasil uji API sudah ada pada screenshot di README.
- **Jika masih ada waktu**, boleh demonstrasikan POST order 201 dan stok berkurang lalu stok kurang 409; ini tambahan bukti, **bukan syarat mengetik ulang untuk NIM 0**. Jangan mengirim order sukses berulang tanpa sengaja.

## 5. Alokasi waktu maksimal 15 menit

| Menit | Aktivitas |
|---|---|
| 00:00–00:40 | Salam, identitas, kasus dan target POST. |
| 00:40–01:35 | Struktur folder dan alur request. |
| 01:35–02:15 | Schema, relasi dan migrasi MySQL. |
| 02:15–07:50 | **Ketik ulang** Joi → data → service → controller → route, jelaskan tiap bagian. |
| 07:50–08:20 | Start server, tangani error nyata bila ada. |
| 08:20–10:10 | Postman 201, 409 duplikat, perbaikan input, 400 validasi. |
| 10:10–10:55 | phpMyAdmin: SKU baru benar-benar ada. |
| 10:55–13:15 | Tunjukkan GET pagination/filter, GET orders dan kode transaksi yang sudah ada; **tidak mengetik order**. Uji order tambahan hanya jika waktu cukup. |
| 13:15–14:20 | Error sengaja yang sudah diuji dan cara memperbaikinya, kesimpulan pribadi, penggunaan AI yang jujur, salam. |
| 14:20–15:00 | Cadangan bila aplikasi lambat; **jangan melebihi 15 menit**. |

Kesimpulan contoh (ubah sesuai pengalaman pribadi): “Saya belajar memisahkan request ke route, validasi, controller, service, dan data. Indeks unik menjaga SKU, sementara transaksi memastikan order dan stok konsisten. OpenCode/AI membantu rancangan, peninjauan kode dan dokumentasi; saya menjalankan serta memeriksa hasilnya sendiri. Terima kasih, wassalamualaikum warahmatullahi wabarakatuh.”

## 6. Pertanyaan yang mungkin muncul

| Pertanyaan | Jawaban singkat yang harus dipahami |
|---|---|
| Mengapa POST 201? | Ada resource baru. |
| Mengapa 400/409? | 400 bentuk input salah menurut Joi; 409 benturan aturan unik/stok. |
| Di mana query INSERT? | `data.simpan` → `prisma.product.create`. |
| Mengapa `res.locals.body`? | Middleware `validate` menyimpan hasil Joi di sana. |
| Mengapa tidak cek SKU dulu saja? | Pre-check rentan race; constraint database tetap wajib. |
| Mengapa harga Decimal? | Uang tidak memakai float biner; order memakai perkalian Decimal dari harga database. |
| Mengapa transaksi pada order? | INSERT order dan UPDATE stok harus berhasil/gagal bersama; `tx` menjaga keduanya di transaksi sama. |
| Mengapa DELETE produk ber-order ditolak? | FK `ON DELETE RESTRICT` menjaga riwayat pesanan. |

Setelah video selesai, periksa hasil pada branch latihan dan repo. **Jangan mengklaim video atau pengujian yang tidak benar-benar dilakukan.** Isi URL video asli di README lalu kumpulkan link repo dan video di Berajah.
