/**
 * ⚠️ DEPRECATED - This file is being phased out
 * 
 * This legacy monolithic API file is being replaced with domain-driven APIs.
 * Please use the new domain-specific API modules instead:
 * 
 * - CoreAPI (users, zones, groups, permissions)
 * - SettingsAPI (categories, units, currencies, etc.)
 * - PartnersAPI (clients, suppliers, employees)
 * - InventoryAPI (products, stock, supplies, transfers)
 * - SalesAPI (sales, invoices, quotes)
 * - ProductionAPI (productions, materials)
 * - TreasuryAPI (accounts, expenses, payments)
 * - DashboardAPI (stats, reports)
 * 
 * Import from: import * as CoreAPI from '../services/api/core.api'
 * Or use the compatibility layer: import { ClientsAPI } from '../services/api'
 * 
 * See: frontend/API_DEPRECATION_PLAN.md for migration guide
 * 
 * Remaining usage:
 * - Settings.tsx (generic endpoint-based pattern)
 * - Treasury.BACKUP.tsx (can be deleted)
 */

