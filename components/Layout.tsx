import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Role } from '../types';
import {
  Plane,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  UserCircle,
  ClipboardList,
  BarChart3,
  Receipt,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return <div className="min-h-screen bg-apple-gray">{children}</div>;
  }

  const isAdmin = user.role === Role.ADMIN;

  const NavItem = ({ to, icon: Icon, label, mobile = false }: { to: string, icon: any, label: string, mobile?: boolean }) => (
    <Link
      to={to}
      className={`
        ${mobile
          ? 'flex flex-col items-center justify-center p-2 text-xs space-y-1'
          : 'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200'
        }
        ${isActive(to)
          ? 'text-apple-blue font-semibold ' + (!mobile ? 'bg-white/50 backdrop-blur-sm shadow-sm' : '')
          : 'text-gray-500 hover:text-gray-900 hover:bg-white/30'
        }
      `}
    >
      <Icon className={`${mobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
      <span>{label}</span>
    </Link>
  );

  const navLinks = isAdmin ? [
    { to: '/admin/workbench', icon: ClipboardList, label: '处理中心' },
    { to: '/admin/stats', icon: BarChart3, label: '数据统计' },
    { to: '/admin/reimbursements', icon: Receipt, label: '报销审批' },
  ] : [
    { to: '/user/dashboard', icon: LayoutDashboard, label: '我的需求' },
    { to: '/user/create', icon: PlusCircle, label: '新建需求' },
    { to: '/user/reimbursements', icon: Receipt, label: '我的报销' },
    { to: '/user/profile', icon: UserCircle, label: '个人资料' },
  ];

  return (
    <div className="flex h-screen w-full bg-apple-gray">
      {/* Desktop Sidebar - Translucent & Floating look potentially, but sticking to solid glass sidebar for now */}
      <aside className="hidden md:flex flex-col w-64 h-full glass border-r border-apple-border/50 z-20">
        <div className="p-8 flex items-center space-x-3">
          <div className="bg-gradient-to-br from-apple-blue to-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">TripFlow</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            MENU
          </div>
          {navLinks.map(link => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        <div className="p-6 border-t border-gray-200/50">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{isAdmin ? 'Administrator' : 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden glass-nav flex items-center justify-between p-4 sticky top-0 z-10 px-6">
          <span className="text-lg font-bold text-gray-900">TripFlow</span>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
            {user.name.charAt(0)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 scroll-smooth">
          <div className="max-w-5xl mx-auto space-y-6">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Tab Bar */}
        <div className="md:hidden glass-nav fixed bottom-0 left-0 right-0 z-30 pb-safe">
          <div className="flex justify-around items-center h-16 px-2">
            {navLinks.map(link => (
              <NavItem key={link.to} {...link} mobile />
            ))}
            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center p-2 text-xs space-y-1 text-gray-400 hover:text-red-500"
            >
              <LogOut className="w-6 h-6" />
              <span>退出</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
