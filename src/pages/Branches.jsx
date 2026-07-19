import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Branches = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected branch details & inventory
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchInventory, setBranchInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Branch creation modal
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [branchSubmitting, setBranchSubmitting] = useState(false);

  // Link product modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [initialQty, setInitialQty] = useState(0);
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  // Stock adjustment modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/branches?per_page=100');
      if (res.data && res.data.success) {
        setBranches(res.data.data.data || res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalProducts = async () => {
    try {
      const res = await api.get('/products?per_page=100');
      if (res.data && res.data.success) {
        setProducts(res.data.data.data || res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchGlobalProducts();
  }, []);

  const handleBranchClick = async (branch) => {
    setSelectedBranch(branch);
    setInventoryLoading(true);
    try {
      const res = await api.get(`/branches/${branch.id}/inventory`);
      if (res.data && res.data.success) {
        setBranchInventory(res.data.data.data || res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching branch stock details:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setBranchSubmitting(true);
    try {
      const res = await api.post('/branches', { name: branchName, location: branchLocation });
      if (res.data.success) {
        alert('Store branch created successfully.');
        setShowBranchModal(false);
        setBranchName('');
        setBranchLocation('');
        fetchBranches();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating branch.');
    } finally {
      setBranchSubmitting(false);
    }
  };

  const handleLinkProduct = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a product.');
      return;
    }
    setLinkSubmitting(true);
    try {
      const res = await api.post(`/branches/${selectedBranch.id}/inventory/add-product`, {
        product_id: parseInt(selectedProductId),
        initial_quantity: parseInt(initialQty) || 0,
      });
      if (res.data.success) {
        alert('Product linked to branch inventory successfully.');
        setShowLinkModal(false);
        setSelectedProductId('');
        setInitialQty(0);
        handleBranchClick(selectedBranch);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error linking product.');
    } finally {
      setLinkSubmitting(false);
    }
  };

  const openAdjustModal = (item) => {
    setAdjustProduct(item);
    setAdjustQty(item.stock_quantity || 0);
    setShowAdjustModal(true);
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setAdjustSubmitting(true);
    try {
      const res = await api.post(`/branches/${selectedBranch.id}/inventory`, {
        product_id: adjustProduct.id,
        stock_quantity: parseInt(adjustQty) || 0,
      });
      if (res.data.success) {
        alert('Stock levels updated successfully.');
        setShowAdjustModal(false);
        handleBranchClick(selectedBranch);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust stock.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1 style={{ margin: 0, fontSize: '28px' }}>Store Branches</h1>
        {isAdmin && (
          <button onClick={() => setShowBranchModal(true)} className="btn btn-primary">
            + Add New Location
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        {/* Branch Locations List */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Store Locations</h3>
          {loading ? (
            <div className="loader-container"><div className="loader"></div></div>
          ) : branches.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>No locations setup yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {branches.map(b => (
                <div
                  key={b.id}
                  onClick={() => handleBranchClick(b)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: selectedBranch?.id === b.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: selectedBranch?.id === b.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--panel-bg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>{b.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>
                    📍 {b.location || 'No Location details'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Branch Inventory */}
        <div className="card">
          {selectedBranch ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div>
                  <h3 className="card-title">{selectedBranch.name} Inventory</h3>
                  <p style={{ fontSize: '13px', margin: '4px 0 0' }}>📍 {selectedBranch.location || 'No Location details'}</p>
                </div>
                {isManager && (
                  <button onClick={() => setShowLinkModal(true)} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                    + Link Product Stock
                  </button>
                )}
              </div>

              {inventoryLoading ? (
                <div className="loader-container"><div className="loader"></div></div>
              ) : branchInventory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>No products associated with this branch yet.</p>
                  {isManager && (
                    <button onClick={() => setShowLinkModal(true)} className="btn btn-secondary">
                      Link First Product
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product SKU</th>
                        <th>Name</th>
                        <th>Available Stock</th>
                        {isManager && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {branchInventory.map(item => {
                        const product = item.product || {};
                        const qty = item.stock_quantity || 0;
                        return (
                          <tr key={item.id}>
                            <td><code>{product.sku || 'N/A'}</code></td>
                            <td style={{ fontWeight: 600 }}>{product.name || 'Unknown Product'}</td>
                            <td>
                              <span className={`badge ${qty <= 5 ? 'badge-danger' : qty <= 15 ? 'badge-warning' : 'badge-success'}`}>
                                {qty}
                              </span>
                            </td>
                            {isManager && (
                              <td>
                                <button
                                  onClick={() => openAdjustModal({ ...product, stock_quantity: qty })}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  Adjust Stock
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text)' }}>
              <span style={{ fontSize: '48px' }}>🏢</span>
              <h3 style={{ margin: '16px 0 8px', color: 'var(--text-h)' }}>Select a Branch Location</h3>
              <p>Choose a location from the left side panel to manage branch-specific inventory catalog and stock adjustments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Branch Location Modal */}
      {showBranchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', background: 'var(--panel-bg)' }}>
            <div className="card-header">
              <h3 className="card-title">Add Store Branch</h3>
              <button onClick={() => setShowBranchModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
            </div>
            <form onSubmit={handleCreateBranch}>
              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location / Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={branchSubmitting}>
                {branchSubmitting ? 'Saving...' : 'Save Location'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Link Product Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', background: 'var(--panel-bg)' }}>
            <div className="card-header">
              <h3 className="card-title">Link Product to {selectedBranch?.name}</h3>
              <button onClick={() => setShowLinkModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
            </div>
            <form onSubmit={handleLinkProduct}>
              <div className="form-group">
                <label className="form-label">Select Product Catalog Entry</label>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={initialQty}
                  onChange={(e) => setInitialQty(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={linkSubmitting}>
                {linkSubmitting ? 'Linking...' : 'Add to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', background: 'var(--panel-bg)' }}>
            <div className="card-header">
              <h3 className="card-title">Adjust Stock Level</h3>
              <button onClick={() => setShowAdjustModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div style={{ marginBottom: '16px' }}>
                <strong>Product:</strong> {adjustProduct?.name} <code style={{ fontSize: '12px' }}>{adjustProduct?.sku}</code>
              </div>
              <div className="form-group">
                <label className="form-label">Current Stock Count</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={adjustSubmitting}>
                {adjustSubmitting ? 'Adjusting...' : 'Override Stock Quantity'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
