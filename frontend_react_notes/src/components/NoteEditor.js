import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * PUBLIC_INTERFACE
 * NoteEditor component for creating or editing a note.
 * @param {object} props - component props
 * @param {function} props.onSave - called with (note) on save
 * @param {function} props.onCancel - called on cancel
 * @param {object} [props.initialNote] - existing note to edit
 */
export default function NoteEditor({ onSave, onCancel, initialNote }) {
  const [title, setTitle] = useState(initialNote ? initialNote.title : '');
  const [content, setContent] = useState(initialNote ? initialNote.content : '');
  const [error, setError] = useState(null);
  const titleInputRef = useRef(null);
  const maxTitleLength = 120;

  useEffect(() => {
    // Focus title field on open
    titleInputRef.current && titleInputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }
    if (trimmedTitle.length > maxTitleLength) {
      setError(`Title cannot exceed ${maxTitleLength} characters.`);
      return;
    }
    // Pass trimmed values
    onSave({
      ...initialNote,
      title: trimmedTitle,
      content: content.trim()
    });
    setError(null);
    // Optionally reset (not needed)
  };

  return (
    <form className="note-editor" onSubmit={handleSubmit} aria-labelledby="editor-form-title">
      <h2 id="editor-form-title">
        {initialNote ? 'Edit Note' : 'Add Note'}
      </h2>
      <div className="form-group">
        <label htmlFor="note-title">Title <span aria-hidden="true" style={{color:'#e11d48'}}>*</span></label>
        <input
          ref={titleInputRef}
          id="note-title"
          type="text"
          value={title}
          maxLength={maxTitleLength}
          onChange={e => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          required
          aria-required="true"
          aria-invalid={!!error}
          autoComplete="off"
        />
        <div className="char-count" aria-live="polite">
          {title.length}/{maxTitleLength}
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="note-content">Content</label>
        <textarea
          id="note-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={5}
          maxLength={2000}
        />
      </div>
      {error && (
        <div className="form-error" role="alert">{error}</div>
      )}
      <div className="editor-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!title.trim()}
          aria-disabled={!title.trim()}
        >
          Save
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

NoteEditor.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialNote: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.string,
    updatedAt: PropTypes.string
  })
};
