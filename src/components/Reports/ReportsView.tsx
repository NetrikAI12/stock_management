// components/SalesReportsView/SalesReportsView.tsx
import React, { useState, useEffect } from 'react';
import { Download, Calendar, FileText } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Define interfaces for data structures
interface Product {
  ProductID: number;
  ProductName: string;
  ProductType: string;
  DefaultUnit: string;
}

interface SalesReport {
  SalesReportID: number;
  ProductID: number;
  ProductName?: string;
  ReportDate: string;
  OpeningCylinders: number;
  OpeningUnits: number;
  PurchaseCylinders: number;
  PurchaseUnits: number;
  TotalCylinders: number;
  TotalUnits: number;
  SalesCylinders: number;
  SalesUnits: number;
  StockTransferCylinders: number;
  StockTransferUnits: number;
  ClosingCylinders: number;
  ClosingUnits: number;
  PhysicalCylinders: number;
  PhysicalUnits: number;
  DiscrepancyNote?: string;
  CreatedAt: string;
}

interface StockContextType {
  salesReports: SalesReport[];
  products: Product[];
  loading: boolean;
  error: string | null;
}

const useStock = (): StockContextType => {
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchProducts();
        await fetchSalesReports();
      } catch (err) {
        setError('Failed to fetch data. Please check your Supabase connection or RLS policies.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error fetching products:', error.message);
      throw error;
    } else {
      setProducts(data || []);
    }
  };

  const fetchSalesReports = async () => {
    const { data, error } = await supabase
      .from('salesreports')
      .select(`
        *,
        products(productname, defaultunit)
      `);
    if (error) {
      console.error('Error fetching sales reports:', error.message);
      throw error;
    } else {
      const formattedSalesReports = data.map((report: any) => ({
        SalesReportID: report.salesreportid,
        ProductID: report.productid,
        ProductName: report.products.productname,
        ReportDate: report.reportdate,
        OpeningCylinders: report.openingcylinders,
        OpeningUnits: report.openingunits,
        PurchaseCylinders: report.purchasecylinders,
        PurchaseUnits: report.purchaseunits,
        TotalCylinders: report.totalcylinders,
        TotalUnits: report.totalunits,
        SalesCylinders: report.salecylinders,
        SalesUnits: report.salesunits,
        StockTransferCylinders: report.stocktransfercylinders,
        StockTransferUnits: report.stocktransferunits,
        ClosingCylinders: report.closingcylinders,
        ClosingUnits: report.closingunits,
        PhysicalCylinders: report.physicalcylinders,
        PhysicalUnits: report.physicalunits,
        DiscrepancyNote: report.discrepancynote,
        CreatedAt: report.createdat,
      }));
      setSalesReports(formattedSalesReports);
    }
  };

  return { salesReports, products, loading, error };
};

const SalesReportsView: React.FC = () => {
  const { salesReports, products, loading, error } = useStock();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedProduct, setSelectedProduct] = useState<number | 'all'>('all');

  const handleExport = (format: 'csv' | 'pdf') => {
    alert(`Exporting sales report as ${format.toUpperCase()}...`);
    // Implement export logic here (e.g., using Papa Parse for CSV or jsPDF for PDF)
  };

  const filteredReports = salesReports.filter((report: SalesReport) => {
    const reportDate = new Date(report.ReportDate).toISOString().split('T')[0];
    const isInDateRange = reportDate >= dateRange.start && reportDate <= dateRange.end;
    const isProductMatch = selectedProduct === 'all' || report.ProductID === selectedProduct;
    return isInDateRange && isProductMatch;
  });

  const getSummary = () => {
    return filteredReports.reduce(
      (acc: {
        totalOpeningCylinders: number;
        totalOpeningUnits: number;
        totalPurchaseCylinders: number;
        totalPurchaseUnits: number;
        totalSalesCylinders: number;
        totalSalesUnits: number;
        totalClosingCylinders: number;
        totalClosingUnits: number;
      }, report: SalesReport) => ({
        totalOpeningCylinders: acc.totalOpeningCylinders + report.OpeningCylinders,
        totalOpeningUnits: acc.totalOpeningUnits + report.OpeningUnits,
        totalPurchaseCylinders: acc.totalPurchaseCylinders + report.PurchaseCylinders,
        totalPurchaseUnits: acc.totalPurchaseUnits + report.PurchaseUnits,
        totalSalesCylinders: acc.totalSalesCylinders + report.SalesCylinders,
        totalSalesUnits: acc.totalSalesUnits + report.SalesUnits,
        totalClosingCylinders: acc.totalClosingCylinders + report.ClosingCylinders,
        totalClosingUnits: acc.totalClosingUnits + report.ClosingUnits,
      }),
      {
        totalOpeningCylinders: 0,
        totalOpeningUnits: 0,
        totalPurchaseCylinders: 0,
        totalPurchaseUnits: 0,
        totalSalesCylinders: 0,
        totalSalesUnits: 0,
        totalClosingCylinders: 0,
        totalClosingUnits: 0,
      }
    );
  };

  const summary = getSummary();

  const renderSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white">Total Opening</h4>
        <p className="text-2xl font-bold text-blue-600 mt-1">
          {summary.totalOpeningCylinders} cyl / {summary.totalOpeningUnits.toFixed(2)} units
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white">Total Purchased</h4>
        <p className="text-2xl font-bold text-green-600 mt-1">
          {summary.totalPurchaseCylinders} cyl / {summary.totalPurchaseUnits.toFixed(2)} units
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white">Total Sold</h4>
        <p className="text-2xl font-bold text-red-600 mt-1">
          {summary.totalSalesCylinders} cyl / {summary.totalSalesUnits.toFixed(2)} units
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white">Total Closing</h4>
        <p className="text-2xl font-bold text-purple-600 mt-1">
          {summary.totalClosingCylinders} cyl / {summary.totalClosingUnits.toFixed(2)} units
        </p>
      </div>
    </div>
  );

  const renderReportsTable = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">
          Sales Reports ({filteredReports.length} records)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Opening
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Purchased
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transferred
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Closing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Physical
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Discrepancy
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredReports.map((report: SalesReport) => (
              <tr key={report.SalesReportID}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {new Date(report.ReportDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.ProductName || `Product ${report.ProductID}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.OpeningCylinders} cyl / {report.OpeningUnits.toFixed(2)} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.PurchaseCylinders} cyl / {report.PurchaseUnits.toFixed(2)} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.SalesCylinders} cyl / {report.SalesUnits.toFixed(2)} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.StockTransferCylinders} cyl / {report.StockTransferUnits.toFixed(2)} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.ClosingCylinders} cyl / {report.ClosingUnits.toFixed(2)} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.PhysicalCylinders} cyl / {report.PhysicalUnits.toFixed(2)} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {report.DiscrepancyNote || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sales Reports
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Products</option>
              {products.length > 0 ? (
                products.map((product: Product) => (
                  <option key={product.ProductID} value={product.ProductID}>
                    {product.ProductName}
                  </option>
                ))
              ) : (
                <option disabled>No products available</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {renderSummary()}
      {renderReportsTable()}
    </div>
  );
};

export default SalesReportsView;