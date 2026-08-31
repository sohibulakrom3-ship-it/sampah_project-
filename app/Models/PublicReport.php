<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * SIPESA — Laporan warga kampus (ANONIM, tanpa login).
 *
 * Tabel terpisah dari `complaints` (yang wajib login).
 *
 * Format nomor tiket: LP-YYYYMMDD-XXXX (counter direset per hari).
 * Duplicate window: 1 jam (ip_address + tong + jenis_masalah).
 */
class PublicReport extends Model
{
    protected $table = 'public_reports';

    /** Detik dalam jendela duplicate detection (1 jam). */
    public const DUPLICATE_WINDOW_MINUTES = 60;

    protected $fillable = [
        'nomor_tiket',
        'trash_bin_id',
        'jenis_masalah',
        'nama_pelapor',
        'deskripsi',
        'status',
        'catatan_admin',
        'petugas_id',
        'ditangani_oleh',
        'ditangani_pada',
        'ip_address',
        'user_agent',
        'foto',
        'is_duplikat',
        'duplikat_dari_id',
    ];

    public function getFotoUrlAttribute(): ?string
    {
        return $this->foto ? Storage::url($this->foto) : null;
    }

    protected $casts = [
        'ditangani_pada' => 'datetime',
        'is_duplikat' => 'boolean',
    ];

    protected $appends = ['foto_url'];

    // =========================================================
    // RELATIONS
    // =========================================================
    public function trashBin(): BelongsTo
    {
        return $this->belongsTo(TrashBin::class);
    }

    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }

    public function ditanganiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ditangani_oleh');
    }

    public function duplikatDari(): BelongsTo
    {
        return $this->belongsTo(self::class, 'duplikat_dari_id');
    }

    public function duplikat(): HasMany
    {
        return $this->hasMany(self::class, 'duplikat_dari_id');
    }

    public function pickupSchedules(): HasMany
    {
        return $this->hasMany(PickupSchedule::class);
    }

    // =========================================================
    // SCOPES
    // =========================================================

    /** Laporan masih aktif (belum selesai/ditolak). */
    public function scopeAktif(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['selesai', 'ditolak']);
    }

    public function scopeByTipe(Builder $query, string $tipe): Builder
    {
        return $query->where('jenis_masalah', $tipe);
    }

    // =========================================================
    // STATIC HELPERS
    // =========================================================

    /**
     * Generate nomor tiket LP-YYYYMMDD-XXXX (counter direset per hari).
     * Atomic — pakai transaksi + lock baris terakhir hari ini.
     */
    public static function generateNomorTiket(): string
    {
        $tanggal = now()->format('Ymd');
        $prefix = "LP-{$tanggal}-";

        return DB::transaction(function () use ($prefix) {
            // Cari nomor tertinggi hari ini, lock baris untuk hindari race condition.
            $last = static::where('nomor_tiket', 'like', $prefix . '%')
                ->orderByDesc('nomor_tiket')
                ->lockForUpdate()
                ->value('nomor_tiket');

            $next = 1;
            if ($last) {
                $tail = substr($last, strlen($prefix));
                $next = ((int) $tail) + 1;
            }

            return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
        });
    }

    /**
     * Cari duplikat laporan dalam jendela 1 jam terakhir.
     * Match by: ip_address + trash_bin_id + jenis_masalah.
     *
     * Return laporan asli jika ada duplikat, null jika tidak.
     */
    public static function findDuplicate(string $ip, int $tongId, string $jenis): ?self
    {
        return static::where('ip_address', $ip)
            ->where('trash_bin_id', $tongId)
            ->where('jenis_masalah', $jenis)
            ->where('created_at', '>=', now()->subMinutes(self::DUPLICATE_WINDOW_MINUTES))
            ->where('is_duplikat', false)
            ->orderByDesc('created_at')
            ->first();
    }

    // =========================================================
    // LABEL HELPERS (UI)
    // =========================================================
    public static function getStatusColors(): array
    {
        return [
            'menunggu' => ['bg' => 'bg-yellow-100', 'text' => 'text-yellow-800', 'dot' => 'bg-yellow-500', 'label' => 'Menunggu'],
            'diproses' => ['bg' => 'bg-blue-100', 'text' => 'text-blue-800', 'dot' => 'bg-blue-500', 'label' => 'Diproses'],
            'selesai' => ['bg' => 'bg-green-100', 'text' => 'text-green-800', 'dot' => 'bg-green-500', 'label' => 'Selesai'],
            'ditolak' => ['bg' => 'bg-gray-100', 'text' => 'text-gray-800', 'dot' => 'bg-gray-500', 'label' => 'Ditolak'],
        ];
    }

    public static function getJenisMasalahLabels(): array
    {
        return [
            'penuh' => 'Tong Penuh',
            'rusak' => 'Tong Rusak',
            'bau' => 'Bau Menyengat',
            'hama' => 'Hama/Serangga',
            'pemilahan' => 'Salah Pemilahan',
            'lainnya' => 'Lainnya',
        ];
    }
}
