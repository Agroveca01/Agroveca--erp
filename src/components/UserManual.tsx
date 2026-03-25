import { useState } from 'react';
import { Book, X, Wrench, TrendingUp, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { UserProfileRole } from '../lib/supabase';

interface UserManualProps {
  onClose: () => void;
}

export default function UserManual({ onClose }: UserManualProps) {
  const [activeRole, setActiveRole] = useState<UserProfileRole>(UserProfileRole.Admin);

  const roles = [
    {
        id: UserProfileRole.Admin,
      name: 'Administrador',
      icon: Shield,
      color: 'from-purple-600 to-indigo-600',
      description: 'Control total del sistema ERP',
    },
    {
        id: UserProfileRole.Operario,
      name: 'Operario',
      icon: Wrench,
      color: 'from-blue-600 to-cyan-600',
      description: 'Gestión de producción e inventario',
    },
    {
        id: UserProfileRole.Vendedor,
      name: 'Vendedor',
      icon: TrendingUp,
      color: 'from-[#10b981] to-[#10b981]',
      description: 'Gestión de ventas y distribución',
    },
  ];

  const roleContent = {
    [UserProfileRole.Admin]: {
      responsibilities: [
        'Gestión completa de finanzas y contabilidad',
        'Administración de usuarios y permisos',
        'Supervisión de producción y ventas',
        'Gestión de proveedores y cuentas por pagar',
        'Configuración del sistema y parámetros',
        'Revisión de KPIs y rendimiento del equipo',
      ],
      modules: [
        { name: 'Dashboard General', description: 'Vista consolidada de métricas financieras y operativas' },
        { name: 'KPIs Semanales', description: 'Monitor de rendimiento del equipo con ranking y medallas' },
        { name: 'Salud Financiera', description: 'Estado de IVA, PPM, utilidades y reservas fiscales' },
        { name: 'Calendario F29', description: 'Gestión de declaraciones tributarias y pagos al SII' },
        { name: 'Proveedores', description: 'Registro y administración de proveedores' },
        { name: 'Facturas de Compra', description: 'Ingreso y validación de facturas de proveedores' },
        { name: 'Cuentas por Pagar', description: 'Control de pagos pendientes a proveedores' },
        { name: 'Compras', description: 'Registro de compras y gestión de stock' },
        { name: 'Stock Crítico', description: 'Alertas de inventario bajo y reabastecimiento' },
        { name: 'Hoja de Producción', description: 'Planificación y registro de lotes de producción' },
        { name: 'Inventario', description: 'Control de insumos, envases y productos terminados' },
        { name: 'Producción', description: 'Gestión completa del proceso productivo' },
        { name: 'Finanzas', description: 'Análisis de costos y rentabilidad por producto' },
        { name: 'Simulador', description: 'Proyección de ventas Shopify con Meta Ads' },
        { name: 'Mayoristas', description: 'Simulador de distribución con descuento 40%' },
        { name: 'Ventas', description: 'Registro y seguimiento de órdenes de venta' },
        { name: 'Órdenes', description: 'Preparación y despacho de pedidos' },
        { name: 'CRM & Lealtad', description: 'Gestión de clientes y programa de fidelización' },
        { name: 'Shopify', description: 'Integración con tienda online y sincronización' },
        { name: 'Usuarios', description: 'Administración de usuarios del sistema' },
        { name: 'Configuración', description: 'Parámetros generales del negocio' },
      ],
      tasks: [
        'Revisar Dashboard al iniciar cada día',
        'Aprobar y programar pagos de F29 y PPM',
        'Revisar cuentas por pagar semanalmente',
        'Publicar avisos importantes en el Muro',
        'Revisar KPIs del equipo cada viernes',
        'Validar facturas de proveedores',
        'Aprobar descuentos especiales a distribuidores',
      ],
    },
    [UserProfileRole.Operario]: {
      responsibilities: [
        'Ejecución de producción diaria',
        'Control de calidad (pH, filtrado)',
        'Gestión de inventario de insumos',
        'Registro de lotes producidos',
        'Mantenimiento de equipos',
        'Alertas de stock crítico',
      ],
      modules: [
        { name: 'Dashboard', description: 'Vista de tareas diarias y avisos del sistema' },
        { name: 'Hoja de Producción', description: 'Registro de mezcla de 100L y envasado por formato' },
        { name: 'Inventario', description: 'Consulta y actualización de stock de insumos' },
        { name: 'Stock Crítico', description: 'Alertas de reabastecimiento necesario' },
      ],
      tasks: [
        'Revisar Tablero de Pendientes Diarios al comenzar turno',
        'Verificar stock de envases, tapas y etiquetas',
        'Registrar limpieza de filtros diariamente',
        'Preparar lotes según prioridad del Muro de Avisos',
        'Marcar tareas como completadas en el checklist',
        'Reportar stock crítico al administrador',
        'Completar Hoja de Ruta con datos de producción',
        'Verificar pH y calidad antes de envasar',
      ],
    },
    [UserProfileRole.Vendedor]: {
      responsibilities: [
        'Gestión de ventas y cobranzas',
        'Atención a distribuidores',
        'Seguimiento de cuentas por cobrar',
        'Cotizaciones y simulaciones',
        'Relación con clientes VIP',
        'Registro de órdenes de venta',
      ],
      modules: [
        { name: 'Dashboard', description: 'Vista de tareas y avisos comerciales' },
        { name: 'Salud Financiera', description: 'Estado de cuentas por cobrar' },
        { name: 'Simulador', description: 'Proyección de ventas Shopify' },
        { name: 'Mayoristas', description: 'Cotizador con descuento 40% y MOQ' },
        { name: 'Ventas', description: 'Registro de órdenes de venta' },
        { name: 'Órdenes', description: 'Preparación de pedidos para despacho' },
        { name: 'CRM & Lealtad', description: 'Gestión de clientes y programa VIP' },
      ],
      tasks: [
        'Revisar Tablero de Pendientes al inicio del día',
        'Cobrar facturas con +5 días de atraso',
        'Contactar Top 5 Distribuidores semanalmente',
        'Responder consultas de clientes VIP',
        'Generar cotizaciones con Simulador Mayoristas',
        'Validar MOQ (mínimo 12 unidades por categoría)',
        'Registrar órdenes de venta en el sistema',
        'Hacer seguimiento de despachos pendientes',
      ],
    },
  };

  const currentRole = roleContent[activeRole];
  const currentRoleInfo = roles.find((r) => r.id === activeRole)!;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-700">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-cyan-600 p-3 rounded-xl">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Manual de Usuario ERP</h2>
                <p className="text-slate-400 mt-1">Guía completa por roles y permisos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          <div className="w-80 bg-slate-800/50 border-r border-slate-700 p-6 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Selecciona un Rol
            </h3>
            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRole(role.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${role.color} shadow-lg scale-105`
                        : 'bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon className="w-6 h-6 text-white" />
                      <span className="font-bold text-white text-lg">{role.name}</span>
                    </div>
                    <p className="text-sm text-white/80">{role.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-slate-700/30 rounded-xl border border-slate-600">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white">Nota Importante</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cada rol tiene permisos específicos. Solo verás los módulos permitidos para tu rol en el menú lateral.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className={`bg-gradient-to-r ${currentRoleInfo.color} rounded-xl p-6 mb-6 shadow-xl`}>
              <div className="flex items-center space-x-4">
                <currentRoleInfo.icon className="w-12 h-12 text-white" />
                <div>
                  <h3 className="text-3xl font-bold text-white">{currentRoleInfo.name}</h3>
                  <p className="text-white/90 text-lg mt-1">{currentRoleInfo.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-[#10b981]" />
                  <span>Responsabilidades Principales</span>
                </h4>
                <ul className="space-y-3">
                  {currentRole.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <div className="bg-[#10b981] rounded-full p-1 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-slate-300 text-lg">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h4 className="text-xl font-bold text-white mb-4">Módulos Disponibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentRole.modules.map((module, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <h5 className="font-bold text-cyan-400 mb-2">{module.name}</h5>
                      <p className="text-sm text-slate-400">{module.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h4 className="text-xl font-bold text-white mb-4">Tareas Diarias Recomendadas</h4>
                <div className="space-y-3">
                  {currentRole.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start space-x-3 bg-slate-700/30 rounded-lg p-4">
                      <div className="bg-cyan-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{idx + 1}</span>
                      </div>
                      <span className="text-slate-300 text-lg">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-xl p-6 border border-amber-700/50">
                <div className="flex items-center space-x-3 mb-3">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                  <h4 className="text-xl font-bold text-white">Consejos de Uso</h4>
                </div>
                <ul className="space-y-2 text-amber-100">
                  <li>Revisa el Muro de Avisos al inicio de cada jornada</li>
                  <li>Marca todas tus tareas como completadas en el Tablero de Pendientes</li>
                  <li>Mantén actualizado el stock para evitar alertas críticas</li>
                  <li>Reporta cualquier problema al Administrador mediante el sistema</li>
                  {activeRole === 'admin' && <li>Revisa los KPIs semanales para identificar oportunidades de mejora</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
