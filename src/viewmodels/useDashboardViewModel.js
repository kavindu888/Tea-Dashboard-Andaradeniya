import { startTransition, useEffect, useRef, useState } from "react";
import {
  fetchFactories,
  fetchFactorySummaries,
  fetchLeafCollectionFilters,
} from "../api/leafCollectionApi";

const monthLookup = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function toOptionMonthLabel(date) {
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month}-${date.getFullYear()}`;
}

function getMonthDayCount(monthLabel) {
  const [monthCode, yearCode] = String(monthLabel || "").trim().split("-");
  const monthIndex = monthLookup[monthCode?.slice(0, 3).toUpperCase()];
  const year = Number(yearCode);
  if (monthIndex === undefined || !year) return 31;
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong loading the dashboard."
  );
}

const EMPTY_SUMMARY = {
  allFactories: {
    leafSummary: { normalNetWeight: 0, superNetWeight: 0, totalNetWeight: 0 },
    deductions: [],
    excess: { normalExcess: 0, superExcess: 0, totalExcess: 0 },
  },
  factories: [],
};

export function useDashboardViewModel() {
  const today = new Date();

  const [filterOptions, setFilterOptions] = useState({ months: [] });
  const [filters, setFilters] = useState({
    month: toOptionMonthLabel(today),
    day: today.getDate(),
  });
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [busy, setBusy] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const requestIdRef = useRef(0);
  const latestFiltersRef = useRef(filters);
  const loadSummaryRef = useRef(async () => {});

  latestFiltersRef.current = filters;

  loadSummaryRef.current = async (activeFilters, options = {}) => {
    const requestId = ++requestIdRef.current;
    if (!options.silent) setBusy(true);

    try {
      const response = await fetchFactorySummaries(activeFilters);
      if (requestId !== requestIdRef.current) return;
      startTransition(() => {
        setSummary(response);
        setErrorMessage("");
      });
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current && !options.silent) {
        setBusy(false);
      }
    }
  };

  // Load months for the filter dropdowns (use the first factory or all-factories)
  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      try {
        const factoriesResponse = await fetchFactories();
        const firstId =
          factoriesResponse.defaultFactoryId ||
          factoriesResponse.factories?.[0]?.id ||
          "";
        if (!firstId || cancelled) return;

        const filtersResponse = await fetchLeafCollectionFilters(firstId);
        if (cancelled) return;

        startTransition(() => {
          setFilterOptions({ months: filtersResponse.months || [] });
        });
      } catch (error) {
        if (!cancelled) setErrorMessage(getErrorMessage(error));
      }
    }

    loadMeta();
    return () => { cancelled = true; };
  }, []);

  // Load summary whenever filters change
  useEffect(() => {
    if (!filters.month || !filters.day) return undefined;
    loadSummaryRef.current(filters);
    return undefined;
  }, [filters.month, filters.day]);

  // Polling: refresh silently every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSummaryRef.current(latestFiltersRef.current, { silent: true });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function updateFilter(field, value) {
    setFilters((prev) => {
      const next = {
        ...prev,
        [field]: field === "day" ? Number(value) : value,
      };
      if (field === "month") {
        const total = getMonthDayCount(value);
        next.day = Math.min(Number(next.day) || 1, total);
      }
      return next;
    });
  }

  const dayOptions = Array.from(
    { length: getMonthDayCount(filters.month) },
    (_, i) => i + 1,
  );

  return {
    filters,
    filterOptions,
    updateFilter,
    dayOptions,
    summary,
    busy,
    errorMessage,
  };
}
