import React, { useEffect, useState, useMemo } from 'react';
import { mockService } from '../../services/mockService';
import { TravelRequest, User, RequestStatus, StatusTranslation, TypeTranslation } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Briefcase,
  Filter,
  Search,
  Calendar,
  X,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({ start: '', end: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const data = await mockService.getRequests(user);
      setRequests(data);
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  // --- Filtering Logic ---

  // 1. Get Unique Users for Dropdown
  const userOptions = useMemo(() => {
    const uniqueUsersMap = new Map();
    requests.forEach(req => {
      if (!uniqueUsersMap.has(req.userId)) {
        uniqueUsersMap.set(req.userId, req.userName);
      }
    });
    return Array.from(uniqueUsersMap.entries()).map(([id, name]) => ({ id, name }));
  }, [requests]);

  // 2. Filter Requests based on selection & date
  const filteredRequests = useMemo(() => {
    let result = requests;

    // User Filter
    if (selectedUserId !== 'ALL') {
      result = result.filter(r => r.userId === selectedUserId);
    }

    // Date Range Filter
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.createdAt).getTime() >= start.getTime());
    }
    
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.createdAt).getTime() <= end.getTime());
    }

    return result;
  }, [requests, selectedUserId, dateRange]);

  // --- Statistics Logic (Based on filteredRequests) ---

  // 1. Core Counts
  const pendingCount = filteredRequests.filter(r => r.status === RequestStatus.SUBMITTED).length;
  
  // 2. Financials (Only SUCCESS orders)
  const completedRequests = filteredRequests.filter(r => r.status === RequestStatus.SUCCESS);
  const totalSpend = completedRequests.reduce((acc, curr) => acc + (curr.bookingResult?.price || 0), 0);
  const avgOrderValue = completedRequests.length > 0 ? totalSpend / completedRequests.length : 0;

  // 3. User Stats
  const activeUsersCount = new Set(filteredRequests.map(r => r.userId)).size;

  // 4. Chart Data: Spend by Month (Last 6 Months or Dynamic based on range)
  const getMonthKey = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const trendDataMap = completedRequests.reduce((acc, curr) => {
    const key = getMonthKey(curr.createdAt);
    acc[key] = (acc[key] || 0) + (curr.bookingResult?.price || 0);
    return acc;
  }, {} as Record<string, number>);

  // Sort keys
  const trendData = Object.keys(trendDataMap).sort().map(key => ({
    name: key,
    amount: trendDataMap[key]
  }));

  // 5. Chart Data: Spend by Category
  const categorySpendMap = completedRequests.reduce((acc, curr) => {
    const typeName = TypeTranslation[curr.type];
    acc[typeName] = (acc[typeName] || 0) + (curr.bookingResult?.price || 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.keys(categorySpendMap).map(key => ({
    name: key,
    value: categorySpendMap[key]
  }));

  // 6. Chart Data: Top Spenders
  const employeeSpendMap = completedRequests.reduce((acc, curr) => {
    acc[curr.userName] = (acc[curr.userName] || 0) + (curr.bookingResult?.price || 0);
    return acc;
  }, {} as Record<string, number>);

  const topSpendersData = Object.keys(employeeSpendMap)
    .map(key => ({ name: key, amount: employeeSpendMap[key] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Top 5

  // 7. Status Distribution
  const statusDist = filteredRequests.reduce((acc, curr) => {
    const status = StatusTranslation[curr.status];
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusData = Object.keys(statusDist).map(key => ({ name: key, value: statusDist[key] }));

  // Helper to clear filters
  const clearFilters = () => {
    setSelectedUserId('ALL');
    setDateRange({ start: '', end: '' });
  };

  const isFiltered = selectedUserId !== 'ALL' || dateRange.start !== '' || dateRange.end !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理员数据中心</h1>
          <p className="text-gray-500 text-sm mt-1">
             {selectedUserId === 'ALL' ? '全公司差旅数据概览' : `员工 [${userOptions.find(u => u.id === selectedUserId)?.name}] 个人差旅分析`}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          
          {/* Employee Filter */}
          <div className="flex items-center space-x-2 w-full lg:w-auto">
             <div className="flex items-center text-gray-500 bg-gray-50 px-3 py-2 rounded-l-md border border-r-0 border-gray-300">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium whitespace-nowrap">员工</span>
             </div>
             <div className="relative flex-1 lg:w-48">
               <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 rounded-r-md border focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
               >
                 <option value="ALL">全部员工</option>
                 {userOptions.map(u => (
                   <option key={u.id} value={u.id}>{u.name}</option>
                 ))}
               </select>
             </div>
          </div>

          {/* Separator */}
          <div className="hidden lg:block w-px h-8 bg-gray-200 mx-2"></div>

          {/* Date Range Filter */}
          <div className="flex items-center space-x-2 w-full lg:w-auto flex-1">
            <div className="flex items-center text-gray-500 bg-gray-50 px-3 py-2 rounded-l-md border border-r-0 border-gray-300">
               <Calendar className="w-4 h-4 mr-2" />
               <span className="text-sm font-medium whitespace-nowrap">预定日期</span>
            </div>
            <div className="flex items-center space-x-0 border border-gray-300 rounded-r-md overflow-hidden flex-1">
               <input 
                 type="date" 
                 value={dateRange.start}
                 onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                 className="block w-full min-w-[100px] pl-2 pr-1 py-2 text-xs sm:text-sm border-none focus:ring-0 text-gray-700"
               />
               <span className="text-gray-400 bg-white px-1 text-sm">-</span>
               <input 
                 type="date" 
                 value={dateRange.end}
                 onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                 className="block w-full min-w-[100px] pl-1 pr-2 py-2 text-xs sm:text-sm border-none focus:ring-0 text-gray-700"
               />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-2 lg:pt-0 w-full lg:w-auto">
             {isFiltered && (
               <button
                  onClick={clearFilters}
                  className="flex-1 lg:flex-none justify-center flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
               >
                 <X className="w-4 h-4 mr-1.5" /> 重置
               </button>
             )}
             <button 
                className="flex-1 lg:flex-none justify-center flex items-center px-5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
             >
               <Search className="w-4 h-4 mr-1.5" /> 查询
             </button>
          </div>
        </div>
      </div>

      {/* 1. Core Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">累计支出</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥{totalSpend.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-green-600 flex items-center">
             <TrendingUp className="w-3 h-3 mr-1" /> {selectedUserId === 'ALL' ? '全员总计' : '个人累计'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">累计订单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredRequests.length}</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-gray-500">
             待处理: <span className="text-orange-500 font-bold">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">平均客单价</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥{Math.round(avgOrderValue).toLocaleString()}</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-gray-500">
             基于筛选范围内订单
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">{selectedUserId === 'ALL' ? '涉及员工' : '筛选状态'}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {selectedUserId === 'ALL' ? activeUsersCount : 'Active'}
              </p>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {isFiltered ? '筛选结果' : '全量统计'}
          </div>
        </div>
      </div>

      {/* 2. Charts Row 1: Trend & Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spend Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 mb-6">支出趋势 (按预定时间)</h3>
           {trendData.length > 0 ? (
             <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trendData}>
                   <defs>
                     <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `¥${value/1000}k`} />
                   <Tooltip 
                      formatter={(value: number) => [`¥${value.toLocaleString()}`, '支出']}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                   />
                   <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="h-72 w-full flex items-center justify-center text-gray-400">当前筛选范围内暂无数据</div>
           )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 mb-6">支出占比</h3>
           {categoryData.length > 0 ? (
             <>
               <div className="h-72 w-full flex justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={categoryData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
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
               </div>
               <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {categoryData.map((d, i) => (
                    <div key={d.name} className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                      <span className="truncate">{d.name}</span>
                    </div>
                  ))}
               </div>
             </>
           ) : (
             <div className="h-72 w-full flex items-center justify-center text-gray-400">暂无数据</div>
           )}
        </div>
      </div>

      {/* 3. Charts Row 2: Top Employees & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spenders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 mb-6">
             {selectedUserId === 'ALL' ? '员工支出排行 (Top 5)' : '个人支出总览'}
           </h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={topSpendersData} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 12, fill: '#4b5563'}} />
                 <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                 <Bar dataKey="amount" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Order Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 mb-6">订单状态分布</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={statusData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11}} interval={0} />
                 <YAxis axisLine={false} tickLine={false} />
                 <Tooltip />
                 <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* 4. Filtered Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">
            订单列表 ({filteredRequests.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用途</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.slice(0, 15).map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{TypeTranslation[req.type]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{req.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{req.data.purpose}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${req.status === RequestStatus.SUBMITTED ? 'bg-blue-100 text-blue-800' : 
                        req.status === RequestStatus.SUCCESS ? 'bg-green-100 text-green-800' : 
                        req.status === RequestStatus.FAILED ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {StatusTranslation[req.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                     {req.bookingResult?.price ? `¥${req.bookingResult.price.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => navigate(`/admin/request/${req.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      处理
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                     <div className="flex flex-col items-center justify-center">
                        <Filter className="w-8 h-8 text-gray-300 mb-2" />
                        <p>没有找到符合条件的订单</p>
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

export default AdminDashboard;