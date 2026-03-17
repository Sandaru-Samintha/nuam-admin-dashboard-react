import { Activity, Bell, ChevronLeft, FileText, LayoutDashboard, MapPin, Menu, Network, Server, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

function MainLayout() {

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
    const [activeRoute , setActiveRoute] = useState<string>();

    useEffect(() => {
        const currentPath = window.location.pathname;
        setActiveRoute(currentPath);
    }, [window.location.pathname]);
    
    return (
        <div className="flex h-screen bg-slate-50">
            <aside
                className={`bg-slate-900 text-slate-100 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
            >
                <div className="p-4 flex items-center justify-between border-b border-slate-800">
                    {!sidebarCollapsed && <span className="font-semibold">LAN Monitor</span>}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1 hover:bg-slate-800 rounded"
                    >
                        {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </button>
                </div>

                <nav className="p-2 space-y-1">
                    {[
                        { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', link: '/'},
                        { icon: <Network className="h-5 w-5" />, label: 'Topology', link: '/topological-view' },
                        { icon: <Activity className="h-5 w-5" />, label: 'Network Activity', link: '/network-activity'},
                        { icon: <MapPin className="h-5 w-5" />, label: 'IP Management', link: '/ip-management'},
                        { icon: <FileText className="h-5 w-5" />, label: 'Reports', link: '/reports'},
                        { icon: <Settings className="h-5 w-5" />, label: 'Settings', link: '/settings' },
                    ].map((item) => (
                        <button
                            onClick={() => {
                                navigate(item.link)
                                setActiveRoute(item.link);
                            }}
                            key={item.label}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${activeRoute === item.link
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation */}
                <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-slate-900">LAN Network Monitor</h1>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded text-sm text-slate-700">
                        <Server className="h-4 w-4" />
                        <span>Mininet Lab</span>
                        </div>
                    </div>
                    
                    {/* <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-slate-100 rounded relative">
                            <Bell className="h-5 w-5 text-slate-600" />
                            <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded">
                            <User className="h-5 w-5 text-slate-600" />
                        </button>
                    </div> */}
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    <Outlet />
                </main>

            </div>

        </div>
    )
}

export default MainLayout