import React from 'react';
import PropTypes from 'prop-types';

/**
 * PUBLIC_INTERFACE
 * NoteItem displays a single note (title, content preview, updatedAt).
 * @param {object} props
 * @param {object} props.note - The note object.
 * @param {function} props.onEdit - Called with (noteId) for edit.
 * @param {function} props.onDelete - Called with (noteId) for delete.
 * @param {boolean} [props.selected] - Whether this note is selected.
 */
export default function NoteItem({ note, onEdit, onDelete, selected }) {
  // Only show up to 80 chars of content in preview
  const contentPreview = note.content?.length > 0
    ? note.content.slice(0, 80) + (note.content.length > 80 ? '…' : '')
    : <span className="content-empty">[No content]</span>;

  const updatedFmt = new Date(note.updatedAt).toLocaleString();

  return (
    <div
      className={`note-item${selected ? ' note-item-selected': ''}`}
      tabIndex={0}
      aria-current={selected ? "true": undefined}
      aria-label={`Note: ${note.title}`}
      role="listitem"
      data-note-id={note.id}
    >
      <div className="note-header">
        <div className="note-title">{note.title}</div>
        <div className="note-actions">
          <button
            className="btn btn-small btn-edit"
            onClick={() => onEdit(note.id)}
            aria-label="Edit note"
            title="Edit note"
          >✏️</button>
          <button
            className="btn btn-small btn-danger"
            onClick={() => onDelete(note.id)}
            aria-label="Delete note"
            title="Delete note"
            tabIndex={0}
          >🗑️</button>
        </div>
      </div>
      <div className="note-content-preview">{contentPreview}</div>
      <div className="note-updated" aria-label={`Last updated ${updatedFmt}`}>
        <small>Last updated: {updatedFmt}</small>
      </div>
    </div>
  );
}

NoteItem.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string,
    updatedAt: PropTypes.string.isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  selected: PropTypes.bool
};
