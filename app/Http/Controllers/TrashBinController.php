<?php

namespace App\Http\Controllers;

use App\Models\{TrashBin, Unit, Activity};
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TrashBinController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = TrashBin::with('unit');

        if ($this->mustStayInOwnUnit($user)) {
            $query->where('unit_id', $user->unit_id);
        }

        $query->when($request->unit_id, fn ($q) => $q->where('unit_id', $request->unit_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->jenis_sampah, fn ($q) => $q->where('jenis_sampah', $request->jenis_sampah))
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('kode', 'like', "%{$request->search}%")
                    ->orWhere('nama', 'like', "%{$request->search}%")
                    ->orWhere('lokasi', 'like', "%{$request->search}%");
            }));

        $units = $this->mustStayInOwnUnit($user)
            ? Unit::where('id', $user->unit_id)->get()
            : Unit::orderBy('nama')->get();

        return Inertia::render('TrashBins/Index', [
            'trashBins' => $query->orderBy('nama')->paginate(12),
            'filters' => $request->only(['unit_id', 'status', 'jenis_sampah', 'search']),
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $rules = [
            'kode' => 'required|string|max:255|unique:trash_bins,kode',
            'nama' => 'required|string|max:255',
            'unit_id' => 'required|exists:units,id',
            'lokasi' => 'required|string|max:255',
            'jenis_sampah' => ['required', Rule::in(['organik', 'anorganik'])],
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'keterangan' => 'nullable|string',
        ];

        if ($user->isAdminUnit()) {
            $request->merge(['unit_id' => $user->unit_id]);
            unset($rules['unit_id']);
        }

        $validated = $request->validate($rules);

        if ($user->isAdminUnit()) {
            $validated['unit_id'] = $user->unit_id;
        }

        $trashBin = TrashBin::create($validated);

        $this->logActivity('trash_bin', 'Menambahkan tempat sampah ' . $trashBin->nama);

        return redirect()->back()->with('success', 'Tempat sampah berhasil ditambahkan');
    }

    public function update(Request $request, TrashBin $trashBin)
    {
        $user = $request->user();

        if ($user->isAdminUnit() && $trashBin->unit_id !== $user->unit_id) {
            abort(403, 'Anda tidak memiliki akses ke tong sampah ini.');
        }

        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:255', Rule::unique('trash_bins', 'kode')->ignore($trashBin->id)],
            'nama' => 'required|string|max:255',
            'unit_id' => 'required|exists:units,id',
            'lokasi' => 'required|string|max:255',
            'jenis_sampah' => ['required', Rule::in(['organik', 'anorganik'])],
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'keterangan' => 'nullable|string',
        ]);

        if ($user->isAdminUnit()) {
            $validated['unit_id'] = $user->unit_id;
        }

        $trashBin->update($validated);

        $this->logActivity('trash_bin', 'Memperbarui tempat sampah ' . $trashBin->nama);

        return redirect()->back()->with('success', 'Tempat sampah berhasil diperbarui');
    }

    public function destroy(TrashBin $trashBin)
    {
        $user = auth()->user();

        if ($user->isAdminUnit() && $trashBin->unit_id !== $user->unit_id) {
            abort(403, 'Anda tidak memiliki akses ke tong sampah ini.');
        }

        $this->logActivity('trash_bin', 'Menghapus tempat sampah ' . $trashBin->nama);

        $trashBin->delete();

        return redirect()->back()->with('success', 'Tempat sampah berhasil dihapus');
    }

    public function updateStatus(Request $request, TrashBin $trashBin)
    {
        $user = $request->user();

        // unit_id bisa jadi null bila unit petugas dihapus (onDelete set null).
        // Perlakukan null sebagai "tidak cocok" agar tidak lolos jadi akses global.
        if (
            ! $user->isSuperAdmin()
            && ($user->isScopedToUnit() || $user->isPetugas())
            && $trashBin->unit_id !== $user->unit_id
        ) {
            abort(403, 'Anda tidak memiliki akses ke tong sampah ini.');
        }

        $validated = $request->validate([
            'status' => 'required|in:kosong,setengah_penuh,penuh,sudah_diangkut',
        ]);

        $trashBin->update(['status' => $validated['status']]);

        $this->logActivity('trash_bin', 'Memperbarui status tempat sampah ' . $trashBin->nama . ' menjadi ' . $validated['status']);

        return redirect()->back()->with('success', 'Status tempat sampah berhasil diperbarui');
    }

    public function barcode(Request $request, TrashBin $trashBin)
    {
        $user = $request->user();

        if ($user->isAdminUnit() && $trashBin->unit_id !== $user->unit_id) {
            abort(403, 'Anda tidak memiliki akses ke tong sampah ini.');
        }

        return Inertia::render('TrashBins/Barcode', [
            'trashBin' => $trashBin->load('unit'),
            'reportUrl' => route('public-reports.create', ['trashBin' => $trashBin->kode]),
        ]);
    }

    public function monitor(Request $request)
    {
        $user = $request->user();

        if ($this->mustStayInOwnUnit($user)) {
            $units = Unit::with(['trashBins' => function ($q) {
                $q->orderBy('nama');
            }])->where('id', $user->unit_id)->get();
        } else {
            $units = Unit::with('trashBins')->orderBy('nama')->get();
        }

        return Inertia::render('TrashBins/Monitor', [
            'units' => $units,
        ]);
    }

    private function logActivity(string $tipe, string $deskripsi, array $data = []): void
    {
        Activity::create([
            'user_id' => auth()->id(),
            'tipe' => $tipe,
            'deskripsi' => $deskripsi,
            'data' => $data,
        ]);
    }

    private function mustStayInOwnUnit($user): bool
    {
        return $user->isScopedToUnit() || $user->isSiswa() || $user->isPetugas();
    }
}
