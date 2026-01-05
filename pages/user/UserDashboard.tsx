import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TravelRequest, User, RequestStatus, StatusTranslation, TypeTranslation } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';

interface UserDashboardProps {
  user: User;
}

const statusColors: Record<string, string> = {
  [RequestStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [RequestStatus.ACCEPTED]: 'bg-indigo-100 text-indigo-800',
  [RequestStatus.INFO_NEEDED]: 'bg-yellow-100 text-yellow-800',
  [RequestStatus.BOOKING]: 'bg-purple-100 text-purple-800',
  [RequestStatus.SUCCESS]: 'bg-green-100 text-green-800',
  [RequestStatus.FAILED]: 'bg-red-100 text-red-800',
  [RequestStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  [RequestStatus.CLOSED]: 'bg-gray-200 text-gray-700',
};

const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const data = await api.getRequests(user);
      setRequests(data);
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  const filteredRequests = requests.filter(req => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return [RequestStatus.SUBMITTED, RequestStatus.ACCEPTED, RequestStatus.BOOKING, RequestStatus.INFO_NEEDED].includes(req.status);
    if (filter === 'COMPLETED') return [RequestStatus.SUCCESS, RequestStatus.CLOSED].includes(req.status);
    return true;
  });

  const getFilterLabel = (key: string) => {
    switch (key) {
      case 'ALL': return '全部';
      case 'ACTIVE': return '进行中';
      case 'COMPLETED': return '已完成';
      default: return key;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">我的需求</h1>
          <p className="text-gray-500 mt-1">追踪您的差旅预定状态</p>
        </div>
        <Link
          to="/user/create"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-apple-blue text-white rounded-full hover:bg-blue-600 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          新建需求
        </Link>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/20 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200/50 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {['ALL', 'ACTIVE', 'COMPLETED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${filter === f
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
            >
              {getFilterLabel(f)}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100/50">
          {loading ? (
            <div className="p-12 text-center text-gray-500">加载中...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto h-16 w-16 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">暂无需求</h3>
              <p className="text-gray-500 mt-2">开始创建您的第一个差旅需求吧。</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/user/request/${req.id}`)}
                className="p-6 hover:bg-white/40 cursor-pointer transition-all duration-200 block group"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-900 text-lg">{req.data.purpose}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${statusColors[req.status] || 'bg-gray-100'}`}>
                        {StatusTranslation[req.status]}
                      </span>
                      {req.data.urgency === 'URGENT' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                          加急
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-3 font-medium">
                      <span>{TypeTranslation[req.type]}</span>
                      <span className="text-gray-300">•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-mono text-xs text-gray-400">ID: {req.id.split('-')[1]}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 flex items-center">
                      <span className="bg-gray-100/50 px-2 py-1 rounded-md">
                        {req.type === 'FLIGHT' && (req.data as any).departureCity + ' ➔ ' + (req.data as any).arrivalCity}
                        {req.type === 'HOTEL' && (req.data as any).city + ', ' + (req.data as any).checkInDate}
                        {req.type === 'CAR_RENTAL' && (req.data as any).pickupCity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Actions for active requests */}
                    {(req.status === RequestStatus.SUBMITTED || req.status === RequestStatus.INFO_NEEDED) && (
                      <div className="flex items-center space-x-2 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/user/edit/${req.id}`);
                          }}
                          className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-sm font-medium transition-colors shadow-sm"
                        >
                          修改
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('确定要删除此订单吗？此操作无法撤销。')) {
                              try {
                                await api.deleteRequest(req.id, user.id);
                                setRequests(prev => prev.filter(r => r.id !== req.id));
                              } catch (err: any) {
                                alert(err.message || '删除失败');
                              }
                            }
                          }}
                          className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium transition-colors shadow-sm"
                        >
                          删除
                        </button>
                      </div>
                    )}
                    <div className="flex items-center text-gray-400 group-hover:text-apple-blue transition-colors group-hover:translate-x-1 duration-200">
                      <span className="text-sm font-medium">查看详情 &rarr;</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
