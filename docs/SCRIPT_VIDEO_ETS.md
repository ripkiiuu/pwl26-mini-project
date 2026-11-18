# Rencana video ETS — maksimal 15 menit

**Satu rekaman kontinu, tanpa potongan/percepatan, suara Muhammad Rifqy Habibi sendiri.** Durasi target 14:20 dengan cadangan 40 detik. **NIM 0 hanya mengetik ulang POST /products, bukan POST /orders.** Relasi dan transaksi order sudah ada di proyek; cukup jelaskan kode yang ada. Demonstrasi tambahan bila sempat harus nyata. Jangan mengaku video sudah direkam.

| Waktu | Segmen dan apa yang dijelaskan |
|---|---|
| 00:00–00:35 | **A.** “Assalamualaikum warahmatullahi wabarakatuh. Perkenalkan, saya Muhammad Rifqy Habibi, NIM F1D02410080, dari Program Studi Teknik Informatika, Universitas Mataram.” Kasus buket dan batas satu produk/order. |
| 00:35–01:30 | **B.** Buka `src/`: route → validasi → controller → service → data → Prisma → MySQL; logger/error handler setelah routing. |
| 01:30–02:15 | **C.** Schema `Product`–`Order`, SKU unik, Decimal, FK RESTRICT, SQL migrasi dan tabel MySQL/phpMyAdmin yang **benar-benar sudah diterapkan**. |
| 02:15–08:10 | **D.** Live coding ulang POST: Joi, `data.simpan`, `service.buat`, `controller.buat`, route POST; jelaskan setiap layer; restart/periksa server. Gunakan panduan live coding untuk checkpoint aman. |
| 08:10–09:45 | **E.** POST SKU baru 201, ulang SKU sama 409, body `{}` 400; sebut perbedaan validasi dan constraint unik. |
| 09:45–10:25 | **F.** Tunjukkan SKU/ID yang sama pada tabel `products` phpMyAdmin. |
| 10:25–12:25 | **G.** GET daftar + filter/halaman/meta, GET orders `include`, tunjukkan kode transaksi `POST /orders` yang **sudah ada** tanpa mengetik ulang. Sebutkan GET detail, PUT, DELETE; screenshot di README berisi hasil tes nyata. Jika waktu cukup, boleh uji order tambahan, tetapi bukan live coding wajib NIM 0. |
| 12:25–13:15 | **H.** Kesalahan sengaja: SKU duplikat tadi 409, tunjukkan perbaikan dengan SKU baru 201; atau demonstrasi kode salah lokal dan langsung pulihkan. Untuk rollback tunjukkan skrip `verify-rollback.js` jika waktu/DB memungkinkan. |
| 13:15–14:20 | **I.** Kesimpulan pribadi: indeks unik, alur layer, transaksi/stok atomik, apa yang dipelajari; deklarasi bantuan OpenCode/AI secara jujur, jelaskan pengujian pribadi yang benar-benar sudah dilakukan. Salam penutup. |

Sebelum rekaman, cek koneksi MySQL, migrasi status, seed, Postman, phpMyAdmin, SKU baru, volume mikrofon, durasi, dan README tautan video sesudah upload. Setelah rekaman, tinjau apakah seluruh alur route–controller–service–data ditulis ulang secara jelas; jangan menyunting video menjadi seolah-olah satu take.
