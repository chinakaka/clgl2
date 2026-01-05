import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { TravelRequest, User, RequestStatus, StatusTranslation, FieldTranslation } from '../../types';
import { ArrowLeft, MessageSquare, Download, AlertCircle } from 'lucide-react';

interface UserRequestDetailProps {
    user: User;
}

const UserRequestDetail: React.FC<UserRequestDetailProps> = ({ user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<TravelRequest | null>(null);
    const [comment, setComment] = useState('');

    const refresh = async () => {
        if (id) {
            const data = await api.getRequestById(id);
            if (data) setRequest(data);
        }
    };

    useEffect(() => {
        refresh();
    }, [id]);

    if (!request) return <div>加载中...</div>;

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !comment.trim()) return;
        await api.addComment(id, user, comment);
        setComment('');
        refresh();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button onClick={() => navigate('/user/dashboard')} className="flex items-center text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回列表
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Main Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{request.data.purpose}</h1>
                                <p className="text-sm text-gray-500">单号: {request.id}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {(request.status === RequestStatus.SUBMITTED || request.status === RequestStatus.INFO_NEEDED) && (
                                    <button
                                        onClick={() => navigate(`/user/edit/${request.id}`)}
                                        className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-sm"
                                    >
                                        修改申请
                                    </button>
                                )}
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold 
                                ${request.status === RequestStatus.SUCCESS ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {StatusTranslation[request.status]}
                                </div>
                            </div>
                        </div>

                        {/* Booking Failure Banner */}
                        {request.status === RequestStatus.FAILED && request.bookingResult?.failureReason && (
                            <div className="bg-red-50 p-4 border-b border-red-100 flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-red-900 font-medium">预定失败</h4>
                                    <p className="text-red-700 text-sm mt-1">{request.bookingResult.failureReason}</p>
                                </div>
                            </div>
                        )}

                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {Object.entries(request.data).map(([key, value]) => {
                                if (key === 'travelers' || typeof value === 'object') return null;
                                return (
                                    <div key={key}>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                            {FieldTranslation[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                        <p className="text-gray-900 font-medium break-words">{String(value)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Travelers List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900">Travelers / 出行人员详情</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['name', 'idType', 'idNumber', 'idExpiryDate', 'phone'].map(key => (
                                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {FieldTranslation[key] || key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {request.data.travelers.map((traveler, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{traveler.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{traveler.idType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{traveler.idNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{traveler.idExpiryDate || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{traveler.phone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Attachments if Success */}
                    {request.status === RequestStatus.SUCCESS && request.bookingResult && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">预定凭证</h3>
                            <div className="space-y-3">
                                {request.bookingResult.files?.map((file, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 gap-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-indigo-50 rounded">
                                                <Download className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">预定确认单 {i + 1}</p>
                                                <p className="text-xs text-gray-500">PDF 文件</p>
                                            </div>
                                        </div>
                                        <a href={file} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                                            下载
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat/Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">沟通记录</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {request.comments.length === 0 && (
                            <div className="text-center text-gray-400 text-sm mt-10">暂无消息</div>
                        )}
                        {request.comments.map(c => (
                            <div key={c.id} className={`flex flex-col ${c.author === user.name ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 ${c.author === user.name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                    <p className="text-sm">{c.content}</p>
                                </div>
                                <span className="text-xs text-gray-400 mt-1">{c.author} • {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <form onSubmit={handleAddComment}>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="发送消息给管理员..."
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700">
                                    发送
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRequestDetail;