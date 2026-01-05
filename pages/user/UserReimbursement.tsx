
import React, { useEffect, useState } from 'react';
import { User, Reimbursement, ReimbursementStatus, ReimbursementCategory, ReimbursementCategoryTranslation } from '../../types';
import { api } from '../../services/api';
import { Plus, Upload, X, FileText, CheckCircle, AlertCircle, Clock, Search, Loader2 } from 'lucide-react';

interface UserReimbursementProps {
  user: User;
}

const UserReimbursement: React.FC<UserReimbursementProps> = ({ user }) => {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: ReimbursementCategory.MEALS,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const data = await api.getReimbursements(user);
    setReimbursements(data);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    setSubmitting(true);

    // Convert files to Base64
    const fileUrls = await Promise.all(attachments.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }));

    await api.createReimbursement(user, {
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      attachments: fileUrls
    });

    setSubmitting(false);
    setShowModal(false);
    setFormData({
      amount: '',
      category: ReimbursementCategory.MEALS,
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setAttachments([]);
    fetchData();
  };

  const getStatusBadge = (status: ReimbursementStatus) => {
    switch (status) {
      case ReimbursementStatus.APPROVED:
        return <span className="flex items-center text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs font-medium"><CheckCircle className="w-3 h-3 mr-1" /> 已通过</span>;
      case ReimbursementStatus.REJECTED:
        return <span className="flex items-center text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs font-medium"><AlertCircle className="w-3 h-3 mr-1" /> 已驳回</span>;
      default:
        return <span className="flex items-center text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-xs font-medium"><Clock className="w-3 h-3 mr-1" /> 审批中</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的报销</h1>
          <p className="text-gray-500 text-sm mt-1">上传凭证并跟踪报销进度</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5 mr-1.5" /> 新建报销
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : reimbursements.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">暂无报销记录</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报销单号/日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类别</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">附件</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reimbursements.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{r.id}</div>
                      <div className="text-xs text-gray-500">{r.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {ReimbursementCategoryTranslation[r.category]}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {r.description}
                      {r.rejectionReason && (
                        <p className="text-red-600 text-xs mt-1">驳回原因: {r.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {r.attachments.length} 个文件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ¥{r.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end">
                      {getStatusBadge(r.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">新建报销申请</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">报销类别</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ReimbursementCategory })}
                    className="w-full border p-2 rounded-lg bg-white"
                  >
                    {Object.entries(ReimbursementCategoryTranslation).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">发生日期</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border p-2 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">报销金额 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border p-2 rounded-lg text-lg font-bold"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">费用说明</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border p-2 rounded-lg h-24"
                  placeholder="请描述费用产生的具体情况..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传凭证 (发票/小票)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto w-6 h-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">点击或拖拽上传图片/PDF</p>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReimbursement;
