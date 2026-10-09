import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Circle, ClipboardList, Edit3, ListTodo, Plus, Search, Trash2, X } from 'lucide-react';
import { todoApi } from './api';

const emptyForm = { title: '', description: '', deadline: '' };

function formatDeadline(deadline) {
  if (!deadline) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${deadline}T00:00:00Z`),
  );
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      setTodos(await todoApi.getAll());
    } catch (err) {
      setError(`${err.message}. Make sure the Spring Boot backend is running on port 8080.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTodos(); }, [loadTodos]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;
  const visibleTodos = useMemo(() => todos.filter((todo) => {
    const matchesFilter = filter === 'all' || (filter === 'active' && !todo.completed) || (filter === 'completed' && todo.completed);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${todo.title} ${todo.description || ''}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [todos, filter, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, deadline: form.deadline || null };
      if (editingId !== null) {
        await todoApi.update(editingId, { ...payload, completed: todos.find((todo) => todo.id === editingId)?.completed ?? false });
      } else {
        await todoApi.create({ ...payload, completed: false });
      }
      resetForm();
      await loadTodos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setForm({ title: todo.title, description: todo.description || '', deadline: todo.deadline || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleTodo(id) {
    try {
      const updated = await todoApi.toggle(id);
      setTodos((current) => current.map((todo) => todo.id === id ? updated : todo));
    } catch (err) { setError(err.message); }
  }

  async function deleteTodo(id) {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      await todoApi.remove(id);
      setTodos((current) => current.filter((todo) => todo.id !== id));
      if (editingId === id) resetForm();
    } catch (err) { setError(err.message); }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-icon"><ListTodo size={22} /></span> donezo<span className="brand-dot">.</span></a>
        <span className="topbar-note"><span className="status-dot" /> Your day, in focus</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL WORKSPACE</div>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p className="hero-copy">A little progress each day adds up to big results.</p>
      </section>

      <section className="stats-grid" aria-label="Task summary">
        <div className="stat-card"><div className="stat-icon purple"><ClipboardList size={19} /></div><div><p>Total tasks</p><strong>{todos.length}</strong></div></div>
        <div className="stat-card"><div className="stat-icon orange"><Circle size={19} /></div><div><p>In progress</p><strong>{activeCount}</strong></div></div>
        <div className="stat-card"><div className="stat-icon green"><Check size={19} /></div><div><p>Completed</p><strong>{completedCount}</strong></div></div>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><span className="section-kicker">PLAN IT. DO IT.</span><h2>{editingId !== null ? 'Edit your task' : 'Add a new task'}</h2></div><span className="step-number">{editingId !== null ? 'EDIT' : '01 / CREATE'}</span></div>
        <form className="task-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="title">Task title <span>*</span></label>
          <input id="title" maxLength="160" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finish my project documentation" required />
          <label className="field-label" htmlFor="description">Description <span className="optional">(optional)</span></label>
          <textarea id="description" maxLength="1000" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add a few details to help you get started..." />
          <label className="field-label" htmlFor="deadline">Deadline <span className="optional">(optional)</span></label>
          <input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <div className="form-footer"><span className="helper-text">Keep it small. Keep it moving.</span><div className="form-actions">{editingId !== null && <button type="button" className="button button-light" onClick={resetForm}><X size={16} /> Cancel</button>}<button className="button button-primary" disabled={saving}><Plus size={18} /> {saving ? 'Saving...' : editingId !== null ? 'Save changes' : 'Add task'}</button></div></div>
        </form>
      </section>

      <section className="task-section">
        <div className="section-heading list-heading"><div><span className="section-kicker">YOUR CHECKLIST</span><h2>Tasks <span className="count-pill">{todos.length}</span></h2></div><div className="search-box"><Search size={17} /><input aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." /></div></div>
        <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
          {[['all', 'All tasks'], ['active', 'In progress'], ['completed', 'Completed']].map(([key, label]) => <button key={key} role="tab" aria-selected={filter === key} className={`filter-tab ${filter === key ? 'selected' : ''}`} onClick={() => setFilter(key)}>{label}{key === 'all' ? ` (${todos.length})` : key === 'active' ? ` (${activeCount})` : ` (${completedCount})`}</button>)}
        </div>

        {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}
        {loading ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={25} /></div><h3>Loading your tasks...</h3><p>Connecting to your todo list.</p></div> :
          visibleTodos.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={25} /></div><h3>{search ? 'No matching tasks' : filter === 'completed' ? 'Nothing completed yet' : filter === 'active' ? 'You’re all caught up' : 'A fresh start'}</h3><p>{search ? 'Try another search term.' : 'Add a task above and take the first step.'}</p></div> :
          <div className="todo-list">{visibleTodos.map((todo) => <article className={`todo-item ${todo.completed ? 'is-completed' : ''}`} key={todo.id}>
            <button className={`complete-button ${todo.completed ? 'checked' : ''}`} onClick={() => toggleTodo(todo.id)} aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as completed'}>{todo.completed && <Check size={16} strokeWidth={3} />}</button>
            <div className="todo-content"><h3>{todo.title}</h3>{todo.description && <p>{todo.description}</p>}{todo.deadline && <span className="task-deadline"><CalendarDays size={13} />Due {formatDeadline(todo.deadline)}</span>}<span className={`task-status ${todo.completed ? 'done' : 'in-progress'}`}><span />{todo.completed ? 'Completed' : 'In progress'}</span></div>
            <div className="todo-actions"><button title="Edit task" aria-label={`Edit ${todo.title}`} onClick={() => startEdit(todo)}><Edit3 size={17} /></button><button title="Delete task" aria-label={`Delete ${todo.title}`} className="delete-action" onClick={() => deleteTodo(todo.id)}><Trash2 size={17} /></button></div>
          </article>)}</div>}
        <div className="list-footer"><span>Showing <strong>{visibleTodos.length}</strong> of <strong>{todos.length}</strong> tasks</span><span>Small steps count <span className="footer-spark">✦</span></span></div>
      </section>
      <footer className="page-footer">BUILT FOR BETTER DAYS <span>·</span> REACT + SPRING BOOT</footer>
    </main>
  );
}
