import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

const Customers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [reEngageCustomer, setReEngageCustomer] = useState(null);
  const [reEngageMessage, setReEngageMessage] = useState('');
  const [reEngageChannel, setReEngageChannel] = useState('email');
  const [reEngageLoading, setReEngageLoading] = useState(false);
  const [showReEngage, setShowReEngage] = useState(false);

  const loadData = async (tab = activeTab) => {
    setLoading(true);
    try {
      let customerUrl = tab === 'inactive' ? '/customers/inactive?days=90' : '/customers';
      const [custRes, empRes] = await Promise.all([
        api.get(customerUrl),
        user.role === 'admin' ? api.get('/employees') : Promise.resolve({ data: { data: [] } }),
      ]);

      setCustomers(tab === 'inactive' ? custRes.data.data : custRes.data.data.data || custRes.data.data);
      setEmployees(empRes.data.data.data || empRes.data.data || []);
    } catch (error) {
      console.error('Error loading CRM details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAssignEmployee = async (customerId, employeeId) => {
    try {
      if (!employeeId) {
        const res = await api.post(`/customers/${customerId}/unassign-employee`);
        if (res.data.success) {
          toast('Employee unassigned successfully.', 'success');
          loadData();
        }
      } else {
        const res = await api.post(`/customers/${customerId}/assign-employee`, { employee_id: employeeId });
        if (res.data.success) {
          toast('Employee assigned successfully.', 'success');
          loadData();
        }
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Error updating assignment.', 'error');
    }
  };

  const handleViewPurchases = async (customer) => {
    setSelectedCustomer(customer);
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/customers/${customer.id}/purchases`);
      if (res.data.success) {
        setPurchaseHistory(res.data.data.data || res.data.data);
      }
    } catch (err) {
      console.error('Error loading purchase history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReEngageSubmit = async (e) => {
    e.preventDefault();
    setReEngageLoading(true);
    try {
      const res = await api.post(`/customers/${reEngageCustomer.id}/re-engage`, {
        message: reEngageMessage,
        channel: reEngageChannel,
      });

      if (res.data.success) {
        toast(`Re-engagement notification sent successfully using ${reEngageChannel}!`, 'success');
        setShowReEngage(false);
        setReEngageMessage('');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send re-engagement.', 'error');
    } finally {
      setReEngageLoading(false);
    }
  };

  const openReEngage = (customer) => {
    setReEngageCustomer(customer);
    setReEngageMessage(`Hi ${customer.name}, we haven't seen you in a while! Here is a special 15% discount code for your next order: REENGAGE15`);
    setShowReEngage(true);
  };

  return (
    <div>
      <div className="card-header">
        <h1 style={{ margin: 0, fontSize: '28px' }}>Customers CRM</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Customers
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`btn ${activeTab === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'inactive' ? {} : { border: '1px solid var(--warning)', color: 'var(--warning)' }}
          >
            Lost/Inactive (90d+)
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : customers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>No customers found matching filter.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>Purchase Freq</th>
                  <th>Last Purchase</th>
                  <th>Status</th>
                  {activeTab === 'inactive' && <th>Re-engage</th>}
                  <th>Assigned Rep</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => {
                  const isInactive = activeTab === 'inactive' || 
                    (customer.last_purchase_date && 
                     (new Date() - new Date(customer.last_purchase_date)) / (1000 * 60 * 60 * 24) >= 90);

                  return (
                    <tr key={customer.id}>
                      <td>
                        <button
                          onClick={() => handleViewPurchases(customer)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                          {customer.name}
                        </button>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div>{customer.email}</div>
                        <div style={{ color: 'var(--text)' }}>{customer.phone || 'N/A'}</div>
                      </td>
                      <td>{customer.purchase_frequency} times</td>
                      <td>{customer.last_purchase_date || 'Never'}</td>
                      <td>
                        <span className={`badge ${isInactive ? 'badge-danger' : 'badge-success'}`}>
                          {isInactive ? 'Lost' : 'Active'}
                        </span>
                      </td>
                      {activeTab === 'inactive' && (
                        <td>
                          <button
                            onClick={() => openReEngage(customer)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ✉️ Re-engage
                          </button>
                        </td>
                      )}
                      <td>
                        {user.role === 'admin' ? (
                          <select
                            className="form-control"
                            style={{ padding: '4px 8px', fontSize: '13px', width: '160px' }}
                            value={customer.assigned_employee_id || ''}
                            onChange={(e) => handleAssignEmployee(customer.id, e.target.value)}
                          >
                            <option value="">-- Unassigned --</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: '13px' }}>
                            {customer.assigned_employee?.name || <em style={{ color: 'var(--text)' }}>None</em>}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '700px', maxHeight: '80%', overflowY: 'auto', background: 'var(--panel-bg)' }}>
            <div className="card-header">
              <h3 className="card-title">Purchase History: {selectedCustomer?.name}</h3>
              <button onClick={() => setShowHistory(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Close</button>
            </div>
            
            {historyLoading ? (
              <div className="loader-container"><div className="loader"></div></div>
            ) : purchaseHistory.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>No purchases found for this customer.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Branch</th>
                      <th>Items</th>
                      <th>Total Paid</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.map(sale => (
                      <tr key={sale.id}>
                        <td><code>{sale.invoice_number}</code></td>
                        <td>{sale.branch?.name}</td>
                        <td style={{ fontSize: '13px' }}>
                          {(sale.items || []).map((item, idx) => (
                            <div key={idx}>- {item.product?.name} (x{item.quantity})</div>
                          ))}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>${parseFloat(sale.total_amount).toFixed(2)}</td>
                        <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showReEngage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', background: 'var(--panel-bg)' }}>
            <div className="card-header">
              <h3 className="card-title">Send Promo to {reEngageCustomer?.name}</h3>
              <button onClick={() => setShowReEngage(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
            </div>
            
            <form onSubmit={handleReEngageSubmit}>
              <div className="form-group">
                <label className="form-label">Delivery Channel</label>
                <select
                  className="form-control"
                  value={reEngageChannel}
                  onChange={(e) => setReEngageChannel(e.target.value)}
                >
                  <option value="email">Email (Mailtrap SMTP)</option>
                  <option value="sms">SMS (Log Simulation)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message Text</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={reEngageMessage}
                  onChange={(e) => setReEngageMessage(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={reEngageLoading}
              >
                {reEngageLoading ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
