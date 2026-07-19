import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });

  const fetchSales = async (page = 1, branchId = '') => {
    setLoading(true);
    try {
      let url = branchId ? `/sales/branch/${branchId}?page=${page}` : `/sales?page=${page}`;
      const response = await api.get(url);
      if (response.data && response.data.success) {
        setSales(response.data.data.data);
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
        });
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await api.get('/branches');
        if (res.data && res.data.success) {
          setBranches(res.data.data.data || res.data.data);
        }
      } catch (err) {
        console.error('Error loading branches:', err);
      }
      fetchSales(1);
    };
    loadBranches();
  }, []);

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);
    fetchSales(1, branchId);
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      fetchSales(page, selectedBranch);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1 style={{ margin: 0, fontSize: '28px' }}>Sales & Orders</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="form-control"
            value={selectedBranch}
            onChange={handleBranchChange}
            style={{ width: '180px' }}
          >
            <option value="">-- All Branches --</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <Link to="/sales/create" className="btn btn-primary">
            + Record New Sale
          </Link>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : sales.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>No sales records found.</p>
        ) : (
          <div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Branch</th>
                    <th>Staff Rep</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id}>
                      <td><code>{sale.invoice_number}</code></td>
                      <td style={{ fontWeight: 600 }}>{sale.customer?.name}</td>
                      <td>{sale.branch?.name}</td>
                      <td style={{ fontSize: '13px' }}>{sale.employee?.name || 'N/A'}</td>
                      <td>${parseFloat(sale.subtotal).toFixed(2)}</td>
                      <td style={{ color: 'var(--danger)' }}>-${parseFloat(sale.discount_amount).toFixed(2)}</td>
                      <td>${parseFloat(sale.tax_amount).toFixed(2)}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>
                        ${parseFloat(sale.total_amount).toFixed(2)}
                      </td>
                      <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  onClick={() => changePage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', fontSize: '14px' }}>
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  onClick={() => changePage(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
