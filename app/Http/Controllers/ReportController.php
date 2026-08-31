<?php

namespace App\Http\Controllers;

use App\Models\{PublicReport, Report, Activity, TrashHistory};
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Report::with('user', 'unit')->latest();

        if ($user->isScopedToUnit()) {
            $query->where('unit_id', $user->unit_id);
        }

        if ($request->filled('tipe') && in_array($request->tipe, ['harian', 'mingguan', 'bulanan'])) {
            $query->where('tipe', $request->tipe);
        }

        if ($request->filled('unit_id') && !$user->isScopedToUnit()) {
            $query->where('unit_id', $request->unit_id);
        }

        $summary = [
            'total_tong_penuh' => (clone $query)->sum('total_tong_penuh'),
            'total_pengangkutan' => (clone $query)->sum('total_pengangkutan'),
            'total_aduan' => (clone $query)->sum('total_aduan'),
            'total_laporan' => (clone $query)->count(),
        ];

        $selectedUnitId = $user->isScopedToUnit()
            ? $user->unit_id
            : ($request->filled('unit_id') ? (int) $request->unit_id : null);

        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfDay();

        $monthHistoryScope = TrashHistory::whereBetween('tanggal', [$monthStart, $monthEnd]);
        $monthComplaintScope = PublicReport::whereBetween('created_at', [$monthStart, $monthEnd]);
        $monthReportScope = Report::whereBetween('periode_selesai', [$monthStart, $monthEnd]);

        if ($selectedUnitId) {
            $monthHistoryScope->whereHas('trashBin', fn ($trashBin) => $trashBin->where('unit_id', $selectedUnitId));
            $monthComplaintScope->whereHas('trashBin', fn ($trashBin) => $trashBin->where('unit_id', $selectedUnitId));
            $monthReportScope->where('unit_id', $selectedUnitId);
        }

        if ($request->filled('tipe') && in_array($request->tipe, ['harian', 'mingguan', 'bulanan'])) {
            $monthReportScope->where('tipe', $request->tipe);
        }

        $monthlyTongPenuhByDate = (clone $monthHistoryScope)
            ->selectRaw('DATE(tanggal) as date, COUNT(*) as count')
            ->where('status_sebelum', 'penuh')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $monthlyPengangkutanByDate = (clone $monthHistoryScope)
            ->selectRaw('DATE(tanggal) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $monthlyAduanByDate = (clone $monthComplaintScope)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $monthlyReportsByDate = (clone $monthReportScope)
            ->selectRaw('DATE(periode_selesai) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $monthTrend = collect(CarbonPeriod::create($monthStart->copy(), $monthEnd->copy()))
            ->map(function ($date) use (
                $monthlyTongPenuhByDate,
                $monthlyPengangkutanByDate,
                $monthlyAduanByDate,
                $monthlyReportsByDate
            ) {
                $key = $date->format('Y-m-d');

                return [
                    'label' => $date->format('d/m'),
                    'date' => $key,
                    'tong_penuh' => (int) ($monthlyTongPenuhByDate[$key] ?? 0),
                    'pengangkutan' => (int) ($monthlyPengangkutanByDate[$key] ?? 0),
                    'aduan' => (int) ($monthlyAduanByDate[$key] ?? 0),
                    'laporan' => (int) ($monthlyReportsByDate[$key] ?? 0),
                ];
            })
            ->values();

        $monthSummary = [
            'total_tong_penuh' => (clone $monthHistoryScope)->where('status_sebelum', 'penuh')->count(),
            'total_pengangkutan' => (clone $monthHistoryScope)->count(),
            'total_aduan' => (clone $monthComplaintScope)->count(),
            'total_laporan' => (clone $monthReportScope)->count(),
        ];

        $chartData = [
            'metric_breakdown' => [
                ['label' => 'Tong Penuh', 'value' => (int) $monthSummary['total_tong_penuh']],
                ['label' => 'Pengangkutan', 'value' => (int) $monthSummary['total_pengangkutan']],
                ['label' => 'Aduan', 'value' => (int) $monthSummary['total_aduan']],
                ['label' => 'Laporan', 'value' => (int) $monthSummary['total_laporan']],
            ],
            'type_breakdown' => collect(['harian', 'mingguan', 'bulanan'])
                ->map(fn ($type) => [
                    'type' => $type,
                    'label' => ucfirst($type),
                    'total' => (clone $monthReportScope)->where('tipe', $type)->count(),
                ])
                ->values(),
            'month_summary' => $monthSummary,
            'month_label' => $monthStart->translatedFormat('F Y'),
            'trend' => $monthTrend,
        ];

        $reports = $query->paginate(15)->appends($request->only(['tipe', 'unit_id']));

        $units = $user->isScopedToUnit()
            ? \App\Models\Unit::where('id', $user->unit_id)->get()
            : \App\Models\Unit::orderBy('nama')->get();

        return Inertia::render('Reports/Index', [
            'reports' => $reports,
            'summary' => $summary,
            'chartData' => $chartData,
            'filters' => $request->only(['tipe', 'unit_id']),
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->isAdminUnit()) {
            $request->merge(['unit_id' => $user->unit_id]);
        }

        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['harian', 'mingguan', 'bulanan'])],
            'unit_id' => 'nullable|exists:units,id',
            'periode_mulai' => 'required|date',
            'periode_selesai' => 'required|date|after_or_equal:periode_mulai',
            'isi' => 'nullable|string|max:10000',
        ]);

        $validated['user_id'] = $user->id;
        $validated = array_merge($validated, $this->calculateMetrics($validated));

        $report = Report::create($validated);

        Activity::create([
            'user_id' => $request->user()->id,
            'tipe' => 'laporan',
            'deskripsi' => 'Membuat laporan: ' . $report->judul,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil dibuat.');
    }

    public function show(Request $request, Report $report)
    {
        $this->authorizeReportAccess($request, $report);

        return Inertia::render('Reports/Show', [
            'report' => $report->load('user', 'unit'),
        ]);
    }

    public function update(Request $request, Report $report)
    {
        $this->authorizeReportAccess($request, $report, write: true);
        $user = $request->user();

        if ($user->isAdminUnit()) {
            $request->merge(['unit_id' => $user->unit_id]);
        }

        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['harian', 'mingguan', 'bulanan'])],
            'unit_id' => 'nullable|exists:units,id',
            'periode_mulai' => 'required|date',
            'periode_selesai' => 'required|date|after_or_equal:periode_mulai',
            'isi' => 'nullable|string|max:10000',
        ]);

        $validated = array_merge($validated, $this->calculateMetrics($validated));

        $report->update($validated);

        Activity::create([
            'user_id' => $request->user()->id,
            'tipe' => 'laporan',
            'deskripsi' => 'Memperbarui laporan: ' . $report->judul,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil diperbarui.');
    }

    public function destroy(Request $request, Report $report)
    {
        $this->authorizeReportAccess($request, $report, write: true);

        $judul = $report->judul;

        $report->delete();

        Activity::create([
            'user_id' => request()->user()->id,
            'tipe' => 'laporan',
            'deskripsi' => 'Menghapus laporan: ' . $judul,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil dihapus.');
    }

    public function exportPdf(Request $request, Report $report)
    {
        $this->authorizeReportAccess($request, $report);

        $report->load('user', 'unit');

        $pdf = Pdf::loadView('reports.pdf', [
            'report' => $report,
        ]);

        return $pdf->download('laporan-' . $report->id . '.pdf');
    }

    public function exportCsv(Request $request, Report $report): StreamedResponse
    {
        $this->authorizeReportAccess($request, $report);

        $report->load('user', 'unit');

        return response()->streamDownload(function () use ($report): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Kolom', 'Nilai']);
            fputcsv($handle, ['Judul', $this->csvCell($report->judul)]);
            fputcsv($handle, ['Tipe', $report->tipe]);
            fputcsv($handle, ['Unit', $this->csvCell($report->unit?->nama ?? 'Semua Unit')]);
            fputcsv($handle, ['Periode Mulai', optional($report->periode_mulai)->format('Y-m-d')]);
            fputcsv($handle, ['Periode Selesai', optional($report->periode_selesai)->format('Y-m-d')]);
            fputcsv($handle, ['Total Tong Penuh', $report->total_tong_penuh]);
            fputcsv($handle, ['Total Pengangkutan', $report->total_pengangkutan]);
            fputcsv($handle, ['Total Aduan', $report->total_aduan]);
            fputcsv($handle, ['Isi', $this->csvCell($report->isi ?? '')]);

            fclose($handle);
        }, 'laporan-' . $report->id . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function csvCell(?string $value): string
    {
        $value = (string) $value;

        return preg_match('/^\s*[=+\-@]/', $value) === 1
            ? "'" . $value
            : $value;
    }

    private function authorizeReportAccess(Request $request, Report $report, bool $write = false): void
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        if (! $write && $user->isKepalaPusat()) {
            return;
        }

        if ($user->isScopedToUnit() && $report->unit_id === $user->unit_id) {
            if ($write && ! $user->isAdminUnit()) {
                abort(403, 'Akun Kepala hanya memiliki akses lihat (read-only).');
            }

            return;
        }

        abort(403, $write ? 'Laporan ini berada di luar unit Anda.' : 'Anda tidak memiliki akses ke laporan ini.');
    }

    private function calculateMetrics(array $validated): array
    {
        $periodeMulai = Carbon::parse($validated['periode_mulai'])->startOfDay();
        $periodeSelesai = Carbon::parse($validated['periode_selesai'])->endOfDay();

        $historyScope = TrashHistory::whereBetween('tanggal', [$periodeMulai, $periodeSelesai]);
        $complaintScope = PublicReport::whereBetween('created_at', [$periodeMulai, $periodeSelesai]);

        if (! empty($validated['unit_id'])) {
            $historyScope->whereHas('trashBin', fn ($q) => $q->where('unit_id', $validated['unit_id']));
            $complaintScope->whereHas('trashBin', fn ($trashBin) => $trashBin->where('unit_id', $validated['unit_id']));
        }

        return [
            'total_tong_penuh' => (clone $historyScope)
                ->where('status_sebelum', 'penuh')
                ->count(),
            'total_pengangkutan' => $historyScope->count(),
            'total_aduan' => $complaintScope->count(),
        ];
    }
}
