import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import { TravelRequest, User, RequestStatus, StatusTranslation, TypeTranslation } from '../../types';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Search,
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  X as XIcon,
  MoreVertical,
  Loader2
} from 'lucide-react';

interface AdminWorkbenchProps {
  user: User;
}

type SortField = 'id' | 'type' | 'userName' | 'purpose' | 'status' | 'urgency';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortField;
  direction: SortDirection;
}

const AdminWorkbench: React.FC<AdminWorkbenchProps> = ({ user }) => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TODO' | 'PROCESSING' | 'FINISHED'>('TODO');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  const fetchRequests = useCallback(async () => {
    // We don't set global loading=true here to prevent UI flashing during background refreshes
    try {
      const data = await api.getRequests(user);
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRequests();
      setLoading(false);
    };
    init();
  }, [fetchRequests]);

  // Clear selection when changing tabs to avoid confusion
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  // --- Logic Helpers ---

  const handleSort = (key: SortField) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortField) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 text-indigo-600" />
      : <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // 1. Tab Filtering
    if (activeTab === 'TODO') {
      result = result.filter(r => [RequestStatus.SUBMITTED, RequestStatus.INFO_NEEDED].includes(r.status));
    } else if (activeTab === 'PROCESSING') {
      result = result.filter(r => [RequestStatus.ACCEPTED, RequestStatus.BOOKING].includes(r.status));
    } else if (activeTab === 'FINISHED') {
      result = result.filter(r => [RequestStatus.SUCCESS, RequestStatus.FAILED, RequestStatus.CANCELLED, RequestStatus.CLOSED].includes(r.status));
    }

    // 2. Search Filtering
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.userName.toLowerCase().includes(lowerTerm) ||
        r.id.toLowerCase().includes(lowerTerm) ||
        r.data.purpose.toLowerCase().includes(lowerTerm)
      );
    }

    // 3. Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (sortConfig.key) {
          case 'id':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'type':
            aValue = TypeTranslation[a.type];
            bValue = TypeTranslation[b.type];
            break;
          case 'userName':
            aValue = a.userName;
            bValue = b.userName;
            break;
          case 'purpose':
            aValue = a.data.purpose;
            bValue = b.data.purpose;
            break;
          case 'status':
            aValue = StatusTranslation[a.status];
            bValue = StatusTranslation[b.status];
            break;
          case 'urgency':
            aValue = a.data.urgency === 'URGENT' ? 1 : 0;
            bValue = b.data.urgency === 'URGENT' ? 1 : 0;
            break;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [requests, activeTab, searchTerm, sortConfig]);

  // Counts for tabs
  const todoCount = requests.filter(r => [RequestStatus.SUBMITTED, RequestStatus.INFO_NEEDED].includes(r.status)).length;
  const processingCount = requests.filter(r => [RequestStatus.ACCEPTED, RequestStatus.BOOKING].includes(r.status)).length;
  const finishedCount = requests.filter(r => [RequestStatus.SUCCESS, RequestStatus.FAILED, RequestStatus.CANCELLED, RequestStatus.CLOSED].includes(r.status)).length;

  // --- Selection Logic ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      const allIds = new Set(filteredRequests.map(r => r.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = filteredRequests.length > 0 && selectedIds.size === filteredRequests.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredRequests.length;

  // --- Deletion Logic ---
  const handleDelete = async (idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return;

    const confirmMessage = idsToDelete.length === 1
      ? "确定要删除这条任务吗？"
      : `确定要删除选中的 ${idsToDelete.length} 条任务吗？`;

    if (window.confirm(`${confirmMessage}\n注意：此操作不可撤销。`)) {
      setLoading(true); // Trigger loading state immediately
      try {
        await api.deleteRequests(idsToDelete);
        await fetchRequests();
        setSelectedIds(new Set()); // Clear selection after successful delete
      } catch (error) {
        console.error(error);
        alert("删除失败，请重试");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">处理中心</h1>
          <p className="text-gray-500 text-sm mt-1">
            管理和处理员工的差旅预定需求
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="搜索单号、姓名、用途..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('TODO')}
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${activeTab === 'TODO'
              ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md'
              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${activeTab === 'TODO' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
              <Inbox className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`font-bold ${activeTab === 'TODO' ? 'text-indigo-900' : 'text-gray-900'}`}>待办事项</p>
              <p className="text-xs text-gray-500">待受理 / 待补充</p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${activeTab === 'TODO' ? 'text-indigo-600' : 'text-gray-400'}`}>
            {todoCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROCESSING')}
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${activeTab === 'PROCESSING'
              ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-md'
              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${activeTab === 'PROCESSING' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`font-bold ${activeTab === 'PROCESSING' ? 'text-blue-900' : 'text-gray-900'}`}>处理中</p>
              <p className="text-xs text-gray-500">预定中 / 已受理</p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${activeTab === 'PROCESSING' ? 'text-blue-600' : 'text-gray-400'}`}>
            {processingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FINISHED')}
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${activeTab === 'FINISHED'
              ? 'bg-white border-gray-500 ring-1 ring-gray-500 shadow-md'
              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${activeTab === 'FINISHED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`font-bold ${activeTab === 'FINISHED' ? 'text-gray-900' : 'text-gray-900'}`}>已结束</p>
              <p className="text-xs text-gray-500">成功 / 失败 / 取消</p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${activeTab === 'FINISHED' ? 'text-gray-800' : 'text-gray-400'}`}>
            {finishedCount}
          </span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-sm text-indigo-600 font-medium mt-2">处理中...</span>
            </div>
          </div>
        )}

        {/* Conditional Header */}
        {selectedIds.size > 0 ? (
          <div className="bg-indigo-50 px-6 py-4 flex items-center justify-between border-b border-indigo-100 relative z-20">
            <span className="text-indigo-900 font-medium flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
              已选择 {selectedIds.size} 项
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer"
              >
                <XIcon className="w-4 h-4 mr-1 pointer-events-none" /> 取消
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(Array.from(selectedIds));
                }}
                className="flex items-center text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2 pointer-events-none" />
                批量删除
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 min-h-[64px] relative z-20">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === 'TODO' ? '待处理任务' : activeTab === 'PROCESSING' ? '进行中的预定' : '已归档订单'}
              </h3>
              <span className="text-sm text-gray-500">共 {filteredRequests.length} 条</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 w-10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAllSelected) setSelectedIds(new Set());
                    else setSelectedIds(new Set(filteredRequests.map(r => r.id)));
                  }}
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={handleSelectAll}
                    onClick={e => e.stopPropagation()}
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center space-x-1">
                    <span>单号/日期</span>
                    {getSortIcon('id')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>类型</span>
                    {getSortIcon('type')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>申请人</span>
                    {getSortIcon('userName')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('purpose')}
                >
                  <div className="flex items-center space-x-1">
                    <span>用途详情</span>
                    {getSortIcon('purpose')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>当前状态</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('urgency')}
                >
                  <div className="flex items-center space-x-1">
                    <span>紧急度</span>
                    {getSortIcon('urgency')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => navigate(`/admin/request/${req.id}`)}
                  className={`transition-colors cursor-pointer ${selectedIds.has(req.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap relative z-10" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      checked={selectedIds.has(req.id)}
                      onChange={(e) => handleSelectOne(req.id, e)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{req.id}</div>
                    <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{TypeTranslation[req.type]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{req.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{req.data.purpose}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${req.status === RequestStatus.SUBMITTED ? 'bg-indigo-100 text-indigo-800' :
                        req.status === RequestStatus.INFO_NEEDED ? 'bg-orange-100 text-orange-800' :
                          req.status === RequestStatus.BOOKING ? 'bg-blue-100 text-blue-800' :
                            req.status === RequestStatus.SUCCESS ? 'bg-green-100 text-green-800' :
                              req.status === RequestStatus.FAILED ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'}`}>
                      {StatusTranslation[req.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.data.urgency === 'URGENT' ? (
                      <span className="flex items-center text-red-600 text-xs font-bold">
                        <AlertCircle className="w-3 h-3 mr-1" /> 加急
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">普通</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative z-10">
                    <div
                      className="flex items-center justify-end space-x-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/admin/request/${req.id}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md cursor-pointer"
                      >
                        处理
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete([req.id]);
                        }}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Filter className="w-8 h-8 text-gray-300 mb-2" />
                      <p>该分类下暂无订单</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkbench;