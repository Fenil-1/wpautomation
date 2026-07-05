import React, { useState } from 'react';
import { groupsApi } from '../api/groups';
import { ApiError } from '../api/client';
import { Modal, TextField, inputClass, PrimaryButton, SecondaryButton, Spinner } from './ui';

export default function GroupFormModal({ group, onClose, onSaved }) {
  const isEdit = Boolean(group);
  const [form, setForm] = useState({
    name: group?.name ?? '',
    description: group?.description ?? '',
    color: group?.color ?? '#25d366',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      color: form.color || null,
    };
    try {
      if (isEdit) await groupsApi.update(group.id, payload);
      else await groupsApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save group');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Group' : 'New Group'}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" form="group-form" disabled={saving || !form.name.trim()}>
            {saving && <Spinner className="w-4 h-4 text-white" />}
            {isEdit ? 'Save Changes' : 'Create Group'}
          </PrimaryButton>
        </>
      }
    >
      <form id="group-form" onSubmit={submit} className="p-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>
        )}
        <TextField label="Name">
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="e.g. VIP Customers" required />
        </TextField>
        <TextField label="Description">
          <input className={inputClass} value={form.description} onChange={set('description')} placeholder="Optional" />
        </TextField>
        <TextField label="Color">
          <div className="flex items-center gap-3 pt-1">
            <input type="color" value={form.color} onChange={set('color')} className="w-10 h-10 rounded cursor-pointer border border-wa-border" />
            <span className="text-sm font-mono text-wa-text-secondary">{form.color}</span>
          </div>
        </TextField>
      </form>
    </Modal>
  );
}
