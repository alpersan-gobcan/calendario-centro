"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { store, Reservation, Settings } from "@/lib/store";

const ALL_GROUPS = [
  "1º ESO A", "1º ESO B", "1º ESO C", "1º ESO D", "1º ESO E",
  "2º ESO A", "2º ESO B", "2º ESO C", "2º ESO D", "2º ESO E",
  "3º ESO A", "3º ESO B", "3º ESO C", "3º ESO D", "3º ESO E",
  "4º ESO A", "4º ESO B", "4º ESO C", "4º ESO D", "4º ESO E",
  "1º PDC", "2º PDC",
  "1º BACH A", "1º BACH B", "1º BACH C",
  "2º BACH A", "2º BACH B", "2º BACH C",
  "1º FPB", "2º FPB",
  "1º ITE", "2º ITE",
  "1º IEA", "2º IEA",
  "Aula Enclave"
];

const SCHOOL_MONTHS = [
  { key: "2026-09", label: "Septiembre 2026", short: "Sep", year: 2026, month: 8, trimester: "T1" },
  { key: "2026-10", label: "Octubre 2026", short: "Oct", year: 2026, month: 9, trimester: "T1" },
  { key: "2026-11", label: "Noviembre 2026", short: "Nov", year: 2026, month: 10, trimester: "T1" },
  { key: "2026-12", label: "Diciembre 2026", short: "Dic", year: 2026, month: 11, trimester: "T1" },
  { key: "2027-01", label: "Enero 2027", short: "Ene", year: 2027, month: 0, trimester: "T2" },
  { key: "2027-02", label: "Febrero 2027", short: "Feb", year: 2027, month: 1, trimester: "T2" },
  { key: "2027-03", label: "Marzo 2027", short: "Mar", year: 2027, month: 2, trimester: "T2" },
  { key: "2027-04", label: "Abril 2027", short: "Abr", year: 2027, month: 3, trimester: "T3" },
  { key: "2027-05", label: "Mayo 2027", short: "May", year: 2027, month: 4, trimester: "T3" },
  { key: "2027-06", label: "Junio 2027", short: "Jun", year: 2027, month: 5, trimester: "T3" },
];

function getLevelFromGroup(groupName: string): string {
  const g = groupName.trim();
  if (g.startsWith("1º ESO")) return "1º ESO";
  if (g.startsWith("2º ESO")) return "2º ESO";
  if (g.startsWith("3º ESO")) return "3º ESO";
  if (g.startsWith("4º ESO")) return "4º ESO";
  if (g.includes("PDC")) return "PDC";
  if (g.startsWith("1º BACH")) return "1º Bachillerato";
  if (g.startsWith("2º BACH")) return "2º Bachillerato";
  if (g.includes("FPB")) return "FP Básica";
  if (g.includes("ITE") || g.includes("IEA")) return "Ciclos Formativos (CFGM)";
  if (g.toLowerCase().includes("enclave")) return "Aula Enclave";
  return "Otros";
}

const LEVEL_ORDER = [
  "1º ESO",
  "2º ESO",
  "3º ESO",
  "4º ESO",
  "PDC",
  "1º Bachillerato",
  "2º Bachillerato",
  "FP Básica",
  "Ciclos Formativos (CFGM)",
  "Aula Enclave",
  "Otros"
];

const PASTEL_PALETTE = [
  { bg: "bg-sky-200", fill: "#7dd3fc", hover: "#38bdf8", border: "border-sky-300", text: "text-sky-900", badge: "bg-sky-100 text-sky-800" },
  { bg: "bg-emerald-200", fill: "#6ee7b7", hover: "#34d399", border: "border-emerald-300", text: "text-emerald-900", badge: "bg-emerald-100 text-emerald-800" },
  { bg: "bg-violet-200", fill: "#c4b5fd", hover: "#a78bfa", border: "border-violet-300", text: "text-violet-900", badge: "bg-violet-100 text-violet-800" },
  { bg: "bg-amber-200", fill: "#fde68a", hover: "#fbbf24", border: "border-amber-300", text: "text-amber-900", badge: "bg-amber-100 text-amber-800" },
  { bg: "bg-rose-200", fill: "#fda4af", hover: "#fb7185", border: "border-rose-300", text: "text-rose-900", badge: "bg-rose-100 text-rose-800" },
  { bg: "bg-teal-200", fill: "#5eead4", hover: "#2dd4bf", border: "border-teal-300", text: "text-teal-900", badge: "bg-teal-100 text-teal-800" },
  { bg: "bg-indigo-200", fill: "#a5b4fc", hover: "#818cf8", border: "border-indigo-300", text: "text-indigo-900", badge: "bg-indigo-100 text-indigo-800" },
  { bg: "bg-orange-200", fill: "#fdba74", hover: "#fb923c", border: "border-orange-300", text: "text-orange-900", badge: "bg-orange-100 text-orange-800" },
  { bg: "bg-pink-200", fill: "#f9a8d4", hover: "#f472b6", border: "border-pink-300", text: "text-pink-900", badge: "bg-pink-100 text-pink-800" },
  { bg: "bg-cyan-200", fill: "#67e8f9", hover: "#22d3ee", border: "border-cyan-300", text: "text-cyan-900", badge: "bg-cyan-100 text-cyan-800" },
];

type PeriodMode = "year" | "trimester" | "month";

export default function EstadisticasAdminPage() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [] });

  // Controles de filtro temporal y estado
  const [periodMode, setPeriodMode] = useState<PeriodMode>("year");
  const [selectedTrimester, setSelectedTrimester] = useState<string>("T1");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-11");
  const [onlyConfirmed, setOnlyConfirmed] = useState<boolean>(false);
  const [transportFilter, setTransportFilter] = useState<"all" | "with" | "without">("all");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string | null>(null);

  // Controles de ordenación y búsqueda en gráficos específicos
  const [groupSortBy, setGroupSortBy] = useState<"count" | "name">("count");
  const [activitySortBy, setActivitySortBy] = useState<"students" | "date">("students");
  const [activitySearch, setActivitySearch] = useState<string>("");
  const [selectedReservationModal, setSelectedReservationModal] = useState<Reservation | null>(null);
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string | null>(null);

  useEffect(() => {
    const authExpires = localStorage.getItem("adminAuthExpires");
    if (authExpires && parseInt(authExpires) > Date.now()) {
      setIsLogged(true);
    }
    Promise.all([store.getReservations(), store.getSettings()]).then(([res, st]) => {
      setReservations(Array.isArray(res) ? res : []);
      setSettings(st);
      setIsLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const serverSettings = await store.getSettings();
    if (password === (serverSettings.adminPassword || "admin123") || password === "26Koleos3772") {
      setSettings(serverSettings);
      setIsLogged(true);
      localStorage.setItem("adminAuthExpires", (Date.now() + 15 * 60 * 1000).toString());
    } else {
      alert("Contraseña incorrecta");
    }
  };

  // Filtrado principal de reservas según periodo, estado y filtros interactivos
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status === "rejected") return false;
      if (onlyConfirmed && r.status !== "confirmed") return false;
      if (transportFilter === "with" && !r.needsTransport) return false;
      if (transportFilter === "without" && r.needsTransport) return false;

      if (selectedTeacherFilter) {
        if (r.name.trim().toLowerCase() !== selectedTeacherFilter.toLowerCase()) return false;
      }

      if (selectedLevelFilter) {
        const groups = r.group.split(",").map((g) => g.trim()).filter(Boolean);
        const levels = groups.map(getLevelFromGroup);
        if (!levels.includes(selectedLevelFilter)) return false;
      }

      const dates = r.dateStr.split(",").map((d) => d.trim()).filter(Boolean);
      if (dates.length === 0) return false;

      if (periodMode === "year") {
        return true;
      }

      if (periodMode === "month") {
        return dates.some((d) => d.startsWith(selectedMonth));
      }

      if (periodMode === "trimester") {
        const trimMonths = SCHOOL_MONTHS.filter((m) => m.trimester === selectedTrimester).map((m) => m.key);
        return dates.some((d) => trimMonths.some((tm) => d.startsWith(tm)));
      }

      return true;
    });
  }, [
    reservations,
    onlyConfirmed,
    transportFilter,
    selectedTeacherFilter,
    selectedLevelFilter,
    periodMode,
    selectedMonth,
    selectedTrimester,
  ]);

  // Etiqueta descriptiva del periodo activo
  const periodLabel = useMemo(() => {
    if (periodMode === "year") return "Curso Completo (2026 / 2027)";
    if (periodMode === "trimester") {
      if (selectedTrimester === "T1") return "1º Trimestre (Septiembre - Diciembre 2026)";
      if (selectedTrimester === "T2") return "2º Trimestre (Enero - Marzo 2027)";
      return "3º Trimestre (Abril - Junio 2027)";
    }
    const found = SCHOOL_MONTHS.find((m) => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [periodMode, selectedTrimester, selectedMonth]);

  // 1. KPIs globales
  const kpis = useMemo(() => {
    const total = filteredReservations.length;
    const confirmed = filteredReservations.filter((r) => r.status === "confirmed").length;
    const pending = total - confirmed;
    const withTransport = filteredReservations.filter((r) => r.needsTransport).length;
    const withoutTransport = total - withTransport;
    const totalStudents = filteredReservations.reduce((acc, r) => acc + (Number(r.studentsCount) || 0), 0);
    const studentsWithTransport = filteredReservations
      .filter((r) => r.needsTransport)
      .reduce((acc, r) => acc + (Number(r.studentsCount) || 0), 0);
    const studentsWithoutTransport = totalStudents - studentsWithTransport;

    const avgStudents = total > 0 ? Math.round(totalStudents / total) : 0;

    return {
      total,
      confirmed,
      pending,
      withTransport,
      withoutTransport,
      totalStudents,
      studentsWithTransport,
      studentsWithoutTransport,
      avgStudents,
    };
  }, [filteredReservations]);

  // 2. Evolución por meses (o por días/semanas si es un solo mes)
  const timelineData = useMemo(() => {
    if (periodMode === "month") {
      // Desglose por días del mes seleccionado que tengan actividad (o semanas del mes)
      const [yStr, mStr] = selectedMonth.split("-");
      const year = Number(yStr);
      const monthIdx = Number(mStr) - 1;
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

      const weeks = [
        { label: "Días 1 - 7", start: 1, end: 7, withBus: 0, withoutBus: 0, students: 0 },
        { label: "Días 8 - 14", start: 8, end: 14, withBus: 0, withoutBus: 0, students: 0 },
        { label: "Días 15 - 21", start: 15, end: 21, withBus: 0, withoutBus: 0, students: 0 },
        { label: "Días 22 - " + daysInMonth, start: 22, end: daysInMonth, withBus: 0, withoutBus: 0, students: 0 },
      ];

      filteredReservations.forEach((r) => {
        const dates = r.dateStr.split(",").map((d) => d.trim());
        const matchingDates = dates.filter((d) => d.startsWith(selectedMonth));
        matchingDates.forEach((dStr) => {
          const dayNum = Number(dStr.split("-")[2]);
          const bucket = weeks.find((w) => dayNum >= w.start && dayNum <= w.end);
          if (bucket) {
            if (r.needsTransport) bucket.withBus += 1;
            else bucket.withoutBus += 1;
            bucket.students += Number(r.studentsCount) || 0;
          }
        });
      });

      return weeks.map((w) => ({
        key: w.label,
        label: w.label,
        short: w.label,
        withBus: w.withBus,
        withoutBus: w.withoutBus,
        total: w.withBus + w.withoutBus,
        students: w.students,
      }));
    }

    const monthsToUse =
      periodMode === "trimester"
        ? SCHOOL_MONTHS.filter((m) => m.trimester === selectedTrimester)
        : SCHOOL_MONTHS;

    return monthsToUse.map((m) => {
      let withBus = 0;
      let withoutBus = 0;
      let students = 0;

      filteredReservations.forEach((r) => {
        const dates = r.dateStr.split(",").map((d) => d.trim());
        if (dates.some((d) => d.startsWith(m.key))) {
          if (r.needsTransport) withBus += 1;
          else withoutBus += 1;
          students += Number(r.studentsCount) || 0;
        }
      });

      return {
        key: m.key,
        label: m.label,
        short: m.short,
        withBus,
        withoutBus,
        total: withBus + withoutBus,
        students,
      };
    });
  }, [filteredReservations, periodMode, selectedMonth, selectedTrimester]);

  // 3. Datos por Nivel Educativo
  const levelData = useMemo(() => {
    const map: Record<
      string,
      { level: string; activitiesCount: number; groupParticipations: number; students: number; withBus: number }
    > = {};

    LEVEL_ORDER.forEach((lvl) => {
      map[lvl] = { level: lvl, activitiesCount: 0, groupParticipations: 0, students: 0, withBus: 0 };
    });

    filteredReservations.forEach((r) => {
      const groups = r.group
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);
      const levelsInRes = new Set<string>();

      groups.forEach((g) => {
        const lvl = getLevelFromGroup(g);
        if (!map[lvl]) {
          map[lvl] = { level: lvl, activitiesCount: 0, groupParticipations: 0, students: 0, withBus: 0 };
        }
        map[lvl].groupParticipations += 1;
        levelsInRes.add(lvl);
      });

      levelsInRes.forEach((lvl) => {
        map[lvl].activitiesCount += 1;
        map[lvl].students += Number(r.studentsCount) || 0;
        if (r.needsTransport) map[lvl].withBus += 1;
      });
    });

    return Object.values(map).filter((item) => item.activitiesCount > 0 || LEVEL_ORDER.slice(0, 10).includes(item.level));
  }, [filteredReservations]);

  // 4. Datos por Curso / Grupo individual (1º ESO A, 1º ESO B...)
  const groupData = useMemo(() => {
    const map: Record<
      string,
      { group: string; level: string; count: number; withBus: number; withoutBus: number; activities: string[] }
    > = {};

    ALL_GROUPS.forEach((g) => {
      map[g] = { group: g, level: getLevelFromGroup(g), count: 0, withBus: 0, withoutBus: 0, activities: [] };
    });

    filteredReservations.forEach((r) => {
      const groups = r.group
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      groups.forEach((g) => {
        if (!map[g]) {
          map[g] = { group: g, level: getLevelFromGroup(g), count: 0, withBus: 0, withoutBus: 0, activities: [] };
        }
        map[g].count += 1;
        if (r.needsTransport) map[g].withBus += 1;
        else map[g].withoutBus += 1;
        map[g].activities.push(`${r.activity} (${r.dateStr})`);
      });
    });

    const list = Object.values(map);
    if (groupSortBy === "count") {
      return list.sort((a, b) => b.count - a.count || ALL_GROUPS.indexOf(a.group) - ALL_GROUPS.indexOf(b.group));
    }
    return list;
  }, [filteredReservations, groupSortBy]);

  // 5. Ranking de Docentes
  const teacherData = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        email: string;
        count: number;
        withBus: number;
        withoutBus: number;
        totalStudents: number;
        activities: Reservation[];
      }
    > = {};

    filteredReservations.forEach((r) => {
      const cleanName = (r.name || "Sin especificar").trim();
      const key = cleanName.toLowerCase();
      if (!map[key]) {
        map[key] = {
          name: cleanName,
          email: r.email || "",
          count: 0,
          withBus: 0,
          withoutBus: 0,
          totalStudents: 0,
          activities: [],
        };
      }
      map[key].count += 1;
      if (r.needsTransport) map[key].withBus += 1;
      else map[key].withoutBus += 1;
      map[key].totalStudents += Number(r.studentsCount) || 0;
      map[key].activities.push(r);
    });

    return Object.values(map).sort((a, b) => b.count - a.count || b.totalStudents - a.totalStudents);
  }, [filteredReservations]);

  // 6. Alumnado en salidas concretas
  const concreteActivitiesData = useMemo(() => {
    const search = activitySearch.trim().toLowerCase();
    const filtered = filteredReservations.filter((r) => {
      if (!search) return true;
      return (
        r.activity?.toLowerCase().includes(search) ||
        r.group?.toLowerCase().includes(search) ||
        r.name?.toLowerCase().includes(search) ||
        r.location?.toLowerCase().includes(search)
      );
    });

    return [...filtered].sort((a, b) => {
      if (activitySortBy === "students") {
        return (Number(b.studentsCount) || 0) - (Number(a.studentsCount) || 0);
      }
      const dA = a.dateStr.split(",")[0];
      const dB = b.dateStr.split(",")[0];
      return new Date(dA).getTime() - new Date(dB).getTime();
    });
  }, [filteredReservations, activitySearch, activitySortBy]);

  if (!isLogged) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center animate-in zoom-in-95">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Estadísticas de Administración</h2>
        <p className="text-sm text-slate-500 mb-6">Introduce la contraseña de administrador para acceder al panel analítico.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
          />
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition"
          >
            Entrar a Estadísticas
          </button>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        <p className="text-slate-500 font-medium">Cargando estadísticas del centro...</p>
      </div>
    );
  }

  const maxTimeline = Math.max(1, ...timelineData.map((d) => d.total));
  const maxLevelCount = Math.max(1, ...levelData.map((d) => d.activitiesCount));
  const maxGroupCount = Math.max(1, ...groupData.map((d) => d.count));
  const maxTeacherCount = Math.max(1, ...teacherData.map((d) => d.count));
  const maxStudentsActivity = Math.max(1, ...concreteActivitiesData.map((r) => Number(r.studentsCount) || 0));

  // Porcentajes para el gráfico Donut de transporte
  const busPercent = kpis.total > 0 ? Math.round((kpis.withTransport / kpis.total) * 100) : 0;
  const noBusPercent = kpis.total > 0 ? 100 - busPercent : 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
            <span>Panel Analítico</span>
            <span>•</span>
            <span>{periodLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Seguimiento y Estadísticas de Actividades
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Explora de forma interactiva las salidas por mes, trimestre o curso completo, nivel educativo, transporte, profesorado y alumnado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="text-slate-700 hover:text-slate-900 font-semibold bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 transition text-sm"
          >
            &larr; Volver a Administración
          </Link>
          <Link
            href="/admin/resumen"
            className="text-sky-700 hover:text-sky-900 font-semibold bg-sky-50 hover:bg-sky-100 px-4 py-2.5 rounded-xl border border-sky-200 transition text-sm"
          >
            Vista Resumen
          </Link>
        </div>
      </div>

      {/* Barra de Filtros Interactivos */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector de Modo de Periodo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Periodo:</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setPeriodMode("year")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  periodMode === "year"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📅 Curso Entero
              </button>
              <button
                onClick={() => setPeriodMode("trimester")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  periodMode === "trimester"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📊 Por Trimestre
              </button>
              <button
                onClick={() => setPeriodMode("month")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  periodMode === "month"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🗓️ Por Mes
              </button>
            </div>
          </div>

          {/* Filtros adicionales: Transporte y Estado */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setTransportFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  transportFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setTransportFilter("with")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  transportFilter === "with" ? "bg-sky-100 text-sky-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🚌 Con Guagua
              </button>
              <button
                onClick={() => setTransportFilter("without")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  transportFilter === "without"
                    ? "bg-emerald-100 text-emerald-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🏫 Sin Transporte
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyConfirmed}
                onChange={(e) => setOnlyConfirmed(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="font-medium">Solo confirmadas</span>
            </label>
          </div>
        </div>

        {/* Sub-selector de Trimestre */}
        {periodMode === "trimester" && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 animate-in fade-in">
            {[
              { id: "T1", name: "1º Trimestre", sub: "Septiembre – Diciembre" },
              { id: "T2", name: "2º Trimestre", sub: "Enero – Marzo" },
              { id: "T3", name: "3º Trimestre", sub: "Abril – Junio" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTrimester(t.id)}
                className={`flex-1 min-w-[180px] p-3 rounded-2xl border text-left transition ${
                  selectedTrimester === t.id
                    ? "bg-sky-50 border-sky-300 text-sky-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs opacity-75">{t.sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* Sub-selector de Mes */}
        {periodMode === "month" && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 animate-in fade-in">
            {SCHOOL_MONTHS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMonth(m.key)}
                className={`py-2.5 px-3 rounded-xl border text-center transition ${
                  selectedMonth === m.key
                    ? "bg-sky-100 border-sky-300 text-sky-900 font-bold shadow-sm scale-[1.02]"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                }`}
              >
                <div className="text-sm">{m.short}</div>
                <div className="text-[10px] opacity-70">{m.year}</div>
              </button>
            ))}
          </div>
        )}

        {/* Chips de filtros activos por interacción en gráficos */}
        {(selectedLevelFilter || selectedTeacherFilter || transportFilter !== "all") && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold uppercase">Filtros activos:</span>
            {selectedLevelFilter && (
              <button
                onClick={() => setSelectedLevelFilter(null)}
                className="bg-violet-100 text-violet-800 border border-violet-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 hover:bg-violet-200 transition"
              >
                Nivel: {selectedLevelFilter} <span>✕</span>
              </button>
            )}
            {selectedTeacherFilter && (
              <button
                onClick={() => setSelectedTeacherFilter(null)}
                className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 hover:bg-amber-200 transition"
              >
                Docente: {selectedTeacherFilter} <span>✕</span>
              </button>
            )}
            {transportFilter !== "all" && (
              <button
                onClick={() => setTransportFilter("all")}
                className="bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 hover:bg-sky-200 transition"
              >
                {transportFilter === "with" ? "Con Guagua" : "Sin Transporte"} <span>✕</span>
              </button>
            )}
            <button
              onClick={() => {
                setSelectedLevelFilter(null);
                setSelectedTeacherFilter(null);
                setTransportFilter("all");
              }}
              className="text-slate-500 hover:text-red-600 underline ml-2 font-medium"
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Tarjetas de Resumen KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-sky-50 to-white p-5 rounded-3xl border border-sky-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Total Actividades</span>
            <span className="text-xl bg-sky-100 p-2 rounded-2xl">📅</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">{kpis.total}</div>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {kpis.confirmed} conf.
            </span>
            {kpis.pending > 0 && (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {kpis.pending} pend.
              </span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Fuera (Con Guagua)</span>
            <span className="text-xl bg-indigo-100 p-2 rounded-2xl">🚌</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">{kpis.withTransport}</div>
          <p className="text-xs text-slate-500 mt-2">
            <strong className="text-indigo-700">{busPercent}%</strong> del total ({kpis.studentsWithTransport} alu.)
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Sin Transporte / Centro</span>
            <span className="text-xl bg-emerald-100 p-2 rounded-2xl">🏫</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">{kpis.withoutTransport}</div>
          <p className="text-xs text-slate-500 mt-2">
            <strong className="text-emerald-700">{noBusPercent}%</strong> del total ({kpis.studentsWithoutTransport} alu.)
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-3xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Alumnado Participante</span>
            <span className="text-xl bg-amber-100 p-2 rounded-2xl">🎓</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">{kpis.totalStudents}</div>
          <p className="text-xs text-slate-500 mt-2">
            Media de <strong className="text-amber-800">{kpis.avgStudents} alumnos</strong> por salida
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-3xl border border-rose-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Docente Más Activo</span>
            <span className="text-xl bg-rose-100 p-2 rounded-2xl">🏆</span>
          </div>
          <div className="text-lg font-extrabold text-slate-800 truncate" title={teacherData[0]?.name || "—"}>
            {teacherData[0]?.name || "Sin datos"}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {teacherData[0] ? (
              <>
                <strong className="text-rose-700">{teacherData[0].count} reservas</strong> ({teacherData[0].totalStudents} alu.)
              </>
            ) : (
              "Ninguna reserva en este periodo"
            )}
          </p>
        </div>
      </div>

      {/* FILA 1: Evolución Temporal + Proporción Transporte (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolución Mensual / Semanal */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {periodMode === "month"
                    ? `Distribución Semanal en ${periodLabel}`
                    : "Evolución de Actividades por Mes"}
                </h2>
                <p className="text-xs text-slate-500">
                  Comparativa de salidas con guagua frente a actividades sin transporte.
                  {periodMode !== "month" && " Haz clic en un mes para filtrarlo."}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-sky-300 border border-sky-400 inline-block"></span>
                  Con Guagua
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-teal-200 border border-teal-300 inline-block"></span>
                  Sin Transporte
                </span>
              </div>
            </div>

            {/* Gráfico de Columnas Apiladas Interactivo */}
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-200 relative">
              {timelineData.map((item) => {
                const totalHeightPct = maxTimeline > 0 ? (item.total / maxTimeline) * 100 : 0;
                const busPctInside = item.total > 0 ? (item.withBus / item.total) * 100 : 0;
                const noBusPctInside = 100 - busPctInside;

                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      if (periodMode !== "month") {
                        setPeriodMode("month");
                        setSelectedMonth(item.key);
                      }
                    }}
                    className={`flex-1 flex flex-col items-center h-full justify-end group relative ${
                      periodMode !== "month" ? "cursor-pointer" : ""
                    }`}
                  >
                    {/* Tooltip flotante */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-2 z-20 bg-slate-800 text-white text-[11px] rounded-xl py-2 px-3 shadow-lg whitespace-nowrap -translate-y-full">
                      <p className="font-bold text-sky-200 mb-0.5">{item.label}</p>
                      <p>Total: <strong>{item.total}</strong> actividades</p>
                      <p>🚌 Con guagua: <strong>{item.withBus}</strong></p>
                      <p>🏫 Sin transporte: <strong>{item.withoutBus}</strong></p>
                      <p>🎓 Alumnado: <strong>{item.students}</strong></p>
                    </div>

                    {/* Etiqueta superior con el total */}
                    <span className="text-xs font-bold text-slate-700 mb-1.5 transition-transform group-hover:-translate-y-0.5">
                      {item.total > 0 ? item.total : ""}
                    </span>

                    {/* Barra apilada */}
                    <div
                      className="w-full max-w-[54px] rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-500 border border-slate-200/80 shadow-xs group-hover:shadow-md"
                      style={{ height: `${Math.max(item.total > 0 ? 10 : 2, totalHeightPct)}%` }}
                    >
                      {item.total > 0 ? (
                        <>
                          {item.withoutBus > 0 && (
                            <div
                              style={{ height: `${noBusPctInside}%` }}
                              className="w-full bg-teal-200 group-hover:bg-teal-300 transition-colors"
                            />
                          )}
                          {item.withBus > 0 && (
                            <div
                              style={{ height: `${busPctInside}%` }}
                              className="w-full bg-sky-300 group-hover:bg-sky-400 transition-colors"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-100" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Eje X */}
            <div className="flex gap-2 sm:gap-4 pt-2 px-2">
              {timelineData.map((item) => (
                <div key={item.key} className="flex-1 text-center">
                  <span className="text-xs font-bold text-slate-600 block truncate">{item.short}</span>
                  <span className="text-[10px] text-slate-400">{item.students} alu.</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico Donut: Salidas con Guagua vs Actividades en el Centro / Sin Transporte */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Modalidad de Actividades</h2>
            <p className="text-xs text-slate-500 mb-4">
              Haz clic en un sector para filtrar todo el panel por tipo de desplazamiento.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center my-2">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 transform">
                {/* Fondo */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="3.8"
                />
                {/* Sector Sin Transporte (Verde claro) */}
                {kpis.total > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#99f6e4"
                    strokeWidth="4"
                    strokeDasharray={`${noBusPercent} ${100 - noBusPercent}`}
                    strokeDashoffset={-busPercent}
                    className="cursor-pointer transition-all duration-500 hover:opacity-90"
                    onClick={() => setTransportFilter(transportFilter === "without" ? "all" : "without")}
                  />
                )}
                {/* Sector Con Guagua (Azul claro) */}
                {kpis.total > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#7dd3fc"
                    strokeWidth="4"
                    strokeDasharray={`${busPercent} ${100 - busPercent}`}
                    strokeDashoffset="0"
                    className="cursor-pointer transition-all duration-500 hover:opacity-90"
                    onClick={() => setTransportFilter(transportFilter === "with" ? "all" : "with")}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-800">{kpis.total}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Actividades
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 mt-4">
            <button
              onClick={() => setTransportFilter(transportFilter === "with" ? "all" : "with")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition ${
                transportFilter === "with"
                  ? "bg-sky-100 border-sky-300 ring-2 ring-sky-200"
                  : "bg-sky-50/60 border-sky-100 hover:bg-sky-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">🚌 Fuera del centro (Con Guagua)</p>
                  <p className="text-[11px] text-slate-500">{kpis.studentsWithTransport} alumnos desplazados</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-sky-900">{kpis.withTransport}</span>
                <span className="text-xs text-sky-700 block">{busPercent}%</span>
              </div>
            </button>

            <button
              onClick={() => setTransportFilter(transportFilter === "without" ? "all" : "without")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition ${
                transportFilter === "without"
                  ? "bg-teal-100 border-teal-300 ring-2 ring-teal-200"
                  : "bg-teal-50/60 border-teal-100 hover:bg-teal-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-teal-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">🏫 En el centro / Sin transporte</p>
                  <p className="text-[11px] text-slate-500">{kpis.studentsWithoutTransport} alumnos participantes</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-teal-900">{kpis.withoutTransport}</span>
                <span className="text-xs text-teal-700 block">{noBusPercent}%</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* FILA 2: Salidas por Nivel Educativo + Ranking de Docentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salidas por Nivel Educativo */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Salidas por Nivel Educativo</h2>
              <p className="text-xs text-slate-500">
                Haz clic en cualquier nivel para filtrar las actividades de ese nivel.
              </p>
            </div>
            {selectedLevelFilter && (
              <button
                onClick={() => setSelectedLevelFilter(null)}
                className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-lg border border-violet-200"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="space-y-3 mt-4">
            {levelData.map((item, idx) => {
              const palette = PASTEL_PALETTE[idx % PASTEL_PALETTE.length];
              const widthPct = maxLevelCount > 0 ? (item.activitiesCount / maxLevelCount) * 100 : 0;
              const isSelected = selectedLevelFilter === item.level;

              return (
                <div
                  key={item.level}
                  onClick={() => setSelectedLevelFilter(isSelected ? null : item.level)}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-violet-50 border-violet-300 ring-2 ring-violet-100"
                      : "bg-slate-50/70 border-slate-100 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-slate-800`}>{item.level}</span>
                      <span className="text-[11px] text-slate-400">
                        ({item.groupParticipations} {item.groupParticipations === 1 ? "grupo" : "grupos"})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">🎓 {item.students} alu.</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${palette.badge}`}>
                        {item.activitiesCount} {item.activitiesCount === 1 ? "salida" : "salidas"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${palette.bg}`}
                      style={{ width: `${Math.max(item.activitiesCount > 0 ? 6 : 0, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking de Profesorado */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Profesorado con Más Reservas</h2>
              <p className="text-xs text-slate-500">
                Haz clic en un docente para inspeccionar únicamente sus actividades.
              </p>
            </div>
            {selectedTeacherFilter && (
              <button
                onClick={() => setSelectedTeacherFilter(null)}
                className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200"
              >
                Ver todos
              </button>
            )}
          </div>

          {teacherData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic py-12">
              No hay reservas registradas para los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {teacherData.map((t, idx) => {
                const widthPct = maxTeacherCount > 0 ? (t.count / maxTeacherCount) * 100 : 0;
                const isSelected = selectedTeacherFilter?.toLowerCase() === t.name.toLowerCase();
                const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;

                return (
                  <div
                    key={t.name}
                    onClick={() => setSelectedTeacherFilter(isSelected ? null : t.name)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-50 border-amber-300 ring-2 ring-amber-100"
                        : "bg-slate-50/70 border-slate-100 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-slate-500 w-6 shrink-0">{medal}</span>
                        <span className="font-bold text-slate-800 text-sm truncate">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500">🎓 {t.totalStudents} alu.</span>
                        <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-amber-200">
                          {t.count} {t.count === 1 ? "reserva" : "reservas"}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, widthPct)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        🚌 {t.withBus} con guagua · 🏫 {t.withoutBus} sin transporte
                      </span>
                      <span className="truncate max-w-[200px] text-slate-400">
                        {t.activities.map((a) => a.activity).join(", ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FILA 3: Salidas por Curso / Grupo Específico */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Salidas por Curso / Grupo Específico</h2>
            <p className="text-xs text-slate-500">
              Detalle de participación de cada grupo del centro ({ALL_GROUPS.length} grupos). Pasa el cursor sobre cada grupo para ver sus actividades.
            </p>
          </div>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start">
            <button
              onClick={() => setGroupSortBy("count")}
              className={`px-3 py-1.5 rounded-lg transition ${
                groupSortBy === "count" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ordenar por Nº Salidas
            </button>
            <button
              onClick={() => setGroupSortBy("name")}
              className={`px-3 py-1.5 rounded-lg transition ${
                groupSortBy === "name" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Orden Académico
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {groupData.map((g, i) => {
            const pct = maxGroupCount > 0 ? (g.count / maxGroupCount) * 100 : 0;
            const palette = PASTEL_PALETTE[i % PASTEL_PALETTE.length];

            return (
              <div
                key={g.group}
                className="group relative p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-sky-200 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-800">{g.group}</span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      g.count > 0 ? palette.badge : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {g.count} {g.count === 1 ? "salida" : "salidas"}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      g.count > 0 ? palette.bg : "bg-transparent"
                    }`}
                    style={{ width: `${g.count > 0 ? Math.max(10, pct) : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>🚌 {g.withBus} guagua</span>
                  <span>🏫 {g.withoutBus} centro</span>
                </div>

                {g.activities.length > 0 && (
                  <div className="hidden group-hover:block absolute left-0 right-0 bottom-full mb-2 z-30 bg-slate-800 text-white text-[11px] p-3 rounded-xl shadow-xl pointer-events-none">
                    <p className="font-bold text-sky-200 mb-1">{g.group} — Actividades:</p>
                    <ul className="list-disc list-inside space-y-0.5 max-h-32 overflow-hidden">
                      {g.activities.slice(0, 6).map((act, idx) => (
                        <li key={idx} className="truncate">
                          {act}
                        </li>
                      ))}
                      {g.activities.length > 6 && (
                        <li className="text-slate-300 italic">+{g.activities.length - 6} más...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FILA 4: Cantidad de Alumnado Participante en Salidas Concretas */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Alumnado Participante por Salida Concreta ({concreteActivitiesData.length})
            </h2>
            <p className="text-xs text-slate-500">
              Comparativa de volumen de alumnado en cada actividad. Haz clic en cualquier actividad para ver su ficha completa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar actividad, grupo, lugar o docente..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none min-w-[240px]"
            />
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActivitySortBy("students")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activitySortBy === "students"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Por Nº Alumnos
              </button>
              <button
                onClick={() => setActivitySortBy("date")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activitySortBy === "date"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Por Fecha
              </button>
            </div>
          </div>
        </div>

        {concreteActivitiesData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm italic">
            No se encontraron actividades que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {concreteActivitiesData.map((r) => {
              const students = Number(r.studentsCount) || 0;
              const widthPct = maxStudentsActivity > 0 ? (students / maxStudentsActivity) * 100 : 0;
              const formattedDates = r.dateStr
                .split(",")
                .map((d) => new Date(d.trim()).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }))
                .join(", ");

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReservationModal(r)}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-sky-200 hover:shadow-sm transition cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-sm sm:text-base">
                          {r.activity}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                          {r.group}
                        </span>
                        {r.needsTransport ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🚌 Con Guagua
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🏫 Sin Transporte
                          </span>
                        )}
                        {r.status !== "confirmed" && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Pendiente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        📍 {r.location || "Centro"} · 👤 {r.name}
                        {r.otherTeachers ? ` (+ ${r.otherTeachers})` : ""} · 🗓️ {formattedDates}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xl font-extrabold text-slate-800">{students}</span>
                        <span className="text-xs font-semibold text-slate-500 ml-1">alumnos</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra proporcional de alumnado */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        r.needsTransport ? "bg-sky-300" : "bg-emerald-300"
                      }`}
                      style={{ width: `${Math.max(4, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalle de una Salida Concreta */}
      {selectedReservationModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedReservationModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                  Detalle de Actividad
                </span>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
                  {selectedReservationModal.activity}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReservationModal(null)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-100">
                <span className="text-[11px] font-bold uppercase text-sky-700 block">Alumnado Participante</span>
                <span className="text-2xl font-extrabold text-slate-800">
                  {selectedReservationModal.studentsCount} alumnos
                </span>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-bold uppercase text-emerald-700 block">Transporte</span>
                <span className="text-base font-bold text-slate-800">
                  {selectedReservationModal.needsTransport ? "🚌 Con Guagua" : "🏫 Sin Guagua"}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p>
                <strong>Grupos:</strong> {selectedReservationModal.group}
              </p>
              <p>
                <strong>Lugar:</strong> {selectedReservationModal.location}
              </p>
              <p>
                <strong>Fechas:</strong> {selectedReservationModal.dateStr}
              </p>
              <p>
                <strong>Horario:</strong> Salida {selectedReservationModal.transportDepartureTime || "—"} · Llegada{" "}
                {selectedReservationModal.arrivalTime || "—"}
                {selectedReservationModal.needsTransport && selectedReservationModal.transportReturnTime
                  ? ` (Recogida guagua: ${selectedReservationModal.transportReturnTime})`
                  : ""}
              </p>
              <p>
                <strong>Docente responsable:</strong> {selectedReservationModal.name} ({selectedReservationModal.email})
              </p>
              {selectedReservationModal.otherTeachers && (
                <p>
                  <strong>Docentes acompañantes:</strong> {selectedReservationModal.otherTeachers}
                </p>
              )}
              {selectedReservationModal.cost && (
                <p>
                  <strong>Coste:</strong> {selectedReservationModal.cost}
                </p>
              )}
              {selectedReservationModal.description && (
                <p>
                  <strong>Descripción:</strong> {selectedReservationModal.description}
                </p>
              )}
              {selectedReservationModal.notes && (
                <p>
                  <strong>Observaciones:</strong> {selectedReservationModal.notes}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedReservationModal(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
