import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    productsCount: 0,
    inactiveCount: 0,
    salesCount: 0,
    totalRevenue: 0,
  });
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prodRes, customerRes, salesRes] = await Promise.all([
          api.get('/products'),
          api.get('/customers/inactive?days=90'),
          api.get('/sales'),
        ]);

        const totalSales = salesRes.data?.data?.data || [];
        const revenue = totalSales.reduce((acc, sale) => acc + parseFloat(sale.total_amount || 0), 0);

        setMetrics({
          productsCount: prodRes.data?.data?.total || 0,
          inactiveCount: customerRes.data?.data?.length || 0,
          salesCount: salesRes.data?.data?.total || 0,
          totalRevenue: revenue,
        });

        const productsList = prodRes.data?.data?.data || [];
        const lowStockItems = [];
        productsList.forEach(product => {
          const totalStock = (product.branches || []).reduce((acc, b) => acc + (b.pivot?.stock_quantity || 0), 0);
          if (totalStock <= 15) {
            lowStockItems.push({
              name: product.name,
              sku: product.sku,
              stock: totalStock,
            });
          }
        });
        setLowStock(lowStockItems.slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '32px' }}>Welcome, {user?.name}!</h1>
        <Link to="/sales/create" className="btn btn-primary">
          + Record New Sale
        </Link>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Catalog Products</div>
          <div className="stat-value">{metrics.productsCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Sales (Orders)</div>
          <div className="stat-value">{metrics.salesCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Estimated Sales Volume</div>
          <div className="stat-value">${metrics.totalRevenue.toFixed(2)}</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-title">Lost Customers (90d)</div>
          <div className="stat-value">{metrics.inactiveCount}</div>
        </div>

        {user?.role === 'employee' && (
          <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="stat-title">Your KPI Score</div>
            <div className="stat-value">{user.kpi_score || 0}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Quick Navigation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/products" className="nav-link" style={{ border: '1px solid var(--border)' }}>
              📦 View Product stock Levels
            </Link>
            <Link to="/customers" className="nav-link" style={{ border: '1px solid var(--border)' }}>
              👥 Inspect Inactive Customers CRM
            </Link>
            <Link to="/sales" className="nav-link" style={{ border: '1px solid var(--border)' }}>
              🛒 View Order History
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Aggregate Low Stock Alerts (Total &lt;= 15)</h3>
          {lowStock.length === 0 ? (
            <p>No low stock warnings. All inventories healthy!</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Total Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td><code>{item.sku}</code></td>
                      <td>
                        <span className="badge badge-danger">{item.stock} left</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
