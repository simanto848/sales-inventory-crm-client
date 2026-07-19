import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });

  const fetchProducts = async (page = 1, query = '') => {
    setLoading(true);
    try {
      let url = query ? `/products/search?q=${encodeURIComponent(query)}&page=${page}` : `/products?page=${page}`;
      const response = await api.get(url);
      if (response.data && response.data.success) {
        setProducts(response.data.data.data);
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const branchRes = await api.get('/branches');
        if (branchRes.data && branchRes.data.success) {
          setBranches(branchRes.data.data.data || branchRes.data.data);
        }
      } catch (err) {
        console.error('Error loading branches:', err);
      }
      fetchProducts(1);
    };
    loadInitialData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1, searchQuery);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val === '') {
      fetchProducts(1, '');
    }
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      fetchProducts(page, searchQuery);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1 style={{ margin: 0, fontSize: '28px' }}>Inventory Catalog</h1>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, SKU..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ width: '260px' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>No products found in catalog.</p>
        ) : (
          <div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    {branches.map(branch => (
                      <th key={branch.id}>{branch.name} Stock</th>
                    ))}
                    <th>Total Available</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const totalStock = (product.branches || []).reduce(
                      (acc, b) => acc + (b.pivot?.stock_quantity || 0), 0
                    );

                    return (
                      <tr key={product.id}>
                        <td><code>{product.sku}</code></td>
                        <td style={{ fontWeight: 600, color: 'var(--text-h)' }}>{product.name}</td>
                        <td>${parseFloat(product.price).toFixed(2)}</td>
                        {branches.map(branch => {
                          const branchStockObj = (product.branches || []).find(b => b.id === branch.id);
                          const quantity = branchStockObj ? branchStockObj.pivot?.stock_quantity : 0;
                          return (
                            <td key={branch.id}>
                              <span className={`badge ${quantity <= 5 ? 'badge-danger' : quantity <= 15 ? 'badge-warning' : 'badge-success'}`}>
                                {quantity}
                              </span>
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 'bold' }}>
                          <span className={`badge ${totalStock <= 15 ? 'badge-danger' : 'badge-info'}`}>
                            {totalStock}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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

export default Products;
