import React, { useState } from 'react';
import { contactsApi } from '../api/contacts';
import { ApiError } from '../api/client';
import { Modal, TextField, inputClass, PrimaryButton, SecondaryButton, Spinner } from './ui';

// Create/edit a contact. On success calls onSaved() so the parent refreshes.
export default function ContactFormModal({ contact, onClose, onSaved }) {
  const isEdit = Boolean(contact);
  const [form, setForm] = useState({
    name: contact?.name ?? '',
    countryCode: contact?.countryCode ?? '+91',
    phoneNumber: contact?.phoneNumber ?? '',
    businessName: contact?.businessName ?? '',
    city: contact?.city ?? '',
    state: contact?.state ?? '',
    notes: contact?.notes ?? '',
    isBlocked: contact?.isBlocked ?? false,
    isOptedOut: contact?.isOptedOut ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Send empty optional strings as null so they clear rather than fail validation.
    const payload = {
      name: form.name.trim(),
      countryCode: form.countryCode.trim(),
      phoneNumber: form.phoneNumber.trim(),
      businessName: form.businessName.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      notes: form.notes.trim() || null,
      isBlocked: form.isBlocked,
      isOptedOut: form.isOptedOut,
    };
    try {
      if (isEdit) await contactsApi.update(contact.id, payload);
      else await contactsApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save contact');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Contact' : 'New Contact'}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" form="contact-form" disabled={saving || !form.name.trim() || !form.phoneNumber.trim()}>
            {saving && <Spinner className="w-4 h-4 text-white" />}
            {isEdit ? 'Save Changes' : 'Create Contact'}
          </PrimaryButton>
        </>
      }
    >
      <form id="contact-form" onSubmit={submit} className="p-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>
        )}
        <TextField label="Name">
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Full name" required />
        </TextField>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Code">
            <input className={inputClass} value={form.countryCode} onChange={set('countryCode')} placeholder="+91" />
          </TextField>
          <div className="col-span-2">
            <TextField label="Phone Number">
              <input
                className={inputClass}
                value={form.phoneNumber}
                onChange={set('phoneNumber')}
                placeholder="9876543210"
                inputMode="numeric"
                required
              />
            </TextField>
          </div>
        </div>
        <TextField label="Business Name">
          <input className={inputClass} value={form.businessName} onChange={set('businessName')} placeholder="Optional" />
        </TextField>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="City">
            <input className={inputClass} value={form.city} onChange={set('city')} placeholder="Optional" />
          </TextField>
          <TextField label="State">
            <input className={inputClass} value={form.state} onChange={set('state')} placeholder="Optional" />
          </TextField>
        </div>
        <TextField label="Notes">
          <textarea className={inputClass} value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
        </TextField>
        <div className="flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm text-wa-text-primary cursor-pointer">
            <input type="checkbox" checked={form.isBlocked} onChange={set('isBlocked')} className="accent-wa-green w-4 h-4" />
            Blocked
          </label>
          <label className="flex items-center gap-2 text-sm text-wa-text-primary cursor-pointer">
            <input type="checkbox" checked={form.isOptedOut} onChange={set('isOptedOut')} className="accent-wa-green w-4 h-4" />
            Opted out
          </label>
        </div>
      </form>
    </Modal>
  );
}
