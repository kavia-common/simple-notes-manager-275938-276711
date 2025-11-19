import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import NoteEditor from './components/NoteEditor';
import NotesList from './components/NotesList';
import { loadNotes, saveNotes } from './utils/localStorage';

// Generates a unique id in a robust way
function generateId() {
  // PUBLIC_INTERFACE
  // Prefer crypto.randomUUID if available, else fallback to Date.now + Math.random
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2,10)}`;
}

function sortNotesByUpdatedAt(notes) {
  return notes.slice().sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}

// PUBLIC_INTERFACE
/**
 * Main App for notes management.
 */
export default function App() {
  const [theme, setTheme] = useState('light');
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editorMode, setEditorMode] = useState(null); // "new" or "edit"
  const [editingNote, setEditingNote] = useState(null);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load notes from localStorage on first mount
  useEffect(() => {
    setNotes(sortNotesByUpdatedAt(loadNotes()));
  }, []);

  // Save to localStorage whenever notes change
  useEffect(() => {
    try { saveNotes(notes); } catch {}
  }, [notes]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(theme => (theme === 'light' ? 'dark' : 'light'));

  // Handler: Add new note
  const handleAddClick = () => {
    setEditorMode('new');
    setEditingNote(null);
    setSelectedId(null);
  };

  // Handler: Save (from NoteEditor)
  const handleEditorSave = noteData => {
    // If editing: replace
    if (editorMode === 'edit' && editingNote) {
      setNotes(prevNotes =>
        sortNotesByUpdatedAt(
          prevNotes.map(n =>
            n.id === editingNote.id
              ? {
                  ...n,
                  title: noteData.title,
                  content: noteData.content,
                  updatedAt: new Date().toISOString()
                }
              : n
          )
        )
      );
      setSelectedId(editingNote.id);
    } else {
      // Adding new
      const newNote = {
        id: generateId(),
        title: noteData.title,
        content: noteData.content,
        updatedAt: new Date().toISOString()
      };
      setNotes(prevNotes => sortNotesByUpdatedAt([newNote, ...prevNotes]));
      setSelectedId(newNote.id);
    }
    setEditorMode(null);
    setEditingNote(null);
  };

  // Handler: Cancel editor
  const handleEditorCancel = () => {
    setEditorMode(null);
    setEditingNote(null);
  };

  // Handler: Edit button
  const handleEdit = useCallback(noteId => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditingNote(note);
      setEditorMode('edit');
      setSelectedId(noteId);
    }
  }, [notes]);

  // Handler: Delete
  const handleDelete = noteId => {
    if (!window.confirm('Delete this note?')) return;
    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
    if (selectedId === noteId) setSelectedId(null);
    if (editingNote && editingNote.id === noteId) setEditorMode(null);
  };

  // Keyboard shortcut: new note (Ctrl+N)
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleAddClick();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="notes-app">
      <header className="notes-header">
        <h1>📝 Notes</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      <main className="notes-main">
        <div className="notes-toolbar">
          <button
            className="btn btn-primary"
            onClick={handleAddClick}
            aria-label="Add note"
            title="Add note (Ctrl+N)"
            tabIndex={0}
          >+ Add Note</button>
          <span className="notes-count">
            Notes: {notes.length}
          </span>
        </div>

        {editorMode && (
          <NoteEditor
            key={editorMode + (editingNote && editingNote.id ? editingNote.id : '')}
            onSave={handleEditorSave}
            onCancel={handleEditorCancel}
            initialNote={editingNote}
          />
        )}

        <NotesList
          notes={notes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedId={selectedId}
        />
      </main>
      <footer className="notes-footer">
        <small>All notes stored locally in your browser. <span aria-label="secure">🔒</span></small>
      </footer>
    </div>
  );
}
