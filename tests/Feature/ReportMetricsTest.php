<?php

namespace Tests\Feature;

use App\Models\PublicReport;
use App\Models\Report;
use App\Models\Role;
use App\Models\TrashBin;
use App\Models\TrashHistory;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_metrics_include_full_end_date_and_recalculate_on_update(): void
    {
        $admin = $this->makeUser('super_admin');
        $unit = $this->makeUnit('SD Kampus Laporan');
        $otherUnit = $this->makeUnit('SMP Kampus Laporan');
        $trashBin = $this->makeTrashBin($unit, 'RPT-001');
        $otherTrashBin = $this->makeTrashBin($otherUnit, 'RPT-999');

        $this->makeHistory($trashBin, $admin, '2026-06-20 23:30:00');
        $this->makeHistory($trashBin, $admin, '2026-06-21 10:00:00');
        $this->makeHistory($otherTrashBin, $admin, '2026-06-20 12:00:00');

        $this->makePublicReport($trashBin, '2026-06-20 22:00:00', 'Aduan malam — masih masuk tanggal akhir.', '192.168.1.10');
        $this->makePublicReport($trashBin, '2026-06-20 21:00:00', 'Tetap masuk laporan unit ini.', '192.168.1.11');
        $this->makePublicReport($otherTrashBin, '2026-06-20 21:30:00', 'Tidak boleh masuk laporan unit ini.', '192.168.1.12');

        $this->actingAs($admin)
            ->post(route('admin.reports.store'), [
                'judul' => 'Laporan Akurat',
                'tipe' => 'harian',
                'unit_id' => $unit->id,
                'periode_mulai' => '2026-06-20',
                'periode_selesai' => '2026-06-20',
                'isi' => 'Ringkasan awal.',
            ])
            ->assertSessionHasNoErrors();

        $report = Report::where('judul', 'Laporan Akurat')->firstOrFail();

        $this->assertSame(1, $report->total_tong_penuh);
        $this->assertSame(1, $report->total_pengangkutan);
        $this->assertSame(2, $report->total_aduan);

        $this->actingAs($admin)
            ->put(route('admin.reports.update', $report), [
                'judul' => 'Laporan Akurat',
                'tipe' => 'harian',
                'unit_id' => $unit->id,
                'periode_mulai' => '2026-06-20',
                'periode_selesai' => '2026-06-21',
                'isi' => 'Ringkasan diperbarui.',
            ])
            ->assertSessionHasNoErrors();

        $report->refresh();

        $this->assertSame(2, $report->total_tong_penuh);
        $this->assertSame(2, $report->total_pengangkutan);
        $this->assertSame(2, $report->total_aduan);
    }

    public function test_report_index_exposes_filtered_summary_for_visible_reports(): void
    {
        $ownedUnit = $this->makeUnit('SD Kampus Summary');
        $otherUnit = $this->makeUnit('SMP Kampus Summary');
        $adminUnit = $this->makeUser('admin_unit', $ownedUnit);
        $otherAdmin = $this->makeUser('admin_unit', $otherUnit);

        Report::create([
            'user_id' => $adminUnit->id,
            'unit_id' => $ownedUnit->id,
            'judul' => 'Laporan unit sendiri',
            'tipe' => 'harian',
            'periode_mulai' => '2026-06-20',
            'periode_selesai' => '2026-06-20',
            'total_tong_penuh' => 2,
            'total_pengangkutan' => 3,
            'total_aduan' => 4,
        ]);
        Report::create([
            'user_id' => $otherAdmin->id,
            'unit_id' => $otherUnit->id,
            'judul' => 'Laporan unit lain',
            'tipe' => 'harian',
            'periode_mulai' => '2026-06-20',
            'periode_selesai' => '2026-06-20',
            'total_tong_penuh' => 20,
            'total_pengangkutan' => 30,
            'total_aduan' => 40,
        ]);

        $this->actingAs($adminUnit)
            ->get(route('admin.reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Reports/Index')
                ->where('summary.total_tong_penuh', 2)
                ->where('summary.total_pengangkutan', 3)
                ->where('summary.total_aduan', 4)
                ->where('summary.total_laporan', 1)
                ->has('reports.data', 1)
                ->where('reports.data.0.unit_id', $ownedUnit->id)
            );
    }

    public function test_report_csv_export_escapes_spreadsheet_formulas(): void
    {
        $admin = $this->makeUser('super_admin');
        $unit = Unit::create([
            'nama' => '=HYPERLINK("https://evil.test")',
            'jenis' => 'SD',
            'alamat' => 'Jl. Pendidikan',
        ]);
        $report = Report::create([
            'user_id' => $admin->id,
            'unit_id' => $unit->id,
            'judul' => '=cmd|\' /C calc\'!A0',
            'tipe' => 'harian',
            'periode_mulai' => '2026-06-20',
            'periode_selesai' => '2026-06-20',
            'isi' => '@SUM(1,1)',
            'total_tong_penuh' => 0,
            'total_pengangkutan' => 0,
            'total_aduan' => 0,
        ]);

        $response = $this->actingAs($admin)
            ->get(route('admin.reports.csv', $report))
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString("\"'=cmd|' /C calc'!A0\"", $response);
        $this->assertStringContainsString("\"'=HYPERLINK(\"\"https://evil.test\"\")\"", $response);
        $this->assertStringContainsString("'@SUM(1,1)", $response);
        $this->assertStringNotContainsString("\nJudul,\"=cmd", $response);
        $this->assertStringNotContainsString("\nIsi,\"@SUM", $response);
    }

    private function makeRole(string $name): Role
    {
        return Role::firstOrCreate(
            ['name' => $name],
            ['label' => str_replace('_', ' ', $name)]
        );
    }

    private function makeUser(string $roleName, ?Unit $unit = null): User
    {
        return User::factory()->create([
            'role_id' => $this->makeRole($roleName)->id,
            'unit_id' => $unit?->id,
            'email_verified_at' => now(),
        ]);
    }

    private function makeUnit(string $name): Unit
    {
        return Unit::create([
            'nama' => $name,
            'jenis' => str($name)->before(' ')->toString(),
            'alamat' => 'Jl. Pendidikan',
        ]);
    }

    private function makeTrashBin(Unit $unit, string $kode): TrashBin
    {
        return TrashBin::create([
            'kode' => $kode,
            'nama' => 'Tong ' . $kode,
            'unit_id' => $unit->id,
            'lokasi' => 'Halaman',
            'jenis_sampah' => 'organik',
            'status' => 'penuh',
        ]);
    }

    private function makePublicReport(TrashBin $trashBin, string $createdAt, string $deskripsi, string $ip): PublicReport
    {
        // created_at tidak masuk $fillable PublicReport, jadi diset eksplisit
        // agar periode laporan (whereBetween created_at) menghitungnya.
        $report = PublicReport::create([
            'nomor_tiket' => PublicReport::generateNomorTiket(),
            'trash_bin_id' => $trashBin->id,
            'jenis_masalah' => 'penuh',
            'deskripsi' => $deskripsi,
            'status' => 'menunggu',
            'ip_address' => $ip,
        ]);

        $report->created_at = $createdAt;
        $report->save();

        return $report;
    }

    private function makeHistory(TrashBin $trashBin, User $user, string $tanggal): TrashHistory
    {
        return TrashHistory::create([
            'trash_bin_id' => $trashBin->id,
            'user_id' => $user->id,
            'status_sebelum' => 'penuh',
            'status_sesudah' => 'kosong',
            'tanggal' => $tanggal,
        ]);
    }
}
