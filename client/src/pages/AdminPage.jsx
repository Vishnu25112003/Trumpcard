import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const STAT_KEYS = ['power', 'speed', 'intelligence', 'strength', 'defense', 'popularity'];
const STAT_COLORS = {
  power:        'text-red-400',
  speed:        'text-yellow-400',
  intelligence: 'text-blue-400',
  strength:     'text-orange-400',
  defense:      'text-green-400',
  popularity:   'text-pink-400',
};

const emptyForm = {
  name: '',
  category: 'anime',
  stats: { power: '', speed: '', intelligence: '', strength: '', defense: '', popularity: '' },
  image: null,
};

export default function AdminPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cards');
      setCards(res.data.data);
    } catch (err) {
      showToast('Failed to load cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAddModal = () => {
    setEditCard(null);
    setForm(emptyForm);
    setPreview(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (card) => {
    setEditCard(card);
    setForm({
      name: card.name,
      category: card.category,
      stats: { ...card.stats },
      image: null,
    });
    setPreview(card.image);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditCard(null);
    setForm(emptyForm);
    setPreview(null);
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleStatChange = (key, val) => {
    setForm((f) => ({ ...f, stats: { ...f.stats, [key]: val } }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Character name is required';
    if (!editCard && !form.image) return 'Card image is required';
    for (const key of STAT_KEYS) {
      const v = Number(form.stats[key]);
      if (!form.stats[key] && form.stats[key] !== 0) return `${key} stat is required`;
      if (v < 1 || v > 100) return `${key} must be between 1 and 100`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setError(err); return; }

    setSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('category', form.category);
      fd.append('stats', JSON.stringify({
        power:        Number(form.stats.power),
        speed:        Number(form.stats.speed),
        intelligence: Number(form.stats.intelligence),
        strength:     Number(form.stats.strength),
        defense:      Number(form.stats.defense),
        popularity:   Number(form.stats.popularity),
      }));
      if (form.image) fd.append('image', form.image);

      if (editCard) {
        await api.put(`/cards/${editCard._id}`, fd);
        showToast('Card updated successfully!');
      } else {
        await api.post('/cards', fd);
        showToast('Card created successfully!');
      }

      closeModal();
      fetchCards();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cards/${id}`);
      setDeleteConfirm(null);
      showToast('Card deleted', 'success');
      fetchCards();
    } catch (err) {
      showToast('Failed to delete card', 'error');
    }
  };

  const statBarWidth = (val) => `${Math.max(2, Number(val) || 0)}%`;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-[#12121a] border-b border-purple-900/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🃏</span>
            <div>
              <h1 className="text-xl font-bold text-white">Trumpcard Admin</h1>
              <p className="text-xs text-gray-500">Manage anime cards</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#1a1a2e] px-4 py-2 rounded-lg border border-purple-900/30">
              <span className="text-purple-400 font-bold text-lg">{cards.length}</span>
              <span className="text-gray-400 text-sm">/ 52 Cards</span>
            </div>
            <button
              onClick={openAddModal}
              disabled={cards.length >= 52}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <span className="text-lg leading-none">+</span>
              Add Card
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <div className="h-1 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(cards.length / 52) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <span className="text-6xl">🃏</span>
            <p className="text-gray-400 text-lg">No cards yet</p>
            <p className="text-gray-600 text-sm">Click "Add Card" to create the first anime card</p>
            <button
              onClick={openAddModal}
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add First Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cards.map((card) => (
              <div
                key={card._id}
                className="bg-[#12121a] border border-[#1a1a2e] rounded-xl overflow-hidden hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/20 group"
              >
                {/* Card image */}
                <div className="relative h-52 overflow-hidden bg-[#1a1a2e]">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent" />
                  <span className="absolute top-2 right-2 bg-purple-600/80 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {card.category}
                  </span>
                </div>

                {/* Card name */}
                <div className="px-4 pt-3 pb-2">
                  <h3 className="font-bold text-white text-sm truncate">{card.name}</h3>
                </div>

                {/* Stats */}
                <div className="px-4 pb-3 space-y-1.5">
                  {STAT_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`text-xs capitalize w-20 shrink-0 ${STAT_COLORS[key]}`}>
                        {key}
                      </span>
                      <div className="flex-1 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-amber-500"
                          style={{ width: statBarWidth(card.stats[key]) }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right shrink-0">
                        {card.stats[key]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => openEditModal(card)}
                    className="flex-1 bg-[#1a1a2e] hover:bg-purple-900/30 text-gray-300 hover:text-purple-300 text-xs py-2 rounded-lg border border-[#2a2a3e] hover:border-purple-800/50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(card)}
                    className="flex-1 bg-[#1a1a2e] hover:bg-red-900/20 text-gray-300 hover:text-red-400 text-xs py-2 rounded-lg border border-[#2a2a3e] hover:border-red-900/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a2e]">
              <h2 className="text-lg font-bold text-white">
                {editCard ? 'Edit Card' : 'Add New Card'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Image upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Character Image {!editCard && <span className="text-red-400">*</span>}
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-40 rounded-xl border-2 border-dashed border-[#2a2a3e] hover:border-purple-700 transition-colors cursor-pointer overflow-hidden bg-[#1a1a2e] flex items-center justify-center"
                >
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl mb-2">🖼️</div>
                      <p className="text-gray-500 text-sm">Click to upload image</p>
                      <p className="text-gray-600 text-xs mt-1">JPG, PNG, WEBP — max 5MB</p>
                    </div>
                  )}
                  {preview && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Change Image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Character Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Naruto Uzumaki"
                  className="w-full bg-[#1a1a2e] border border-[#2a2a3e] text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>

              {/* Stats */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">
                  Stats <span className="text-gray-600 text-xs">(1 – 100 each)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {STAT_KEYS.map((key) => (
                    <div key={key}>
                      <label className={`block text-xs capitalize mb-1 ${STAT_COLORS[key]}`}>
                        {key}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={form.stats[key]}
                        onChange={(e) => handleStatChange(key, e.target.value)}
                        placeholder="1-100"
                        className="w-full bg-[#1a1a2e] border border-[#2a2a3e] text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-600 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#2a2a3e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editCard ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="text-white font-bold text-lg mb-1">Delete Card?</h3>
              <p className="text-gray-400 text-sm">
                This will permanently delete{' '}
                <span className="text-white font-medium">{deleteConfirm.name}</span> and its
                Cloudinary image.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#2a2a3e]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl transition-all ${
            toast.type === 'error'
              ? 'bg-red-900/90 text-red-200 border border-red-800/50'
              : 'bg-green-900/90 text-green-200 border border-green-800/50'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
