<?php

namespace App\Http\Controllers;

use App\Models\{Activity, PublicReport, SipesaNotification, TrashBin};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PublicReportController extends Controller
{
    public function create(TrashBin $trashBin)
    {
        return Inertia::render('PublicReports/Create', [
            'trashBin' => $trashBin->load('unit'),
            'jenisMasalahLabels' => PublicReport::getJenisMasalahLabels(),
            'statusOptions' => [
                ['value' => 'penuh', 'label' => 'Penuh'],
                ['value' => 'setengah_penuh', 'label' => 'Setengah penuh'],
                ['value' => 'kosong', 'label' => 'Belum penuh / kosong'],
            ],
        ]);
    }

    public function store(Request $request, TrashBin $trashBin)
    {
        $validated = $request->validate([
            'status_tong' => ['required', Rule::in(['kosong', 'setengah_penuh', 'penuh'])],
            'jenis_masalah' => ['nullable', Rule::in(array_keys(PublicReport::getJenisMasalahLabels()))],
            'nama_pelapor' => ['nullable', 'string', 'max:100'],
            'deskripsi' => ['nullable', 'string', 'max:300'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
        ]);

        $statusTong = $validated['status_tong'];
        $jenisMasalah = $statusTong === 'penuh'
            ? 'penuh'
            : ($validated['jenis_masalah'] ?: 'lainnya');

        $ipAddress = $request->ip() ?: '0.0.0.0';
        $duplicate = $jenisMasalah === 'penuh'
            ? PublicReport::findDuplicate($ipAddress, $trashBin->id, $jenisMasalah)
            : null;

        if ($duplicate) {
            return redirect()
                ->route('public-reports.create', ['trashBin' => $trashBin->kode])
                ->with('success', 'Laporan serupa sudah diterima. Nomor tiket: ' . $duplicate->nomor_tiket);
        }

        $report = DB::transaction(function () use ($request, $trashBin, $validated, $statusTong, $jenisMasalah, $ipAddress) {
            $fotoPath = null;
            if ($request->hasFile('foto')) {
                $fotoPath = $request->file('foto')->store('laporan', 'public');
            }

            $description = trim((string) ($validated['deskripsi'] ?? ''));
            $statusLabel = match ($statusTong) {
                'penuh' => 'Penuh',
                'setengah_penuh' => 'Setengah penuh',
                default => 'Belum penuh / kosong',
            };

            $report = PublicReport::create([
                'nomor_tiket' => PublicReport::generateNomorTiket(),
                'trash_bin_id' => $trashBin->id,
                'jenis_masalah' => $jenisMasalah,
                'nama_pelapor' => $validated['nama_pelapor'] ?? null,
                'deskripsi' => trim("Kondisi tong: {$statusLabel}. {$description}"),
                'foto' => $fotoPath,
                'status' => 'menunggu',
                'ip_address' => $ipAddress,
                'user_agent' => (string) $request->userAgent(),
            ]);

            $trashBin->update(['status' => $statusTong]);

            Activity::create([
                'user_id' => null,
                'tipe' => 'laporan_warga',
                'deskripsi' => 'Laporan QR ' . $report->nomor_tiket . ' untuk tong ' . $trashBin->kode,
                'data' => [
                    'trash_bin_id' => $trashBin->id,
                    'public_report_id' => $report->id,
                    'status_tong' => $statusTong,
                ],
            ]);

            SipesaNotification::create([
                'judul' => 'Laporan warga baru',
                'pesan' => 'Tong ' . $trashBin->kode . ' dilaporkan ' . strtolower($statusLabel) . ' melalui QR.',
                'tipe' => 'laporan_baru',
                'trash_bin_id' => $trashBin->id,
                'public_report_id' => $report->id,
                'action_url' => route('admin.trash-bins.index', ['search' => $trashBin->kode]),
            ]);

            return $report;
        });

        return redirect()
            ->route('public-reports.create', ['trashBin' => $trashBin->kode])
            ->with('success', 'Laporan berhasil dikirim. Nomor tiket: ' . $report->nomor_tiket)
            ->with('foto_url', $report->foto_url);
    }

    public function index(Request $request)
    {
        $query = PublicReport::with('trashBin.unit')->latest();

        if ($request->user()->isScopedToUnit()) {
            $query->whereHas('trashBin', fn ($trashBin) => $trashBin->where('unit_id', $request->user()->unit_id));
        }

        if ($request->filled('status') && in_array($request->status, ['menunggu', 'diproses', 'selesai', 'ditolak'])) {
            $query->where('status', $request->status);
        }

        return Inertia::render('Admin/PublicReports/Index', [
            'reports' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only(['status']),
        ]);
    }

    public function tanggapi(Request $request, PublicReport $publicReport)
    {
        // Kepala (read-only) sudah ditolak middleware viewer untuk method non-GET.
        $this->ensureWithinUnit($request, $publicReport);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['diproses', 'selesai', 'ditolak'])],
            'catatan_admin' => ['required', 'string', 'max:1000'],
        ]);

        $publicReport->update([
            'status' => $validated['status'],
            'catatan_admin' => $validated['catatan_admin'],
            'ditangani_oleh' => $request->user()->id,
            'ditangani_pada' => now(),
        ]);

        Activity::create([
            'user_id' => $request->user()->id,
            'tipe' => 'laporan_warga',
            'deskripsi' => 'Menanggapi laporan ' . $publicReport->nomor_tiket,
            'data' => [
                'public_report_id' => $publicReport->id,
                'status' => $validated['status'],
            ],
        ]);

        return redirect()->back()->with('success', 'Laporan ' . $publicReport->nomor_tiket . ' berhasil ditanggapi.');
    }

    public function destroy(Request $request, PublicReport $publicReport)
    {
        $this->ensureWithinUnit($request, $publicReport);

        if ($publicReport->foto) {
            Storage::disk('public')->delete($publicReport->foto);
        }

        $nomorTiket = $publicReport->nomor_tiket;
        $publicReport->delete();

        Activity::create([
            'user_id' => $request->user()->id,
            'tipe' => 'laporan_warga',
            'deskripsi' => 'Menghapus laporan ' . $nomorTiket,
        ]);

        return redirect()->back()->with('success', 'Laporan ' . $nomorTiket . ' berhasil dihapus.');
    }

    /**
     * Admin unit / kepala hanya boleh menangani laporan di unitnya sendiri.
     */
    private function ensureWithinUnit(Request $request, PublicReport $publicReport): void
    {
        $user = $request->user();

        if ($user->isScopedToUnit() && $publicReport->trashBin?->unit_id !== $user->unit_id) {
            abort(403, 'Laporan ini berada di luar unit Anda.');
        }
    }
}
