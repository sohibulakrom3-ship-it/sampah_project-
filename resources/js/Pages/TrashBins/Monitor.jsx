import AppLayout from '@/Layouts/AppLayout';
import StatusBadge from '@/Components/StatusBadge';
import EmptyState from '@/Components/EmptyState';
import TrackingMap from '@/Components/TrackingMap';
import { usePage, router, Link } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';

const statusCardStyles = {
    kosong: 'bg-green-50 border-green-300',
    setengah_penuh: 'bg-yellow-50 border-yellow-300',
    penuh: 'bg-red-50 border-red-300',
    sudah_diangkut: 'bg-blue-50 border-blue-300',
};

const statusBgStyles = {
    kosong: 'bg-green-500',
    setengah_penuh: 'bg-yellow-500',
    penuh: 'bg-red-500',
    sudah_diangkut: 'bg-blue-500',
};

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

export default function Monitor({ units: initialUnits }) {
    const { props: pageProps } = usePage();
    const userRole = pageProps.auth.user?.role;
    const isPetugas = userRole === 'petugas';
    const isAdmin = userRole === 'super_admin' || userRole === 'admin_unit';
    // Super admin memakai alur peta sama seperti petugas (GPS + rute prioritas).
    const isSuperAdmin = userRole === 'super_admin';
    const usesGps = isPetugas || isSuperAdmin;

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [unitFilter, setUnitFilter] = useState('');
    const [selectedMapBinId, setSelectedMapBinId] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('Mendeteksi lokasi...');

    useEffect(() => {
        if (!usesGps) return;

        if (!navigator.geolocation) {
            setLocationStatus('Browser tidak mendukung deteksi lokasi.');
            return;
        }

        const updateLocation = (position) => {
            setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy ?? null,
                heading: position.coords.heading ?? null,
            });
            setLocationStatus('Lokasi aktif. Tong diurutkan dari jarak terdekat per unit.');
        };

        const handleLocationError = () => {
            setLocationStatus('Izin lokasi ditolak atau lokasi tidak tersedia.');
        };

        // watchPosition agar ikon petugas ikut bergerak real-time saat petugas berjalan.
        const watchId = navigator.geolocation.watchPosition(
            updateLocation,
            handleLocationError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 },
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [usesGps]);

    const units = useMemo(() => {
        if (!initialUnits) return [];
        return initialUnits.map((unit) => {
            let filteredBins = unit.trash_bins || [];
            if (search) {
                const s = search.toLowerCase();
                filteredBins = filteredBins.filter(
                    (b) =>
                        (b.kode && b.kode.toLowerCase().includes(s)) ||
                        (b.nama && b.nama.toLowerCase().includes(s)) ||
                        (b.lokasi && b.lokasi.toLowerCase().includes(s)),
                );
            }
            if (statusFilter) {
                filteredBins = filteredBins.filter((b) => b.status === statusFilter);
            }
            filteredBins = filteredBins.map((bin) => ({
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
            return { ...unit, filteredBins };
        }).filter((unit) => {
            const matchUnit = !unitFilter || unit.id.toString() === unitFilter;
            return matchUnit && unit.filteredBins.length > 0;
        });
    }, [initialUnits, search, statusFilter, unitFilter, userLocation]);

    const mapBins = useMemo(
        () => units.flatMap((unit) =>
            unit.filteredBins.map((bin) => ({
                ...bin,
                unit_nama: unit.nama,
            })),
        ),
        [units],
    );

    const handleAngkut = (bin) => {
        router.get(route('petugas.pengangkutan.index'), { trash_bin_id: bin.id });
    };

    const handleEdit = (bin) => {
        router.get(route('admin.trash-bins.index'));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    return (
        <AppLayout header="Monitoring Tong Sampah">
            <div className="space-y-4">
                {/* Search and Filter Bar */}
                <div className="rounded-xl bg-white border border-[#e5e7eb] p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-1">Cari Tong</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Kode, nama, atau lokasi..."
                                className="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-green-500 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-green-500 focus:ring-green-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="kosong">Kosong</option>
                                <option value="setengah_penuh">Setengah Penuh</option>
                                <option value="penuh">Penuh</option>
                                <option value="sudah_diangkut">Sudah Diangkut</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-1">Unit</label>
                            <select
                                value={unitFilter}
                                onChange={(e) => setUnitFilter(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-green-500 focus:ring-green-500"
                            >
                                <option value="">Semua Unit</option>
                                {initialUnits?.map((u) => (
                                    <option key={u.id} value={u.id}>{u.nama}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Unit Groups */}
                {usesGps && (
                    <div className="rounded-xl bg-white border border-[#e5e7eb] px-4 py-3 text-xs text-[#6b7280]">
                        {locationStatus}
                    </div>
                )}

                <TrackingMap
                    bins={mapBins}
                    userLocation={userLocation}
                    selectedBinId={selectedMapBinId}
                    onSelectBin={(bin) => setSelectedMapBinId(bin.id)}
                    priorityRoute={isSuperAdmin}
                    showLabels
                    title={isPetugas ? 'Peta Tracking Petugas' : 'Peta Monitoring Tong'}
                    subtitle={isPetugas
                        ? 'Lihat posisi petugas, titik tong terdekat, dan prioritas angkut.'
                        : isSuperAdmin
                            ? 'Garis rute menghubungkan tong prioritas: penuh & setengah penuh (kosong tampil tanpa rute).'
                            : 'Lihat sebaran titik tong berdasarkan filter yang aktif.'}
                />

                {units.length > 0 ? (
                    <div className="space-y-6">
                        {units.map((unit) => (
                            <div key={unit.id}>
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-5.25 0v15m3-12h.75M16.5 15.75h.75" />
                                    </svg>
                                    <h3 className="text-sm font-semibold text-[#111827]">{unit.nama}</h3>
                                    <span className="text-xs text-[#9ca3af]">({unit.filteredBins.length} tong)</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {unit.filteredBins.map((bin) => {
                                        const isPenuh = bin.status === 'penuh';
                                        const isSetengah = bin.status === 'setengah_penuh';
                                        return (
                                            <div
                                                key={bin.id}
                                                className={`rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                                                    String(selectedMapBinId) === String(bin.id)
                                                        ? 'ring-4 ring-green-200'
                                                        : ''
                                                } ${statusCardStyles[bin.status] || statusCardStyles.kosong}`}
                                                onClick={() => setSelectedMapBinId(bin.id)}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-block w-3 h-3 rounded-full ${statusBgStyles[bin.status] || statusBgStyles.kosong}`}></span>
                                                        <span className="text-xs font-semibold text-gray-500">{bin.kode}</span>
                                                    </div>
                                                    <StatusBadge status={bin.status} type="trash" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 mb-1">{bin.nama}</p>
                                                <p className="text-xs text-gray-500 mb-2">{bin.lokasi}</p>
                                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                                                    </svg>
                                                    {bin.jenis_sampah}
                                                </div>
                                                {isPetugas && (
                                                    <p className="text-xs text-gray-500 mb-3">
                                                        {formatDistance(bin.distance_km)}
                                                    </p>
                                                )}
                                                {bin.is_overdue && (
                                                    <div className="mb-3">
                                                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                                            Prioritas 3 hari
                                                        </span>
                                                    </div>
                                                )}
                                                {bin.terakhir_diangkut && (
                                                    <p className="text-xs text-gray-400 mb-3">
                                                        Terakhir diangkut: {formatDate(bin.terakhir_diangkut)}
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    {isPetugas && (isPenuh || isSetengah) && (
                                                        <button
                                                            onClick={() => handleAngkut(bin)}
                                                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                                            </svg>
                                                            Angkut
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleEdit(bin)}
                                                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                            </svg>
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                            </svg>
                        }
                        title="Tidak ada tong ditemukan"
                        description="Coba ubah filter atau kata kunci pencarian"
                    />
                )}
            </div>
        </AppLayout>
    );
}
