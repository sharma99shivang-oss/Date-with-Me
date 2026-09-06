import { useEffect, useState } from 'react';
import { Download, Eye, Heart, LogIn, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminApi } from './api.js';

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try { const result = await getAdminApi().post('/admin/login', form); localStorage.setItem('dateMeAdminToken', result.data.token); onLogin(); toast.success('Welcome back, princess.'); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not log in.'); }
    finally { setBusy(false); }
  }
  return <main className="admin-shell"><div className="admin-login card-shadow"><div className="hero-heart small"><Heart size={30} fill="currentColor" /></div><p className="eyebrow">private garden</p><h1>Response room</h1><p className="body-copy">See the answers to your little invitation, all in one place.</p><form onSubmit={submit}><input className="field" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input className="field" type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button className="primary-button full" disabled={busy}>{busy ? 'Opening...' : <><LogIn size={17} /> Enter quietly</>}</button></form><Link className="back-link standalone" to="/"><Heart size={14} /> back to the invitation</Link></div></main>;
}

export default function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('dateMeAdminToken')));
  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;
  return <Dashboard onLogout={() => { localStorage.removeItem('dateMeAdminToken'); setAuthenticated(false); navigate('/admin'); }} />;
}

function Dashboard({ onLogout }) {
  const client = getAdminApi();
  const [analytics, setAnalytics] = useState(null);
  const [responses, setResponses] = useState({ items: [], total: 0 });
  const [invitations, setInvitations] = useState([]);
  const [filters, setFilters] = useState({ search: '', answer: '', dateType: '', from: '', to: '' });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      const [stats, list, owners] = await Promise.all([client.get('/admin/analytics'), client.get(`/admin/responses?${query}`), client.get(`/admin/invitations?search=${encodeURIComponent(filters.search)}`)]);
      setAnalytics(stats.data); setResponses(list.data); setInvitations(owners.data.items);
    } catch (error) {
      if (error.response?.status === 401) onLogout();
      else toast.error('Could not load the response room.');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filters.answer, filters.dateType, filters.from, filters.to]);

  async function remove(id) {
    if (!window.confirm('Delete this response permanently?')) return;
    try { await client.delete(`/admin/responses/${id}`); toast.success('Response removed.'); load(); }
    catch { toast.error('Could not delete response.'); }
  }
  async function exportData(format) {
    try {
      const query = new URLSearchParams({ format, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
      const result = await client.get(`/admin/export?${query}`, { responseType: 'blob' });
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'csv' ? 'date-me-responses.csv' : 'date-me-responses.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error.response?.status === 401) onLogout();
      else toast.error('The export could not be prepared.');
    }

    async function removeInvitation(inviteCode) {
      if (!window.confirm('Delete this invitation and all of its responses?')) return;
      try { await client.delete(`/admin/invitations/${inviteCode}`); toast.success('Invitation removed.'); load(); }
      catch { toast.error('Could not delete invitation.'); }
    }
  }

  return <main className="admin-shell"><header className="admin-nav"><Link to="/" className="brand"><span>♡</span> Date With Me</Link><div><span className="admin-caption">super admin · private response room</span><button className="logout-button" onClick={onLogout}>log out</button></div></header><section className="dashboard"><div className="dashboard-heading"><div><p className="eyebrow">platform overview</p><h1>Invitation owners</h1><p className="body-copy">Every invitation, owner, and response in one quiet place.</p></div><div className="export-actions"><button className="secondary-button" onClick={() => exportData('csv')}><Download size={16} /> CSV</button><button className="secondary-button" onClick={() => exportData('json')}><Download size={16} /> JSON</button></div></div><div className="stat-grid">{[['Invitation owners', analytics?.owners ?? '—', 'private links created'], ['Total responses', analytics?.total ?? '—', 'all invitations'], ['Accepted', analytics?.yes ?? '—', 'a very good number'], ['Rejected', analytics?.no ?? '—', 'received with care'], ["Today's responses", analytics?.today ?? '—', 'freshly delivered'], ['Upcoming dates', analytics?.upcoming ?? '—', 'calendar magic']].map(([label, value, helper]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{helper}</small></div>)}</div><div className="table-card owner-table"><div className="table-toolbar"><div className="search-field"><Search size={17} /><input placeholder="Search invitation owners..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} onKeyDown={(event) => event.key === 'Enter' && load()} /></div></div>{invitations.length === 0 ? <div className="empty-state">No invitation owners yet.</div> : invitations.map((item) => <div className="table-row owner-row" key={item._id}><span><strong>{item.ownerName}</strong><small>{item.ownerEmail}</small></span><span>{item.ownerPhone}</span><span>{item.inviteCode}</span><span>{item.status}</span><span className="row-actions"><button aria-label="Delete invitation" onClick={() => removeInvitation(item.inviteCode)}><Trash2 size={16} /></button></span></div>)}</div><div className="table-card response-admin-table"><div className="table-toolbar"><strong>Recent responses</strong><select value={filters.answer} onChange={(e) => setFilters({ ...filters, answer: e.target.value })}><option value="">All answers</option><option value="yes">Accepted</option><option value="no">Rejected</option></select></div>{loading ? <div className="empty-state">Gathering responses…</div> : responses.items.length === 0 ? <div className="empty-state">No responses yet.</div> : <div className="response-table"><div className="table-head"><span>Answer</span><span>Invite</span><span>Guest</span><span>Received</span><span>Actions</span></div>{responses.items.map((item) => <div className="table-row" key={item._id}><span><b className={`pill ${item.answer}`}>{item.answer === 'yes' ? '♡ yes' : 'no'}</b></span><span>{item.inviteCode}</span><span>{item.guestName || '—'}</span><span>{new Date(item.createdAt).toLocaleDateString()}</span><span className="row-actions"><button aria-label="View" onClick={async () => setSelected((await client.get(`/admin/responses/${item._id}`)).data)}><Eye size={16} /></button><button aria-label="Delete" onClick={() => remove(item._id)}><Trash2 size={16} /></button></span></div>)}</div>}</div></section>{selected && <Detail response={selected} onClose={() => setSelected(null)} />}</main>;
}

function Detail({ response, onClose }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="detail-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><p className="eyebrow">response detail</p><h2>{response.answer === 'yes' ? 'A date is blooming.' : 'A thoughtful no.'}</h2><div className="detail-grid">{Object.entries(response).filter(([key, value]) => value && !['_id', '__v', 'metadata'].includes(key) && typeof value !== 'object').map(([key, value]) => <div key={key}><small>{key.replace(/([A-Z])/g, ' $1')}</small><strong>{key === 'createdAt' ? new Date(value).toLocaleString() : value}</strong></div>)}</div></div></div>;
}
