import React, { useMemo } from 'react';
import { RefreshCw, Building2, Wallet2, AlertTriangle, Activity, Brain, CalendarClock, BarChart3, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip as RTooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import useDashboard from '../../hooks/useDashboard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';

const DashboardPage = () => {
  const { dashboardData, loading, error, refreshDashboard, lastUpdated } = useDashboard();

  // KPIs principales adaptados a la estructura documentada del backend
  const kpisPrincipales = useMemo(() => {
    // Datos de prueba si no hay conexión
    const fallbackData = {
      metricas_generales: {
        total_unidades: 120,
        total_propietarios: 95,
        ocupacion_porcentaje: 85,
        historial_ocupacion: [82, 84, 85, 87, 85]
      },
      finanzas: {
        ingresos_mes_actual: 850000,
        ingresos_mes_anterior: 820000,
        tasa_morosidad: 8.5,
        tasa_morosidad_prev: 12.2
      },
      prediccion_ingresos: [890000, 875000, 920000, 900000]
    };

    const resumen = dashboardData.resumen || fallbackData;
    const metricas = resumen.metricas_generales || fallbackData.metricas_generales;
    const fin = resumen.finanzas || fallbackData.finanzas;
    const normalize = (val) => formatPrimitive(val);
    const predIngArr = Array.isArray(resumen.prediccion_ingresos) ? resumen.prediccion_ingresos : fallbackData.prediccion_ingresos;

    // Helpers para trends
    const pctDiff = (a,b) => (a!=null && b!=null && b!==0) ? (((a-b)/b)*100) : null;
    const ingresosActual = fin.ingresos_mes_actual ?? null;
    const ingresosPrev = fin.ingresos_mes_anterior ?? fin.ingresos_mes_prev ?? null;
    const varIngresos = pctDiff(ingresosActual, ingresosPrev);
    const morosidad = fin.tasa_morosidad ?? null;
    const morosidadPrev = fin.tasa_morosidad_prev ?? null;
    const varMorosidad = pctDiff(morosidadPrev, morosidad); // invertido: mejora si baja
    const ocupHist = metricas.historial_ocupacion || [];
    const ocupActual = metricas.ocupacion_porcentaje ?? (ocupHist.length ? ocupHist[ocupHist.length-1] : null);
    const ocupPrev = ocupHist.length>1 ? ocupHist[ocupHist.length-2] : null;
    const varOcup = pctDiff(ocupActual, ocupPrev);

    const sparkIngresos = predIngArr.map((v,i)=>({ value:v, i }));
    const sparkOcup = ocupHist.map((v,i)=>({ value:v, i }));

    return [
      {
        label: 'Unidades',
        value: normalize(metricas.total_unidades),
        icon: Building2,
        tone: 'default'
      },
      {
        label: 'Propietarios',
        value: normalize(metricas.total_propietarios),
        icon: Users,
        tone: 'info'
      },
      {
        label: 'Ingresos',
        value: ingresosActual != null ? formatoMoneda(ingresosActual) : formatoMoneda(fallbackData.finanzas.ingresos_mes_actual),
        icon: Wallet2,
        tone: 'success',
        subtitle: morosidad != null ? `${morosidad}% morosidad` : `${fallbackData.finanzas.tasa_morosidad}% morosidad`,
        trend: varIngresos != null ? { type: varIngresos>0 ? 'up':'down', value: `${Math.abs(varIngresos).toFixed(1)}%`, label: 'vs anterior' } : null
      },
      {
        label: 'Ocupación',
        value: ocupActual != null ? `${ocupActual}%` : `${fallbackData.metricas_generales.ocupacion_porcentaje}%`,
        icon: TrendingUp,
        tone: 'info',
        trend: varOcup != null ? { type: varOcup>0 ? 'up':'down', value: `${Math.abs(varOcup).toFixed(1)}%`, label: 'variación' } : null
      }
    ];
  }, [dashboardData.resumen]);

  // Datos para gráfico financiero con múltiples fallbacks
  const dataFinanciera = useMemo(() => {
    // Datos de prueba
    const fallbackFinancial = [
      { mes: 'Ene', ingresos: 820000, gastos: 450000 },
      { mes: 'Feb', ingresos: 790000, gastos: 480000 },
      { mes: 'Mar', ingresos: 850000, gastos: 420000 },
      { mes: 'Abr', ingresos: 880000, gastos: 390000 },
      { mes: 'May', ingresos: 920000, gastos: 410000 },
      { mes: 'Jun', ingresos: 850000, gastos: 440000 }
    ];

    // 1. Endpoint dedicado finanzas
    if (dashboardData.finanzas) {
      return dashboardData.finanzas.tendencia || dashboardData.finanzas.series || fallbackFinancial;
    }
    // 2. Resumen.finanzas con historiales separados
    const resumen = dashboardData.resumen || {};
    const fin = resumen.finanzas || {};
    const ingresosArr = fin.historial_ingresos;
    const gastosArr = fin.historial_gastos;
    if (Array.isArray(ingresosArr) || Array.isArray(gastosArr)) {
      const maxLen = Math.max(ingresosArr?.length || 0, gastosArr?.length || 0);
      return Array.from({ length: maxLen }).map((_, i) => ({
        mes: (fin.meses && fin.meses[i]) || i + 1,
        ingresos: ingresosArr ? ingresosArr[i] : null,
        gastos: gastosArr ? gastosArr[i] : null
      }));
    }
    // 3. Predicción de ingresos como tendencia sintética
    if (Array.isArray(resumen.prediccion_ingresos)) {
      return resumen.prediccion_ingresos.map((v, i) => ({ mes: i + 1, ingresos: v, gastos: null }));
    }
    // 4. Fallback por defecto
    return fallbackFinancial;
  }, [dashboardData.finanzas, dashboardData.resumen]);

  // Lista riesgos ordenados por criticidad
  const riesgosLista = useMemo(() => {
    const fallbackRisks = [
      { nombre: 'Juan Pérez', nivel: 'alto', score: 85, descripcion: 'Mora de 3 meses' },
      { nombre: 'María García', nivel: 'medio', score: 65, descripcion: 'Pagos irregulares' },
      { nombre: 'Carlos López', nivel: 'bajo', score: 25, descripcion: 'Historial estable' }
    ];
    const r = dashboardData.riesgos;
    if (!r) return fallbackRisks;
    let lista = [];
    if (Array.isArray(r.scores_detallados)) lista = r.scores_detallados; 
    else if (Array.isArray(r.lista)) lista = r.lista; 
    else if (Array.isArray(r.detalles)) lista = r.detalles; 
    else if (Array.isArray(r.items)) lista = r.items;
    else return fallbackRisks;
    const mapped = lista.map((item, idx) => {
      const nombre = item.nombre || item.titulo || `Riesgo ${idx+1}`;
      const nivel = item.nivel || item.clasificacion || 'medio';
      const score = item.score ?? item.probabilidad ?? item.valor ?? null;
      return {
        nombre,
        nivel,
        score: typeof score === 'number' ? score : null,
        probabilidad: typeof score === 'number' ? score : null,
        descripcion: item.descripcion || item.detalle || null,
        factores: item.factores || item.causas || []
      };
    });
    return mapped.sort((a,b)=> (b.score ?? 0) - (a.score ?? 0));
  }, [dashboardData.riesgos]);

  // Predicciones con fallback a resumen.prediccion_ingresos (array de números)
  const prediccionesItems = useMemo(() => {
    const fallbackPredictions = [
      { titulo: 'Ingresos próximo mes', descripcion: 'Proyección basada en tendencia', valor: 890000, confianza: 0.85 },
      { titulo: 'Ocupación áreas comunes', descripcion: 'Incremento esperado del 15%', valor: 65, confianza: 0.72 },
      { titulo: 'Nuevos propietarios', descripcion: 'Se esperan 3 nuevas familias', valor: 3, confianza: 0.60 }
    ];
    const p = dashboardData.predicciones || {};
    let lista = p.items || p.lista || p.predicciones;
    if (!Array.isArray(lista)) {
      const resumen = dashboardData.resumen || {};
      if (Array.isArray(resumen.prediccion_ingresos)) {
        lista = resumen.prediccion_ingresos.map((v,i)=>({ titulo:`Ingreso proyectado ${i+1}`, valor:v, confianza:0.8 - (i*0.1), descripcion:'Proyección estimada' }));
      } else {
        lista = fallbackPredictions;
      }
    }
    return lista.map((item, idx) => {
      const titulo = item.titulo || item.nombre || `Predicción ${idx + 1}`;
      const valor = item.valor ?? item.proyeccion ?? item.metric ?? null;
      const confianza = item.confianza ?? item.probabilidad ?? null;
      return {
        titulo,
        valor: typeof valor === 'number' ? valor : formatPrimitive(valor),
        confianza: typeof confianza === 'number' ? confianza : null,
        descripcion: item.descripcion || item.detalle || item.descripcion_corta || null
      };
    });
  }, [dashboardData.predicciones, dashboardData.resumen]);

  // Uso de áreas comunes
  const areasUsage = useMemo(() => {
    const fallbackAreas = [
      { nombre: 'Piscina', ocupacion: 75, reservas: 12 },
      { nombre: 'Gimnasio', ocupacion: 60, reservas: 8 },
      { nombre: 'Salón social', ocupacion: 40, reservas: 5 },
      { nombre: 'Cancha deportiva', ocupacion: 85, reservas: 15 }
    ];
    const a = dashboardData.areasComunes;
    if (!a) return fallbackAreas;
    if (Array.isArray(a.top_areas)) return a.top_areas;
    if (Array.isArray(a.estadisticas)) return a.estadisticas;
    if (Array.isArray(a.top)) return a.top;
    return a.lista || a.items || a.usos || fallbackAreas;
  }, [dashboardData.areasComunes]);

  const formatoErrorGlobal = error.global;
  const cargandoGlobal = loading.global;
  if (cargandoGlobal) return <DashboardSkeleton />;

  const updatedLabel = lastUpdated ? `Actualizado ${new Date(lastUpdated).toLocaleTimeString()}` : '';
  const headerDescription = `Panel administrativo${updatedLabel ? ' · ' + updatedLabel : ''}`;

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Dashboard"
        description={headerDescription}
        icon={BarChart3}
        actions={(
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshDashboard}
            disabled={loading.global}
          >
            {loading.global ? 'Cargando…' : 'Actualizar'}
          </Button>
        )}
      />

      {formatoErrorGlobal && (
        <div className="alert-error text-sm">{formatoErrorGlobal}</div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Métricas</h2>
        <KPIGrid items={kpisPrincipales} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection title="Finanzas" icon={Wallet2}>
          <FinanceTrends data={dataFinanciera} loading={loading.finanzas} />
        </DashboardSection>
        <DashboardSection title="Ocupación vs Predicción" icon={BarChart3}>
          <ChartOcupacionPrediccion resumen={dashboardData.resumen} />
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardSection title="Predicciones" icon={Brain}>
          <PredictionHighlights items={prediccionesItems} loading={loading.predicciones} />
        </DashboardSection>
        <DashboardSection title="Riesgos" icon={AlertTriangle}>
          <RiskList items={riesgosLista} loading={loading.riesgos} />
        </DashboardSection>
        <DashboardSection title="Áreas Comunes" icon={Users}>
          <AreasUsage data={areasUsage} loading={loading.areasComunes} />
        </DashboardSection>
      </div>

      <DashboardSection title="Operacional" icon={Activity}>
        <IndicadoresOperacionales data={dashboardData.operacional} loading={loading.operacional} />
      </DashboardSection>
    </div>
  );
};

// Gráfico combinado ocupación vs predicción ingresos
const ChartOcupacionPrediccion = ({ resumen }) => {
  const fallbackData = [
    { idx: 1, ocupacion: 82, prediccion: 850000 },
    { idx: 2, ocupacion: 84, prediccion: 880000 },
    { idx: 3, ocupacion: 85, prediccion: 890000 },
    { idx: 4, ocupacion: 87, prediccion: 920000 },
    { idx: 5, ocupacion: 85, prediccion: 900000 }
  ];

  const metricas = resumen?.metricas_generales || {};
  const ocupHist = Array.isArray(metricas.historial_ocupacion) ? metricas.historial_ocupacion : [];
  const predIng = Array.isArray(resumen?.prediccion_ingresos) ? resumen.prediccion_ingresos : [];
  
  let data = fallbackData;
  if (ocupHist.length || predIng.length) {
    const maxLen = Math.max(ocupHist.length, predIng.length);
    data = Array.from({length:maxLen}).map((_,i)=>({
      idx: i+1,
      ocupacion: ocupHist[i] ?? null,
      prediccion: predIng[i] ?? null
    }));
  }
  
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-2">
        <BarChart3 size={20} className="text-blue-300/40" />
        <p className="text-blue-100/60 text-sm">Sin datos históricos</p>
      </div>
    );
  }
  
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="idx" stroke="#93c5fd" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="#93c5fd" tick={{ fontSize:10 }} width={40} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" tick={{ fontSize:10 }} width={50} tickLine={false} axisLine={false} />
          <RTooltip 
            contentStyle={{ 
              background:'rgba(30,58,138,0.9)', 
              border:'1px solid rgba(147,197,253,0.3)', 
              borderRadius:8, 
              color:'#fff', 
              fontSize:11 
            }} 
            formatter={(v,n)=> [n==='ocupacion'? v+'%': formatCurrency(v), n==='ocupacion'? 'Ocupación':'Predicción']} 
            labelFormatter={(l)=> 'Período '+l} 
          />
          <Line yAxisId="left" type="monotone" dataKey="ocupacion" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="prediccion" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Skeleton de carga simplificado
const DashboardSkeleton = () => {
  const shimmer = 'animate-pulse bg-blue-500/15 rounded-lg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header skeleton */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="w-full max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${shimmer}`} />
              <div className="space-y-2">
                <div className={`h-5 w-32 ${shimmer}`} />
                <div className={`h-3 w-24 ${shimmer}`} />
              </div>
            </div>
            <div className={`h-8 w-24 ${shimmer}`} />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* KPIs */}
        <div className="space-y-3">
          <div className={`h-5 w-20 ${shimmer}`} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({length:4}).map((_,i)=>(
              <div key={i} className={`h-20 ${shimmer}`} />
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`h-48 ${shimmer}`} />
          <div className={`h-48 ${shimmer}`} />
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({length:3}).map((_,i)=>(
            <div key={i} className={`h-32 ${shimmer}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Componentes reutilizables

const DashboardSection = ({ title, icon: Icon = null, children, className = '' }) => {
  return (
    <div className={`bg-white/10 backdrop-blur-sm border border-blue-300/20 rounded-xl p-4 transition-all duration-200 hover:bg-white/15 hover:border-blue-300/30 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-blue-600/30 text-blue-200 shadow-lg shadow-blue-500/20">
            <Icon size={16} />
          </div>
        )}
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
};

const KPIGrid = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.slice(0, 8).map((kpi, i) => <KpiCard key={i} {...kpi} />)}
    </div>
  );
};

const KpiCard = ({ label, value, icon: Icon = null, tone = 'default', trend = null, subtitle = null, spark = null }) => {
  const toneMap = {
    default: 'from-blue-500/10 to-blue-600/5 border-blue-400/20',
    success: 'from-green-500/15 to-green-600/10 border-green-400/30',
    warning: 'from-yellow-500/15 to-yellow-600/10 border-yellow-400/30',
    danger: 'from-red-500/15 to-red-600/10 border-red-400/30',
    info: 'from-blue-500/15 to-blue-600/10 border-blue-400/30'
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border p-3 bg-gradient-to-br backdrop-blur-sm ${toneMap[tone]} transition-all duration-200 hover:border-blue-300/40 hover:shadow-lg hover:shadow-blue-500/20`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className="text-xs text-blue-100/70 font-medium">{label}</span>
          <div className="text-lg font-semibold text-white mt-1">{value ?? '—'}</div>
          {subtitle && <span className="text-xs text-blue-100/50">{subtitle}</span>}
        </div>
        {Icon && (
          <div className="text-blue-200/60">
            <Icon size={16} />
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-medium mt-2">
          <span className={
            trend.type === 'up' ? 'text-green-300' : trend.type === 'down' ? 'text-red-300' : 'text-blue-200/60'
          }>
            {trend.type === 'up' ? '↗' : trend.type === 'down' ? '↘' : '•'} {trend.value}
          </span>
          {trend.label && <span className="text-blue-100/50">{trend.label}</span>}
        </div>
      )}
      {spark && spark.data && (
        <div className="mt-2 -mb-1">
          <Sparkline data={spark.data} dataKey={spark.dataKey || 'value'} stroke={spark.color || '#3b82f6'} />
        </div>
      )}
    </div>
  );
};

const Sparkline = ({ data = [], dataKey = 'value', stroke = '#3b82f6' }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="h-8 w-full" />;
  }
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${stroke.replace(/[#()%,\s]/g,'')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.4} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} fill={`url(#spark-${stroke.replace(/[#()%,\s]/g,'')})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const FinanceTrends = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 space-y-2">
        <div className="w-8 h-8 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-2">
        <Wallet2 size={20} className="text-blue-300/40" />
        <p className="text-blue-100/60 text-sm">Sin datos financieros</p>
      </div>
    );
  }

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="areaIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="mes" stroke="#93c5fd" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#93c5fd" tick={{ fontSize: 10 }} width={50} axisLine={false} tickLine={false} />
          <RTooltip 
            formatter={(v,name)=>[formatCurrency(v), name === 'ingresos' ? 'Ingresos' : 'Gastos']} 
            contentStyle={{ 
              background:'rgba(30,58,138,0.9)', 
              border:'1px solid rgba(147,197,253,0.3)', 
              borderRadius:8, 
              color:'#fff', 
              fontSize:11 
            }} 
          />
          <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2} fill="url(#areaIngresos)" />
          {data.some(d => d.gastos != null) && (
            <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fill="transparent" />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const PredictionHighlights = ({ items = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Brain size={16} className="text-blue-400 animate-pulse" />
      </div>
    );
  }
  
  if (!items?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-24 space-y-1">
        <Brain size={16} className="text-blue-300/40" />
        <p className="text-blue-100/60 text-xs">Sin predicciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0,3).map((p, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm">
          <Brain size={14} className="text-blue-300 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white font-medium line-clamp-1">{p.titulo || 'Predicción'}</p>
            <p className="text-xs text-blue-100/70 line-clamp-2">{p.descripcion || '—'}</p>
            {p.confianza != null && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1 bg-blue-900/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(0, p.confianza * 100))}%` }} 
                  />
                </div>
                <span className="text-xs text-blue-200/60">{Math.round(p.confianza * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const RiskList = ({ items = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <AlertTriangle size={16} className="text-orange-400 animate-pulse" />
      </div>
    );
  }
  
  if (!items?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-24 space-y-1">
        <AlertTriangle size={16} className="text-green-400" />
        <p className="text-green-400 text-xs">Todo bajo control</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0,4).map((r, i) => {
        const levelClass = levelAccent(r.nivel);
        return (
          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border-l-2 ${levelClass.bar} backdrop-blur-sm`}>
            <AlertTriangle size={14} className={levelClass.icon} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium truncate">{r.propietario || r.nombre}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${getBadge(r.nivel)}`}>{r.nivel}</span>
              </div>
              {r.score != null && <p className="text-xs text-blue-100/60">Score: {r.score}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AreasUsage = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Users size={16} className="text-blue-400 animate-pulse" />
      </div>
    );
  }
  
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-24 space-y-1">
        <Users size={16} className="text-blue-300/40" />
        <p className="text-blue-100/60 text-xs">Sin actividad</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0,4).map((a,i) => {
        const nombre = a.nombre || a.area || `Área ${i+1}`;
        const ocupacion = a.ocupacion ?? a.uso ?? 0;
        return (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-blue-300" />
              <span className="text-sm text-white">{nombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, ocupacion))}%` }} 
                />
              </div>
              <span className="text-xs text-blue-200/80 w-8 text-right">{Math.round(ocupacion)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Subcomponente inline para indicadores operacionales
const IndicadoresOperacionales = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Activity size={16} className="text-blue-400 animate-pulse" />
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-20 space-y-1">
        <Activity size={16} className="text-blue-300/40" />
        <p className="text-blue-100/60 text-xs">Sistema estable</p>
      </div>
    );
  }

  const normalize = (val) => formatPrimitive(val);
  const items = [
    { label: 'Tickets', value: normalize(data.tickets_abiertos ?? data.ticketsOpen ?? data.abiertos ?? 0) },
    { label: 'Alertas', value: normalize(data.alertas_activas ?? data.alertas ?? data.alerts ?? 0) },
    { label: 'Eficiencia', value: data.eficiencia != null ? `${normalize(data.eficiencia)}%` : '98%' },
  ].filter(i => i.value !== undefined && i.value !== null && i.value !== '—');

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it, idx) => (
        <div key={idx} className="text-center p-2 rounded-lg bg-blue-500/10 backdrop-blur-sm">
          <div className="text-sm font-semibold text-white">{it.value}</div>
          <div className="text-xs text-blue-100/70">{it.label}</div>
        </div>
      ))}
    </div>
  );
};

// Funciones auxiliares
function formatoMoneda(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v.toLocaleString('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return v;
}

function formatCurrency(v) {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toLocaleString('es-ES',{ style:'currency', currency:'USD', maximumFractionDigits:0 });
}

function shortCurrency(v) {
  if (v == null) return '';
  const n = Number(v);
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000) return (n/1_000).toFixed(1)+'K';
  return n;
}

function formatPrimitive(value) {
  if (value == null) return '—';
  if (React.isValidElement(value)) return '—';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return String(value);
  if (Array.isArray(value)) return value.length;
  if (t === 'object') {
    const vals = Object.values(value);
    if (vals.every(v => typeof v === 'number')) {
      const sum = vals.reduce((acc, n) => acc + n, 0);
      return sum;
    }
    return Object.keys(value).length;
  }
  return '—';
}

function getBadge(level) {
  switch((level||'').toLowerCase()) {
    case 'alto': return 'bg-red-500/15 text-red-300 border-red-500/30';
    case 'medio': return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
    case 'bajo': return 'bg-green-600/20 text-green-300 border-green-500/30';
    default: return 'bg-blue-500/15 text-blue-200/60 border-blue-500/30';
  }
}

function levelAccent(level) {
  switch((level||'').toLowerCase()) {
    case 'alto': return { bar: 'bg-red-500', iconWrapper: 'bg-red-500/10 border-red-500/30', icon: 'text-red-300' };
    case 'medio': return { bar: 'bg-yellow-400', iconWrapper: 'bg-yellow-500/10 border-yellow-500/30', icon: 'text-yellow-300' };
    case 'bajo': return { bar: 'bg-green-500', iconWrapper: 'bg-green-500/10 border-green-600/30', icon: 'text-green-300' };
    default: return { bar: 'bg-blue-400/40', iconWrapper: 'bg-blue-500/10 border-blue-400/30', icon: 'text-blue-200/70' };
  }
}

export default DashboardPage;