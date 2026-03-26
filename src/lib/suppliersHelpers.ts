import { PurchaseInvoice, Supplier } from './supabase';

export interface SupplierFormValues {
  rut: string;
  business_name: string;
  trade_name: string;
  business_activity: string;
  address: string;
  phone: string;
  email: string;
  contact_person: string;
  payment_terms_days: number;
  notes: string;
}

export interface SupplierStats {
  totalSpent: number;
  pendingAmount: number;
  invoiceCount: number;
}

export const DEFAULT_SUPPLIER_FORM: SupplierFormValues = {
  rut: '',
  business_name: '',
  trade_name: '',
  business_activity: '',
  address: '',
  phone: '',
  email: '',
  contact_person: '',
  payment_terms_days: 30,
  notes: '',
};

export const mapSupplierToForm = (supplier: Supplier): SupplierFormValues => {
  return {
    rut: supplier.rut,
    business_name: supplier.business_name,
    trade_name: supplier.trade_name || '',
    business_activity: supplier.business_activity || '',
    address: supplier.address || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    contact_person: supplier.contact_person || '',
    payment_terms_days: supplier.payment_terms_days,
    notes: supplier.notes || '',
  };
};

export const getSupplierStats = (
  invoices: PurchaseInvoice[],
  supplierId: string,
): SupplierStats => {
  const supplierInvoices = invoices.filter((invoice) => invoice.supplier_id === supplierId);
  const totalSpent = supplierInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const pendingInvoices = supplierInvoices.filter((invoice) => invoice.status === 'pending');
  const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

  return {
    totalSpent,
    pendingAmount,
    invoiceCount: supplierInvoices.length,
  };
};
