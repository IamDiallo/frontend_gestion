/**
 * Production Domain API
 * Handles: Productions, ProductionMaterials
 * Base path: /api/production/
 */

import { api } from './config';
import type { Production } from '../../interfaces/production';

// ============================================================================
// PRODUCTIONS
// ============================================================================

export const fetchProductions = async (): Promise<Production[]> => {
  const response = await api.get('/production/productions/');
  return response.data.results || response.data;
};

export const createProduction = async (data: Partial<Production>): Promise<Production> => {
  const response = await api.post('/production/productions/', data);
  return response.data;
};

export const updateProduction = async (id: number, data: Partial<Production>): Promise<Production> => {
  const response = await api.patch(`/production/productions/${id}/`, data);
  return response.data;
};

export const deleteProduction = async (id: number): Promise<void> => {
  await api.delete(`/production/productions/${id}/`);
};

export const approveProduction = async (id: number): Promise<Production> => {
  const response = await api.post(`/production/productions/${id}/approve/`);
  return response.data;
};

// ============================================================================
// PRODUCTION MATERIALS
// ============================================================================

export const fetchProductionMaterials = async (): Promise<unknown[]> => {
  const response = await api.get('/production/production-materials/');
  return response.data.results || response.data;
};

export const createProductionMaterial = async (data: Record<string, unknown>): Promise<unknown> => {
  const response = await api.post('/production/production-materials/', data);
  return response.data;
};

export const updateProductionMaterial = async (id: number, data: Record<string, unknown>): Promise<unknown> => {
  const response = await api.patch(`/production/production-materials/${id}/`, data);
  return response.data;
};

export const deleteProductionMaterial = async (id: number): Promise<void> => {
  await api.delete(`/production/production-materials/${id}/`);
};
