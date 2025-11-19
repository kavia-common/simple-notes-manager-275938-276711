import React from 'react';
import PropTypes from 'prop-types';
import NoteItem from './NoteItem';

/**
 * PUBLIC_INTERFACE
 * NotesList renders the full list of notes.
 * @param {object} props
 * @param {Array} props.notes - Array of notes.
 * @param {function} props.onEdit - Called with (noteId) for edit.
 * @param {function} props.onDelete - Called with (noteId) for delete.
 * @param {string} [props.selectedId] - Optional: note id to highlight.
 */
export default function NotesList({ notes, onEdit, onDelete, selectedId }) {
  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    return (<div className="notes-empty" role="status">No notes found. Get started by adding one!</div>);
  }
  return (
    <div className="notes-list" role="list" aria-label="Notes list">
      {notes.map(note =>
        <NoteItem
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          selected={selectedId === note.id}
        />
      )}
    </div>
  );
}

NotesList.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string,
    updatedAt: PropTypes.string.isRequired
  })).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  selectedId: PropTypes.string
};
