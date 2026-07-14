"use client";

import { useEffect, useState } from "react";
import { getReporteRifa } from "./services/analytics.service";
import FiltersBar from "./components/FiltersBar";
import KPISection from "./components/KPISection";
import MethodsChart from "./components/MethodsChart";
import TicketsChart from "./components/TicketsChart";

type Rifa = {
  id: string;
  nombre: string;
};

type Vendedor = {
  id: string;
  nombre: string;
  rol: string;
};

type Scope = 'global' | 'mis-ventas';

export type PersonFilter = {
  tipo: 'TODOS' | 'ADMINS' | 'ADMIN' | 'VENDEDOR';
  vendedorId: string | null;
};

type Props = {
  rifas: Rifa[];
  scope?: Scope;
  title?: string;
  esSuperAdmin?: boolean;
  vendedores?: Vendedor[];
};

export default function AnalyticsDashboard({ rifas, scope = 'global', title, esSuperAdmin = false, vendedores = [] }: Props) {
  const headerTitle = title ?? (scope === 'mis-ventas' ? 'Mis Reportes' : 'Análisis de Rifas');

  const [selectedRifa, setSelectedRifa] = useState<string | null>(
    rifas.length ? rifas[0].id : null
  );

  const hoy = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [personFilter, setPersonFilter] = useState<PersonFilter>({ tipo: 'TODOS', vendedorId: null });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extraFilters = (() => {
    if (!esSuperAdmin || scope !== 'global') return {};
    if (personFilter.tipo === 'ADMINS') return { filtroRol: 'ADMINS' };
    if (personFilter.tipo === 'ADMIN' && personFilter.vendedorId) {
      return { vendedorId: personFilter.vendedorId };
    }
    if (personFilter.tipo === 'VENDEDOR' && personFilter.vendedorId) {
      return { vendedorId: personFilter.vendedorId };
    }
    return {};
  })();

  useEffect(() => {
    if (!selectedRifa) return;

    let cancelado = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getReporteRifa(
          selectedRifa,
          fechaInicio,
          fechaFin,
          scope,
          extraFilters
        );
        if (!cancelado) setData(result);
      } catch (err: any) {
        if (!cancelado) {
          const msg =
            err?.code === 'ECONNABORTED'
              ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
              : err?.response?.data?.message || err?.message || 'No se pudo cargar el reporte. Intenta de nuevo.';
          setError(msg);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRifa, fechaInicio, fechaFin, scope, personFilter.tipo, personFilter.vendedorId]);

  if (!rifas.length) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate-500">No hay rifas disponibles</div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <header className="mb-4 sm:mb-6 border-b-[1.5px] border-black pb-3 sm:pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Dashboard</p>
        <h1
          className="text-xl sm:text-3xl lg:text-4xl font-[800] tracking-tight text-black mt-1 break-words"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {headerTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          Recaudo, boletas y métodos de pago del periodo. Usa el menú para cambiar de módulo.
        </p>
      </header>

      <div className="w-full min-w-0 max-w-[1200px]">
        <FiltersBar
          rifas={rifas}
          selectedRifa={selectedRifa}
          setSelectedRifa={setSelectedRifa}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          setFechaInicio={setFechaInicio}
          setFechaFin={setFechaFin}
          esSuperAdmin={esSuperAdmin && scope === 'global'}
          vendedores={vendedores as any}
          personFilter={personFilter as any}
          setPersonFilter={setPersonFilter as any}
        />

        {error && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-4 bg-white border-[1.5px] border-black px-4">
            <div className="text-red-700 font-medium text-center max-w-md text-sm sm:text-base">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                getReporteRifa(selectedRifa!, fechaInicio, fechaFin, scope, extraFilters)
                  .then((r) => setData(r))
                  .catch((err: any) =>
                    setError(err?.response?.data?.message || err?.message || 'No se pudo cargar el reporte.')
                  )
                  .finally(() => setLoading(false));
              }}
              className="px-5 py-2.5 bg-[var(--primary)] text-black border-[1.5px] border-black font-bold uppercase text-sm hover:brightness-95"
            >
              Reintentar
            </button>
          </div>
        ) : loading && !data ? (
          <div className="flex justify-center items-center py-16 sm:py-20 bg-white border-[1.5px] border-black">
            <div className="text-slate-500 animate-pulse font-medium text-sm">Procesando métricas...</div>
          </div>
        ) : data ? (
          <div className={`space-y-4 sm:space-y-6 min-w-0 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <KPISection data={data} fechaInicio={fechaInicio} fechaFin={fechaFin} scope={scope} extraFilters={extraFilters} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 min-w-0">
              <div className="min-w-0 overflow-hidden">
                <MethodsChart methods={data.metodos_pago} serieDiaria={data.serie_diaria} fechaInicio={fechaInicio} fechaFin={fechaFin} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <TicketsChart resumen={data.resumen_boletas} boletasPeriodo={data.boletas_periodo} hayFiltro={!!(fechaInicio && fechaFin)} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
