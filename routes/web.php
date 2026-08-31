<?php

use App\Http\Controllers\{
    DashboardController,
    ProfileController,
    PublicReportController,
    ReportController,
    TrashBinController,
    TrashHistoryController,
    UnitController,
    UserController,
};
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/lapor/{trashBin:kode}', [PublicReportController::class, 'create'])->name('public-reports.create');
Route::post('/lapor/{trashBin:kode}', [PublicReportController::class, 'store'])->name('public-reports.store');

Route::get('/scanner', function () {
    return Inertia::render('Scanner');
})->name('scanner');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Super Admin - Unit Management
Route::middleware(['auth', 'verified', 'super_admin'])
    ->prefix('super-admin')
    ->name('super-admin.')
    ->group(function () {
        Route::get('/units', [UnitController::class, 'index'])->name('units.index');
        Route::post('/units', [UnitController::class, 'store'])->name('units.store');
        Route::put('/units/{unit}', [UnitController::class, 'update'])->name('units.update');
        Route::delete('/units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');
    });

// Management Panel (admin write access + kepala read-only access)
Route::middleware(['auth', 'verified', 'viewer'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Trash Bins
        Route::get('/trash-bins', [TrashBinController::class, 'index'])->name('trash-bins.index');
        Route::post('/trash-bins', [TrashBinController::class, 'store'])->name('trash-bins.store');
        Route::get('/trash-bins/{trashBin}/barcode', [TrashBinController::class, 'barcode'])->name('trash-bins.barcode');
        Route::put('/trash-bins/{trashBin}', [TrashBinController::class, 'update'])->name('trash-bins.update');
        Route::delete('/trash-bins/{trashBin}', [TrashBinController::class, 'destroy'])->name('trash-bins.destroy');
        Route::put('/trash-bins/{trashBin}/status', [TrashBinController::class, 'updateStatus'])->name('trash-bins.status');

        // Trash Histories
        Route::get('/trash-histories', [TrashHistoryController::class, 'index'])->name('trash-histories.index');
        Route::post('/trash-histories', [TrashHistoryController::class, 'store'])->name('trash-histories.store');
        Route::get('/trash-histories/{trashHistory}', [TrashHistoryController::class, 'show'])->name('trash-histories.show');
        Route::delete('/trash-histories/{trashHistory}', [TrashHistoryController::class, 'destroy'])->name('trash-histories.destroy');

        // Complaints — data Laporan Warga (QR publik); aduan login sudah dinonaktifkan.
        // Nama route & URL tetap agar menu "Aduan" dan tautan lain tidak berubah.
        Route::get('/complaints', [PublicReportController::class, 'index'])->name('complaints.index');
        Route::put('/complaints/{publicReport}/tanggapi', [PublicReportController::class, 'tanggapi'])->name('complaints.tanggapi');
        Route::delete('/complaints/{publicReport}', [PublicReportController::class, 'destroy'])->name('complaints.destroy');

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
        Route::get('/reports/{report}', [ReportController::class, 'show'])->name('reports.show');
        Route::put('/reports/{report}', [ReportController::class, 'update'])->name('reports.update');
        Route::delete('/reports/{report}', [ReportController::class, 'destroy'])->name('reports.destroy');
        Route::get('/reports/{report}/pdf', [ReportController::class, 'exportPdf'])->name('reports.pdf');
        Route::get('/reports/{report}/csv', [ReportController::class, 'exportCsv'])->name('reports.csv');

        // Users
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Monitoring
        Route::get('/monitoring', [TrashBinController::class, 'monitor'])->name('monitoring');
    });

// Petugas
Route::middleware(['auth', 'verified', 'role:petugas,super_admin'])
    ->prefix('petugas')
    ->name('petugas.')
    ->group(function () {
        Route::get('/pengangkutan', [TrashHistoryController::class, 'index'])->name('pengangkutan.index');
        Route::post('/pengangkutan', [TrashHistoryController::class, 'store'])->name('pengangkutan.store');
        Route::delete('/pengangkutan/{trashHistory}', [TrashHistoryController::class, 'destroy'])->name('pengangkutan.destroy');

        // Status tong update
        Route::put('/tong/{trashBin}/status', [TrashBinController::class, 'updateStatus'])->name('tong.status');

        // Monitoring
        Route::get('/monitoring', [TrashBinController::class, 'monitor'])->name('monitoring');
    });

// Warga/siswa tidak lagi memakai monitoring atau aduan login.
// Laporan warga masuk dari QR publik per tong: /lapor/{kode-tong}.
Route::middleware(['auth', 'verified', 'role:siswa'])
    ->prefix('siswa')
    ->name('siswa.')
    ->group(function () {
        Route::get('/monitoring', fn () => abort(403, 'Monitoring hanya untuk admin dan petugas.'))->name('monitoring');
    });

require __DIR__.'/auth.php';
