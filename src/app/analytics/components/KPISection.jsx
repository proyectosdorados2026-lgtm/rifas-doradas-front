import React, { useMemo, useState } from 'react';
import VentasGeneralModal from './VentasGeneralModal';

function KPICard({ title, value, subtitle, icon, color, expanded, onToggle }) {
  const colorMap = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', iconBg: 'bg-slate-100' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', iconBg: 'bg-rose-100' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', iconBg: 'bg-cyan-100' },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <button
      onClick={onToggle}
      className={`text-left w-full border-[1.5px] border-black p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 transition-all duration-200 cursor-pointer min-w-0
        ${expanded ? `${c.bg} shadow-[3px_3px_0_#101010]` : `bg-white hover:shadow-[3px_3px_0_#101010]`}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 ${c.iconBg} flex items-center justify-center border border-black shrink-0`}>
          <span className="text-base sm:text-lg">{icon}</span>
        </div>
        <svg className={`w-4 h-4 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''} text-slate-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className="min-w-0">
        <h3 className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</h3>
        <p className={`text-xl sm:text-2xl font-semibold ${c.text} mt-1 break-all`}>{value}</p>
      </div>
      {expanded && subtitle && (
        <div className={`text-xs sm:text-sm ${c.text} font-medium bg-white/60 px-3 py-2 mt-1 border ${c.border} break-words`}>
          {subtitle}
        </div>
      )}
    </button>
  );
}

export default function KPISection({ data, fechaInicio, fechaFin, scope = 'global', extraFilters = {} }) {
  const { finanzas, resumen_boletas, rifa, boletas_periodo, ventas_periodo, filtro_aplicado } = data;
  const [expandedCard, setExpandedCard] = useState(null);
  const [showVentasModal, setShowVentasModal] = useState(false);

  const precioBoleta = Number(rifa?.precio_boleta) || 0;
  const hayFiltro = !!(fechaInicio && fechaFin);

  // Label del periodo activo
  const periodoLabel = useMemo(() => {
    if (!fechaInicio && !fechaFin) return 'Total acumulado';
    if (fechaInicio === fechaFin) return `Hoy (${fechaInicio})`;
    return `${fechaInicio} → ${fechaFin}`;
  }, [fechaInicio, fechaFin]);

  // Datos globales (estado actual de todas las boletas)
  const pagadasGlobal = Number(resumen_boletas?.pagadas) || 0;
  const reservadasGlobal = Number(resumen_boletas?.reservadas) || 0;
  const abonadasGlobal = Number(resumen_boletas?.abonadas) || 0;
  const disponibles = Number(resumen_boletas?.disponibles) || 0;
  const anuladasGlobal = Number(resumen_boletas?.anuladas) || 0;
  const totalBoletas = Number(resumen_boletas?.total_boletas) || 0;

  // boletas_periodo siempre viene del backend (filtrado por ventas.created_at)
  const bp = boletas_periodo || {};
  const pagadas = hayFiltro ? (Number(bp.pagadas) || 0) : pagadasGlobal;
  const reservadas = hayFiltro ? (Number(bp.reservadas) || 0) : reservadasGlobal;
  const abonadas = hayFiltro ? (Number(bp.abonadas) || 0) : abonadasGlobal;
  const anuladas = hayFiltro ? (Number(bp.anuladas) || 0) : anuladasGlobal;

  // Recaudo ya viene filtrado del backend
  const recaudoReal = finanzas.recaudo_real || 0;
  const recaudoTotal = finanzas.recaudo_total || finanzas.recaudo_real || 0;

  const dineroPagedas = pagadas * precioBoleta;
  const dineroReservadas = reservadas * precioBoleta;
  const dineroAbonadoAbonadas = finanzas.abonado_abonadas ?? 0;
  const deudaAbonadas = finanzas.deuda_abonadas ?? 0;
  const dineroDisponibles = disponibles * precioBoleta;

  // Ventas del periodo
  const totalVentas = Number(ventas_periodo?.total_ventas) || 0;

  const fmt = (n) => `$${Number(n).toLocaleString('es-CO')}`;

  const toggle = (id) => setExpandedCard(prev => prev === id ? null : id);

  return (
    <div className="space-y-3 sm:space-y-4 min-w-0">
      {/* Periodo activo */}
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="break-all">{periodoLabel}</span>
        {hayFiltro && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 font-medium">
            Filtrado
          </span>
        )}
        {precioBoleta > 0 && (
          <span className="sm:ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-1">
            Boleta: {fmt(precioBoleta)}
          </span>
        )}
      </div>

      {/* Fila 1: Finanzas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 min-w-0">
        <KPICard
          title="Recaudo Real"
          value={fmt(recaudoReal)}
          subtitle={hayFiltro ? `Total histórico: ${fmt(recaudoTotal)}` : null}
          icon="💰"
          color="green"
          expanded={expandedCard === 'recaudo'}
          onToggle={() => toggle('recaudo')}
        />
        <KPICard
          title="Proyección Total"
          value={fmt(finanzas.proyeccion_total)}
          subtitle={`${totalBoletas.toLocaleString()} boletas × ${fmt(precioBoleta)}`}
          icon="📊"
          color="blue"
          expanded={expandedCard === 'proyeccion'}
          onToggle={() => toggle('proyeccion')}
        />
        <KPICard
          title="Cumplimiento"
          value={`${hayFiltro ? finanzas.porcentaje_periodo : finanzas.porcentaje_cumplimiento}%`}
          subtitle={hayFiltro
            ? `Global: ${finanzas.porcentaje_cumplimiento}% | Faltan ${fmt(finanzas.proyeccion_total - recaudoTotal)}`
            : `Faltan ${fmt(finanzas.proyeccion_total - recaudoReal)} para la meta`
          }
          icon="🎯"
          color="cyan"
          expanded={expandedCard === 'cumplimiento'}
          onToggle={() => toggle('cumplimiento')}
        />
        {/* Ventas Realizadas — card custom (div, no button) para evitar nested <button> */}
        <div
          className={`text-left w-full rounded-2xl shadow-sm border p-6 flex flex-col gap-3 transition-all duration-200
            ${expandedCard === 'ventas' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-300' : 'bg-white border-slate-200 hover:shadow-md hover:border-amber-200'}`}
        >
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('ventas')}>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="text-lg">🛒</span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${expandedCard === 'ventas' ? 'rotate-180' : ''} text-slate-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="cursor-pointer" onClick={() => toggle('ventas')}>
            <h3 className="text-sm font-medium text-slate-500">Ventas Realizadas</h3>
            <p className="text-2xl font-semibold text-amber-600 mt-1">{totalVentas.toLocaleString()}</p>
          </div>
          {expandedCard === 'ventas' && (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-amber-600 font-medium bg-white/60 rounded-lg px-3 py-2 border border-amber-200">
                {hayFiltro ? 'En el periodo seleccionado' : 'Total acumulado'}
              </div>
              <button
                onClick={() => setShowVentasModal(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Ventas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Ventas Generales */}
      <VentasGeneralModal
        isOpen={showVentasModal}
        onClose={() => setShowVentasModal(false)}
        rifaId={rifa?.id}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        rifaNombre={rifa?.nombre}
        scope={scope}
        extraFilters={extraFilters}
      />

      {/* Fila 2: Boletas por estado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 min-w-0">
        <KPICard
          title={hayFiltro ? 'Pagadas en periodo' : 'Boletas Pagadas'}
          value={pagadas.toLocaleString()}
          subtitle={hayFiltro
            ? `Global: ${pagadasGlobal} pagadas | ${fmt(pagadas * precioBoleta)}`
            : `Equivale a ${fmt(dineroPagedas)}`
          }
          icon="✅"
          color="green"
          expanded={expandedCard === 'pagadas'}
          onToggle={() => toggle('pagadas')}
        />
        <KPICard
          title={hayFiltro ? 'Reservadas en periodo' : 'Boletas Reservadas'}
          value={reservadas.toLocaleString()}
          subtitle={hayFiltro
            ? `Global: ${reservadasGlobal} reservadas | ${fmt(reservadas * precioBoleta)}`
            : `Potencial: ${fmt(dineroReservadas)}`
          }
          icon="🔒"
          color="amber"
          expanded={expandedCard === 'reservadas'}
          onToggle={() => toggle('reservadas')}
        />
        <KPICard
          title={hayFiltro ? 'Abonadas en periodo' : 'Boletas Abonadas'}
          value={abonadas.toLocaleString()}
          subtitle={
            <div className="flex flex-col gap-1">
              <span><span className="font-bold text-purple-700">Abonado:</span> <span className="font-bold text-slate-900">{fmt(dineroAbonadoAbonadas)}</span></span>
              <span><span className="font-bold text-rose-700">Deuda:</span> <span className="font-bold text-slate-900">{fmt(deudaAbonadas)}</span></span>
              {hayFiltro && <span className="text-xs text-slate-400">Global: {abonadasGlobal} abonadas</span>}
            </div>
          }
          icon="💳"
          color="purple"
          expanded={expandedCard === 'abonadas'}
          onToggle={() => toggle('abonadas')}
        />
        <KPICard
          title="Boletas Disponibles"
          value={disponibles.toLocaleString()}
          subtitle={`Potencial sin vender: ${fmt(dineroDisponibles)}`}
          icon="🎟️"
          color="slate"
          expanded={expandedCard === 'disponibles'}
          onToggle={() => toggle('disponibles')}
        />
      </div>

      {/* Barra de progreso visual (siempre muestra estado global) */}
      <div className="bg-white border-[1.5px] border-black p-3 sm:p-5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3 min-w-0">
          <span className="text-xs sm:text-sm font-medium text-slate-600 break-words">
            Distribución de Boletas {hayFiltro ? '(estado actual global)' : ''}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{totalBoletas.toLocaleString()} total</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
          {pagadasGlobal > 0 && (
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(pagadasGlobal / totalBoletas) * 100}%` }}
              title={`Pagadas: ${pagadasGlobal}`}
            />
          )}
          {abonadasGlobal > 0 && (
            <div
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${(abonadasGlobal / totalBoletas) * 100}%` }}
              title={`Abonadas: ${abonadasGlobal}`}
            />
          )}
          {reservadasGlobal > 0 && (
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${(reservadasGlobal / totalBoletas) * 100}%` }}
              title={`Reservadas: ${reservadasGlobal}`}
            />
          )}
          {disponibles > 0 && (
            <div
              className="bg-slate-200 h-full transition-all duration-500"
              style={{ width: `${(disponibles / totalBoletas) * 100}%` }}
              title={`Disponibles: ${disponibles}`}
            />
          )}
          {anuladasGlobal > 0 && (
            <div
              className="bg-rose-400 h-full transition-all duration-500"
              style={{ width: `${(anuladasGlobal / totalBoletas) * 100}%` }}
              title={`Anuladas: ${anuladasGlobal}`}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pagadas ({pagadasGlobal})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Abonadas ({abonadasGlobal})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Reservadas ({reservadasGlobal})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300"></span> Disponibles ({disponibles})</span>
          {anuladasGlobal > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Anuladas ({anuladasGlobal})</span>}
        </div>
      </div>
    </div>
  );
}