<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Models\TrashBin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // =========================================================
        // ROLES (6 role + warga anonim publik)
        // =========================================================
        // Akses level:
        //   super_admin   -> CRUD penuh semua unit
        //   admin_unit    -> CRUD dalam unit-nya saja
        //   kepala_unit   -> READ-ONLY dalam unit-nya saja
        //   kepala_pusat  -> READ-ONLY semua unit
        //   petugas       -> Eksekusi pengangkutan (tugas lapangan)
        //   siswa         -> Melapor lewat QR pada tong sampah (tanpa login)
        //   (anonim)      -> Halaman publik /lapor/{kode-tong} tanpa login
        // =========================================================
        $superAdmin = Role::create([
            'name' => 'super_admin',
            'label' => 'Super Admin',
            'description' => 'Akses penuh ke seluruh sistem (CRUD semua unit).',
        ]);
        $adminUnit = Role::create([
            'name' => 'admin_unit',
            'label' => 'Admin Unit',
            'description' => 'Mengelola unit masing-masing (CRUD dalam unit).',
        ]);
        $kepalaUnit = Role::create([
            'name' => 'kepala_unit',
            'label' => 'Kepala Unit',
            'description' => 'Hanya melihat data unitnya sendiri (read-only, scope unit).',
        ]);
        $kepalaPusat = Role::create([
            'name' => 'kepala_pusat',
            'label' => 'Kepala Pusat',
            'description' => 'Melihat seluruh data sistem semua unit (read-only).',
        ]);
        $petugas = Role::create([
            'name' => 'petugas',
            'label' => 'Petugas',
            'description' => 'Petugas pengangkut sampah lapangan.',
        ]);
        $siswa = Role::create([
            'name' => 'siswa',
            'label' => 'Siswa',
            'description' => 'Siswa/civitas yang melapor lewat QR pada tong sampah (tanpa login).',
        ]);

        // =========================================================
        // UNITS — Kampus A–E, Muhammadiyah Cileungsi
        // =========================================================
        // Kampus B
        $sd = Unit::create(['nama' => 'SD Kampus B', 'kampus' => 'Kampus B', 'jenis' => 'SD', 'alamat' => 'Jl. Pendidikan No. 1, Kampus B', 'deskripsi' => 'Sekolah Dasar']);
        $smp = Unit::create(['nama' => 'SMP Kampus B', 'kampus' => 'Kampus B', 'jenis' => 'SMP', 'alamat' => 'Jl. Pendidikan No. 2, Kampus B', 'deskripsi' => 'Sekolah Menengah Pertama']);
        $sma = Unit::create(['nama' => 'SMA Kampus B', 'kampus' => 'Kampus B', 'jenis' => 'SMA', 'alamat' => 'Jl. Pendidikan No. 3, Kampus B', 'deskripsi' => 'Sekolah Menengah Atas']);
        $tk = Unit::create(['nama' => 'TK Kampus B', 'kampus' => 'Kampus B', 'jenis' => 'TK', 'alamat' => 'Jl. Pendidikan No. 4, Kampus B', 'deskripsi' => 'Taman Kanak-Kanak']);
        $btm = Unit::create(['nama' => 'BTM Kampus B', 'kampus' => 'Kampus B', 'jenis' => 'BTM', 'alamat' => 'Jl. Pendidikan No. 5, Kampus B', 'deskripsi' => 'Balai Teknologi dan Manajemen']);
        $sumart = Unit::create(['nama' => 'Sumart Kampus B', 'kampus' => 'Kampus B', 'jenis' => 'Sumart', 'alamat' => 'Jl. Pendidikan No. 6, Kampus B', 'deskripsi' => 'Mini Market / Kantin']);
        $umci = Unit::create(['nama' => 'UMCI Kampus B', 'kampus' => 'Kampus B', 'jenis' => 'Umci', 'alamat' => 'Jl. Pendidikan No. 7, Kampus B', 'deskripsi' => 'Unit MCI']);

        // Kampus A
        $smk1 = Unit::create(['nama' => 'SMKM 1', 'kampus' => 'Kampus A', 'jenis' => 'SMK', 'alamat' => 'Kampus A, Cileungsi, Bogor', 'deskripsi' => 'SMK Muhammadiyah 1 Cileungsi']);
        $smk3 = Unit::create(['nama' => 'SMKM 3', 'kampus' => 'Kampus A', 'jenis' => 'SMK', 'alamat' => 'Kampus A, Cileungsi, Bogor', 'deskripsi' => 'SMK Muhammadiyah 3 Cileungsi']);

        // Kampus C
        $sdMuh2 = Unit::create(['nama' => 'SDM 2', 'kampus' => 'Kampus C', 'jenis' => 'SD', 'alamat' => 'Kampus C, Cileungsi, Bogor', 'deskripsi' => 'SD Muhammadiyah 2 Cileungsi']);
        $smpMuh2 = Unit::create(['nama' => 'SMPM 2', 'kampus' => 'Kampus C', 'jenis' => 'SMP', 'alamat' => 'Kampus C, Cileungsi, Bogor', 'deskripsi' => 'SMP Muhammadiyah 2 Cileungsi']);

        // Kampus D
        $smk2 = Unit::create(['nama' => 'SMKM 2', 'kampus' => 'Kampus D', 'jenis' => 'SMK', 'alamat' => 'Kampus D, Cileungsi, Bogor', 'deskripsi' => 'SMK Muhammadiyah 2 Cileungsi']);
        $sdMuh3 = Unit::create(['nama' => 'SDM 3', 'kampus' => 'Kampus D', 'jenis' => 'SD', 'alamat' => 'Kampus D, Cileungsi, Bogor', 'deskripsi' => 'SD Muhammadiyah 3 Cileungsi']);

        // Kampus E
        $smk4 = Unit::create(['nama' => 'SMKM 4', 'kampus' => 'Kampus E', 'jenis' => 'SMK', 'alamat' => 'Kampus E, Cileungsi, Bogor', 'deskripsi' => 'SMK Muhammadiyah 4 Cileungsi']);

        // =========================================================
        // USERS — Akun contoh untuk semua role
        // Password default: 'password' untuk semua akun
        // =========================================================
        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $superAdmin->id,
            'no_telepon' => '081200000001',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Admin SD',
            'email' => 'adminsd@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $adminUnit->id,
            'unit_id' => $sd->id,
            'no_telepon' => '081200000002',
            'email_verified_at' => now(),
        ]);

        // === Akun read-only baru ===
        User::create([
            'name' => 'Kepala Unit SD',
            'email' => 'kepala.sd@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $kepalaUnit->id,
            'unit_id' => $sd->id,
            'no_telepon' => '081200000010',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Kepala Unit SMP',
            'email' => 'kepala.smp@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $kepalaUnit->id,
            'unit_id' => $smp->id,
            'no_telepon' => '081200000011',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Kepala Pusat',
            'email' => 'kepala.pusat@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $kepalaPusat->id,
            'no_telepon' => '081200000020',
            'email_verified_at' => now(),
        ]);
        // === END read-only ===

        User::create([
            'name' => 'Petugas 1',
            'email' => 'petugas@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $petugas->id,
            'unit_id' => $sd->id,
            'no_telepon' => '081200000003',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Petugas 2',
            'email' => 'petugas2@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $petugas->id,
            'unit_id' => $smp->id,
            'no_telepon' => '081200000004',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Siswa Contoh',
            'email' => 'siswa@sipesa.test',
            'password' => Hash::make('password'),
            'role_id' => $siswa->id,
            'unit_id' => $sd->id,
            'no_telepon' => '081200000005',
            'email_verified_at' => now(),
        ]);

        // =========================================================
        // TRASH BINS — contoh tong sampah per unit dengan koordinat
        // =========================================================
        $units = [$sd, $smp, $sma, $tk, $btm, $sumart, $umci, $smk1, $smk3, $sdMuh2, $smpMuh2, $smk2, $sdMuh3, $smk4];
        $statuses = ['kosong', 'setengah_penuh', 'penuh', 'sudah_diangkut'];
        $jenisList = ['organik', 'anorganik'];

        // Offset dasar per kampus agar tong tiap kampus bergerombol di titiknya sendiri (sekitar Cileungsi)
        $kampusOffsets = [
            'Kampus A' => [0.0040, 0.0040],
            'Kampus B' => [0.0000, 0.0000],
            'Kampus C' => [-0.0040, 0.0030],
            'Kampus D' => [0.0050, -0.0040],
            'Kampus E' => [-0.0030, -0.0050],
        ];
        $unitIndexPerKampus = [];

        foreach ($units as $globalIdx => $unit) {
            $kampus = $unit->kampus ?? 'Kampus B';
            [$latOffset, $lngOffset] = $kampusOffsets[$kampus] ?? [0.0, 0.0];
            $unitInKampus = $unitIndexPerKampus[$kampus] ?? 0;
            $unitIndexPerKampus[$kampus] = $unitInKampus + 1;

            $numBins = rand(3, 6);
            for ($j = 1; $j <= $numBins; $j++) {
                // Tinggi tong realistis: 60-120 cm
                $tinggi = rand(60, 120);

                // Persentase kepenuhan disesuaikan status
                $status = $statuses[array_rand($statuses)];
                $persen = match ($status) {
                    'kosong' => rand(0, 40),
                    'setengah_penuh' => rand(41, 75),
                    'penuh' => rand(76, 100),
                    'sudah_diangkut' => 0,
                    default => rand(0, 100),
                };

                TrashBin::create([
                    'kode' => strtoupper(substr($unit->jenis, 0, 2)) . '-' . str_pad($globalIdx + 1, 2, '0', STR_PAD_LEFT) . str_pad($j, 2, '0', STR_PAD_LEFT),
                    'nama' => 'Tong ' . $unit->nama . ' #' . $j,
                    'unit_id' => $unit->id,
                    'lokasi' => $unit->nama . ' - Area ' . chr(64 + $j),
                    'jenis_sampah' => $jenisList[array_rand($jenisList)],
                    'tinggi_tong_cm' => $tinggi,
                    'persentase_kepenuhan' => $persen,
                    'last_sensor_at' => rand(0, 1) ? now()->subMinutes(rand(1, 30)) : null,
                    'status' => $status,
                    // Koordinat dummy di sekitar titik kampusnya masing-masing
                    'latitude' => -6.374672 + $latOffset + ($unitInKampus * 0.0004) + ($j * 0.0001),
                    'longitude' => 106.924831 + $lngOffset + ($unitInKampus * 0.0004) + ($j * 0.0001),
                    'keterangan' => 'Tong sampah otomatis terdata',
                ]);
            }
        }

        // =========================================================
        // SEEDER MODUL BARU (IoT, Sensor, Jadwal, Laporan Publik)
        // =========================================================
        $this->call([
            IotDeviceSeeder::class,
            SensorLogSeeder::class,
            PickupScheduleSeeder::class,
            PublicReportSeeder::class,
            MonthlyReportDemoSeeder::class,
        ]);
    }
}
