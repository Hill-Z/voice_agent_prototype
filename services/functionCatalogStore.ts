import { FlowFunction } from '../types';

const FUNCTION_CATALOG_STORAGE_KEY = 'polyai.custom-functions';
const FUNCTION_CATALOG_EVENT = 'polyai:function-catalog-updated';

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadStoredCustomFunctions(): FlowFunction[] {
  if (!canUseBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(FUNCTION_CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FlowFunction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomFunctions(functions: FlowFunction[]): void {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(FUNCTION_CATALOG_STORAGE_KEY, JSON.stringify(functions));
  window.dispatchEvent(new CustomEvent(FUNCTION_CATALOG_EVENT, { detail: functions }));
}

export function getFunctionCatalogStoreEventName() {
  return FUNCTION_CATALOG_EVENT;
}
