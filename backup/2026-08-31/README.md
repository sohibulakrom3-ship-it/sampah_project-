# Backup SiPeSa — 2026-08-31

Backup database & file upload SiPeSa dari VPS production (container `sipesa_db` + volume `uploads_data`).

> **Catatan:** dump ini memuat data akun (hash password) & laporan warga. Disimpan di sini dengan izin pemilik repo. Untuk keamanan lebih baik, backup data user sebaiknya disimpan di repo private.

## Isi

| Path | Keterangan |
|---|---|
| `db/sipesa-2026-08-31.sql.gz` | Dump penuh database `sipesa` (schema + data), gzip |
| `storage/laporan/` | Foto bukti laporan warga dari `storage/app/public/laporan` |

Statistik saat backup: 7 user, 207 laporan, 36 riwayat angkut, 6 tong, 12 notifikasi, 126 aktivitas log, 6 foto bukti laporan.

## Cara restore

### Database

```bash
zcat db/sipesa-2026-08-31.sql.gz | docker exec -i sipesa_db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot sipesa'
```

### Foto / storage

```bash
docker cp storage/laporan sipesa_app:/var/www/html/storage/app/public/
docker exec sipesa_app chown -R www-data:www-data /var/www/html/storage/app/public/laporan
```
