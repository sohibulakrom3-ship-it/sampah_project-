<?php

namespace App\Http\Controllers;

use App\Models\{Activity, PublicReport, Report, TrashBin, TrashHistory, Unit, User};
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return match (true) {
            $user->isSuperAdmin() => $this->superAdminDashboard(),
            $user->isAdminUnit() => $this->adminUnitDashboard($user),
            $user->isKepalaPusat() => $this->superAdminDashboard(),
            $user->isKepalaUnit() => $this->adminUnitDashboard($user),
            $user->isPetugas() => $this->petugasDashboard($user),
            $user->isSiswa() => $this->siswaDashboard($user),
            default => redirect()->route('login'),
        };
    }

    private function superAdminDashboard(): \Inertia\Response
    {
        $totalUnits = Unit::count();
        $totalTrashBins = TrashBin::count();
        $totalUsers = User::count();
        $totalAduanPending = PublicReport::where('status', 'menunggu')->count();
        $totalDiangkutHariIni = TrashHistory::whereDate('tanggal', today())->count();
        $totalReports = Report::count();

        return Inertia::render('Dashboard/SuperAdmin', [
            'totalUnits' => $totalUnits,
            'totalUnit' => $totalUnits,
            'totalTrashBins' => $totalTrashBins,
            'totalTongSampah' => $totalTrashBins,
            'totalUsers' => $totalUsers,
            'totalPengguna' => $totalUsers,
            'totalPenuh' => TrashBin::where('status', 'penuh')->count(),
            'totalDiangkutHariIni' => $totalDiangkutHariIni,
            'pengangkutanHariIni' => $totalDiangkutHariIni,
            'totalAduanPending' => $totalAduanPending,
            'totalAduanMenunggu' => $totalAduanPending,
            'totalReports' => $totalReports,
            'tongPerUnit' => Unit::withCount(['trashBins', 'trashBins as penuh_count' => fn($q) => $q->where('status', 'penuh')])
                ->get()
                ->map(fn($u) => [
                    'unit' => $u->nama,
                    'nama' => $u->nama,
                    'total_tong' => $u->trash_bins_count,
                    'total' => $u->trash_bins_count,
                    'penuh' => $u->penuh_count,
                ]),
            'aktivitasTerbaru' => Activity::with('user')->latest()->take(10)->get(),
            'aduanTerbaru' => PublicReport::with('trashBin.unit')->latest()->take(5)->get(),
            'tongPenuh' => TrashBin::with('unit')->where('status', 'penuh')->latest()->take(5)->get(),
            'trenPengangkutan' => TrashHistory::selectRaw('DATE(tanggal) as date, COUNT(*) as count')
                ->whereDate('tanggal', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn ($item) => [
                    'date' => $item->date,
                    'count' => (int) $item->count,
                    'tanggal' => $item->date,
                    'jumlah' => (int) $item->count,
                ]),
        ]);
    }

    private function adminUnitDashboard(User $user): \Inertia\Response
    {
        $pendingReports = PublicReport::whereHas('trashBin', fn ($trashBin) => $trashBin->where('unit_id', $user->unit_id));
        $unitReports = Report::where('unit_id', $user->unit_id);

        return Inertia::render('Dashboard/AdminUnit', [
            'totalUnits' => Unit::where('id', $user->unit_id)->count(),
            'totalTrashBins' => TrashBin::where('unit_id', $user->unit_id)->count(),
            'totalUsers' => User::where('unit_id', $user->unit_id)->count(),
            'totalPetugas' => User::whereHas('role', fn ($role) => $role->where('name', 'petugas'))->count(),
            'totalReports' => (clone $unitReports)->count(),
            'totalPenuh' => TrashBin::where('unit_id', $user->unit_id)->where('status', 'penuh')->count(),
            'totalDiangkutHariIni' => TrashHistory::whereHas('trashBin', fn($q) => $q->where('unit_id', $user->unit_id))
                ->whereDate('tanggal', today())->count(),
            'totalAduanPending' => (clone $pendingReports)->where('status', 'menunggu')->count(),
            'tongPerUnit' => Unit::where('id', $user->unit_id)
                ->withCount(['trashBins', 'trashBins as penuh_count' => fn($q) => $q->where('status', 'penuh')])
                ->get()
                ->map(fn($u) => [
                    'unit' => $u->nama,
                    'nama' => $u->nama,
                    'total_tong' => $u->trash_bins_count,
                    'total' => $u->trash_bins_count,
                    'penuh' => $u->penuh_count,
                ]),
            'aktivitasTerbaru' => Activity::whereHas('user', fn($q) => $q->where('unit_id', $user->unit_id))
                ->with('user')->latest()->take(10)->get(),
            'aduanTerbaru' => (clone $pendingReports)
                ->with('trashBin.unit')
                ->latest()->take(5)->get(),
            'tongPenuh' => TrashBin::with('unit')
                ->where('unit_id', $user->unit_id)
                ->where('status', 'penuh')
                ->latest()->take(5)->get(),
            'trenPengangkutan' => TrashHistory::selectRaw('DATE(tanggal) as date, COUNT(*) as count')
                ->whereHas('trashBin', fn($q) => $q->where('unit_id', $user->unit_id))
                ->whereDate('tanggal', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn ($item) => [
                    'date' => $item->date,
                    'count' => (int) $item->count,
                    'tanggal' => $item->date,
                    'jumlah' => (int) $item->count,
                ]),
        ]);
    }

    private function petugasDashboard(User $user): \Inertia\Response
    {
        return Inertia::render('Dashboard/Petugas', [
            'tongPenuh' => TrashBin::with('unit')
                ->where('unit_id', $user->unit_id)
                ->whereIn('status', ['penuh', 'setengah_penuh'])
                ->orderByRaw("CASE WHEN status = 'penuh' THEN 0 ELSE 1 END")
                ->take(10)
                ->get(),
            'riwayatHariIni' => TrashHistory::with('trashBin.unit')
                ->where('user_id', $user->id)
                ->whereDate('tanggal', today())
                ->latest()
                ->get(),
            'totalDiangkutHariIni' => TrashHistory::where('user_id', $user->id)
                ->whereDate('tanggal', today())
                ->count(),
            'jadwalHariIni' => [],
        ]);
    }

    private function siswaDashboard(User $user): \Inertia\Response
    {
        $tongSekitar = TrashBin::with('unit')
            ->when($user->unit_id !== null, fn ($q) => $q->where('unit_id', $user->unit_id))
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Dashboard/Siswa', [
            'tongSekitar' => $tongSekitar,
            // Laporan publik (QR) tidak terkait akun; siswa hanya bisa melapor
            // lewat QR tanpa login, jadi tidak ada "aduansaya".
            'aduanSaya' => [],
            'totalAduanSaya' => [],
            'edukasiList' => [],
        ]);
    }
}
