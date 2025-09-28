import React, { useState } from 'react';
import axios from 'axios';
import '../Cssfiles/Admin.css';
import { API_BASE_URL } from '../../config';

export default function Admin({ items, setItems }) {
  const [expandedId, setExpandedId] = useState(null);
  const [addImageFile, setAddImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    Title: '',
    Ingredients: '',
    Instructions: '',
    Image_Name: '',
    Cleaned_Ingredients: '',
    category: '',
    price: ''
  });

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState('all');
  const uniqueCategories = [
    'all',
    ...Array.from(new Set(items.map(item => item.category || 'Uncategorized')))
  ];

  const fetchItems = async () => {
    try {
      const res = await axios.get('${API_BASE_URL}/api/items');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setItems([]);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ ...item });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      const payload = { ...editForm, price: Number(editForm.price) };
      await axios.put(`${API_BASE_URL}/api/items/${editingId}`, payload);
      setEditingId(null);
      fetchItems();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/items/${id}`);
        fetchItems();
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    }
  };

  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const addItem = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(addForm).forEach(([key, value]) => formData.append(key, value));
    if (addImageFile) formData.append('image', addImageFile);

    try {
      await axios.post('${API_BASE_URL}/api/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAdd(false);
      setAddForm({
        Title: '',
        Ingredients: '',
        Instructions: '',
        Image_Name: '',
        Cleaned_Ingredients: '',
        category: '',
        price: ''
      });
      setAddImageFile(null);
      fetchItems();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  // Group items by category
  const groupedByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Filtered categories for display
  const categoriesToShow = categoryFilter === 'all'
    ? Object.entries(groupedByCategory)
    : Object.entries(groupedByCategory).filter(([cat]) => cat === categoryFilter);

  return (
    <div className="admin-main">

    
      <h1 className="admin-title">Admin - Categorized Items</h1>

      {/* Category Filter Dropdown */}
      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: 8 }}>Filter by Category:</label>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8 }}
        >
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-categorized">
        {categoriesToShow.map(([category, categoryItems]) => (
          <div key={category} className="admin-category-group">
            <h2 className="admin-category-title">{category}</h2>
            <div className="admin-card-grid">
              {categoryItems.map(item => (
                <div key={item._id} className="admin-card">
                  <img
                    src={`/Food/${item.Image_Name ? item.Image_Name.trim() + '.jpg' : 'placeholder.jpg'}`}
                    alt={item.Title}
                    onError={e => { e.target.src = '/images/placeholder.jpg'; }}
                  />

                  {editingId === item._id ? (
                    <>
                      <input name="Title" value={editForm.Title} onChange={handleEditChange} />
                      <input name="category" value={editForm.category} onChange={handleEditChange} />
                      <input name="price" value={editForm.price} onChange={handleEditChange} />
                      <input name="Image_Name" value={editForm.Image_Name} onChange={handleEditChange} />
                      <textarea name="Ingredients" value={editForm.Ingredients} onChange={handleEditChange} />
                      <textarea name="Instructions" value={editForm.Instructions} onChange={handleEditChange} />
                      <div className="admin-card-actions">
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={() => setEditingId(null)} className="delete">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2>{item.Title}</h2>
                      <div className="admin-card-category">{item.category}</div>
                      <div className="admin-card-price">₹{item.price}</div>
                      {expandedId === item._id ? (
                        <div>
                          <strong>Instructions:</strong> {item.instructions}
                          <button
                            className="admin-readmore-btn"
                            onClick={() => setExpandedId(null)}
                            style={{ marginLeft: 8, fontSize: 12 }}
                          >
                            Show Less
                          </button>
                        </div>
                      ) : (
                        <button
                          className="admin-readmore-btn"
                          onClick={() => setExpandedId(item._id)}
                          style={{ marginTop: 8, fontSize: 12 }}
                        >
                          Read More
                        </button>
                      )}
                      <div className="admin-card-actions">
                        <button onClick={() => startEdit(item)}>Edit</button>
                        <button onClick={() => deleteItem(item._id)} className="delete">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button className="admin-add-btn" onClick={() => setShowAdd(true)}>+</button>

      {/* Add Modal */}
      {showAdd && (
        <div className="admin-modal-backdrop" onClick={() => setShowAdd(false)}>
          <form
            className="admin-modal-form"
            onClick={e => e.stopPropagation()}
            onSubmit={addItem}
          >
            <h2>Add New Item</h2>
            <input type="file" accept="image/*" onChange={e => setAddImageFile(e.target.files[0])} />
            <input name="Title" value={addForm.Title} onChange={handleAddChange} placeholder="Title" required />
            <input name="category" value={addForm.category} onChange={handleAddChange} placeholder="Category" required />
            <input name="price" value={addForm.price} onChange={handleAddChange} placeholder="Price" type="number" required />
            <input name="Image_Name" value={addForm.Image_Name} onChange={handleAddChange} placeholder="Image Name" />
            <textarea name="Ingredients" value={addForm.Ingredients} onChange={handleAddChange} placeholder="Ingredients" />
            <textarea name="Instructions" value={addForm.Instructions} onChange={handleAddChange} placeholder="Instructions" />
            <button type="submit">Add</button>
            <button type="button" className="delete" onClick={() => setShowAdd(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
