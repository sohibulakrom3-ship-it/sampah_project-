import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

const statusFilterTabs = ['semua', 'menunggu', 'diproses', 'selesai', 'ditolak'];

const statusLabels = {
    menunggu: 'Menunggu',
    diproses: 'Diproses',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
};

const jenisLabels = {
    penuh: 'Tong Penuh',
    rusak: 'Tong Rusak',
    bau: 'Bau Menyengat',
    hama: 'Hama/Serangga',
    pemilahan: 'Salah Pemilahan',
    lainnya: 'Lainnya',
};

export default function Index({ reports, filters }) {
    const [responseModalOpen, setResponseModalOpen] = useState(false);
    const [responseItem, setResponseItem] = useState(null);
    const [showCatatanId, setShowCatatanId] = useState(null);

    const responseForm = useForm({
        status: 'diproses',
        catatan_admin: '',
    });

    const setFilter = (status) => {
        router.get(
            route('admin.complaints.index'),
            status === 'semua' ? {} : { status },
            { preserveState: true, replace: true }
        );
    };

    const openResponse = (item) => {
        responseForm.clearErrors();
        setResponseItem(item);
        responseForm.setData({
            status: ['diproses', 'selesai', 'ditolak'].includes(item.status) ? item.status : 'diproses',
            catatan_admin: item.catatan_admin || '',
        });
        setResponseModalOpen(true);
    };

    const handleResponse = (e) => {
        e.preventDefault();
        responseForm.put(route('admin.complaints.tanggapi', responseItem.id), {
            onSuccess: () => {
                setResponseModalOpen(false);
                responseForm.reset();
            },
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Hapus laporan?',
            text: 'Tindakan ini tidak dapat dibatalkan',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.complaints.destroy', id));
            }
        });
    };

    const formatDate = (value) => {
        try {
            return new Date(value).toLocaleString('id-ID');
        } catch {
            return value || '-';
        }
    };

    return (
        <AppLayout header="Data Aduan">
            <Head title="Aduan" />

            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-earth-heading">Aduan (Laporan Publik)</h1>
                    <p className="mt-1 text-sm text-muted-earth">
                        Laporan warga yang dikirim lewat scan QR pada tong sampah. Bukti foto dapat digunakan
                        untuk verifikasi.
                    </p>
                </div>

                <div className="overflow-hidden rounded-lg border border-cloud-ash bg-white">
                    {/* Status filter tabs */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-cloud-ash px-5 py-3">
                        {statusFilterTabs.map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition capitalize ${
                                    (filters?.status || 'semua') === s
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-river-stone text-muted-earth hover:bg-[#e5e7eb]'
                                }`}
                            >
                                {s === 'semua' ? 'Semua' : statusLabels[s] || s}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-cloud-ash text-sm">
                            <thead className="bg-cloud-ash/40 text-left text-xs uppercase tracking-wide text-muted-earth">
                                <tr>
                                    <th className="px-4 py-3">Tiket</th>
                                    <th className="px-4 py-3">Tong</th>
                                    <th className="px-4 py-3">Jenis</th>
                                    <th className="px-4 py-3">Pelapor</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Bukti</th>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cloud-ash">
                                {reports.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-muted-earth">
                                            Belum ada laporan warga.
                                        </td>
                                    </tr>
                                )}
                                {reports.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-cloud-ash/20">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-earth-heading">
                                            {r.nomor_tiket}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-earth-heading">{r.trash_bin?.kode}</div>
                                            <div className="text-xs text-muted-earth">
                                                {r.trash_bin?.unit?.nama || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-earth-heading">
                                            {jenisLabels[r.jenis_masalah] || r.jenis_masalah}
                                        </td>
                                        <td className="px-4 py-3 text-earth-heading">
                                            {r.nama_pelapor || <span className="text-muted-earth">Anonim</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={r.status} type="complaint" />
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.foto_url ? (
                                                <a href={r.foto_url} target="_blank" rel="noreferrer">
                                                    <img
                                                        src={r.foto_url}
                                                        alt="Bukti"
                                                        className="h-14 w-14 rounded-md border border-cloud-ash object-cover"
                                                    />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-earth">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-earth">
                                            {formatDate(r.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-3 text-xs font-medium">
                                                {r.catatan_admin && (
                                                    <button
                                                        onClick={() =>
                                                            setShowCatatanId(showCatatanId === r.id ? null : r.id)
                                                        }
                                                        className="text-[#6366f1] hover:text-[#4f46e5] transition"
                                                    >
                                                        {showCatatanId === r.id ? 'Sembunyikan' : 'Catatan'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openResponse(r)}
                                                    className="text-primary-600 hover:text-primary-700 transition"
                                                >
                                                    Tanggapi
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(r.id)}
                                                    className="text-earth-red hover:text-[#b91c1c] transition"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {showCatatanId && (
                        reports.data
                            .filter((r) => r.id === showCatatanId)
                            .map((r) => (
                                <div key={r.id} className="border-t border-cloud-ash bg-warm-chalk px-4 py-3">
                                    <p className="text-xs text-muted-earth">
                                        Catatan admin pada {r.nomor_tiket}: <span className="text-earth-heading">{r.catatan_admin}</span>
                                        {r.ditangani_oleh?.name && ` — oleh ${r.ditangani_oleh.name}`}
                                    </p>
                                </div>
                            ))
                    )}

                    <div className="border-t border-cloud-ash px-4 py-3">
                        <Pagination links={reports.links} />
                    </div>
                </div>
            </div>

            {/* Modal tanggapi */}
            <Modal show={responseModalOpen} onClose={() => setResponseModalOpen(false)} maxWidth="lg">
                <form onSubmit={handleResponse}>
                    <div className="border-b border-cloud-ash px-5 py-4">
                        <h3 className="text-sm font-semibold text-earth-heading">
                            Tanggapi Laporan {responseItem?.nomor_tiket || ''}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-earth/70">
                            {responseItem?.trash_bin?.kode
                                ? `Tong ${responseItem.trash_bin.kode} — ${responseItem.trash_bin?.unit?.nama || ''}`
                                : '-'}
                        </p>
                    </div>
                    <div className="space-y-4 px-5 py-4">
                        {/* Data pelapor */}
                        <div className="rounded-lg border border-cloud-ash bg-warm-chalk/50 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-earth">
                                Data Pelapor
                            </p>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-muted-earth">Nama</p>
                                    <p className="text-sm font-medium text-earth-heading">
                                        {responseItem?.nama_pelapor || <span className="text-muted-earth">Anonim</span>}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-earth">Jenis Masalah</p>
                                    <p className="text-sm font-medium text-earth-heading">
                                        {jenisLabels[responseItem?.jenis_masalah] || responseItem?.jenis_masalah || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-earth">Waktu Laporan</p>
                                    <p className="text-sm font-medium text-earth-heading">
                                        {formatDate(responseItem?.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-earth">IP Address</p>
                                    <p className="text-sm font-medium text-earth-heading">
                                        {responseItem?.ip_address || '-'}
                                    </p>
                                </div>
                            </div>
                            {responseItem?.deskripsi && (
                                <div className="mt-3">
                                    <p className="text-xs text-muted-earth">Deskripsi / Keluhan</p>
                                    <p className="mt-1 whitespace-pre-line text-sm text-earth-heading">
                                        {responseItem.deskripsi}
                                    </p>
                                </div>
                            )}
                            {responseItem?.user_agent && (
                                <div className="mt-3">
                                    <p className="text-xs text-muted-earth">Perangkat / Browser</p>
                                    <p className="mt-1 break-all font-mono text-xs text-earth-heading/80">
                                        {responseItem.user_agent}
                                    </p>
                                </div>
                            )}
                            {responseItem?.foto_url && (
                                <div className="mt-3">
                                    <p className="text-xs text-muted-earth">Bukti Foto</p>
                                    <a
                                        href={responseItem.foto_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 inline-block"
                                    >
                                        <img
                                            src={responseItem.foto_url}
                                            alt="Bukti"
                                            className="h-28 w-28 rounded-md border border-cloud-ash object-cover"
                                        />
                                    </a>
                                </div>
                            )}
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <select
                                id="status"
                                value={responseForm.data.status}
                                onChange={(e) => responseForm.setData('status', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-river-stone bg-white px-3 py-2 text-sm text-earth-heading focus:border-primary-600 focus:ring-primary-600"
                            >
                                <option value="diproses">Diproses</option>
                                <option value="selesai">Selesai</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                            <InputError message={responseForm.errors.status} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="catatan_admin" value="Catatan / Tanggapan Admin" />
                            <textarea
                                id="catatan_admin"
                                rows={4}
                                value={responseForm.data.catatan_admin}
                                onChange={(e) => responseForm.setData('catatan_admin', e.target.value)}
                                placeholder="Cantumkan tindak lanjut terhadap laporan ini..."
                                className="mt-1 w-full rounded-lg border border-river-stone bg-white px-3 py-2 text-sm text-earth-heading focus:border-primary-600 focus:ring-primary-600"
                            />
                            <InputError message={responseForm.errors.catatan_admin} className="mt-1" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-cloud-ash px-5 py-3">
                        <button
                            type="button"
                            onClick={() => setResponseModalOpen(false)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-earth transition hover:bg-river-stone"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={responseForm.processing}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
                        >
                            {responseForm.processing ? 'Menyimpan...' : 'Simpan Tanggapan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
