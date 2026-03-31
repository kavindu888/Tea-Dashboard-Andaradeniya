import { startTransition, useEffect, useRef, useState } from "react";
import {
  createLeafCollectionSocket,
  fetchFactories,
  fetchLeafCollectionDashboard,
  fetchLeafCollectionFilters,
} from "../api/leafCollectionApi";

const monthLookup = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

function getMonthDayCount(monthLabel) {
  const [monthCode, yearCode] = String(monthLabel || "").trim().split("-");
  const monthIndex = monthLookup[monthCode?.slice(0, 3).toUpperCase()];
  const year = Number(yearCode);

  if (monthIndex === undefined || !year) {
    return 31;
  }

  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildDayOptions(monthLabel) {
  const totalDays = getMonthDayCount(monthLabel);
  return Array.from({ length: totalDays }, (_, index) => index + 1);
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong while loading the dashboard."
  );
}

export function useLeafCollectionViewModel() {
  const [factories, setFactories] = useState([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    months: [],
    routes: [],
    modeOptions: ["All", "Auto", "Manual"],
  });
  const [filters, setFilters] = useState({
    mode: "All",
    month: "",
    day: 1,
    route: "All",
    regNo: "",
  });
  const [dashboard, setDashboard] = useState({
    factory: null,
    rows: [],
    totals: {
      totalSupplierCount: 0,
      totalBagCount: 0,
      totalGrossWeight: 0,
      totalBagWeight: 0,
      totalWater: 0,
      totalCoarse: 0,
      totalRejected: 0,
      superDeduction: 0,
      totalNetWeight: 0,
      totalWeightGrams: 0,
    },
    charts: {
      leafSummary: [],
      deductions: [],
    },
    monitoring: {
      totalRecords: 0,
      abnormalRecordCount: 0,
      lastLogTime: null,
      minutesSinceLastEntry: null,
      staleData: false,
    },
  });
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [isLoadingFactories, setIsLoadingFactories] = useState(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [socketState, setSocketState] = useState("disconnected");
  const [errorMessage, setErrorMessage] = useState("");
  const requestIdRef = useRef(0);
  const latestFiltersRef = useRef(filters);
  const selectedFactoryRef = useRef(selectedFactoryId);
  const loadDashboardRef = useRef(async () => {});

  latestFiltersRef.current = filters;
  selectedFactoryRef.current = selectedFactoryId;

  loadDashboardRef.current = async (factoryId, activeFilters, options = {}) => {
    const requestId = ++requestIdRef.current;

    if (!options.silent) {
      setIsLoadingDashboard(true);
    }

    try {
      const response = await fetchLeafCollectionDashboard(factoryId, activeFilters);

      if (requestId !== requestIdRef.current) {
        return;
      }

      startTransition(() => {
        setDashboard(response);
        setErrorMessage("");
        setSelectedRowKey((currentValue) =>
          response.rows.some((row) => row.rowKey === currentValue)
            ? currentValue
            : response.rows[0]?.rowKey ?? null,
        );
      });
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current && !options.silent) {
        setIsLoadingDashboard(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadFactories() {
      try {
        setIsLoadingFactories(true);
        const response = await fetchFactories();

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setFactories(response.factories || []);
          setSelectedFactoryId(
            response.defaultFactoryId || response.factories?.[0]?.id || "",
          );
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFactories(false);
        }
      }
    }

    loadFactories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedFactoryId) {
      return undefined;
    }

    let cancelled = false;

    async function loadMetadata() {
      try {
        setIsLoadingMetadata(true);
        const response = await fetchLeafCollectionFilters(selectedFactoryId);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setFilterOptions({
            months: response.months || [],
            routes: response.routes || [],
            modeOptions: response.modeOptions || ["All", "Auto", "Manual"],
          });
          setFilters(response.defaultFilters);
          setDashboard((currentValue) => ({
            ...currentValue,
            factory: response.factory,
          }));
          setErrorMessage("");
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMetadata(false);
        }
      }
    }

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [selectedFactoryId]);

  useEffect(() => {
    if (!selectedFactoryId || !filters.month || !filters.day) {
      return undefined;
    }

    const delay = filters.regNo ? 250 : 0;
    const timer = window.setTimeout(() => {
      loadDashboardRef.current(selectedFactoryId, filters);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    selectedFactoryId,
    filters.mode,
    filters.month,
    filters.day,
    filters.route,
    filters.regNo,
  ]);

  useEffect(() => {
    if (!selectedFactoryId) {
      return undefined;
    }

    const socket = createLeafCollectionSocket(selectedFactoryId);
    setSocketState("connecting");

    socket.onopen = () => {
      setSocketState("live");
    };

    socket.onerror = () => {
      setSocketState("error");
    };

    socket.onclose = () => {
      setSocketState("disconnected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (
          message.type === "dashboard.updated" &&
          (
            selectedFactoryRef.current === "all-factories" ||
            message.factoryId === selectedFactoryRef.current
          )
        ) {
          loadDashboardRef.current(
            selectedFactoryRef.current,
            latestFiltersRef.current,
            { silent: true },
          );
        }
      } catch (error) {
        console.error("Invalid WebSocket message received.", error);
      }
    };

    return () => {
      socket.close();
    };
  }, [selectedFactoryId]);

  function updateFilter(field, value) {
    setFilters((currentValue) => {
      const nextValue = {
        ...currentValue,
        [field]:
          field === "day"
            ? Number(value)
            : field === "regNo"
              ? String(value).replace(/[^\d]/g, "")
              : value,
      };

      if (field === "month") {
        const totalDays = getMonthDayCount(value);
        const currentDay = Number(nextValue.day) || 1;
        nextValue.day = Math.min(currentDay, totalDays);
      }

      return nextValue;
    });
  }

  const dayOptions = buildDayOptions(filters.month);
  const selectedRow =
    dashboard.rows.find((row) => row.rowKey === selectedRowKey) || null;

  return {
    factories,
    selectedFactoryId,
    setSelectedFactoryId,
    filterOptions,
    filters,
    updateFilter,
    dayOptions,
    dashboard,
    selectedRow,
    selectedRowId: selectedRowKey,
    setSelectedRowId: setSelectedRowKey,
    busy: isLoadingFactories || isLoadingMetadata || isLoadingDashboard,
    socketState,
    errorMessage,
  };
}
