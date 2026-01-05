import React, { useEffect, useState } from 'react';
import { User, UserProfile as UserProfileType, IdentityDocument, Traveler } from '../../types';
import { api } from '../../services/api';
import { UserCircle, CreditCard, Save, Plus, Trash2, Users } from 'lucide-react';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [profile, setProfile] = useState<UserProfileType>({
    chineseName: '',
    englishName: '',
    nationality: '',
    gender: '男',
    birthday: '',
    birthPlace: '',
    phone: '',
    email: '',
    documents: [],
    contacts: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const data = await api.getUserProfile(user.id);
      setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await api.updateUserProfile(user.id, profile);
    setSaving(false);
    setMsg('保存成功');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // --- Document Logic ---
  const addDocument = () => {
    setProfile(prev => ({
      ...prev,
      documents: [...prev.documents, { type: '身份证', number: '', expiryDate: '' }]
    }));
  };

  const removeDocument = (index: number) => {
    const newDocs = [...profile.documents];
    newDocs.splice(index, 1);
    setProfile(prev => ({ ...prev, documents: newDocs }));
  };

  const updateDocument = (index: number, field: keyof IdentityDocument, value: string) => {
    const newDocs = [...profile.documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setProfile(prev => ({ ...prev, documents: newDocs }));
  };

  // --- Contact Logic ---
  const addContact = () => {
    setProfile(prev => ({
      ...prev,
      contacts: [...(prev.contacts || []), { name: '', idType: '身份证', idNumber: '', phone: '' }]
    }));
  };

  const removeContact = (index: number) => {
    const newContacts = [...(profile.contacts || [])];
    newContacts.splice(index, 1);
    setProfile(prev => ({ ...prev, contacts: newContacts }));
  };

  const updateContact = (index: number, field: keyof Traveler, value: string) => {
    const newContacts = [...(profile.contacts || [])];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setProfile(prev => ({ ...prev, contacts: newContacts }));
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">个人资料库</h1>
        {msg && <span className="text-green-600 font-medium bg-green-50 px-3 py-1 rounded">{msg}</span>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
            <div className="p-2 bg-orange-100 rounded text-orange-600 mr-3">
              <UserCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800">旅客信息 (本人)</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">中文名</label>
              <input
                type="text"
                name="chineseName"
                value={profile.chineseName}
                onChange={handleInputChange}
                className="w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-2 bg-transparent"
                placeholder="请输入中文名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">英文名 (拼音)</label>
              <input
                type="text"
                name="englishName"
                value={profile.englishName}
                onChange={handleInputChange}
                className="w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-2 bg-transparent"
                placeholder="LI / WANG"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">国籍 (国家/地区)</label>
              <input
                type="text"
                name="nationality"
                value={profile.nationality}
                onChange={handleInputChange}
                className="w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-2 bg-transparent"
                placeholder="中国大陆"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">性别</label>
              <div className="flex space-x-6 py-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="男"
                    checked={profile.gender === '男'}
                    onChange={handleInputChange}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>男</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="女"
                    checked={profile.gender === '女'}
                    onChange={handleInputChange}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>女</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">生日</label>
              <input
                type="date"
                name="birthday"
                value={profile.birthday}
                onChange={handleInputChange}
                className="w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-2 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">出生地</label>
              <input
                type="text"
                name="birthPlace"
                value={profile.birthPlace}
                onChange={handleInputChange}
                className="w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-2 bg-transparent"
                placeholder="未设置"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">手机号码</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                className="w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-2 bg-transparent"
                placeholder="139****0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                className="w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-2 bg-transparent"
                placeholder="user@example.com"
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded text-orange-600 mr-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-800">证件信息 (本人)</h3>
            </div>
            <button
              type="button"
              onClick={addDocument}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
            >
              <Plus className="w-4 h-4 mr-1" /> 添加证件
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {profile.documents.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">暂无证件信息</div>
            )}
            {profile.documents.map((doc, index) => (
              <div key={index} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50 relative">
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-400 mb-1">证件类型</label>
                  <select
                    value={doc.type}
                    onChange={(e) => updateDocument(index, 'type', e.target.value)}
                    className="w-full bg-transparent border-b md:border-none border-gray-200 focus:ring-0 p-0 font-medium text-gray-900 pb-2 md:pb-0"
                  >
                    <option value="身份证">身份证</option>
                    <option value="护照">护照</option>
                    <option value="港澳通行证">港澳通行证</option>
                    <option value="台胞证">台胞证</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs text-gray-400 mb-1">证件号码</label>
                  <input
                    type="text"
                    value={doc.number}
                    onChange={(e) => updateDocument(index, 'number', e.target.value)}
                    className="w-full bg-transparent border-b md:border-none border-gray-200 focus:ring-0 p-0 text-gray-900 pb-2 md:pb-0"
                    placeholder="请输入号码"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-400 mb-1">有效期</label>
                  <input
                    type="date"
                    value={doc.expiryDate}
                    onChange={(e) => updateDocument(index, 'expiryDate', e.target.value)}
                    className="w-full bg-transparent border-b md:border-none border-gray-200 focus:ring-0 p-0 text-gray-900 pb-2 md:pb-0"
                  />
                </div>
                <div className="md:col-span-2 text-right absolute top-6 right-6 md:static md:top-auto md:right-auto">
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frequent Contacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded text-blue-600 mr-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-800">常用联系人</h3>
            </div>
            <button
              type="button"
              onClick={addContact}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
            >
              <Plus className="w-4 h-4 mr-1" /> 添加联系人
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {(!profile.contacts || profile.contacts.length === 0) && (
              <div className="p-6 text-center text-gray-400 text-sm">暂无常用联系人</div>
            )}
            {profile.contacts?.map((contact, index) => (
              <div key={index} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50 relative">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">姓名</label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className="w-full bg-transparent border-b md:border-none border-gray-200 focus:ring-0 p-0 font-medium text-gray-900 pb-2 md:pb-0"
                    placeholder="姓名"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">证件类型</label>
                  <select
                    value={contact.idType}
                    onChange={(e) => updateContact(index, 'idType', e.target.value)}
                    className="w-full bg-transparent border-b md:border-none border-gray-200 focus:ring-0 p-0 text-gray-900 pb-2 md:pb-0"
                  >
                    <option value="身份证">身份证</option>
                    <option value="护照">护照</option>
                    <option value="港澳通行证">港澳通行证</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs text-gray-400 mb-1">证件号码</label>
                  <input
                    type="text"
                    value={contact.idNumber}
                    onChange={(e) => updateContact(index, 'idNumber', e.target.value)}
                    className="w-full bg-transparent border-b md:border-none border-gray-200 focus:ring-0 p-0 text-gray-900 pb-2 md:pb-0"
                    placeholder="请输入号码"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-400 mb-1">手机号</label>
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="w-full bg-transparent border-b md:border-none border-gray-200 focus:ring-0 p-0 text-gray-900 pb-2 md:pb-0"
                    placeholder="手机号"
                  />
                </div>
                <div className="md:col-span-1 text-right absolute top-6 right-6 md:static md:top-auto md:right-auto">
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-medium disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? '保存中...' : '保存更改'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfile;