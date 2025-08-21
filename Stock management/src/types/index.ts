export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
  category: string;
  pricePerUnit: number;
  supplierId?: string | null;
  addedBy: string;
  dateAdded: string;
  lastUpdated: string;
  threshold: number;
  barcode?: string;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  userId: string;
  userName: string;
  timestamp: string;
  supplierName?: string;
  invoiceNumber?: string;
  cost?: number;
  reason?: string;
  transferredTo?: string;
  department?: string;
  status: 'pending' | 'completed';
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  onTimeDelivery: number;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  location: string;
}

export interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  recentTransactions: number;
  categorySummary: { [key: string]: number };
}