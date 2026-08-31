import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center bg-warm-chalk">
            <div className="w-full sm:max-w-md mt-10 sm:mt-16 px-4">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-600">
                            <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-earth-heading">SiPeSa</span>
                        <span className="text-xs text-muted-earth -mt-1">Sistem Informasi Pengelolaan Sampah</span>
                    </Link>
                </div>

                <div className="bg-white rounded-xl border border-cloud-ash overflow-hidden">
                    {children}
                </div>

                <p className="mt-6 text-center text-xs text-muted-earth">
                    &copy; {new Date().getFullYear()} SiPeSa &mdash; Muhammadiyah Cileungsi
                </p>
            </div>
        </div>
    );
}
