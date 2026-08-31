const trashStatusMap = {
    kosong: 'bg-green-100 text-green-800',
    setengah_penuh: 'bg-yellow-100 text-yellow-800',
    penuh: 'bg-red-100 text-red-800',
    sudah_diangkut: 'bg-blue-100 text-blue-800',
};

const complaintStatusMap = {
    menunggu: 'bg-yellow-100 text-yellow-800',
    diproses: 'bg-blue-100 text-blue-800',
    selesai: 'bg-green-100 text-green-800',
    ditolak: 'bg-gray-100 text-gray-800',
};

const trashLabelMap = {
    kosong: 'Kosong',
    setengah_penuh: 'Setengah Penuh',
    penuh: 'Penuh',
    sudah_diangkut: 'Sudah Diangkut',
};

const complaintLabelMap = {
    menunggu: 'Menunggu',
    diproses: 'Diproses',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
};

export default function StatusBadge({ status, type = 'trash' }) {
    const statusMap = type === 'complaint' ? complaintStatusMap : trashStatusMap;
    const labelMap = type === 'complaint' ? complaintLabelMap : trashLabelMap;
    const colorClass = statusMap[status] || 'bg-gray-100 text-gray-800';
    const label = labelMap[status] || status;

    return (
        <span className={`inline-block rounded-full px-4 py-1 text-sm font-medium ${colorClass}`}>
            {label}
        </span>
    );
}
