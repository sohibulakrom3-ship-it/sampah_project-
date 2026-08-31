import AppLayout from '@/Layouts/AppLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import EmptyState from '@/Components/EmptyState';
import TrackingMap from '@/Components/TrackingMap';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';

const hasCoordinates = (bin) => bin?.latitude !== null && bin?.latitude !== undefined && bin?.longitude !== null && bin?.longitude !== undefined;

const calculateDistanceKm = (from, bin) => {
    if (!from || !hasCoordinates(bin)) return null;

    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const lat1 = Number(from.latitude);
    const lon1 = Number(from.longitude);
    const lat2 = Number(bin.latitude);
    const lon2 = Number(bin.longitude);

    if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(value))) return null;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
};

const formatDistance = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) return 'Jarak tidak tersedia';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
    return `${distanceKm.toFixed(2)} km`;
};

export default function Index({ histories, trashBins }) {
    const { props: pageProps } = usePage();
    const currentUser = pageProps.auth.user;
    const userRole = currentUser.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin_unit';
    const isPetugas = userRole === 'petugas';
    const indexRoute = isAdmin ? 'admin.trash-histories.index' : 'petugas.pengangkutan.index';
    const storeRoute = isAdmin ? 'admin.trash-histories.store' : 'petugas.pengangkutan.store';
    const destroyRoute = isAdmin ? 'admin.trash-histories.destroy' : 'petugas.pengangkutan.destroy';
    const [modalOpen, setModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        trash_bin_id: new URLSearchParams(window.location.search).get('trash_bin_id') || '',
        start_date: new URLSearchParams(window.location.search).get('start_date') || '',
        end_date: new URLSearchParams(window.location.search).get('end_date') || '',
    });
    const [binSearch, setBinSearch] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('Mendeteksi lokasi petugas...');
    const [locationAccuracy, setLocationAccuracy] = useState(null);
    const [selectedPickupBinId, setSelectedPickupBinId] = useState(filters.trash_bin_id || null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        trash_bin_id: '',
        status_sebelum: '',
        status_sesudah: 'kosong',
        tanggal: '',
        foto: null,
        catatan: '',
        latitude_konfirmasi: '',
        longitude_konfirmasi: '',
    });

    useEffect(() => {
        if (!modalOpen) {
            const now = new Date();
            const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            setData('tanggal', local);
        }
    }, [modalOpen]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationStatus('Browser tidak mendukung deteksi lokasi. Daftar tong memakai urutan status.');
            return;
        }

        const updateLocation = (position) => {
            const accuracy = position.coords.accuracy ?? null;
            const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy,
                heading: position.coords.heading ?? null,
            };
            setUserLocation(location);
            setLocationAccuracy(accuracy);
            setLocationStatus(
                accuracy
                    ? `Lokasi petugas aktif. Akurasi sekitar ${Math.round(accuracy)} m.`
                    : 'Lokasi petugas aktif. Tong diurutkan dari jarak terdekat.',
            );
        };

        const handleLocationError = () => {
            setLocationStatus('Izin lokasi ditolak atau lokasi tidak tersedia. Daftar tong memakai urutan status.');
            setLocationAccuracy(null);
        };

        const watchId = navigator.geolocation.watchPosition(
            updateLocation,
            handleLocationError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 },
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    useEffect(() => {
        if (!userLocation) return;

        setData('latitude_konfirmasi', userLocation.latitude);
        setData('longitude_konfirmasi', userLocation.longitude);
    }, [userLocation]);

    const applyFilters = () => {
        const params = {};
        if (filters.trash_bin_id) params.trash_bin_id = filters.trash_bin_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        router.get(route(indexRoute), params, { preserveState: true });
    };

    const resetFilters = () => {
        setFilters({ trash_bin_id: '', start_date: '', end_date: '' });
        router.get(route(indexRoute), {}, { preserveState: true });
    };

    const filteredBins = useMemo(() => {
        if (!trashBins) return [];
        if (!binSearch) return trashBins;
        return trashBins.filter(
            (bin) =>
                (bin.kode && bin.kode.toLowerCase().includes(binSearch.toLowerCase())) ||
                (bin.nama && bin.nama.toLowerCase().includes(binSearch.toLowerCase())) ||
                (bin.unit?.nama && bin.unit.nama.toLowerCase().includes(binSearch.toLowerCase())),
        );
    }, [trashBins, binSearch]);

    const sortedBins = useMemo(() => {
        if (!filteredBins) return [];
        return filteredBins.map((bin) => ({
            ...bin,
            distance_km: calculateDistanceKm(userLocation, bin),
        })).sort((a, b) => {
            if (a.distance_km !== null && b.distance_km !== null) return a.distance_km - b.distance_km;
            if (a.distance_km !== null) return -1;
            if (b.distance_km !== null) return 1;
            if (a.status === 'penuh' && b.status !== 'penuh') return -1;
            if (a.status !== 'penuh' && b.status === 'penuh') return 1;
            return 0;
        });
    }, [filteredBins, userLocation]);

    const selectedBin = useMemo(
        () => trashBins?.find((b) => b.id.toString() === data.trash_bin_id.toString()),
        [trashBins, data.trash_bin_id],
    );
    const hasFormConfirmationCoordinates =
        data.latitude_konfirmasi !== '' &&
        data.latitude_konfirmasi !== null &&
        data.latitude_konfirmasi !== undefined &&
        data.longitude_konfirmasi !== '' &&
        data.longitude_konfirmasi !== null &&
        data.longitude_konfirmasi !== undefined;
    const confirmationLocationRequired = isPetugas && hasCoordinates(selectedBin);
    const confirmationLocationMissing = confirmationLocationRequired && !hasFormConfirmationCoordinates;

    const handleBinSelect = (binId) => {
        const selected = trashBins?.find((b) => b.id.toString() === binId.toString());
        setSelectedPickupBinId(binId);
        setData({
            ...data,
            trash_bin_id: binId,
            status_sebelum: selected?.status || '',
            latitude_konfirmasi: userLocation?.latitude ?? data.latitude_konfirmasi,
            longitude_konfirmasi: userLocation?.longitude ?? data.longitude_konfirmasi,
        });
    };

    const openCreate = (preselectedBin = null) => {
        reset();
        clearErrors();
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        const selected = preselectedBin || null;
        setData({
            trash_bin_id: selected?.id || '',
            status_sebelum: selected?.status || '',
            status_sesudah: 'kosong',
            tanggal: local,
            foto: null,
            catatan: '',
            latitude_konfirmasi: userLocation?.latitude ?? '',
            longitude_konfirmasi: userLocation?.longitude ?? '',
        });
        setSelectedPickupBinId(selected?.id || null);
        setBinSearch('');
        setModalOpen(true);
    };

    // Auto-buka form "Catat Pengangkutan" saat halaman dibuka lewat tombol "Angkut"
    // (trash_bin_id ada di URL). Guard ref memastikan hanya berjalan sekali saat mount,
    // sehingga tidak terbuka ulang saat user memfilter riwayat (router.get preserveState).
    const autoOpenedPickup = useRef(false);
    useEffect(() => {
        if (autoOpenedPickup.current) return;
        autoOpenedPickup.current = true;
        const binId = new URLSearchParams(window.location.search).get('trash_bin_id');
        if (!binId) return;
        const bin = trashBins?.find((b) => b.id.toString() === binId.toString());
        if (bin) openCreate(bin);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trashBins]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route(storeRoute), {
            onSuccess: () => {
                setModalOpen(false);
                reset();
            },
        });
    };

    const confirmDelete = (id) => {
        Swal.fire({
            title: 'Hapus Riwayat?',
            text: 'Data riwayat pengangkutan ini akan dihapus. Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route(destroyRoute, id));
            }
        });
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    const hasConfirmationCoordinates = (history) =>
        history?.latitude_konfirmasi !== null &&
        history?.latitude_konfirmasi !== undefined &&
        history?.longitude_konfirmasi !== null &&
        history?.longitude_konfirmasi !== undefined;

    const formatMeters = (value) => {
        if (value === null || value === undefined) return null;
        return `${Number(value).toFixed(1)} m`;
    };

    const confirmationMapUrl = (history) =>
        `https://www.openstreetmap.org/?mlat=${history.latitude_konfirmasi}&mlon=${history.longitude_konfirmasi}#map=18/${history.latitude_konfirmasi}/${history.longitude_konfirmasi}`;

    const historyList = histories?.data || [];

    return (
        <AppLayout header="Riwayat Pengangkutan">
            <div className="space-y-4">
                {/* Filter Bar */}
                <div className="rounded-xl bg-white border border-[#e5e7eb] p-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-1">Tong Sampah</label>
                            <select
                                value={filters.trash_bin_id}
                                onChange={(e) => setFilters({ ...filters, trash_bin_id: e.target.value })}
                                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                            >
                                <option value="">Semua Tong</option>
                                {sortedBins?.map((bin) => (
                                    <option key={bin.id} value={bin.id}>
                                        {bin.kode} - {bin.nama} ({bin.unit?.nama || '-'}) - {formatDistance(bin.distance_km)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-1">Tanggal Mulai</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-1">Tanggal Akhir</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={applyFilters}
                                className="rounded-full bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#15803d]"
                            >
                                Filter
                            </button>
                            <button
                                onClick={resetFilters}
                                className="rounded-full border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#6b7280] transition hover:bg-[#f3f4f6]"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <TrackingMap
                    bins={sortedBins.map((bin) => ({
                        ...bin,
                        unit_nama: bin.unit?.nama,
                    }))}
                    userLocation={userLocation}
                    selectedBinId={selectedPickupBinId}
                    onSelectBin={(bin) => openCreate(bin)}
                    title="Peta Tracking Pengangkutan"
                    subtitle="Klik titik tong di peta untuk memilih target angkut dan membuka form konfirmasi."
                />

                {/* Data Header + Add Button */}
                <div className="rounded-xl bg-white border border-[#e5e7eb]">
                    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-[#111827]">Daftar riwayat</h2>
                            <p className="mt-0.5 text-xs text-[#9ca3af]">Catatan pengangkutan sampah</p>
                        </div>
                        <button
                            onClick={() => openCreate()}
                            className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#15803d]"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Catat Pengangkutan
                        </button>
                    </div>

                    {historyList.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-xs font-medium text-[#6b7280]">
                                            <th className="px-5 py-3">Tanggal</th>
                                            <th className="px-5 py-3">Tong Sampah</th>
                                            <th className="px-5 py-3">Unit</th>
                                            <th className="px-5 py-3">Petugas</th>
                                            <th className="px-5 py-3">Lokasi Konfirmasi</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3">Catatan</th>
                                            <th className="px-5 py-3">Foto</th>
                                            {pageProps.auth.user?.role === 'super_admin' && (
                                                <th className="px-5 py-3 text-right">Aksi</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f3f4f6]">
                                        {historyList.map((h) => (
                                            <tr key={h.id} className="hover:bg-[#f9fafb] transition">
                                                <td className="px-5 py-3 text-[#6b7280] whitespace-nowrap">{formatDate(h.tanggal)}</td>
                                                <td className="px-5 py-3 font-medium text-[#111827]">
                                                    <div>{h.trash_bin?.nama || '-'}</div>
                                                    <div className="text-xs text-[#9ca3af] font-mono">{h.trash_bin?.kode || '-'}</div>
                                                </td>
                                                <td className="px-5 py-3 text-[#6b7280]">{h.trash_bin?.unit?.nama || '-'}</td>
                                                <td className="px-5 py-3 text-[#111827]">{h.user?.name || '-'}</td>
                                                <td className="px-5 py-3">
                                                    {hasConfirmationCoordinates(h) ? (
                                                        <>
                                                            <a
                                                                href={confirmationMapUrl(h)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs font-medium text-[#16a34a] hover:text-[#15803d]"
                                                            >
                                                                {Number(h.latitude_konfirmasi).toFixed(5)}, {Number(h.longitude_konfirmasi).toFixed(5)}
                                                            </a>
                                                            {h.jarak_konfirmasi_meter !== null && h.jarak_konfirmasi_meter !== undefined && (
                                                                <div className="mt-1 text-xs text-[#6b7280]">
                                                                    {formatMeters(h.jarak_konfirmasi_meter)}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-[#d1d5db]">Belum ada</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <StatusBadge status={h.status_sebelum} type="trash" />
                                                        <svg className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                        </svg>
                                                        <StatusBadge status={h.status_sesudah} type="trash" />
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-[#6b7280] max-w-[200px] truncate">{h.catatan || '-'}</td>
                                                <td className="px-5 py-3">
                                                    {h.foto_url ? (
                                                        <a
                                                            href={h.foto_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-[#6366f1] hover:text-[#4338ca] transition"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.41a2.25 2.25 0 0 1 3.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                            </svg>
                                                            Lihat
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-[#d1d5db]">-</span>
                                                    )}
                                                </td>
                                                {pageProps.auth.user?.role === 'super_admin' && (
                                                    <td className="px-5 py-3 text-right">
                                                        <button
                                                            onClick={() => confirmDelete(h.id)}
                                                            className="text-xs font-medium text-[#dc2626] hover:text-[#b91c1c] transition"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="divide-y divide-[#f3f4f6] lg:hidden">
                                {historyList.map((h) => (
                                    <div key={h.id} className="p-4 space-y-2.5">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs text-[#9ca3af]">{formatDate(h.tanggal)}</span>
                                                    <span className="text-[#d1d5db]">|</span>
                                                    <span className="text-xs text-[#6b7280]">{h.user?.name || '-'}</span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-[#111827]">{h.trash_bin?.nama || '-'}</h3>
                                                <p className="text-xs text-[#9ca3af] font-mono">{h.trash_bin?.kode} - {h.trash_bin?.unit?.nama || '-'}</p>
                                            </div>
                                            {pageProps.auth.user?.role === 'super_admin' && (
                                                <button
                                                    onClick={() => confirmDelete(h.id)}
                                                    className="text-xs font-medium text-[#dc2626] hover:text-[#b91c1c] transition shrink-0"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <StatusBadge status={h.status_sebelum} type="trash" />
                                            <svg className="h-3 w-3 shrink-0 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                            <StatusBadge status={h.status_sesudah} type="trash" />
                                        </div>
                                        {h.catatan && (
                                            <p className="text-xs text-[#6b7280] line-clamp-2">{h.catatan}</p>
                                        )}
                                        {hasConfirmationCoordinates(h) && (
                                            <a
                                                href={confirmationMapUrl(h)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex text-xs font-medium text-[#16a34a] hover:text-[#15803d]"
                                            >
                                                Lokasi konfirmasi: {Number(h.latitude_konfirmasi).toFixed(5)}, {Number(h.longitude_konfirmasi).toFixed(5)}
                                                {h.jarak_konfirmasi_meter !== null && h.jarak_konfirmasi_meter !== undefined
                                                    ? ` (${formatMeters(h.jarak_konfirmasi_meter)})`
                                                    : ''}
                                            </a>
                                        )}
                                        {h.foto_url && (
                                            <a
                                                href={h.foto_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-medium text-[#6366f1] hover:text-[#4338ca] transition"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.41a2.25 2.25 0 0 1 3.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                </svg>
                                                Lihat Foto
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[#e5e7eb] px-5 py-3">
                                <Pagination links={histories.links} meta={histories.meta} />
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                </svg>
                            }
                            title="Belum ada riwayat pengangkutan"
                            description="Catat aktivitas pengangkutan sampah untuk melacak histori"
                        />
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Transition show={modalOpen}>
                <Dialog onClose={closeModal} className="relative z-[2000]">
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
                            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                                <Dialog.Title className="text-base font-semibold text-[#111827] mb-1">
                                    Catat Pengangkutan
                                </Dialog.Title>
                                <p className="text-xs text-[#9ca3af] mb-5">
                                    Catat aktivitas pengangkutan sampah dari tong
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Searchable Bin Select */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Tong Sampah</label>
                                        <div className="mb-2 rounded-md bg-[#f9fafb] px-3 py-2 text-xs text-[#6b7280]">
                                            {locationStatus}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.trash_bin_id ? (trashBins?.find((b) => b.id.toString() === data.trash_bin_id.toString())?.kode + ' - ' + trashBins?.find((b) => b.id.toString() === data.trash_bin_id.toString())?.nama) || '' : binSearch}
                                                onChange={(e) => {
                                                    setBinSearch(e.target.value);
                                                    if (data.trash_bin_id) {
                                                        setData('trash_bin_id', '');
                                                        setData('status_sebelum', '');
                                                    }
                                                }}
                                                onFocus={() => {
                                                    if (data.trash_bin_id) {
                                                        setBinSearch('');
                                                        setData('trash_bin_id', '');
                                                        setData('status_sebelum', '');
                                                    }
                                                }}
                                                placeholder="Cari tong sampah..."
                                                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                            />
                                            {binSearch && !data.trash_bin_id && (
                                                <div className="absolute z-10 mt-1 w-full rounded-md border border-[#e5e7eb] bg-white shadow-lg max-h-48 overflow-y-auto">
                                                    {sortedBins.length > 0 ? (
                                                        sortedBins.map((bin) => (
                                                            <button
                                                                key={bin.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleBinSelect(bin.id);
                                                                    setBinSearch('');
                                                                }}
                                                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-[#f3f4f6] ${
                                                                    bin.status === 'penuh' ? 'bg-red-50' : ''
                                                                }`}
                                                            >
                                                                <div className="text-left min-w-0">
                                                                    <div>
                                                                        <span className="font-medium text-[#111827]">{bin.kode} - {bin.nama}</span>
                                                                        <span className="ml-2 text-xs text-[#6b7280]">{bin.unit?.nama || '-'}</span>
                                                                    </div>
                                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                                                                        <span>{formatDistance(bin.distance_km)}</span>
                                                                        <span className="capitalize">{bin.jenis_sampah}</span>
                                                                        {bin.is_overdue && (
                                                                            <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-700">
                                                                                Prioritas 3 hari
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <StatusBadge status={bin.status} type="trash" />
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-xs text-[#9ca3af]">Tidak ada tong yang cocok</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {errors.trash_bin_id && <p className="mt-1 text-xs text-[#dc2626]">{errors.trash_bin_id}</p>}
                                    </div>

                                    {selectedBin && (
                                        <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#6b7280]">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span>{selectedBin.lokasi || 'Lokasi tidak tersedia'}</span>
                                                <span className="text-[#d1d5db]">|</span>
                                                <span>{formatDistance(calculateDistanceKm(userLocation, selectedBin))}</span>
                                            </div>
                                            <div className="mt-2 text-[#6b7280]">
                                                Koordinat konfirmasi:{' '}
                                                {hasFormConfirmationCoordinates
                                                    ? `${Number(data.latitude_konfirmasi).toFixed(6)}, ${Number(data.longitude_konfirmasi).toFixed(6)}`
                                                    : 'belum tersedia'}
                                            </div>
                                            {locationAccuracy !== null && (
                                                <div className="mt-1 text-[#6b7280]">
                                                    Akurasi lokasi: sekitar {Math.round(locationAccuracy)} m
                                                </div>
                                            )}
                                            {selectedBin.is_overdue && (
                                                <p className="mt-2 font-medium text-orange-700">
                                                    Tong anorganik ini sudah lebih dari 3 hari belum diangkut.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {errors.latitude_konfirmasi && (
                                        <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-[#dc2626]">
                                            {errors.latitude_konfirmasi}
                                        </p>
                                    )}
                                    {confirmationLocationMissing && (
                                        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                                            Lokasi petugas wajib aktif untuk tong yang memiliki titik koordinat.
                                        </p>
                                    )}

                                    {/* Status Sebelum (auto) */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Status Sebelum</label>
                                        <div className="w-full rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-sm text-[#6b7280]">
                                            {data.status_sebelum ? (
                                                <StatusBadge status={data.status_sebelum} type="trash" />
                                            ) : (
                                                'Pilih tong terlebih dahulu'
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Sesudah */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Status Sesudah</label>
                                        <select
                                            value={data.status_sesudah}
                                            onChange={(e) => setData('status_sesudah', e.target.value)}
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        >
                                            <option value="kosong">Kosong</option>
                                            <option value="setengah_penuh">Setengah Penuh</option>
                                            <option value="penuh">Penuh</option>
                                        </select>
                                        {errors.status_sesudah && <p className="mt-1 text-xs text-[#dc2626]">{errors.status_sesudah}</p>}
                                    </div>

                                    {/* Tanggal */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Tanggal</label>
                                        <input
                                            type="datetime-local"
                                            value={data.tanggal}
                                            onChange={(e) => setData('tanggal', e.target.value)}
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        />
                                        {errors.tanggal && <p className="mt-1 text-xs text-[#dc2626]">{errors.tanggal}</p>}
                                    </div>

                                    {/* Foto */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Foto</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setData('foto', e.target.files[0])}
                                            className="w-full text-sm text-[#6b7280] file:mr-3 file:rounded-full file:border-0 file:bg-[#dcfce7] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#16a34a] hover:file:bg-[#bbf7d0]"
                                        />
                                        {errors.foto && <p className="mt-1 text-xs text-[#dc2626]">{errors.foto}</p>}
                                    </div>

                                    {/* Catatan */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#374151] mb-1">Catatan</label>
                                        <textarea
                                            value={data.catatan}
                                            onChange={(e) => setData('catatan', e.target.value)}
                                            rows={2}
                                            placeholder="Catatan pengangkutan (opsional)"
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]"
                                        />
                                        {errors.catatan && <p className="mt-1 text-xs text-[#dc2626]">{errors.catatan}</p>}
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
                                            disabled={processing || confirmationLocationMissing}
                                            className="rounded-full bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#15803d] disabled:opacity-50"
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan'}
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
