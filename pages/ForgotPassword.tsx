import React, { useState } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, ArrowLeft, Mail, Key, Lock } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [debugCode, setDebugCode] = useState(''); // For demo purposes

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.requestPasswordReset(email);
            setStep(2);
            setSuccessMsg('验证码已发送！(请查看下方提示)');
            if (res.debugCode) {
                setDebugCode(res.debugCode);
            }
        } catch (err: any) {
            setError(err.message || '发送失败，请检查邮箱是否正确');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.confirmPasswordReset(email, code, newPassword);
            setSuccessMsg('密码重置成功！即将跳转登录页...');
            setTimeout(() => {
                navigate('/login');
            }, 1000000); // Intentionally long/placeholder, let user read success msg or use automated redirect
            // Actually, let's redirect faster
            setTimeout(() => {
                navigate('/'); // Redirect to login (assuming / is wrapped or redirects to login)
                // Or better:
                window.location.href = '#/'; // Force reload/nav
            }, 2000);
        } catch (err: any) {
            setError(err.message || '重置失败，验证码可能错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-apple-gray py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 glass p-8 rounded-3xl shadow-xl border border-white/20">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Key className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        {step === 1 ? '找回密码' : '重置密码'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {step === 1 ? '请输入您的注册邮箱以获取验证码' : '请输入收到的验证码和新密码'}
                    </p>
                </div>

                {step === 1 ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 ml-1 mb-1">邮箱地址</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
                                        placeholder="请输入您的邮箱"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50/50 p-2 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '发送中...' : '发送验证码'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleReset}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 ml-1 mb-1">验证码</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="code"
                                        name="code"
                                        type="text"
                                        required
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
                                        placeholder="6位验证码"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 ml-1 mb-1">新密码</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
                                        placeholder="设置新密码"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50/50 p-2 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="text-green-600 text-sm text-center bg-green-50/50 p-2 rounded-lg border border-green-100">
                                {successMsg}
                            </div>
                        )}

                        {debugCode && (
                            <div className="text-xs text-center text-gray-400 mt-2 bg-gray-100 p-2 rounded border border-dashed border-gray-300">
                                [演示环境] 您的验证码是: <span className="font-mono font-bold text-gray-800">{debugCode}</span>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '重置中...' : '确认修改密码'}
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
                        返回登录
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
