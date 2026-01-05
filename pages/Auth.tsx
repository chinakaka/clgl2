import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { Plane } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Pass password to login service
        const user = await api.login(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError('用户不存在或密码错误');
        }
      } else {
        if (!name || !email || !password) {
          setError('请填写所有必填项');
          setLoading(false);
          return;
        }
        const user = await api.register(name, email);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setName('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center rotate-3 transform shadow-lg">
            <Plane className="h-10 w-10 text-white -rotate-3" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? '登录 TripFlow' : '注册新账户'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">企业差旅管理系统</p>
        </div>

        <div className="bg-white py-8 px-10 shadow rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  姓名
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="您的真实姓名"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                账号 / 邮箱地址
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="admin 或 you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="********"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-end mb-4">
                <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  忘记密码？
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;