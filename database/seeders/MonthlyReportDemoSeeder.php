<?php

namespace Database\Seeders;

use App\Models\PublicReport;
use App\Models\Report;
use App\Models\TrashBin;
use App\Models\TrashHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class MonthlyReportDemoSeeder extends Seeder
{
    private const MARKER = '[demo-grafik-laporan]';

    public function run(): void
    {
        $start = now()->startOfMonth();
        $end = now()->endOfDay();

        TrashHistory::whereBetween('tanggal', [$start, $end])
            ->where('catatan', 'like', self::MARKER . '%')
            ->delete();

        PublicReport::whereBetween('created_at', [$start, $end])
            ->where('deskripsi', 'like', self::MARKER . '%')
            ->delete();

        Report::whereBetween('periode_selesai', [$start, $end])
            ->where('ringkasan', self::MARKER)
            ->delete();

        $bins = TrashBin::with('unit')->orderBy('unit_id')->orderBy('id')->get();
        $superAdmin = User::whereHas('role', fn ($role) => $role->where('name', 'super_admin'))->first();
        $petugas = User::whereHas('role', fn ($role) => $role->where('name', 'petugas'))->get();

        if ($bins->isEmpty() || ! $superAdmin || $petugas->isEmpty()) {
            return;
        }

        $binsByUnit = $bins->groupBy('unit_id')->values();
        $types = ['harian', 'mingguan', 'bulanan'];
        $statuses = ['menunggu', 'diproses', 'selesai'];
        $dayIndex = 0;

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            foreach ($binsByUnit as $unitIndex => $unitBins) {
                $unitBins = $unitBins->values();
                $dailyBins = $unitBins
                    ->filter(fn ($bin, $index) => ($index + $dayIndex + $unitIndex) % 3 !== 1)
                    ->take(3)
                    ->values();

                if ($dailyBins->isEmpty()) {
                    $dailyBins = $unitBins->take(1)->values();
                }

                foreach ($dailyBins as $index => $bin) {
                    $wasFull = ($index + $dayIndex + $unitIndex) % 3 !== 1;

                    TrashHistory::create([
                        'trash_bin_id' => $bin->id,
                        'user_id' => $petugas[($index + $dayIndex + $unitIndex) % $petugas->count()]->id,
                        'status_sebelum' => $wasFull ? 'penuh' : 'setengah_penuh',
                        'status_sesudah' => 'kosong',
                        'tanggal' => $date->copy()->setTime(7 + (($index + $unitIndex) % 8), [15, 30, 45, 0][$index % 4]),
                        'catatan' => self::MARKER . ' Pengangkutan rutin bulan ini',
                    ]);
                }

                $complaintTotal = (($dayIndex + $unitIndex) % 2) + 1;
                for ($i = 0; $i < $complaintTotal; $i++) {
                    $bin = $unitBins[($dayIndex + $i) % $unitBins->count()];

                    PublicReport::create([
                        'nomor_tiket' => PublicReport::generateNomorTiket(),
                        'trash_bin_id' => $bin->id,
                        'jenis_masalah' => ['penuh', 'rusak', 'bau', 'hama', 'pemilahan', 'lainnya'][($dayIndex + $unitIndex + $i) % 6],
                        'deskripsi' => self::MARKER . ' Tong perlu dipantau pada periode bulan berjalan.',
                        'status' => $statuses[($dayIndex + $unitIndex + $i) % count($statuses)],
                        'ip_address' => '10.0.0.' . ((($dayIndex + $unitIndex + $i) % 250) + 1),
                        'created_at' => $date->copy()->setTime(9 + $i, 20),
                        'updated_at' => $date->copy()->setTime(10 + $i, 5),
                    ]);
                }

                $reportType = $types[($dayIndex + $unitIndex) % count($types)];
                $periodStart = $reportType === 'harian'
                    ? $date->copy()
                    : $date->copy()->subDays($reportType === 'mingguan' ? 6 : min($dayIndex, 14))->startOfDay();

                Report::create([
                    'user_id' => $superAdmin->id,
                    'unit_id' => $unitBins->first()?->unit_id,
                    'judul' => 'Rekap ' . ucfirst($reportType) . ' ' . ($unitBins->first()?->unit?->nama ?? 'Unit') . ' ' . $date->format('d M Y'),
                    'tipe' => $reportType,
                    'periode_mulai' => $periodStart->toDateString(),
                    'periode_selesai' => $date->toDateString(),
                    'total_tong_penuh' => $dailyBins->filter(fn ($bin, $index) => ($index + $dayIndex + $unitIndex) % 3 !== 1)->count(),
                    'total_pengangkutan' => $dailyBins->count(),
                    'total_aduan' => $complaintTotal,
                    'isi' => 'Rekap otomatis untuk menampilkan grafik laporan bulan berjalan di semua unit.',
                    'ringkasan' => self::MARKER,
                    'created_at' => $date->copy()->setTime(16, $unitIndex % 60),
                    'updated_at' => $date->copy()->setTime(16, min(59, 20 + $unitIndex)),
                ]);
            }

            $dayIndex++;
        }
    }
}
