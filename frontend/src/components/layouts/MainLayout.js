import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  PencilSquareIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-twitter-blue flex items-center justify-center">
                <span className="text-white font-bold text-xl">X</span>
              </div>
              <span className="text-xl font-semibold">X-Engage</span>
            </div>
            <button 
              onClick={closeSidebar}
              className="lg:hidden rounded-md p-1 text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Sidebar links */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"}
              onClick={closeSidebar}
            >
              <HomeIcon className="h-5 w-5 mr-3" />
              Dashboard
            </NavLink>
            
            <NavLink 
              to="/compose" 
              className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"}
              onClick={closeSidebar}
            >
              <PencilSquareIcon className="h-5 w-5 mr-3" />
              Compose
            </NavLink>
            
            <NavLink 
              to="/analytics" 
              className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"}
              onClick={closeSidebar}
            >
              <ChartBarIcon className="h-5 w-5 mr-3" />
              Analytics
            </NavLink>
            
            <NavLink 
              to="/scheduled" 
              className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"}
              onClick={closeSidebar}
            >
              <ClockIcon className="h-5 w-5 mr-3" />
              Scheduled
            </NavLink>
            
            <NavLink 
              to="/settings" 
              className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"}
              onClick={closeSidebar}
            >
              <Cog6ToothIcon className="h-5 w-5 mr-3" />
              Settings
            </NavLink>
          </nav>

          {/* User profile */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-8 w-8 text-gray-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden rounded-md p-1 text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {currentUser?.subscription_tier === 'free' ? 'Free Plan' : 'Premium Plan'}
              </span>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;