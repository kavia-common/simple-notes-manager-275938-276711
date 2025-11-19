import React from "react";
import {
  render,
  screen,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// Helper for localStorage mock handling
const STORAGE_KEY = "notes.v1";
function setupLocalStorageMock(defaultNotes = []) {
  const store = {};
  // Optional: preload with provided value
  if (Array.isArray(defaultNotes)) {
    store[STORAGE_KEY] = JSON.stringify(defaultNotes);
  }
  window.localStorage.setItem = jest.fn((key, val) => {
    store[key] = val;
  });
  window.localStorage.getItem = jest.fn((key) => store[key] || null);
  window.localStorage.clear = jest.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });
}

// Generates a fake note, optionally with overrides
function makeNote({ id, title, content, updatedAt } = {}) {
  return {
    id: id || "nid_" + Math.random().toString(16).slice(2, 10),
    title: title || "Note Title " + Math.random().toString(36).slice(2, 6),
    content: content || "Content for this note.",
    updatedAt:
      updatedAt ||
      new Date().toISOString(),
  };
}

beforeEach(() => {
  // Reset localStorage mocks before every test
  setupLocalStorageMock();
  // JS DOM doesn't persist data between tests
});

describe("Notes App integration - Add/Edit/Delete & Persistence", () => {
  test("Add a note: UI, list, and localStorage are updated", async () => {
    render(<App />);
    // Click "+ Add Note" - trigger editor
    const addBtn = screen.getByRole("button", { name: /add note/i });
    await userEvent.click(addBtn);

    // Fill title
    const titleInput = screen.getByLabelText(/title/i);
    await userEvent.type(titleInput, "Grocery List");

    // Fill content
    const contentInput = screen.getByLabelText(/content/i);
    await userEvent.type(contentInput, "Eggs, milk, bread");

    // Save
    const saveBtn = screen.getByRole("button", { name: /^save$/i });
    await userEvent.click(saveBtn);

    // Note appears in list
    expect(
      screen.getByRole("listitem", { name: /grocery list/i })
    ).toBeInTheDocument();
    // List count updates
    expect(screen.getByText(/notes:\s*1/i)).toBeInTheDocument();

    // LocalStorage called with updated notes
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining("Grocery List")
    );
  });

  test("Edit a note: editor shows correct content & list/localStorage update", async () => {
    const note = makeNote({ title: "Old Note", content: "Old content" });
    setupLocalStorageMock([note]);
    render(<App />);
    // Verify initial note present
    let noteCard = await screen.findByRole("listitem", { name: /old note/i });
    // Click edit icon
    const editBtn = within(noteCard).getByRole("button", { name: /edit/i });
    await userEvent.click(editBtn);

    // Editor opens, prefilled values
    expect(
      screen.getByRole("heading", { name: /edit note/i })
    ).toBeInTheDocument();
    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);
    expect(titleInput).toHaveValue("Old Note");
    expect(contentInput).toHaveValue("Old content");

    // Change values
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated Note");
    await userEvent.clear(contentInput);
    await userEvent.type(contentInput, "Fresh stuff");

    // Save edits
    const saveBtn = screen.getByRole("button", { name: /^save$/i });
    await userEvent.click(saveBtn);

    // Updated values in list
    expect(
      await screen.findByRole("listitem", { name: /updated note/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/old note/i)).not.toBeInTheDocument();

    // LocalStorage updated
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining("Updated Note")
    );
  });

  test("Delete a note: removes from UI and storage (with confirmation mock)", async () => {
    // Add two notes
    const note1 = makeNote({ title: "Note Uno" });
    const note2 = makeNote({ title: "Dos" });
    setupLocalStorageMock([note1, note2]);
    render(<App />);
    // Find list item for Note Uno
    const uno = await screen.findByRole("listitem", { name: /note uno/i });
    // Mock confirm to always accept
    jest.spyOn(window, "confirm").mockImplementation(() => true);
    const deleteBtn = within(uno).getByRole("button", { name: /delete/i });
    await userEvent.click(deleteBtn);

    // Should be removed from screen
    expect(screen.queryByText("Note Uno")).not.toBeInTheDocument();
    // Only Note Dos remains
    expect(screen.getByText("Dos")).toBeInTheDocument();
    // List count updated
    expect(screen.getByText(/notes:\s*1/i)).toBeInTheDocument();

    // LocalStorage does not contain deleted note
    expect(window.localStorage.setItem).toHaveBeenLastCalledWith(
      STORAGE_KEY,
      expect.not.stringContaining("Note Uno")
    );
    window.confirm.mockRestore();
  });

  test("Notes persist by loading from localStorage on mount", async () => {
    // Simulate notes in browser
    const myNotes = [
      makeNote({ title: "First" }),
      makeNote({ title: "Second" }),
    ];
    setupLocalStorageMock(myNotes);

    render(<App />);
    // Both notes show up immediately (no empty state)
    expect(await screen.findByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText(/notes:\s*2/i)).toBeInTheDocument();
  });

  test("Accessibility: add button & theme button have correct aria-labels and support keyboard", async () => {
    render(<App />);
    // Theme toggle has correct aria-label
    const themeBtn = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(themeBtn).toHaveAttribute("aria-label", expect.stringContaining("Switch to dark mode"));
    await userEvent.tab(); // header button should receive focus first
    expect(themeBtn).toHaveFocus();

    // Add Note button is keyboard-accessible
    const addBtn = screen.getByRole("button", { name: /add note/i });
    await userEvent.tab(); // add note button
    expect(addBtn).toHaveFocus();
  });

  test("Keyboard shortcut Ctrl+N opens add-note editor", async () => {
    render(<App />);
    // No form initially:
    expect(screen.queryByRole("form", { name: /add note/i })).not.toBeInTheDocument();

    // Simulate Ctrl+N
    fireEvent.keyDown(window, {
      key: "n",
      ctrlKey: true,
    });

    // Editor should appear
    expect(await screen.findByRole("form", { name: /add note/i })).toBeInTheDocument();
  });

  test("Editor validation: empty title blocks save, error shown, aria-invalid", async () => {
    render(<App />);
    const addBtn = screen.getByRole("button", { name: /add note/i });
    await userEvent.click(addBtn);

    const titleInput = screen.getByLabelText(/title/i);
    // Try to save with empty title
    await userEvent.clear(titleInput);
    const saveBtn = screen.getByRole("button", { name: /^save$/i });
    await userEvent.click(saveBtn);

    // Error should show, input is aria-invalid
    expect(await screen.findByRole("alert")).toHaveTextContent(/title is required/i);
    expect(titleInput).toHaveAttribute("aria-invalid", "true");
  });

  test("Empty state: shows callout if there are no notes", () => {
    render(<App />);
    expect(
      screen.getByRole("status", { name: /no notes found/i })
    ).toBeInTheDocument();
  });
});
