import AppLayout from '@/Layouts/AppLayout';
import Pagination from '@/Components/Pagination';
import EmptyState from '@/Components/EmptyState';
import { usePage, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';

const jenisOptions = ['SD', 'SMP', 'SMA', 'SMK', 'TK', 'BTM', 'Sumart', 'Umci', 'Lainnya'];

const jenisColorMap = {
    SD: 'bg-blue-100 text-blue-800',
    SMP: 'bg-indigo-100 text-indigo-800',
    SMA: 'bg-purple-100 text-purple-800',
    SMK: 'bg-teal-100 text-teal-800',
    TK: 'bg-pink-100 text-pink-800',
    BTM: 'bg-amber-100 text-amber-800',
    Sumart: 'bg-emerald-100 text-emerald-800',
    Umci: 'bg-cyan-100 text-cyan-800',
    Lainnya: 'bg-gray-100 text-gray-800',
};

const kampusOptions = ['Kampus A', 'Kampus B', 'Kampus C', 'Kampus D', 'Kampus E'];

const kampusColorMap = {
    'Kampus A': 'bg-orange-100 text-orange-800',
    'Kampus B': 'bg-green-100 text-green-800',
    'Kampus C': 'bg-sky-100 text-sky-800',
    'Kampus D': 'bg-violet-100 text-violet-800',
    'Kampus E': 'bg-rose-100 text-rose-800',
};

export default function Index({ units }) {
    const { props: pageProps } = usePage();
    const role = pageProps.auth.user.role;
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        kampus: '',
        jenis: 'SD',
        alamat: '',
        no_telepon: '',
        deskripsi: '',
    });

    const openCreate = () => {
        reset();
        clearErrors();
        setEditItem(null);
        setModalOpen(true);
    };

    const openEdit = (item) => {
        clearErrors();
        setEditItem(item);
        setData({
            nama: item.nama || '',
            kampus: item.kampus || '',
            jenis: item.jenis || 'SD',
            alamat: item.alamat || '',
            no_telepon: item.no_telepon || '',
            deskripsi: item.deskripsi || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = editItem ? route('super-admin.units.update', editItem.id) : route('super-admin.units.store');
        const method = editItem ? put : post;
        method(url, {
            onSuccess: () => {
                setModalOpen(false);
                reset();
            },
        });
    };

    const confirmDelete = (id) => {
        Swal.fire({
            title: 'Hapus Unit?',
            text: 'Data unit beserta tong sampah dan pengguna terkait akan dihapus. Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('super-admin.units.destroy', id));
            }
        });
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditItem(null);
    };

    const unitList = units?.data || [];

    return (
        <AppLayout header="Kelola Unit">
            <div className="rounded-xl bg-white border border-[#e5e7eb]">
                <div className="flex flex-col gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-[#111827]">Daftar unit</h2>
                        <p className="mt-0.5 text-xs text-[#9ca3af]">Kelola data unit sekolah/instansi</p>
                    </div>
                    {role === 'super_admin' && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#15803d]"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Unit
                        </button>
                    )}
                </div>

                {unitList.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-xs font-medium text-[#6b7280]">
                                        <th className="px-5 py-3 w-12">No</th>
                                        <th className="px-5 py-3">Nama Unit</th>
                                        <th className="px-5 py-3">Kampus</th>
                                        <th className="px-5 py-3">Jenis</th>
                                        <th className="px-5 py-3">Alamat</th>
                                        <th className="px-5 py-3">Total Pengguna</th>
                                        <th className="px-5 py-3">Total Tong</th>
                                        <th className="px-5 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f3f4f6]">
                                    {unitList.map((unit, index) => (
                                        <tr key={unit.id} className="hover:bg-[#f9fafb] transition">
                                            <td className="px-5 py-3 text-[#9ca3af]">{index + 1 + ((units.meta?.current_page || 1) - 1) * (units.meta?.per_page || 10)}</td>
                                            <td className="px-5 py-3 font-medium text-[#111827]">{unit.nama}</td>
                                            <td className="px-5 py-3">
                                                {unit.kampus ? (
                                                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${kampusColorMap[unit.kampus] || 'bg-gray-100 text-gray-800'}`}>
                                                        {unit.kampus}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${jenisColorMap[unit.jenis] || 'bg-gray-100 text-gray-800'}`}>
                                                    {unit.jenis}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-[#6b7280] max-w-[200px] truncate">{unit.alamat || '-'}</td>
                                            <td className="px-5 py-3 text-[#111827]">{unit.users_count ?? 0}</td>
                                            <td className="px-5 py-3 text-[#111827]">{unit.trash_bins_count ?? 0}</td>
                                            <td className="px-5 py-3 text-right space-x-2">
                                                <button onClick={() => openEdit(unit)} className="text-xs font-medium text-[#16a34a] hover:text-[#15803d] transition">Edit</button>
                                                <button onClick={() => confirmDelete(unit.id)} className="text-xs font-medium text-[#dc2626] hover:text-[#b91c1c] transition">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="divide-y divide-[#f3f4f6] sm:hidden">
                            {unitList.map((unit, index) => (
                                <div key={unit.id} className="p-4 space-y-2.5">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[#9ca3af]">#{index + 1}</span>
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${jenisColorMap[unit.jenis] || 'bg-gray-100 text-gray-800'}`}>
                                                    {unit.jenis}
                                                </span>
                                            </div>
                                            <h3 className="mt-1 text-sm font-semibold text-[#111827]">{unit.nama}</h3>
                                            {unit.kampus && (
                                                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${kampusColorMap[unit.kampus] || 'bg-gray-100 text-gray-800'}`}>
                                                    {unit.kampus}
                                                </span>
                                            )}
                                            {unit.alamat && <p className="mt-0.5 text-xs text-[#6b7280] truncate">{unit.alamat}</p>}
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => openEdit(unit)} className="text-xs font-medium text-[#16a34a] hover:text-[#15803d] transition">Edit</button>
                                            <button onClick={() => confirmDelete(unit.id)} className="text-xs font-medium text-[#dc2626] hover:text-[#b91c1c] transition">Hapus</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                                        <span><span className="font-medium text-[#111827]">{unit.users_count ?? 0}</span> pengguna</span>
                                        <span><span className="font-medium text-[#111827]">{unit.trash_bins_count ?? 0}</span> tong</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[#e5e7eb] px-5 py-3">
                            <Pagination links={units.links} meta={units.meta} />
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-5.25 0v15m3-12h.75M16.5 15.75h.75" />
                            </svg>
                        }
                        title="Belum ada unit"
                        description="Tambahkan unit sekolah atau instansi untuk memulai pengelolaan data"
                        action={role === 'super_admin' ? { label: 'Tambah Unit', url: '#' } : null}
                    />
                )}
            </div>

            {/* Create/Edit Modal */}
            <Transition show={modalOpen}>
                <Dialog onClose={closeModal} className="relative z-50">
                    <Transition.Child
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                                <Dialog.Title className="text-base font-semibold text-[#111827] mb-1">
                                    {editItem ? 'Edit Unit' : 'Tambah Unit'}
                                </Dialog.Title>
                                <p className="text-xs text-[#9ca3af] mb-5">
                                    {editItem ? 'Perbarui informasi unit yang dipilih' : 'Isi data unit sekolah atau instansi baru'}
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Nama Unit</label>
                                        <input
                                            type="text"
                                            value={data.nama}
                                            onChange={(e) => setData('nama', e.target.value)}
                                            placeholder="Masukkan nama unit"
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        />
                                        {errors.nama && <p className="mt-1 text-xs text-[#dc2626]">{errors.nama}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Kampus</label>
                                        <select
                                            value={data.kampus}
                                            onChange={(e) => setData('kampus', e.target.value)}
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        >
                                            <option value="">- Tanpa kampus -</option>
                                            {kampusOptions.map((k) => (
                                                <option key={k} value={k}>{k}</option>
                                            ))}
                                        </select>
                                        {errors.kampus && <p className="mt-1 text-xs text-[#dc2626]">{errors.kampus}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Jenis</label>
                                        <select
                                            value={data.jenis}
                                            onChange={(e) => setData('jenis', e.target.value)}
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        >
                                            {jenisOptions.map((j) => (
                                                <option key={j} value={j}>{j}</option>
                                            ))}
                                        </select>
                                        {errors.jenis && <p className="mt-1 text-xs text-[#dc2626]">{errors.jenis}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Alamat</label>
                                        <textarea
                                            value={data.alamat}
                                            onChange={(e) => setData('alamat', e.target.value)}
                                            rows={2}
                                            placeholder="Masukkan alamat unit"
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        />
                                        {errors.alamat && <p className="mt-1 text-xs text-[#dc2626]">{errors.alamat}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">No. Telepon</label>
                                        <input
                                            type="text"
                                            value={data.no_telepon}
                                            onChange={(e) => setData('no_telepon', e.target.value)}
                                            placeholder="Masukkan nomor telepon"
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        />
                                        {errors.no_telepon && <p className="mt-1 text-xs text-[#dc2626]">{errors.no_telepon}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Deskripsi</label>
                                        <textarea
                                            value={data.deskripsi}
                                            onChange={(e) => setData('deskripsi', e.target.value)}
                                            rows={2}
                                            placeholder="Deskripsi singkat unit (opsional)"
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        />
                                        {errors.deskripsi && <p className="mt-1 text-xs text-[#dc2626]">{errors.deskripsi}</p>}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb]">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-full px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f3f4f6]"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-full bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#15803d] disabled:opacity-50"
                                        >
                                            {processing ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </AppLayout>
    );
}
