import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { TravelRequest, User, RequestStatus, StatusTranslation, TypeTranslation, FieldTranslation } from '../../types';
import { ArrowLeft, MessageSquare, Check, X, AlertTriangle, Upload, FileCheck, FileText, Loader2, Trash2, Edit, Save, Plus } from 'lucide-react';

interface AdminRequestDetailProps {
    user: User;
}

const AdminRequestDetail: React.FC<AdminRequestDetailProps> = ({ user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<TravelRequest | null>(null);
    const [comment, setComment] = useState('');

    // Action Modals State
    const [actionMode, setActionMode] = useState<'NONE' | 'COMPLETE' | 'FAIL' | 'INFO'>('NONE');
    const [bookingDetails, setBookingDetails] = useState({ orderId: '', price: '', platform: '' });
    const [failReason, setFailReason] = useState('');

    // File Upload State (For Initial Complete)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // File Editing State (For Modify existing result)
    const [isEditingFiles, setIsEditingFiles] = useState(false);
    const [tempFiles, setTempFiles] = useState<string[]>([]); // URLs/Base64 strings

    const refresh = async () => {
        if (id) {
            const data = await api.getRequestById(id);
            if (data) {
                setRequest(data);
                // Sync temp files if not editing
                if (!isEditingFiles) {
                    setTempFiles(data.bookingResult?.files || []);
                }
            }
        }
    };

    useEffect(() => {
        refresh();
    }, [id]);

    if (!request) return <div>加载中...</div>;

    const handleStatusChange = async (status: RequestStatus) => {
        if (!id) return;
        await api.updateStatus(id, status, user);
        refresh();
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !comment.trim()) return;
        await api.addComment(id, user, comment);
        setComment('');
        refresh();
    };

    // --- Initial Upload Logic ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Explicitly cast to File[] to avoid type issues with FileList
            const files = Array.from(e.target.files) as File[];
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCompleteBooking = async () => {
        if (!id) return;
        setIsUploading(true);

        // Convert files to Base64 to simulate storage in mock service
        const fileUrls = await Promise.all(selectedFiles.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
        }));

        await api.completeBooking(id, user, {
            ...bookingDetails,
            price: parseFloat(bookingDetails.price),
            files: fileUrls
        });

        setIsUploading(false);
        setActionMode('NONE');
        setBookingDetails({ orderId: '', price: '', platform: '' });
        setSelectedFiles([]); // Reset files
        refresh();
    };

    // --- Editing Files Logic ---
    const startEditingFiles = () => {
        setTempFiles(request.bookingResult?.files || []);
        setIsEditingFiles(true);
    };

    const cancelEditingFiles = () => {
        setTempFiles(request.bookingResult?.files || []);
        setIsEditingFiles(false);
    };

    const removeTempFile = (index: number) => {
        setTempFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddNewFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Explicitly cast to File[] to ensure map treats elements as File (subtype of Blob)
            const newFiles = Array.from(e.target.files) as File[];
            const newUrls = await Promise.all(newFiles.map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }));
            setTempFiles(prev => [...prev, ...newUrls]);
        }
        // Reset input value to allow re-uploading same file if needed
        e.target.value = '';
    };

    const saveFiles = async () => {
        if (!id) return;
        setIsUploading(true);
        await api.updateBookingFiles(id, user, tempFiles);
        setIsUploading(false);
        setIsEditingFiles(false);
        refresh();
    };

    const handleFailBooking = async () => {
        if (!id) return;
        await api.failBooking(id, user, failReason);
        setActionMode('NONE');
        refresh();
    };

    const openFile = (dataUrl: string) => {
        try {
            // Modern browsers block navigation to data: URLs in top frame.
            // Convert to Blob URL to bypass this restriction and allow opening/downloading.
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
            // Revoke after delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (e) {
            console.error("Failed to open file", e);
            alert("无法打开文件，请重试");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button onClick={() => navigate('/admin/dashboard')} className="flex items-center text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回列表
                </button>
                <div className="flex flex-wrap gap-2 md:gap-3">
                    {request.status === RequestStatus.SUBMITTED && (
                        <button
                            onClick={() => handleStatusChange(RequestStatus.ACCEPTED)}
                            className="flex-1 md:flex-none justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
                        >
                            受理需求
                        </button>
                    )}
                    {request.status === RequestStatus.ACCEPTED && (
                        <>
                            <button
                                onClick={() => handleStatusChange(RequestStatus.BOOKING)}
                                className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                            >
                                开始预定
                            </button>
                            <button
                                onClick={() => handleStatusChange(RequestStatus.INFO_NEEDED)}
                                className="flex-1 md:flex-none justify-center bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium shadow-sm"
                            >
                                要求补全信息
                            </button>
                        </>
                    )}
                    {request.status === RequestStatus.BOOKING && (
                        <>
                            <button
                                onClick={() => setActionMode('COMPLETE')}
                                className="flex-1 md:flex-none justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                预定成功
                            </button>
                            <button
                                onClick={() => setActionMode('FAIL')}
                                className="flex-1 md:flex-none justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium shadow-sm flex items-center"
                            >
                                <X className="w-4 h-4 mr-2" />
                                预定失败
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Request Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b border-gray-100 pb-4 gap-4">
                            <div className="w-full">
                                <h2 className="text-2xl font-bold text-gray-900 break-words">{request.data.purpose}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        {TypeTranslation[request.type]}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        {StatusTranslation[request.status]}
                                    </span>
                                    {request.data.urgency === 'URGENT' && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                            加急
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-left md:text-right min-w-fit">
                                <p className="text-sm text-gray-500">申请人</p>
                                <p className="font-medium text-gray-900">{request.userName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-sm">
                            {Object.entries(request.data).map(([key, value]) => {
                                if (key === 'travelers' || typeof value === 'object') return null;
                                return (
                                    <div key={key}>
                                        <p className="text-gray-500 capitalize">{FieldTranslation[key] || key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        <p className="font-medium text-gray-900">{String(value)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Booking Result (If Success) */}
                    {request.status === RequestStatus.SUCCESS && request.bookingResult && (
                        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${isEditingFiles ? 'bg-white border-green-300 ring-2 ring-green-100' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-green-900 flex items-center">
                                    <FileCheck className="w-5 h-5 mr-2" />
                                    预定确认
                                </h3>
                                {!isEditingFiles ? (
                                    <button
                                        onClick={startEditingFiles}
                                        className="text-xs flex items-center bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 transition-colors"
                                    >
                                        <Edit className="w-3 h-3 mr-1" /> 管理附件
                                    </button>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={cancelEditingFiles}
                                            className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={saveFiles}
                                            disabled={isUploading}
                                            className="text-xs flex items-center bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                            保存
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-green-700">订单号</p>
                                    <p className="font-bold text-green-900 break-all">{request.bookingResult.orderId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-green-700">预定平台</p>
                                    <p className="font-bold text-green-900">{request.bookingResult.platform}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-green-700">总价</p>
                                    <p className="font-bold text-green-900">¥{request.bookingResult.price}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-green-200/50">
                                <p className="text-sm text-green-700 mb-3 font-medium">附件管理 ({isEditingFiles ? tempFiles.length : request.bookingResult.files?.length || 0})</p>

                                {/* Files List */}
                                <div className="flex flex-col gap-2">
                                    {(isEditingFiles ? tempFiles : request.bookingResult.files)?.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white/60 p-2 rounded border border-green-100 hover:bg-white transition-colors">
                                            <div className="flex items-center space-x-2 overflow-hidden">
                                                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <button
                                                    onClick={() => openFile(f)}
                                                    className="text-sm text-green-800 underline hover:text-green-900 truncate max-w-[200px] sm:max-w-xs text-left"
                                                >
                                                    附件 {i + 1}
                                                </button>
                                            </div>
                                            {isEditingFiles && (
                                                <button
                                                    onClick={() => removeTempFile(i)}
                                                    className="text-gray-400 hover:text-red-500 p-1"
                                                    title="删除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Empty State */}
                                    {(!request.bookingResult.files?.length && !isEditingFiles) && (
                                        <span className="text-sm text-green-600/60 italic">无附件</span>
                                    )}
                                </div>

                                {/* Upload Area (Only in Edit Mode) */}
                                {isEditingFiles && (
                                    <div className="mt-3">
                                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-50/50 transition-colors">
                                            <input type="file" multiple onChange={handleAddNewFiles} className="hidden" />
                                            <div className="flex flex-col items-center text-green-600">
                                                <Plus className="w-5 h-5 mb-1" />
                                                <span className="text-xs font-medium">点击添加更多附件</span>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Activity & Chat */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px] lg:h-[600px]">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                活动日志
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {request.comments.map(c => (
                                <div key={c.id} className={`flex flex-col ${c.role === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-3 ${c.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-900' : 'bg-gray-100 text-gray-900'}`}>
                                        <p className="text-xs text-gray-500 mb-1 flex justify-between w-full min-w-[120px]">
                                            <span className="font-bold">{c.author}</span>
                                            <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </p>
                                        <p className="text-sm">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                            {request.history.map(h => (
                                <div key={h.id} className="flex justify-center">
                                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                        {h.actor} {h.action.toLowerCase().replace(/_/g, ' ')} • {new Date(h.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            <form onSubmit={handleAddComment}>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="添加备注或回复..."
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button type="submit" className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-800">
                                        发送
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modals - Full screen on mobile */}
            {actionMode === 'COMPLETE' && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">完成预定</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">预定平台</label>
                                <input type="text" className="w-full border p-2 rounded" value={bookingDetails.platform} onChange={e => setBookingDetails({ ...bookingDetails, platform: e.target.value })} placeholder="例：携程、航司官网" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">订单号</label>
                                <input type="text" className="w-full border p-2 rounded" value={bookingDetails.orderId} onChange={e => setBookingDetails({ ...bookingDetails, orderId: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">总金额</label>
                                <input type="number" className="w-full border p-2 rounded" value={bookingDetails.price} onChange={e => setBookingDetails({ ...bookingDetails, price: e.target.value })} placeholder="0.00" />
                            </div>

                            {/* File Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">上传附件</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative bg-gray-50/50">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="mx-auto w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-500">点击或拖拽上传行程单/凭证</p>
                                    <p className="text-xs text-gray-400 mt-1">支持 PDF, JPG, PNG</p>
                                </div>

                                {/* File List */}
                                {selectedFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                                <div className="flex items-center overflow-hidden">
                                                    <FileText className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                    <span className="text-xs text-gray-400 ml-2">({(file.size / 1024).toFixed(0)} KB)</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="text-gray-400 hover:text-red-500 ml-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-100">
                            <button onClick={() => setActionMode('NONE')} className="flex-1 sm:flex-none px-4 py-2 border rounded hover:bg-gray-50">取消</button>
                            <button
                                onClick={handleCompleteBooking}
                                disabled={isUploading}
                                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                确认完成
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {actionMode === 'FAIL' && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center space-x-2 text-red-600 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-bold">标记为失败</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">请填写失败原因，这将发送给申请人。</p>
                        <textarea
                            className="w-full border p-2 rounded h-24"
                            value={failReason}
                            onChange={e => setFailReason(e.target.value)}
                            placeholder="例：无票、价格超标、信息错误..."
                        />
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setActionMode('NONE')} className="flex-1 sm:flex-none px-4 py-2 border rounded hover:bg-gray-50">取消</button>
                            <button onClick={handleFailBooking} className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">确认失败</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRequestDetail;