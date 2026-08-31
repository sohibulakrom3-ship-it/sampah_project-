import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import StatCard from '@/Components/StatCard';
import StatusBadge from '@/Components/StatusBadge';
import EmptyState from '@/Components/EmptyState';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

const tipeAktivitasMap = {
    pengangkutan: 'bg-blue-100 text-blue-800',
    aduan: 'bg-yellow-100 text-yellow-800',
    laporan: 'bg-green-100 text-green-800',
    pengguna: 'bg-indigo-100 text-indigo-800',
    unit: 'bg-purple-100 text-purple-800',
    jadwal: 'bg-orange-100 text-orange-800',
};

const tipeAktivitasLabel = {
    pengangkutan: 'Pengangkutan',
    aduan: 'Aduan',
    laporan: 'Laporan',
    pengguna: 'Pengguna',
    unit: 'Unit',
    jadwal: 'Jadwal',
};

const jenisLaporanMap = {
    penuh: 'Tong Penuh',
    rusak: 'Tong Rusak',
    bau: 'Bau Menyengat',
    hama: 'Hama/Serangga',
    pemilahan: 'Salah Pemilahan',
    lainnya: 'Lainnya',
};

export default function AdminUnit({
    totalUnits,
    totalTrashBins,
    totalPenuh,
    totalDiangkutHariIni,
    totalAduanPending,
    totalPetugas,
    tongPerUnit,
    aktivitasTerbaru,
    aduanTerbaru,
    tongPenuh,
    trenPengangkutan,
}) {
    const { auth } = usePage().props;
    const unitName = auth?.user?.unit_name || 'Unit Anda';

    const header = (
        <div className="flex items-center gap-3">
            <span>Dasbor Admin Unit</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 truncate max-w-[180px]">
                {unitName}
            </span>
        </div>
    );

    const barChartData = tongPerUnit && tongPerUnit.length > 0 ? {
        labels: tongPerUnit.map(item => item.unit || item.nama || ''),
        datasets: [
            {
                label: 'Total Tong',
                data: tongPerUnit.map(item => item.total_tong || 0),
                backgroundColor: 'rgba(22, 163, 74, 0.7)',
                borderColor: '#16a34a',
                borderWidth: 1,
                borderRadius: 6,
            },
            {
                label: 'Penuh',
                data: tongPerUnit.map(item => item.penuh || 0),
                backgroundColor: 'rgba(220, 38, 38, 0.7)',
                borderColor: '#dc2626',
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    } : null;

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 16,
                    font: { size: 12 },
                },
            },
            tooltip: {
                backgroundColor: '#111827',
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#6b7280' },
            },
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { font: { size: 11 }, color: '#6b7280', stepSize: 1 },
            },
        },
    };

    const lineChartData = trenPengangkutan && trenPengangkutan.length > 0 ? {
        labels: trenPengangkutan.map(item => item.tanggal || ''),
        datasets: [
            {
                label: 'Pengangkutan',
                data: trenPengangkutan.map(item => item.jumlah || 0),
                borderColor: '#16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.08)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#16a34a',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true,
            },
        ],
    } : null;

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#111827',
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#6b7280', maxTicksLimit: 10 },
            },
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { font: { size: 11 }, color: '#6b7280' },
            },
        },
    };

    return (
        <AppLayout header={header}>
            <Head title={`Dasbor Admin Unit - ${unitName}`} />

            <div className="space-y-6">
                {/* Stat Cards Row 1 */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        title="Total Tong Sampah"
                        value={totalTrashBins || 0}
                        color="green"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Tong Penuh"
                        value={totalPenuh || 0}
                        color="red"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Diangkut Hari Ini"
                        value={totalDiangkutHariIni || 0}
                        color="blue"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Aduan Pending"
                        value={totalAduanPending || 0}
                        color="yellow"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                        }
                    />
                </div>

                {/* Stat Cards Row 2 */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        title="Total Unit"
                        value={totalUnits || 0}
                        color="indigo"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-5.25 0v15m3-12h.75M16.5 15.75h.75" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Total Petugas"
                        value={totalPetugas || 0}
                        color="green"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                        }
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Bar Chart: Sampah per Unit */}
                    <div className="rounded-xl bg-white border border-cloud-ash p-5">
                        <h3 className="text-sm font-semibold text-earth-heading mb-4">Sampah per Unit</h3>
                        {barChartData ? (
                            <div className="h-64">
                                <Bar data={barChartData} options={barChartOptions} />
                            </div>
                        ) : (
                            <EmptyState
                                icon={
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                    </svg>
                                }
                                title="Belum ada data"
                                description="Data sampah per unit akan ditampilkan di sini"
                            />
                        )}
                    </div>

                    {/* Line Chart: Tren Pengangkutan */}
                    <div className="rounded-xl bg-white border border-cloud-ash p-5">
                        <h3 className="text-sm font-semibold text-earth-heading mb-4">Tren Pengangkutan 30 Hari</h3>
                        {lineChartData ? (
                            <div className="h-64">
                                <Line data={lineChartData} options={lineChartOptions} />
                            </div>
                        ) : (
                            <EmptyState
                                icon={
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
                                </svg>
                                }
                                title="Belum ada data"
                                description="Tren pengangkutan akan ditampilkan di sini"
                            />
                        )}
                    </div>
                </div>

                {/* Tong Penuh Saat Ini */}
                <div className="rounded-xl bg-white border border-cloud-ash p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-earth-heading">Tong Penuh Saat Ini</h3>
                        {tongPenuh && tongPenuh.length > 0 && (
                            <Link
                                href={route('admin.trash-bins.index')}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 transition"
                            >
                                Kelola Tong
                            </Link>
                        )}
                    </div>
                    {tongPenuh && tongPenuh.length > 0 ? (
                        <>
                            {/* Desktop table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-cloud-ash text-left">
                                            <th className="pb-3 pr-4 text-xs font-medium text-muted-earth">Kode</th>
                                            <th className="pb-3 pr-4 text-xs font-medium text-muted-earth">Nama</th>
                                            <th className="pb-3 pr-4 text-xs font-medium text-muted-earth">Status</th>
                                            <th className="pb-3 text-xs font-medium text-muted-earth">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-river-stone">
                                        {tongPenuh.map((item, i) => (
                                            <tr key={i} className="hover:bg-warm-chalk transition">
                                                <td className="py-3 pr-4 text-earth-heading font-medium">{item.kode}</td>
                                                <td className="py-3 pr-4 text-grounded-charcoal">{item.nama}</td>
                                                <td className="py-3 pr-4">
                                                    <StatusBadge status={item.status || 'penuh'} type="trash" />
                                                </td>
                                                <td className="py-3">
                                                    <Link
                                                        href={route('admin.trash-bins.index')}
                                                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 transition"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                        Detail
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="lg:hidden space-y-3">
                                {tongPenuh.map((item, i) => (
                                    <div key={i} className="rounded-xl border border-cloud-ash p-4 bg-white hover:border-muted-earth transition">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-earth-heading">{item.nama}</p>
                                                <p className="text-xs text-muted-earth mt-0.5">{item.kode}</p>
                                                <div className="mt-2">
                                                    <StatusBadge status={item.status || 'penuh'} type="trash" />
                                                </div>
                                            </div>
                                            <Link
                                                href={route('admin.trash-bins.index')}
                                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 transition shrink-0"
                                            >
                                                Detail
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            }
                            title="Tidak ada tong penuh"
                            description="Semua tong dalam keadaan terkendali"
                        />
                    )}
                </div>

                {/* Aduan Terbaru */}
                <div className="rounded-xl bg-white border border-cloud-ash p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-earth-heading">Aduan Terbaru</h3>
                        {aduanTerbaru && aduanTerbaru.length > 0 && (
                            <Link
                                href={route('admin.complaints.index')}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 transition"
                            >
                                Lihat Semua
                            </Link>
                        )}
                    </div>
                    {aduanTerbaru && aduanTerbaru.length > 0 ? (
                        <div className="space-y-2">
                            {aduanTerbaru.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-xl border border-cloud-ash p-3 transition hover:border-muted-earth">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-earth-heading truncate">
                                            {item.nomor_tiket} — {jenisLaporanMap[item.jenis_masalah] || item.jenis_masalah}
                                        </p>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-earth">
                                            {item.nama_pelapor && <span>oleh {item.nama_pelapor}</span>}
                                            <span>{item.created_at || item.tanggal}</span>
                                        </div>
                                    </div>
                                    <StatusBadge status={item.status} type="complaint" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                </svg>
                            }
                            title="Belum ada aduan"
                            description="Pengaduan terbaru akan muncul di sini"
                        />
                    )}
                </div>

                {/* Aktivitas Terbaru */}
                <div className="rounded-xl bg-white border border-cloud-ash p-5">
                    <h3 className="text-sm font-semibold text-earth-heading mb-4">Aktivitas Terbaru</h3>
                    {aktivitasTerbaru && aktivitasTerbaru.length > 0 ? (
                        <div className="divide-y divide-river-stone -mx-1">
                            {aktivitasTerbaru.map((item, i) => {
                                const tipe = (item.tipe || '').toLowerCase();
                                const badgeClass = tipeAktivitasMap[tipe] || 'bg-gray-100 text-gray-700';
                                const badgeLabel = tipeAktivitasLabel[tipe] || item.tipe;
                                return (
                                    <div key={i} className="flex items-center gap-3 px-1 py-3">
                                        <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                                            {badgeLabel}
                                        </span>
                                        <span className="flex-1 min-w-0 text-sm text-grounded-charcoal truncate">{item.deskripsi}</span>
                                        <span className="shrink-0 text-xs text-muted-earth/70">{timeAgo(item.created_at)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            }
                            title="Belum ada aktivitas"
                            description="Aktivitas terbaru sistem akan muncul di sini"
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
