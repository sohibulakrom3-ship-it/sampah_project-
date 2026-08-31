import BrandMark from '@/Components/BrandMark';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// 3D render slots. Drop PNGs (transparent) into public/images/sipesa/ and they
// auto-replace the CSS/SVG fallbacks below. Missing files degrade gracefully.
const ASSET = (name) => `/images/sipesa/${name}`;

const navItems = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Alur', href: '#alur' },
    { label: 'Unit', href: '#unit' },
    { label: 'Kontak', href: '#kontak' },
];

const heroStats = [
    { value: '36', label: 'Tong Sampah Aktif', icon: 'trash', tone: 'green' },
    { value: '12', label: 'Pengangkutan Hari Ini', icon: 'truck', tone: 'blue' },
    { value: '82%', label: 'Sampah Berhasil Dipilah', icon: 'recycle', tone: 'green' },
];

const trustedUnits = ['Kampus A', 'Kampus B', 'Kampus C', 'Kampus D', 'Kampus E', 'SMK Muh.', 'SD Muh.', 'SMP Muh.'];

const bandStats = [
    { value: '36+', label: 'Tong Sampah Tersebar', icon: 'trash' },
    { value: '14', label: 'Unit Kampus Terhubung', icon: 'building' },
    { value: '500+', label: 'Laporan Terselesaikan', icon: 'report' },
    { value: '98%', label: 'Keberhasilan Pengangkutan', icon: 'shield' },
];

const features = [
    { title: 'Monitoring Tong', desc: 'Pantau kondisi tong sampah secara realtime dan akurat.', icon: 'trash', tone: 'green' },
    { title: 'Geolocation Routing', desc: 'Tentukan rute pengangkutan paling cepat dan efisien.', icon: 'pin', tone: 'blue' },
    { title: 'Laporan Siswa', desc: 'Siswa dapat melaporkan tong penuh atau masalah dengan mudah.', icon: 'chat', tone: 'purple' },
    { title: 'Dashboard Analitik', desc: 'Statistik dan grafik lengkap untuk pengambilan keputusan lebih baik.', icon: 'chart', tone: 'orange' },
    { title: 'Export Laporan', desc: 'Ekspor laporan ke PDF atau Excel secara otomatis.', icon: 'report', tone: 'teal' },
    { title: 'Multi Unit', desc: 'Kelola semua unit kampus dalam satu platform terintegrasi.', icon: 'building', tone: 'red' },
];

const workflow = [
    { title: 'Tong Penuh', desc: 'Tong sampah terdeteksi penuh oleh petugas atau laporan siswa.', icon: 'trash' },
    { title: 'Laporan Masuk', desc: 'Laporan diterima sistem dan menunggu tindak lanjut.', icon: 'chat' },
    { title: 'Petugas Berangkat', desc: 'Petugas menerima tugas dan menuju lokasi rute terbaik.', icon: 'truck' },
    { title: 'Laporan Tersimpan', desc: 'Sampah diangkut dan status tong diperbarui realtime.', icon: 'recycle' },
];

const geoChecklist = ['Lokasi tong sampah realtime', 'Tracking petugas pengangkutan', 'Rute optimal otomatis'];

const testimonials = [
    {
        quote: 'Dengan SiPeSa, pengelolaan sampah di kampus menjadi lebih terstruktur, efisien, dan mudah dipantau secara realtime. Laporan siswa sangat membantu!',
        name: 'Kepala Sarana Prasarana',
        role: 'Kampus B Muhammadiyah Cileungsi',
        avatar: 'avatar-1.png',
    },
    {
        quote: 'Sebagai petugas kebersihan, aplikasi ini memudahkan kami dalam menerima tugas dan mengetahui lokasi tong dengan tepat. Pengangkutan jadi lebih cepat.',
        name: 'Petugas Kebersihan',
        role: 'Kampus C Muhammadiyah Cileungsi',
        avatar: 'avatar-2.png',
    },
];

const footerCols = [
    { title: 'Menu', items: ['Beranda', 'Fitur', 'Alur', 'Unit', 'Kontak'] },
    { title: 'Fitur', items: ['Monitoring Tong', 'Geolocation Routing', 'Laporan Siswa', 'Dashboard', 'Export Laporan'] },
];

const iconToneStyles = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-500',
    teal: 'bg-teal-100 text-teal-600',
    red: 'bg-red-100 text-red-500',
};

// Scroll-reveal: native IntersectionObserver, honors prefers-reduced-motion.
function Reveal({ children, className = '', delay = 0, as: Tag = 'div', ...rest }) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            setShown(true);
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { threshold: 0.12 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
            {...rest}
        >
            {children}
        </Tag>
    );
}

// <img> with graceful fallback when the asset file is absent.
function Img({ src, alt = '', className = '', fallback = null }) {
    const [ok, setOk] = useState(Boolean(src));
    if (!ok) return fallback;
    return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setOk(false)} />;
}

function Icon({ name, className = 'h-6 w-6' }) {
    const props = {
        className,
        fill: 'none',
        viewBox: '0 0 24 24',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    };

    const paths = {
        leaf: (<><path d="M5 19c8.5 0 13-5.6 13-14-8.4 0-14 4.6-14 13" /><path d="M4 20c2.8-5.7 6.2-9.3 12-12" /></>),
        play: (<><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4Z" /></>),
        login: (<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></>),
        chart: (<><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-4" /><path d="M12 16V8" /><path d="M16 16v-6" /></>),
        users: (<><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
        report: (<><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h5" /><path d="M9 17v-3" /><path d="M12 17v-6" /><path d="M15 17v-4" /></>),
        trash: (<><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 14h10l1-14" /><path d="M9 7V4h6v3" /></>),
        truck: (<><path d="M3 7h11v9H3Z" /><path d="M14 10h4l3 3v3h-7Z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>),
        alert: (<><path d="M10.3 4.4 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 4.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
        camera: (<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>),
        check: (<><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>),
        mail: (<><path d="M4 6h16v12H4Z" /><path d="m4 7 8 6 8-6" /></>),
        pin: (<><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>),
        chat: (<><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" /><path d="M8 9h8M8 13h5" /></>),
        building: (<><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h8v18" /><path d="M15 9h2a2 2 0 0 1 2 2v10" /><path d="M8 7h3M8 11h3M8 15h3" /></>),
        recycle: (<><path d="M7 19h10l-2-3" /><path d="M17 19l3-5-3-2" /><path d="m9 5 3-2 3 5" /><path d="M12 3 9 8 4 7" /><path d="M4 7l-1 6 5 1" /></>),
        shield: (<><path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6Z" /><path d="m9 12 2 2 4-4" /></>),
        download: (<><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>),
        arrow: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
        phone: (<><path d="M6 3h5l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v5a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z" /></>),
        pinSmall: (<><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>),
        quote: (<><path d="M7 7h4v6a4 4 0 0 1-4 4" fill="currentColor" stroke="none" /><path d="M14 7h4v6a4 4 0 0 1-4 4" fill="currentColor" stroke="none" /></>),
        chevronL: (<path d="m14 6-6 6 6 6" />),
        chevronR: (<path d="m10 6 6 6-6 6" />),
        instagram: (<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></>),
        facebook: (<path d="M15 3h-2a4 4 0 0 0-4 4v3H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2Z" />),
        youtube: (<><rect x="3" y="6" width="18" height="12" rx="4" /><path d="m11 9 4 3-4 3Z" fill="currentColor" stroke="none" /></>),
        whatsapp: (<><path d="M5 19l1-4a8 8 0 1 1 3 3l-4 1Z" /><path d="M9 10c0 4 1 5 5 5" /></>),
    };

    return <svg {...props}>{paths[name]}</svg>;
}

// 3D-styled hero illustration (built with layered SVG + gradients + drop-shadow).
// Renders a friendly mascot, three wheeled recycling bins, a school building,
// trees and a floating Earth sphere. A transparent PNG in public/images/sipesa/
// hero.png (via <Img>) still takes precedence.
function Hero3D() {
    // One wheeled bin with rounded 3D body, lid, white "A" badge & two wheels.
    const Bin3D = ({ color, dark, label, x, delay = 0 }) => (
        <g transform={`translate(${x} 232)`} className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
            {/* ground shadow */}
            <ellipse cx="40" cy="186" rx="40" ry="8" fill="#0f172a" opacity="0.10" />
            {/* wheels */}
            <circle cx="18" cy="170" r="11" fill="#1f2937" />
            <circle cx="18" cy="170" r="5" fill="#475569" />
            <circle cx="62" cy="170" r="11" fill="#1f2937" />
            <circle cx="62" cy="170" r="5" fill="#475569" />
            {/* body */}
            <path d="M6 26 Q40 12 74 26 L70 150 Q40 162 10 150 Z" fill={color} />
            {/* side shading */}
            <path d="M6 26 Q40 12 74 26 L66 150 Q40 162 14 150 Z" fill={dark} opacity="0.18" />
            {/* glossy highlight */}
            <path d="M16 30 Q22 24 28 30 L25 130 Q22 132 19 130 Z" fill="#ffffff" opacity="0.22" />
            {/* foot bar */}
            <rect x="8" y="146" width="64" height="14" rx="6" fill={dark} opacity="0.85" />
            {/* lid */}
            <path d="M2 22 Q40 -2 78 22 L72 38 Q40 50 8 38 Z" fill={dark} />
            <ellipse cx="40" cy="22" rx="36" ry="9" fill={color} opacity="0.55" />
            {/* white "A" badge */}
            <circle cx="40" cy="92" r="22" fill="#ffffff" />
            <circle cx="40" cy="92" r="22" fill="none" stroke={dark} strokeWidth="2" opacity="0.18" />
            <text x="40" y="101" textAnchor="middle" fill={dark} fontSize="28" fontWeight="800" fontFamily="Poppins, sans-serif">A</text>
            {/* label */}
            <text x="40" y="184" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700" fontFamily="Poppins, sans-serif">{label}</text>
        </g>
    );

    const Tree = ({ x, scale = 1, delay = 0 }) => (
        <g transform={`translate(${x} 250) scale(${scale})`} className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
            <rect x="-5" y="60" width="10" height="42" rx="4" fill="#78350f" />
            <path d="M0 -10 C-46 22 -40 70 0 70 C40 70 46 22 0 -10 Z" fill="#22c55e" />
            <path d="M0 4 C-34 30 -28 62 0 62 C28 62 34 30 0 4 Z" fill="#16a34a" opacity="0.55" />
            <circle cx="-20" cy="26" r="20" fill="#4ade80" opacity="0.55" />
            <circle cx="22" cy="30" r="22" fill="#4ade80" opacity="0.5" />
            <circle cx="0" cy="6" r="24" fill="#86efac" opacity="0.35" />
        </g>
    );

    return (
        <div className="relative mx-auto aspect-[1.08/1] w-full max-w-[580px]">
            {/* soft ambient glow */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_42%,rgba(34,197,94,0.18),transparent_62%)]" />
            <svg className="h-full w-full drop-shadow-[0_30px_45px_rgba(15,23,42,0.18)]" viewBox="0 0 580 540" role="img" aria-label="Ilustrasi 3D pengelolaan sampah SiPeSa">
                <defs>
                    <linearGradient id="h-sky" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#effbf3" /><stop offset="1" stopColor="#ffffff" /></linearGradient>
                    <linearGradient id="h-earth" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#38bdf8" /><stop offset="0.55" stopColor="#0ea5e9" /><stop offset="1" stopColor="#0369a1" /></linearGradient>
                    <linearGradient id="h-grass" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#86efac" /><stop offset="1" stopColor="#16a34a" /></linearGradient>
                    <linearGradient id="h-roof" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#16a34a" /><stop offset="1" stopColor="#15803d" /></linearGradient>
                    <linearGradient id="h-wall" x1="0" x2="1"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient>
                    <linearGradient id="h-uniform" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#22c55e" /><stop offset="1" stopColor="#15803d" /></linearGradient>
                    <linearGradient id="h-skin" x1="0" x2="1"><stop stopColor="#ffe0bd" /><stop offset="1" stopColor="#f4c493" /></linearGradient>
                    <linearGradient id="h-greenbin" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#4ade80" /><stop offset="1" stopColor="#15803d" /></linearGradient>
                    <linearGradient id="h-yellowbin" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fde047" /><stop offset="1" stopColor="#ca8a04" /></linearGradient>
                    <linearGradient id="h-bluebin" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#60a5fa" /><stop offset="1" stopColor="#1d4ed8" /></linearGradient>
                    <filter id="h-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.18" /></filter>
                </defs>

                {/* sky / backdrop */}
                <rect x="0" y="0" width="580" height="540" fill="url(#h-sky)" />

                {/* floating Earth sphere */}
                <g className="animate-float-slow" transform="translate(448 64)">
                    <circle cx="46" cy="46" r="46" fill="url(#h-earth)" />
                    <path d="M14 36c16-6 30-2 40 8 10-4 20-2 28 6v8c-12 6-26 4-36-4-12 6-26 4-34-6Z" fill="#22c55e" opacity="0.9" />
                    <path d="M22 60c10 8 22 6 30 0 8 6 18 6 26 0 4 8 0 18-8 22-12 6-28 4-38-4-8-6-12-12-10-18Z" fill="#16a34a" opacity="0.85" />
                    <ellipse cx="30" cy="24" rx="20" ry="10" fill="#ffffff" opacity="0.18" />
                    <circle cx="46" cy="46" r="46" fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.25" />
                    {/* orbit ring */}
                    <ellipse cx="46" cy="46" rx="60" ry="22" fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.45" transform="rotate(-22 46 46)" />
                </g>

                {/* school building */}
                <g className="animate-fade-in" style={{ animationDelay: '120ms' }} filter="url(#h-soft)">
                    <rect x="320" y="244" width="170" height="150" rx="12" fill="url(#h-wall)" />
                    <path d="M308 244 405 188l97 56Z" fill="url(#h-roof)" />
                    <rect x="388" y="300" width="34" height="94" rx="4" fill="#cbd5e1" />
                    <rect x="390" y="302" width="30" height="40" fill="#22c55e" opacity="0.18" />
                    <rect x="338" y="270" width="30" height="30" rx="4" fill="#bae6fd" />
                    <rect x="442" y="270" width="30" height="30" rx="4" fill="#bae6fd" />
                    <rect x="338" y="330" width="30" height="30" rx="4" fill="#bae6fd" />
                    <rect x="442" y="330" width="30" height="30" rx="4" fill="#bae6fd" />
                    {/* flag pole */}
                    <rect x="403" y="150" width="4" height="42" fill="#475569" />
                    <path d="M407 152l26 8-26 8Z" fill="#22c55e" />
                </g>

                {/* trees behind mascot */}
                <Tree x={120} scale={0.92} delay={180} />
                <Tree x={566} scale={1.1} delay={220} />

                {/* ground */}
                <ellipse cx="290" cy="476" rx="280" ry="40" fill="url(#h-grass)" />
                <ellipse cx="290" cy="472" rx="270" ry="30" fill="#bbf7d0" opacity="0.55" />

                {/* mascot */}
                <g className="animate-bounce-soft" filter="url(#h-soft)">
                    {/* shadow */}
                    <ellipse cx="180" cy="446" rx="70" ry="12" fill="#0f172a" opacity="0.14" />
                    {/* legs */}
                    <rect x="150" y="356" width="26" height="78" rx="12" fill="#1e3a8a" />
                    <rect x="186" y="356" width="26" height="78" rx="12" fill="#1e3a8a" />
                    <rect x="142" y="426" width="40" height="16" rx="7" fill="#0f172a" />
                    <rect x="180" y="426" width="40" height="16" rx="7" fill="#0f172a" />
                    {/* uniform torso */}
                    <path d="M126 268 Q180 244 234 268 L224 372 Q180 392 136 372 Z" fill="url(#h-uniform)" />
                    {/* collar / shirt accent */}
                    <path d="M158 252 180 280l22-28 12 16-34 30-34-30Z" fill="#ffffff" opacity="0.95" />
                    <path d="M168 272 180 290l12-18 8 10-20 22-20-22Z" fill="#dcfce7" />
                    {/* belt */}
                    <rect x="134" y="356" width="92" height="12" rx="4" fill="#14532d" />
                    <rect x="172" y="356" width="16" height="12" rx="3" fill="#fde047" />
                    {/* right arm -> thumbs up */}
                    <path d="M224 286c22-2 34 6 36 26 2 14-6 22-18 24-4-14-12-22-24-24Z" fill="url(#h-uniform)" />
                    <circle cx="244" cy="306" r="13" fill="url(#h-skin)" />
                    {/* thumbs up */}
                    <rect x="240" y="288" width="9" height="20" rx="4.5" fill="url(#h-skin)" />
                    <path d="M238 296c-4 0-6 4-3 7 2 2 6 1 6-2Z" fill="url(#h-skin)" />
                    {/* left arm */}
                    <path d="M138 286c-18 4-26 16-22 32 12 0 22-6 28-18Z" fill="url(#h-uniform)" />
                    <circle cx="118" cy="316" r="12" fill="url(#h-skin)" />
                    {/* neck */}
                    <rect x="170" y="232" width="22" height="26" rx="9" fill="url(#h-skin)" />
                    {/* head */}
                    <circle cx="181" cy="206" r="42" fill="url(#h-skin)" />
                    {/* hair under hat */}
                    <path d="M140 200c4-30 30-46 50-40 4 16-2 30-14 38-12-6-26-4-36 2Z" fill="#3f2a1d" opacity="0.0" />
                    {/* cap / hat */}
                    <path d="M139 184 Q181 152 223 184 L223 196 Q181 214 139 196 Z" fill="#15803d" />
                    <path d="M139 184 Q181 152 223 184 Q181 168 139 184 Z" fill="#22c55e" />
                    <ellipse cx="181" cy="184" rx="42" ry="9" fill="#166534" opacity="0.4" />
                    <rect x="123" y="188" width="116" height="9" rx="4.5" fill="#14532d" />
                    <circle cx="181" cy="166" r="7" fill="#fde047" />
                    {/* face */}
                    <circle cx="166" cy="206" r="4.5" fill="#1f2937" />
                    <circle cx="196" cy="206" r="4.5" fill="#1f2937" />
                    <circle cx="167" cy="204" r="1.5" fill="#fff" />
                    <circle cx="197" cy="204" r="1.5" fill="#fff" />
                    {/* smile */}
                    <path d="M168 222c8 8 18 8 26 0" fill="none" stroke="#9a4a2a" strokeWidth="3.5" strokeLinecap="round" />
                    {/* cheeks */}
                    <circle cx="158" cy="218" r="5" fill="#fb7185" opacity="0.4" />
                    <circle cx="204" cy="218" r="5" fill="#fb7185" opacity="0.4" />
                </g>

                {/* three wheeled bins */}
                <Bin3D color="#4ade80" dark="#15803d" label="Organik" x={296} delay={300} />
                <Bin3D color="#fde047" dark="#a16207" label="Anorganik" x={384} delay={360} />
                <Bin3D color="#60a5fa" dark="#1d4ed8" label="Daur Ulang" x={472} delay={420} />
            </svg>
        </div>
    );
}

// CSS dashboard preview (fallback when laptop PNG absent).
function DashboardPreview({ className = '' }) {
    const bars = [40, 70, 35, 85, 55, 95, 60];
    return (
        <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)] ${className}`}>
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-3 flex items-center gap-1.5 text-xs font-bold text-green-700"><BrandMark className="h-4 w-4" tone="green" /> SiPeSa</span>
            </div>
            <div className="grid grid-cols-[1fr_2.4fr] gap-3 p-4">
                <div className="hidden flex-col gap-1.5 text-[10px] font-semibold text-slate-500 sm:flex">
                    {['Beranda', 'Tong Sampah', 'Pengangkutan', 'Laporan', 'Peta', 'Pengaturan'].map((m, i) => (
                        <span key={m} className={`rounded-md px-2 py-1.5 ${i === 0 ? 'bg-green-50 text-green-700' : ''}`}>{m}</span>
                    ))}
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                        {[['36', 'green'], ['12', 'blue'], ['82%', 'green'], ['4', 'orange']].map(([v, t], i) => (
                            <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                                <p className={`text-sm font-extrabold ${t === 'blue' ? 'text-blue-600' : t === 'orange' ? 'text-orange-500' : 'text-green-600'}`}>{v}</p>
                                <p className="text-[8px] text-slate-400">Statistik</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-[1.4fr_1fr] gap-3">
                        <div className="rounded-lg border border-slate-100 p-3">
                            <p className="mb-2 text-[9px] font-bold text-slate-500">Pengangkutan Mingguan</p>
                            <div className="flex h-20 items-end gap-1.5">
                                {bars.map((h, i) => <span key={i} className="flex-1 rounded-t bg-green-500/80" style={{ height: `${h}%` }} />)}
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-100 p-3">
                            <p className="mb-2 self-start text-[9px] font-bold text-slate-500">Komposisi Sampah</p>
                            <div className="h-16 w-16 rounded-full" style={{ background: 'conic-gradient(#16a34a 0 50%, #f6b80d 50% 80%, #2563eb 80% 100%)' }}>
                                <div className="m-[22%] h-[56%] w-[56%] rounded-full bg-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// CSS map card (Tong #B-12 detail).
function MapCard() {
    const pins = [
        { x: '18%', y: '30%', c: 'bg-green-500' },
        { x: '62%', y: '22%', c: 'bg-amber-400' },
        { x: '40%', y: '50%', c: 'bg-blue-500' },
        { x: '78%', y: '58%', c: 'bg-green-500' },
        { x: '28%', y: '70%', c: 'bg-red-500' },
    ];
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)]">
            <div className="relative h-56 bg-[linear-gradient(0deg,#eef2f7_1px,transparent_1px),linear-gradient(90deg,#eef2f7_1px,transparent_1px)] bg-[size:26px_26px] bg-[#f8fafc]">
                <div className="absolute left-[10%] top-[40%] h-1.5 w-[55%] -rotate-6 rounded-full bg-green-200/70" />
                <div className="absolute left-[35%] top-[15%] h-[70%] w-1.5 rounded-full bg-blue-200/70" />
                {pins.map((p, i) => (
                    <span key={i} className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-full rounded-full ring-2 ring-white ${p.c}`} style={{ left: p.x, top: p.y, clipPath: 'polygon(50% 100%, 0 35%, 100% 35%)' }} />
                ))}
            </div>
            <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-slate-100 bg-white/95 p-3 backdrop-blur">
                <p className="text-sm font-extrabold text-slate-900">Tong #B-12</p>
                <dl className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="font-bold text-red-500">Penuh</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Jenis</dt><dd className="font-bold text-green-600">Organik</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Lokasi</dt><dd className="font-semibold text-slate-700">Gedung B Lt. 2</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Terakhir Diangkut</dt><dd className="font-semibold text-slate-700">2 jam yang lalu</dd></div>
                </dl>
            </div>
        </div>
    );
}

export default function Welcome({ canLogin, canRegister }) {
    const primaryHref = canRegister ? route('register') : canLogin ? route('login') : '#fitur';
    const year = new Date().getFullYear();

    return (
        <>
            <Head title="SiPeSa - Sistem Pengelolaan Sampah Digital" />
            <div className="min-h-screen overflow-hidden bg-white font-sans text-slate-950">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl animate-fade-in-down">
                    <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
                        <a href="#beranda" className="flex min-w-0 items-center gap-2.5">
                            <BrandMark className="h-9 w-9 shrink-0" tone="green" />
                            <div className="min-w-0 leading-none">
                                <p className="text-xl font-extrabold leading-none tracking-tight">
                                    <span className="text-slate-900">Si</span><span className="text-green-600">PeSa</span>
                                </p>
                                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">Pengelolaan Sampah Netzer</p>
                            </div>
                        </a>
                        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
                            {navItems.map((item, index) => (
                                <a key={item.href} href={item.href} className={`relative rounded-full px-4 py-2 text-sm font-semibold transition ${index === 0 ? 'text-green-700' : 'text-slate-600 hover:text-green-700'}`}>
                                    {item.label}
                                    {index === 0 && <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-green-600" />}
                                </a>
                            ))}
                        </nav>
                        <div className="ml-auto flex items-center gap-2 sm:gap-3">
                            <Link href={route('scanner')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 active:scale-[0.98]">
                                <Icon name="camera" className="h-4 w-4" /> Scan QR
                            </Link>
                            {canLogin && (
                                <Link href={route('login')} className="hidden sm:inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/25 transition hover:bg-green-700 active:scale-[0.98]">
                                    <Icon name="login" className="h-4 w-4" /> Login
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <main id="beranda">
                    {/* Hero */}
                    <section className="bg-[radial-gradient(circle_at_top_right,#ecfdf5,transparent_45%)]">
                        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:px-8 lg:pt-16">
                            <Reveal>
                                <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-xs font-semibold text-green-700 animate-fade-in-up">
                                    <Icon name="leaf" className="h-4 w-4" /> Netzer lebih bersih, data lebih rapi
                                </span>
                                <h1 className="mt-5 text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl lg:text-[58px]">
                                    Kelola Sampah{' '}
                                    <span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">Kampus Secara Digital</span>{' '}
                                    dan Terintegrasi
                                </h1>
                                <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                                    Pantau tong sampah, kelola pengangkutan, tindak lanjuti laporan siswa, dan buat laporan otomatis dalam satu sistem.
                                </p>
                                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                    <Link href={route('scanner')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-600/30 transition hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/40 active:scale-[0.98]">
                                        <Icon name="camera" className="h-5 w-5" /> Scan QR Tong
                                    </Link>
                                    <a href="#alur" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-6 py-3.5 text-sm font-bold text-slate-700 backdrop-blur transition hover:border-green-300 hover:text-green-700 active:scale-[0.98]">
                                        <Icon name="play" className="h-5 w-5" /> Lihat Demo
                                    </a>
                                </div>
                                <div className="mt-7 flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {['#16a34a', '#22c55e', '#84cc16', '#0e86c7'].map((c) => (
                                            <span key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c }} />
                                        ))}
                                    </div>
                                    <p className="text-xs leading-5 text-slate-500">Dipercaya oleh petugas kebersihan<br />dan admin di seluruh kampus (A&ndash;E)</p>
                                </div>
                            </Reveal>

                            <Reveal delay={120} className="relative">
                                <div className="animate-fade-in">
                                    <Img src={ASSET('hero.png')} alt="Ilustrasi pengelolaan sampah SiPeSa" className="mx-auto w-full max-w-[580px]" fallback={<Hero3D />} />
                                </div>
                                {/* Floating glass stat cards (right edge of the 3D container) */}
                                <div className="mt-6 flex flex-col gap-3 sm:absolute sm:right-[-8px] sm:top-1/2 sm:z-10 sm:mt-0 sm:w-56 sm:-translate-y-1/2">
                                    {heroStats.map((s, i) => (
                                        <div
                                            key={s.label}
                                            className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-lg shadow-slate-900/10 backdrop-blur-md animate-fade-in-up"
                                            style={{ animationDelay: `${400 + i * 120}ms` }}
                                        >
                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconToneStyles[s.tone]}`}>
                                                <Icon name={s.icon} className="h-5 w-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-lg font-extrabold leading-none tracking-tight text-slate-900">{s.value}</p>
                                                <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-slate-500">{s.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Reveal>
                        </div>
                    </section>

                    {/* Logo wall */}
                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 lg:flex-row lg:gap-8">
                            <p className="shrink-0 text-sm font-bold text-slate-500 lg:max-w-[120px]">Dipercaya oleh unit di seluruh kampus</p>
                            <div className="grid w-full grid-cols-4 gap-4 sm:grid-cols-8">
                                {trustedUnits.map((u) => (
                                    <div key={u} className="flex flex-col items-center gap-1.5">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-500 grayscale transition hover:text-slate-700">{u.charAt(0)}</span>
                                        <span className="text-center text-[10px] font-semibold text-slate-400">{u}</span>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </section>

                    {/* Dark stats band */}
                    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal className="grid grid-cols-2 gap-6 rounded-3xl bg-primary-950 p-8 sm:gap-8 lg:grid-cols-4 lg:p-10">
                            {bandStats.map((s) => (
                                <div key={s.label} className="flex items-center gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600/20 text-green-300">
                                        <Icon name={s.icon} className="h-6 w-6" />
                                    </span>
                                    <div>
                                        <p className="text-2xl font-extrabold leading-none text-white sm:text-3xl">{s.value}</p>
                                        <p className="mt-1.5 text-xs leading-tight text-green-100/80">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </Reveal>
                    </section>

                    {/* Features */}
                    <section id="fitur" className="mx-auto mt-24 max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
                        <Reveal className="text-center">
                            <p className="text-sm font-bold uppercase tracking-wide text-green-600">Fitur Utama</p>
                            <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                                Semua yang Anda Butuhkan dalam <span className="text-green-600">Satu Sistem</span>
                            </h2>
                        </Reveal>
                        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            {features.map((f, i) => (
                                <Reveal key={f.title} delay={(i % 6) * 60} className="group rounded-2xl border border-slate-200 bg-white p-6 text-center transition duration-200 hover:-translate-y-1.5 hover:border-green-200 hover:shadow-[0_22px_45px_-28px_rgba(22,101,52,0.5)]">
                                    <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${iconToneStyles[f.tone]}`}>
                                        <Icon name={f.icon} className="h-7 w-7" />
                                    </span>
                                    <h3 className="mt-5 text-sm font-extrabold text-slate-950">{f.title}</h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.desc}</p>
                                </Reveal>
                            ))}
                        </div>
                    </section>

                    {/* Workflow + dashboard preview */}
                    <section id="alur" className="mx-auto mt-24 max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            <Reveal>
                                <p className="text-sm font-bold uppercase tracking-wide text-green-600">Alur Sistem</p>
                                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Bagaimana SiPeSa Bekerja?</h2>
                                <ol className="mt-8 space-y-6">
                                    {workflow.map((step, index) => (
                                        <li key={step.title} className="relative flex gap-4">
                                            {index < workflow.length - 1 && <span className="absolute left-[19px] top-11 h-[calc(100%-12px)] w-px border-l border-dashed border-green-300" />}
                                            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-green-200 bg-white text-green-600">
                                                <Icon name={step.icon} className="h-5 w-5" />
                                                <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-extrabold text-white">{index + 1}</span>
                                            </span>
                                            <div className="pt-0.5">
                                                <h3 className="text-base font-extrabold text-slate-950">{step.title}</h3>
                                                <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </Reveal>
                            <Reveal delay={120}>
                                <Img src={ASSET('dashboard.png')} alt="Preview dashboard SiPeSa" className="w-full" fallback={<DashboardPreview />} />
                            </Reveal>
                        </div>
                    </section>

                    {/* Dashboard + Geolocation */}
                    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-10 lg:grid-cols-3">
                            <Reveal>
                                <p className="text-sm font-bold uppercase tracking-wide text-green-600">Dashboard</p>
                                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Pantau Semua Aktivitas dalam Sekali Lihat</h2>
                                <p className="mt-4 text-sm leading-7 text-slate-600">Dashboard interaktif memberikan informasi lengkap dan realtime untuk memudahkan pengelolaan sampah di seluruh unit kampus.</p>
                                {canLogin && (
                                    <Link href={route('login')} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 active:scale-[0.98]">
                                        Lihat Dashboard <Icon name="arrow" className="h-4 w-4" />
                                    </Link>
                                )}
                            </Reveal>
                            <Reveal delay={100}><MapCard /></Reveal>
                            <Reveal delay={200}>
                                <p className="text-sm font-bold uppercase tracking-wide text-green-600">Monitoring Lokasi</p>
                                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Peta Lokasi & Geolocation</h2>
                                <p className="mt-4 text-sm leading-7 text-slate-600">Lihat lokasi semua tong sampah dan petugas secara realtime. Sistem geolocation membantu pengangkutan lebih cepat dan terarah.</p>
                                <ul className="mt-5 space-y-3">
                                    {geoChecklist.map((c) => (
                                        <li key={c} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <Icon name="check" className="h-5 w-5 text-green-600" /> {c}
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                        </div>
                    </section>

                    {/* Testimonials */}
                    <section id="unit" className="mx-auto mt-24 max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
                        <Reveal className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-green-600">Testimoni</p>
                                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Apa Kata Mereka?</h2>
                            </div>
                            <div className="hidden gap-2 sm:flex">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-400"><Icon name="chevronL" className="h-5 w-5" /></span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-400"><Icon name="chevronR" className="h-5 w-5" /></span>
                            </div>
                        </Reveal>
                        <div className="mt-10 grid gap-6 lg:grid-cols-2">
                            {testimonials.map((t, i) => (
                                <Reveal key={t.name} delay={i * 100} className="rounded-2xl border border-slate-200 bg-white p-7">
                                    <Icon name="quote" className="h-7 w-7 text-green-200" />
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{t.quote}</p>
                                    <div className="mt-5 flex items-center gap-3">
                                        <Img src={ASSET(t.avatar)} alt={t.name} className="h-11 w-11 rounded-full object-cover" fallback={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 font-extrabold text-green-700">{t.name.charAt(0)}</span>} />
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900">{t.name}</p>
                                            <p className="text-xs text-slate-500">{t.role}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </section>

                    {/* CTA band */}
                    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-green-500 p-8 sm:p-10">
                            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr_auto]">
                                <Img src={ASSET('mascot.png')} alt="" className="hidden h-28 w-28 object-contain sm:block" fallback={<BrandMark className="hidden h-20 w-20 sm:block" tone="light" />} />
                                <div>
                                    <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">Siap Membuat Kampus Lebih Bersih dan Data Lebih Rapi?</h2>
                                    <p className="mt-2 max-w-xl text-sm leading-7 text-green-50">Bergabung sekarang dan rasakan kemudahan pengelolaan sampah digital.</p>
                                </div>
                                <Link href={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-green-700 transition hover:bg-green-50 active:scale-[0.98]">
                                    Mulai Sekarang <Icon name="leaf" className="h-4 w-4" />
                                </Link>
                            </div>
                        </Reveal>
                    </section>

                    {/* Footer */}
                    <footer id="kontak" className="mt-24 scroll-mt-24 bg-primary-950 text-green-50/80">
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <BrandMark className="h-8 w-8" tone="green" />
                                    <p className="text-xl font-extrabold text-white">SiPeSa</p>
                                </div>
                                <p className="mt-4 max-w-xs text-sm leading-7">Sistem Pengelolaan Sampah Digital untuk lingkungan kampus yang bersih, sehat, dan berkelanjutan.</p>
                                <div className="mt-5 flex gap-2">
                                    {['instagram', 'facebook', 'youtube', 'whatsapp'].map((s) => (
                                        <span key={s} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-green-100 transition hover:bg-green-600 hover:text-white">
                                            <Icon name={s} className="h-4 w-4" />
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {footerCols.map((col) => (
                                <div key={col.title}>
                                    <p className="text-sm font-bold uppercase tracking-wide text-white">{col.title}</p>
                                    <ul className="mt-4 space-y-2.5 text-sm">
                                        {col.items.map((it) => <li key={it}><a href="#beranda" className="transition hover:text-green-300">{it}</a></li>)}
                                    </ul>
                                </div>
                            ))}
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wide text-white">Kontak</p>
                                <ul className="mt-4 space-y-3 text-sm">
                                    <li className="flex gap-2.5"><Icon name="pinSmall" className="h-5 w-5 shrink-0 text-green-400" /> Kampus B Muhammadiyah Cileungsi, Jl. Raya Narogong KM. 23,5 Cileungsi, Bogor</li>
                                    <li className="flex items-center gap-2.5"><Icon name="mail" className="h-5 w-5 shrink-0 text-green-400" /> admin@sipesa.id</li>
                                    <li className="flex items-center gap-2.5"><Icon name="phone" className="h-5 w-5 shrink-0 text-green-400" /> +62 821-1234-5678</li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-white/10 py-5 text-center text-xs text-green-100/60">
                            © {year} SiPeSa. All rights reserved.
                        </div>
                    </footer>
                </main>
            </div>
        </>
    );
}
