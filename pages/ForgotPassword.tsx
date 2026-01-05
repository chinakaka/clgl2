
import React, { useState } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [identifier, setIdentifier] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [debugCode, setDebugCode] = useState<string | null>(null);

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.requestPasswordReset(identifier);
            if (res.success) {
                setStep(2);
                if (res.debugCode) setDebugCode(res.debugCode);
            } else {
                alert(res.message || '请求失败');
            }
        } catch (error) {
            alert('请求出错，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.confirmPasswordReset(identifier, code, newPassword);
            if (res.success) {
                alert('密码重置成功，请登录');
                navigate('/login');
            } else {
                alert(res.error || '重置失败'); // Handle 'res.error' if backend returns { error: ... }
            }
        } catch (error) {
            alert('请求出错');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {step === 1 ? '找回密码' : '重置密码'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {step === 1 ? '请输入您的账号或邮箱以获取验证码' : '请输入验证码和新密码'}
                    </p>
                </div>

                {step === 1 ? (
                    <form className="mt-8 space-y-6" onSubmit={handleRequestCode}>
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                                账号 / 邮箱
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm bg-gray-50/50 focus:bg-white"
                                    placeholder="请输入您的账号或邮箱"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                        >
                            {loading ? '发送中...' : '发送验证码'}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                返回登录
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        {debugCode && (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 text-center mb-4 border-dashed">
                                <span className="font-mono select-all">您的验证码是 {debugCode}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                验证码
                            </label>
                            <input
                                id="code"
                                name="code"
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="mt-2 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm bg-gray-50/50 focus:bg-white"
                                placeholder="请输入6位验证码"
                            />
                        </div>

                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                                新密码
                            </label>
                            <input
                                id="new-password"
                                name="new-password"
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-2 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm bg-gray-50/50 focus:bg-white"
                                placeholder="请输入新密码"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                        >
                            {loading ? '处理中...' : '确认修改密码'}
                        </button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                重新发送验证码
                            </button>
                        </div>
                    </form>
                )}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        返回首页
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
