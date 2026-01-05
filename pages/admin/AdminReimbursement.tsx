import React, { useEffect, useState } from 'react';
import { User, Reimbursement, ReimbursementStatus, ReimbursementCategoryTranslation } from '../../types';
import { api } from '../../services/api';
import { Check, X, FileText, PieChart as PieChartIcon, TrendingUp, DollarSign, Clock, CheckCircle, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AdminReimbursementProps {
    user: User;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

const AdminReimbursement: React.FC<AdminReimbursementProps> = ({ user }) => {
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await api.getReimbursements(user);
        setReimbursements(data);
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        if (action === 'APPROVE') {
            if (window.confirm('确定通过这笔报销申请吗？')) {
                await api.updateReimbursementStatus(id, ReimbursementStatus.APPROVED, user);
                fetchData();
            }
        } else {
            setRejectId(id);
        }
    };

    const confirmReject = async () => {
        if (!rejectId) return;
        await api.updateReimbursementStatus(rejectId, ReimbursementStatus.REJECTED, user, rejectReason);
        setRejectId(null);
        setRejectReason('');
        fetchData();
    };

    // Stats Calculation
    const totalAmount = reimbursements.filter(r => r.status === ReimbursementStatus.APPROVED).reduce((acc, r) => acc + r.amount, 0);
    const pendingCount = reimbursements.filter(r => r.status === ReimbursementStatus.PENDING).length;
    const pendingAmount = reimbursements.filter(r => r.status === ReimbursementStatus.PENDING).reduce((acc, r) => acc + r.amount, 0);

    // Category Data for Chart
    const categoryDataMap = reimbursements.filter(r => r.status === ReimbursementStatus.APPROVED).reduce((acc, r) => {
        const label = ReimbursementCategoryTranslation[r.category];
        acc[label] = (acc[label] || 0) + r.amount;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.keys(categoryDataMap).map(key => ({ name: key, value: categoryDataMap[key] }));

    const openFile = (dataUrl: string) => {
        try {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || '';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (e) {
            alert("无法预览文件");
        }
    };

    const downloadFile = (dataUrl: string, namePrefix: string) => {
        try {
            const arr = dataUrl.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);

            // Guess extension
            let ext = '';
            if (mime.includes('image/jpeg')) ext = '.jpg';
            else if (mime.includes('image/png')) ext = '.png';
            else if (mime.includes('application/pdf')) ext = '.pdf';

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${namePrefix}${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (e) {
            alert("无法下载文件");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">报销审批控制台</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">累计已报销</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">¥{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">待审批金额</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">¥{pendingAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">待处理单据</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{pendingCount} <span className="text-sm font-normal text-gray-400">笔</span></p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">审批列表</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请人</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">凭证</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reimbursements.filter(r => r.status === ReimbursementStatus.PENDING).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">暂无待审批的报销单</td>
                                    </tr>
                                )}
                                {reimbursements.filter(r => r.status === ReimbursementStatus.PENDING).map(r => (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{r.userName}</div>
                                            <div className="text-xs text-gray-500">{r.date}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mb-1">
                                                {ReimbursementCategoryTranslation[r.category]}
                                            </span>
                                            <p className="text-sm text-gray-600 truncate max-w-[150px]">{r.description}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            ¥{r.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.attachments.length > 0 ? (
                                                <div className="flex gap-2">
                                                    {r.attachments.map((file, i) => (
                                                        <div key={i} className="flex space-x-1">
                                                            <button onClick={() => openFile(file)} className="p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100" title="预览">
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => downloadFile(file, `凭证-${r.userName}-${i + 1}`)} className="p-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100" title="下载">
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span className="text-xs text-gray-400">无</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleAction(r.id, 'APPROVE')}
                                                className="text-green-600 hover:text-green-800 font-medium text-sm border border-green-200 bg-green-50 px-3 py-1 rounded"
                                            >
                                                通过
                                            </button>
                                            <button
                                                onClick={() => handleAction(r.id, 'REJECT')}
                                                className="text-red-600 hover:text-red-800 font-medium text-sm border border-red-200 bg-red-50 px-3 py-1 rounded"
                                            >
                                                驳回
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stats Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <PieChartIcon className="w-4 h-4 mr-2" /> 报销类别占比 (已通过)
                    </h3>
                    <div className="h-64 w-full">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                        )}
                    </div>
                    <div className="mt-4 space-y-2">
                        {categoryData.map((d, i) => (
                            <div key={i} className="flex justify-between text-xs text-gray-600">
                                <div className="flex items-center">
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                    {d.name}
                                </div>
                                <span className="font-medium">¥{d.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {rejectId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">驳回申请</h3>
                        <p className="text-sm text-gray-500 mb-4">请填写驳回原因，将通知给申请人。</p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full border p-2 rounded-lg h-24 mb-4"
                            placeholder="例：凭证模糊、费用超标..."
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setRejectId(null)} className="px-4 py-2 border rounded-lg">取消</button>
                            <button onClick={confirmReject} className="px-4 py-2 bg-red-600 text-white rounded-lg">确认驳回</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReimbursement;