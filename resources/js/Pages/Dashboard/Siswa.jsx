import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import StatCard from '@/Components/StatCard';
import StatusBadge from '@/Components/StatusBadge';
import EmptyState from '@/Components/EmptyState';

const statusDotMap = {
    kosong: 'bg-green-500',
    setengah_penuh: 'bg-yellow-500',
    penuh: 'bg-red-500',
    sudah_diangkut: 'bg-blue-500',
};

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

export default function Siswa({
    tongSekitar,
    aduanSaya,
    totalAduanSaya,
    edukasiList,
}) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || 'Siswa';

    const header = (
        <div className="flex items-center gap-3">
            <span>Dasbor Siswa</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Siswa
            </span>
        </div>
    );

    const totalAduan = totalAduanSaya
        ? Object.values(totalAduanSaya).reduce((sum, val) => sum + (parseInt(val) || 0), 0)
        : (aduanSaya ? aduanSaya.length : 0);

    const aduanDiproses = totalAduanSaya?.diproses || 0;

    const aduanSelesai = totalAduanSaya?.selesai || 0;

    const tipsEdukasi = edukasiList && edukasiList.length > 0 ? edukasiList : [
        {
            judul: 'Pilah Sampah dari Rumah',
            deskripsi: 'Pisahkan sampah organik (sisa makanan, daun) dan anorganik (plastik, kertas, kaleng) sebelum dibuang. Sampah yang terpilah lebih mudah didaur ulang.',
        },
        {
            judul: 'Kurangi Plastik Sekali Pakai',
            deskripsi: 'Gunakan botol minum isi ulang, tas belanja kain, dan wadah makanan sendiri untuk mengurangi sampah plastik di lingkungan sekolah.',
        },
        {
            judul: 'Manfaatkan Sampah Organik',
            deskripsi: 'Sampah organik seperti sisa makanan dan daun kering dapat diolah menjadi kompos yang bermanfaat untuk menyuburkan tanaman.',
        },
    ];

    const hasTongSekitar = tongSekitar && tongSekitar.length > 0;
    const hasAduan = aduanSaya && aduanSaya.length > 0;

    return (
        <AppLayout header={header}>
            <Head title="Dasbor Siswa" />

            <div className="space-y-6">
                {/* Quick Action - Lapor Sampah */}
                <div
                    className="flex flex-col items-center rounded-2xl bg-primary-600 p-6 text-white hover:shadow-green-glow transition hover:bg-primary-700 active:scale-[0.98]"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 mb-3">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold">Lapor lewat QR Tong</span>
                    <span className="mt-1 text-center text-sm text-green-100">Scan barcode/QR yang ditempel pada tong untuk melapor tanpa login</span>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    <StatCard
                        title="Total Aduan"
                        value={totalAduan}
                        color="indigo"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Aduan Diproses"
                        value={aduanDiproses}
                        color="yellow"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Aduan Selesai"
                        value={aduanSelesai}
                        color="green"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        }
                    />
                </div>

                {/* Tong Sampah Terdekat */}
                <div className="rounded-xl bg-white border border-cloud-ash p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-earth-heading">Tong Sampah Terdekat</h3>
                        {hasTongSekitar && (
                            <span className="text-xs font-medium text-muted-earth">Scan QR pada tong untuk melapor</span>
                        )}
                    </div>
                    {hasTongSekitar ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {tongSekitar.map((item, i) => {
                                const isPenuh = item.status === 'penuh';
                                const dotColor = statusDotMap[item.status] || 'bg-gray-400';
                                return (
                                    <div
                                        key={i}
                                        className={`rounded-xl border p-4 transition ${
                                            isPenuh
                                                ? 'border-red-200 bg-red-50 hover:border-red-300 cursor-pointer'
                                                : 'border-cloud-ash bg-white hover:border-muted-earth'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${dotColor}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-earth-heading truncate">{item.nama}</p>
                                                <p className="text-xs text-muted-earth mt-0.5">{item.unit?.nama}</p>
                                                <p className="text-xs text-muted-earth/70 mt-0.5 truncate">{item.lokasi}</p>
                                                <div className="mt-2">
                                                    <StatusBadge status={item.status} type="trash" />
                                                </div>
                                                {isPenuh && (
                                                    <p className="mt-3 rounded-lg bg-red-100 px-3 py-1.5 text-center text-xs font-medium text-red-700">
                                                        Laporkan dari QR pada tong.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                </svg>
                            }
                            title="Tidak ada tong sampah terdekat"
                            description="Belum ada data tong sampah di sekitar lokasi Anda"
                        />
                    )}
                </div>

                {/* Aduan Saya */}
                <div className="rounded-xl bg-white border border-cloud-ash p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-earth-heading">Laporan Publik</h3>
                        {hasAduan && (
                            <span className="text-xs font-medium text-muted-earth">Riwayat lama</span>
                        )}
                    </div>
                    {hasAduan ? (
                        <div className="space-y-2">
                            {aduanSaya.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-xl border border-cloud-ash p-3 transition hover:border-muted-earth">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-river-stone text-muted-earth">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-earth-heading truncate">{item.judul}</p>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-earth">
                                            <span>{item.created_at || item.tanggal}</span>
                                            {item.lokasi && <span>{item.lokasi}</span>}
                                        </div>
                                        {item.tanggapan && (
                                            <p className="mt-1 text-xs text-muted-earth/70 italic truncate">
                                                &quot;{item.tanggapan}&quot;
                                            </p>
                                        )}
                                    </div>
                                    <StatusBadge status={item.status} type="complaint" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                </svg>
                            }
                            title="Belum ada laporan publik"
                            description="Laporan warga sekarang dikirim lewat QR pada tong sampah — tanpa login."
                        />
                    )}
                </div>

                {/* Edukasi */}
                <div className="rounded-xl bg-white border border-cloud-ash p-5">
                    <h3 className="text-sm font-semibold text-earth-heading mb-4">Edukasi Pengelolaan Sampah</h3>
                    <div className="space-y-4">
                        {tipsEdukasi.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-xl border border-cloud-ash bg-warm-chalk p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                    </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-semibold text-earth-heading">{item.judul}</h4>
                                    <p className="mt-1 text-sm text-muted-earth leading-relaxed">{item.deskripsi}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
