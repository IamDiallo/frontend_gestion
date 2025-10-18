/**
 * Partners Domain API
 * Handles: Clients, Suppliers, Employees, ClientGroups
 * Base path: /api/partners/
 */

import { api } from './config';
import type { Client, Supplier, Employee, ClientGroup } from '../../interfaces/partners';

// ============================================================================
// CLIENTS
// ============================================================================

export const fetchClients = async (): Promise<Client[]> => {
  const response = await api.get('/partners/clients/');
  return response.data.results || response.data;
};

export const fetchClientById = async (id: number): Promise<Client> => {
  const response = await api.get(`/partners/clients/${id}/`);
  return response.data;
};

export const createClient = async (data: Partial<Client>): Promise<Client> => {
  const response = await api.post('/partners/clients/', data);
  return response.data;
};

export const updateClient = async (id: number, data: Partial<Client>): Promise<Client> => {
  const response = await api.patch(`/partners/clients/${id}/`, data);
  return response.data;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/partners/clients/${id}/`);
};

export const fetchOutstandingClients = async (): Promise<Client[]> => {
  const response = await api.get('/partners/clients/outstanding/');
  return response.data.results || response.data;
};

// ============================================================================
// SUPPLIERS
// ============================================================================

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const response = await api.get('/partners/suppliers/');
  return response.data.results || response.data;
};

export const fetchSupplierById = async (id: number): Promise<Supplier> => {
  const response = await api.get(`/partners/suppliers/${id}/`);
  return response.data;
};

export const createSupplier = async (data: Partial<Supplier>): Promise<Supplier> => {
  const response = await api.post('/partners/suppliers/', data);
  return response.data;
};

export const updateSupplier = async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
  const response = await api.patch(`/partners/suppliers/${id}/`, data);
  return response.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  await api.delete(`/partners/suppliers/${id}/`);
};

export const fetchOutstandingSuppliers = async (): Promise<Supplier[]> => {
  const response = await api.get('/partners/suppliers/outstanding/');
  return response.data.results || response.data;
};

// ============================================================================
// EMPLOYEES
// ============================================================================

export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('/partners/employees/');
  return response.data.results || response.data;
};

export const createEmployee = async (data: Partial<Employee>): Promise<Employee> => {
  const response = await api.post('/partners/employees/', data);
  return response.data;
};

export const updateEmployee = async (id: number, data: Partial<Employee>): Promise<Employee> => {
  const response = await api.patch(`/partners/employees/${id}/`, data);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await api.delete(`/partners/employees/${id}/`);
};

// ============================================================================
// CLIENT GROUPS
// ============================================================================

export const fetchClientGroups = async (): Promise<ClientGroup[]> => {
  const response = await api.get('/partners/client-groups/');
  return response.data.results || response.data;
};

export const createClientGroup = async (data: Partial<ClientGroup>): Promise<ClientGroup> => {
  const response = await api.post('/partners/client-groups/', data);
  return response.data;
};

export const updateClientGroup = async (id: number, data: Partial<ClientGroup>): Promise<ClientGroup> => {
  const response = await api.patch(`/partners/client-groups/${id}/`, data);
  return response.data;
};

export const deleteClientGroup = async (id: number): Promise<void> => {
  await api.delete(`/partners/client-groups/${id}/`);
};
