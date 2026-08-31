<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Unit extends Model
{
    public const KAMPUS_OPTIONS = ['Kampus A', 'Kampus B', 'Kampus C', 'Kampus D', 'Kampus E'];

    protected $fillable = ['nama', 'kampus', 'jenis', 'alamat', 'no_telepon', 'deskripsi'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function trashBins(): HasMany
    {
        return $this->hasMany(TrashBin::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    /**
     * Semua jadwal pengangkutan untuk semua tong di unit ini.
     * (HasManyThrough: Unit → TrashBin → PickupSchedule)
     */
    public function pickupSchedules(): HasManyThrough
    {
        return $this->hasManyThrough(
            PickupSchedule::class,
            TrashBin::class,
            'unit_id',           // FK di trash_bins -> units
            'trash_bin_id',      // FK di pickup_schedules -> trash_bins
            'id',                // PK units
            'id'                 // PK trash_bins
        );
    }

    /**
     * Semua laporan publik untuk semua tong di unit ini.
     */
    public function publicReports(): HasManyThrough
    {
        return $this->hasManyThrough(
            PublicReport::class,
            TrashBin::class,
            'unit_id',
            'trash_bin_id',
            'id',
            'id'
        );
    }
}
