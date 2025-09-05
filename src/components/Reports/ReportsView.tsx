import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload } from 'lucide-react';
import { useStock } from '../../contexts/StockContext';
import { supabase } from '../../supabaseClient';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { StockItem } from '../../types';

interface Product {
  ProductID: number;
  ProductName: string;
  ProductType: string;
  DefaultUnit: string;
}

interface SalesReport {
  SalesReportID: number;
  ProductID: number;
  ProductName: string;
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

const SalesReportsView: React.FC = () => {
  const { stockItems, loading, error } = useStock();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedProduct, setSelectedProduct] = useState<number | 'all'>('all');
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Fetch products and sales reports, combining with stockItems
  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('productid, productname, producttype, defaultunit');
      if (productError) throw new Error(`Error fetching products: ${productError.message}`);
      setProducts(
        productData?.map((p: any) => ({
          ProductID: p.productid,
          ProductName: p.productname,
          ProductType: p.producttype,
          DefaultUnit: p.defaultunit,
        })) || []
      );

      // Fetch sales reports
      const { data, error: salesError } = await supabase
        .from('salesreports')
        .select(`
          salesreportid,
          productid,
          reportdate,
          openingcylinders,
          openingunits,
          purchasecylinders,
          purchaseunits,
          totalcylinders,
          totalunits,
          salecylinders,
          salesunits,
          stocktransfercylinders,
          stocktransferunits,
          closingcylinders,
          closingunits,
          physicalcylinders,
          physicalunits,
          discrepancynote,
          createdat,
          products(productname, defaultunit)
        `);
      if (salesError) throw new Error(`Error fetching sales reports: ${salesError.message}`);

      // Combine stockItems with salesreports data
      const formattedReports: SalesReport[] = stockItems.map((item: StockItem) => {
        const salesReport = data?.find((sr: any) => sr.productid === item.productId) || {};
        const product = productData?.find((p: any) => p.productid === item.productId) || {};
        return {
          SalesReportID: salesReport.salesreportid || item.id,
          ProductID: item.productId || 0,
          ProductName: product.productname || item.name,
          ReportDate: salesReport.reportdate || item.lastUpdated,
          OpeningCylinders: salesReport.openingcylinders || item.quantity,
          OpeningUnits: salesReport.openingunits || 0,
          PurchaseCylinders: salesReport.purchasecylinders || 0,
          PurchaseUnits: salesReport.purchaseunits || 0,
          TotalCylinders: salesReport.totalcylinders || item.quantity,
          TotalUnits: salesReport.totalunits || 0,
          SalesCylinders: salesReport.salecylinders || 0,
          SalesUnits: salesReport.salesunits || 0,
          StockTransferCylinders: salesReport.stocktransfercylinders || 0,
          StockTransferUnits: salesReport.stocktransferunits || 0,
          ClosingCylinders: salesReport.closingcylinders || item.quantity,
          ClosingUnits: salesReport.closingunits || 0,
          PhysicalCylinders: item.quantity,
          PhysicalUnits: salesReport.physicalunits || 0,
          DiscrepancyNote: salesReport.discrepancynote || '-',
          CreatedAt: salesReport.createdat || item.dateAdded || new Date().toISOString(),
        };
      });

      setSalesReports(formattedReports);
      setFetchError(null);
    } catch (err) {
      console.error('Fetch data error:', err);
      setFetchError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription for salesreports
    const subscription = supabase
      .channel('salesreports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salesreports' },
        () => {
          console.log('Detected change in salesreports, refetching data...');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [stockItems]);

  const filteredReports = salesReports.filter((report: SalesReport) => {
    const reportDate = new Date(report.ReportDate).toISOString().split('T')[0];
    const isInDateRange = reportDate >= dateRange.start && reportDate <= dateRange.end;
    const isProductMatch = selectedProduct === 'all' || report.ProductID === selectedProduct;
    return isInDateRange && isProductMatch;
  });

  const getSummary = () => {
    return filteredReports.reduce(
      (
        acc: {
          totalOpeningCylinders: number;
          totalOpeningUnits: number;
          totalPurchaseCylinders: number;
          totalPurchaseUnits: number;
          totalSalesCylinders: number;
          totalSalesUnits: number;
          totalClosingCylinders: number;
          totalClosingUnits: number;
        },
        report: SalesReport
      ) => ({
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

  const handleExportCSV = () => {
    if (!filteredReports.length) {
      alert('No data to export.');
      return;
    }

    const sortedReports = filteredReports.sort((a, b) => a.ProductName.localeCompare(b.ProductName));

    try {
      const csvData = Papa.unparse(
        sortedReports.map((report) => ({
          Date: new Date(report.ReportDate).toLocaleDateString(),
          Product: report.ProductName,
          Opening: `${report.OpeningCylinders} cyl / ${report.OpeningUnits.toFixed(2)} units`,
          Purchased: `${report.PurchaseCylinders} cyl / ${report.PurchaseUnits.toFixed(2)} units`,
          Sold: `${report.SalesCylinders} cyl / ${report.SalesUnits.toFixed(2)} units`,
          Transferred: `${report.StockTransferCylinders} cyl / ${report.StockTransferUnits.toFixed(2)} units`,
          Closing: `${report.ClosingCylinders} cyl / ${report.ClosingUnits.toFixed(2)} units`,
          Physical: `${report.PhysicalCylinders} cyl / ${report.PhysicalUnits.toFixed(2)} units`,
          Discrepancy: report.DiscrepancyNote || '-',
        })),
        { header: true }
      );
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
      alert('CSV exported successfully!');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert(`Failed to export CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      if (result.errors.length) {
        throw new Error(`CSV parsing error: ${result.errors[0].message}`);
      }
      const parsedData = result.data;

      if (!parsedData.length) {
        throw new Error('No valid data found in the uploaded CSV');
      }

      // Map parsed data to SalesReport and upsert in database
      const reportsToUpsert = parsedData.map((row: any) => {
        const parseField = (field: string) => {
          if (!field || field === '-') return { cyl: 0, units: 0 };
          const [cylStr = '0', unitsStr = '0'] = field.split(' / ');
          return {
            cyl: Number(cylStr.replace(' cyl', '')) || 0,
            units: Number(unitsStr.replace(' units', '')) || 0,
          };
        };

        // Parse date in various formats (e.g., MM/DD/YYYY, YYYY-MM-DD)
        let reportDate = row.Date;
        if (reportDate) {
          const dateObj = new Date(reportDate);
          if (!isNaN(dateObj.getTime())) {
            reportDate = dateObj.toISOString().split('T')[0];
          } else {
            throw new Error(`Invalid date format for row with Product: ${row.Product}`);
          }
        } else {
          reportDate = new Date().toISOString().split('T')[0];
        }

        return {
          productid: Number(row.ProductID) || products.find(p => p.ProductName === row.Product)?.ProductID || 0,
          reportdate: reportDate,
          openingcylinders: parseField(row.Opening).cyl,
          openingunits: parseField(row.Opening).units,
          purchasecylinders: parseField(row.Purchased).cyl,
          purchaseunits: parseField(row.Purchased).units,
          totalcylinders: parseField(row.Total || row.Opening).cyl,
          totalunits: parseField(row.Total || row.Opening).units,
          salecylinders: parseField(row.Sold).cyl,
          salesunits: parseField(row.Sold).units,
          stocktransfercylinders: parseField(row.Transferred).cyl,
          stocktransferunits: parseField(row.Transferred).units,
          closingcylinders: parseField(row.Closing).cyl,
          closingunits: parseField(row.Closing).units,
          physicalcylinders: parseField(row.Physical).cyl,
          physicalunits: parseField(row.Physical).units,
          discrepancynote: row.Discrepancy && row.Discrepancy !== '-' ? row.Discrepancy : null,
          createdat: new Date().toISOString(),
        };
      });

      // Validate data
      const invalidRows = reportsToUpsert.filter(row => row.productid === 0 || !row.reportdate);
      if (invalidRows.length) {
        throw new Error('Some rows have invalid ProductID or ReportDate');
      }

      // Upsert into salesreports table
      const { error } = await supabase
        .from('salesreports')
        .upsert(reportsToUpsert, { onConflict: ['productid', 'reportdate'] });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      await fetchData(); // Refresh frontend data
      alert('CSV imported successfully!');
    } catch (err) {
      console.error('Import error (CSV):', err);
      alert(`Failed to import CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const triggerImport = () => {
    csvInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
      e.target.value = ''; // Reset file input
    }
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
                  {report.ProductName}
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

  if (loading || fetchError) return <div className="text-center py-10 text-red-600 dark:text-red-400">{fetchError || 'Loading...'}</div>;
  if (error) return <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Reports</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={triggerImport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <input
            type="file"
            ref={csvInputRef}
            onChange={onFileChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Products</option>
              {products.map((product) => (
                <option key={product.ProductID} value={product.ProductID}>
                  {product.ProductName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
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