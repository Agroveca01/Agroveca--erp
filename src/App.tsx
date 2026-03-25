import { useState } from 'react';
import { Package, Factory, DollarSign, ShoppingCart, Settings, LayoutDashboard, Users, ClipboardList, LogOut, QrCode, ShoppingBag, TrendingUp, Truck, Calendar, Receipt, AlertTriangle, Beaker, FileText, CreditCard, Activity, Building, Award, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getUserRoleLabel, normalizeUserRole } from './lib/supabase';
import AuthModule from './components/AuthModule';
import DashboardModule from './components/DashboardModule';
import InventoryModule from './components/InventoryModule';
import ProductionModule from './components/ProductionModule';
import CostingModule from './components/CostingModule';
import SalesModule from './components/SalesModule';
import ConfigModule from './components/ConfigModule';
import CRMModule from './components/CRMModule';
import OrderPreparationModule from './components/OrderPreparationModule';
import UserManagementModule from './components/UserManagementModule';
import QRScannerModule from './components/QRScannerModule';
import ShopifyIntegrationModule from './components/ShopifyIntegrationModule';
import PricingSimulatorModule from './components/PricingSimulatorModule';
import WholesaleDistributionModule from './components/WholesaleDistributionModule';
import FiscalCalendarModule from './components/FiscalCalendarModule';
import PurchasesModule from './components/PurchasesModule';
import StockMonitorModule from './components/StockMonitorModule';
import ProductionSheetModule from './components/ProductionSheetModule';
import SuppliersModule from './components/SuppliersModule';
import InvoicesPurchaseModule from './components/InvoicesPurchaseModule';
import AccountsPayableModule from './components/AccountsPayableModule';
import FinancialHealthModule from './components/FinancialHealthModule';
import WeeklyKPIModule from './components/WeeklyKPIModule';
import UserManual from './components/UserManual';

type Module = 'dashboard' | 'inventory' | 'production' | 'costing' | 'pricing' | 'wholesale' | 'sales' | 'crm' | 'orders' | 'users' | 'shopify' | 'fiscal' | 'purchases' | 'stock' | 'production-sheet' | 'suppliers' | 'invoices' | 'payables' | 'financial-health' | 'kpis' | 'config';

function AppContent() {
  const { user, profile, loading, signOut, isPasswordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState<Module>('dashboard');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showManual, setShowManual] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-100">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || isPasswordRecovery) {
    return <AuthModule />;
  }

  const getRolePermissions = (role?: string | null): Module[] => {
    const normalizedRole = normalizeUserRole(role);

    if (normalizedRole === 'admin') {
      return ['dashboard', 'kpis', 'financial-health', 'fiscal', 'suppliers', 'invoices', 'payables', 'purchases', 'stock', 'production-sheet', 'inventory', 'production', 'costing', 'pricing', 'wholesale', 'sales', 'orders', 'crm', 'shopify', 'users', 'config'];
    } else if (normalizedRole === 'operario') {
      return ['dashboard', 'production-sheet', 'inventory', 'stock'];
    } else if (normalizedRole === 'vendedor') {
      return ['dashboard', 'pricing', 'wholesale', 'sales', 'orders', 'crm', 'financial-health'];
    }
    return ['dashboard'];
  };


  const allowedModules = profile ? getRolePermissions(profile?.role ?? '') : ['dashboard'];


  const menuItems = [
    { id: 'dashboard' as Module, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'kpis' as Module, name: 'KPIs Semanales', icon: Award },
    { id: 'financial-health' as Module, name: 'Salud Financiera', icon: Activity },
    { id: 'fiscal' as Module, name: 'Calendario F29', icon: Calendar },
    { id: 'suppliers' as Module, name: 'Proveedores', icon: Building },
    { id: 'invoices' as Module, name: 'Facturas', icon: FileText },
    { id: 'payables' as Module, name: 'Cuentas por Pagar', icon: CreditCard },
    { id: 'purchases' as Module, name: 'Compras', icon: Receipt },
    { id: 'stock' as Module, name: 'Stock Crítico', icon: AlertTriangle },
    { id: 'production-sheet' as Module, name: 'Hoja Producción', icon: Beaker },
    { id: 'inventory' as Module, name: 'Inventario', icon: Package },
    { id: 'production' as Module, name: 'Producción', icon: Factory },
    { id: 'costing' as Module, name: 'Finanzas', icon: DollarSign },
    { id: 'pricing' as Module, name: 'Simulador', icon: TrendingUp },
    { id: 'wholesale' as Module, name: 'Distribuidores', icon: Truck },
    { id: 'sales' as Module, name: 'Ventas', icon: ShoppingCart },
    { id: 'orders' as Module, name: 'Órdenes', icon: ClipboardList },
    { id: 'crm' as Module, name: 'CRM', icon: Users },
    { id: 'shopify' as Module, name: 'Shopify', icon: ShoppingBag },
    { id: 'users' as Module, name: 'Usuarios', icon: Users },
    { id: 'config' as Module, name: 'Configuración', icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter(item => allowedModules.includes(item.id));


  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0c10]">

      {/* SIDEBAR - Dark Industrial Style */}
      <aside className="flex-none w-[260px] h-full bg-[#161b22] shadow-2xl z-50 flex flex-col border-r border-[#30363d]">

        {/* Header con Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-[#30363d] bg-[#10b981]">
          <img src="/cuidatuplanta.webp" alt="Logo" className="h-12 w-12 rounded-xl" />
          <div>
            <h1 className="font-bold text-xl m-0 text-white">CTP ERP</h1>
            <p className="text-xs m-0 text-white/90">Sistema de Gestión</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-[#0d1117] m-4 p-4 rounded-xl border border-[#30363d]">
          <p className="text-sm font-semibold m-0 text-slate-200 truncate">
            {profile?.full_name || user.email}
          </p>
            <p className="text-xs text-[#10b981] mt-1 uppercase font-medium">
              {getUserRoleLabel(profile?.role)}
            </p>
        </div>

        {/* Navigation Menu - Simplified */}
        <nav className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-1
                  transition-colors duration-150 font-medium text-sm
                  ${isActive
                    ? 'bg-[#10b981] text-white'
                    : 'text-slate-200 hover:bg-[#30363d] hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[#30363d] p-4 bg-[#0d1117] flex items-center justify-around gap-2">
          <button
            onClick={() => setShowManual(true)}
            className="p-3 rounded-xl cursor-pointer text-slate-200 transition-colors duration-150 hover:bg-[#30363d] bg-[#161b22] border border-[#30363d]"
            title="Manual"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowQRScanner(true)}
            className="p-3 rounded-xl cursor-pointer text-slate-200 transition-colors duration-150 hover:bg-[#10b981] bg-[#161b22] border border-[#30363d]"
            title="Escanear QR"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={() => signOut()}
            className="p-3 rounded-xl cursor-pointer text-slate-200 transition-colors duration-150 hover:bg-red-600 bg-[#161b22] border border-[#30363d]"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT - Deep Dark Theme */}
      <main className="flex-1 h-full overflow-y-auto bg-[#0a0c10] flex flex-col">

        {/* Top Bar */}
        <header className="bg-[#161b22] border-b border-[#30363d] px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white m-0">
                {visibleMenuItems.find(m => m.id === activeTab)?.name || 'Dashboard'}
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Sistema ERP · Módulo: {activeTab}
              </p>
            </div>
              <div className="px-5 py-2 bg-[#10b981] text-white rounded-full text-xs font-bold">
               {getUserRoleLabel(profile?.role).toUpperCase()}
              </div>
          </div>
        </header>

        {/* Module Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-[#0a0c10]">
          <ErrorBoundary key={activeTab}>
            {activeTab === 'dashboard' && <DashboardModule key="dashboard" />}
            {activeTab === 'kpis' && <WeeklyKPIModule key="kpis" />}
            {activeTab === 'financial-health' && <FinancialHealthModule key="financial-health" />}
            {activeTab === 'fiscal' && <FiscalCalendarModule key="fiscal" />}
            {activeTab === 'suppliers' && <SuppliersModule key="suppliers" />}
            {activeTab === 'invoices' && <InvoicesPurchaseModule key="invoices" />}
            {activeTab === 'payables' && <AccountsPayableModule key="payables" />}
            {activeTab === 'purchases' && <PurchasesModule key="purchases" />}
            {activeTab === 'stock' && <StockMonitorModule key="stock" />}
            {activeTab === 'production-sheet' && <ProductionSheetModule key="production-sheet" />}
            {activeTab === 'inventory' && <InventoryModule key="inventory" />}
            {activeTab === 'production' && <ProductionModule key="production" />}
            {activeTab === 'costing' && <CostingModule key="costing" />}
            {activeTab === 'pricing' && <PricingSimulatorModule key="pricing" />}
            {activeTab === 'wholesale' && <WholesaleDistributionModule key="wholesale" />}
            {activeTab === 'sales' && <SalesModule key="sales" />}
            {activeTab === 'orders' && <OrderPreparationModule key="orders" />}
            {activeTab === 'crm' && <CRMModule key="crm" />}
            {activeTab === 'shopify' && <ShopifyIntegrationModule key="shopify" />}
            {activeTab === 'users' && <UserManagementModule key="users" />}
            {activeTab === 'config' && <ConfigModule key="config" />}
          </ErrorBoundary>
        </div>
      </main>

      {/* MODALS - z-index alto */}
      {showQRScanner && (
        <div className="fixed inset-0 z-[10000]">
          <QRScannerModule
            onClose={() => setShowQRScanner(false)}
            onMaterialFound={(material) => {
              setShowQRScanner(false);
              setActiveTab('inventory');
              alert(`Material encontrado: ${material.name}\nStock: ${material.stock_quantity} ${material.unit}`);
            }}
          />
        </div>
      )}

      {showManual && (
        <div className="fixed inset-0 z-[10000]">
          <UserManual onClose={() => setShowManual(false)} />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
