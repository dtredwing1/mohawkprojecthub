'use client';

import { useState, useEffect } from 'react';
import { OpenItem, ItemStatus, Priority } from '@/lib/types';
import { useModals } from '@/components/ModalContext';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Loader2,
  Tag,
  User,
  Calendar,
} from 'lucide-react';

export default function OpenItemsPage() {
  const { openModal } = useModals();
  const [items, setItems] = useState<OpenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchItems = () => {
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleStatusToggle = async (item: OpenItem) => {
    let nextStatus: ItemStatus = 'in-progress';
    if (item.status === 'todo') nextStatus = 'in-progress';
    else if (item.status === 'in-progress') nextStatus = 'done';
    else if (item.status === 'done') nextStatus = 'todo';
    else if (item.status === 'blocked') nextStatus = 'in-progress';

    setUpdatingId(item.id);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, actorName: 'Team Member' }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this open item?')) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.owner.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const getStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-sky-400" />;
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <Circle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-sky-400" />
            Open Items & Action Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lightweight, high-velocity backlog tracking deliverables, blockers, and AI agent work items.
          </p>
        </div>

        <button
          onClick={() => openModal('new-item')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Action Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Filter by title, owner, tags, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'todo', 'in-progress', 'blocked', 'done'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-sky-500/20 text-sky-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <CheckSquare className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No action items found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No open items match your current filter settings. Click "+ New Action Item" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl bg-slate-900/70 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                item.status === 'done'
                  ? 'border-slate-800/50 opacity-60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  onClick={() => handleStatusToggle(item)}
                  disabled={updatingId === item.id}
                  title="Click to advance status"
                  className="mt-0.5 p-0.5 rounded hover:scale-110 transition-transform cursor-pointer shrink-0"
                >
                  {updatingId === item.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                  ) : (
                    getStatusIcon(item.status)
                  )}
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(item.priority)}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {item.status.toUpperCase()}
                    </span>
                    <h3
                      className={`text-sm font-medium ${
                        item.status === 'done' ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-300">{item.owner}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.dueDate}</span>
                    </span>
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <div className="flex gap-1">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleStatusToggle(item)}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {item.status === 'done'
                    ? 'Reopen'
                    : item.status === 'todo'
                    ? 'Start'
                    : 'Mark Done'}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
