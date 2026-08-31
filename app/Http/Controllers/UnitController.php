<?php

namespace App\Http\Controllers;

use App\Models\{Unit, Activity};
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index()
    {
        return Inertia::render('Units/Index', [
            'units' => Unit::withCount(['users', 'trashBins'])
                ->orderBy('nama')
                ->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'kampus' => 'nullable|string|max:255',
            'jenis' => 'required|string|max:255',
            'alamat' => 'nullable|string',
        ]);

        $unit = Unit::create($validated);

        $this->logActivity('unit', 'Menambahkan unit ' . $unit->nama);

        return redirect()->back()->with('success', 'Unit berhasil ditambahkan');
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'kampus' => 'nullable|string|max:255',
            'jenis' => 'required|string|max:255',
            'alamat' => 'nullable|string',
        ]);

        $unit->update($validated);

        $this->logActivity('unit', 'Memperbarui unit ' . $unit->nama);

        return redirect()->back()->with('success', 'Unit berhasil diperbarui');
    }

    public function destroy(Unit $unit)
    {
        $this->logActivity('unit', 'Menghapus unit ' . $unit->nama);

        $unit->delete();

        return redirect()->back()->with('success', 'Unit berhasil dihapus');
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
}
