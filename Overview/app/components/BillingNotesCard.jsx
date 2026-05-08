const { useState: useBillingState } = React;

function BillingNotesCard() {
  const [category, setCategory] = useBillingState('Happy');
  const [notes,    setNotes]    = useBillingState('');
  const [saving,   setSaving]   = useBillingState(false);
  const [saved,    setSaved]    = useBillingState(false);

  const categories = ['Happy', 'Neutral', 'Unhappy', 'VIP', 'At Risk'];

  function handleSave() {
    if (!notes.trim()) return;
    setSaving(true);
    // TODO: ZOHO.CRM.API.updateRecord or addNotes with billing note
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 800);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 flex flex-col h-full">
      <h2 className="text-base font-bold text-gray-900 mb-4">Billing Notes</h2>

      {/* Category dropdown */}
      <div className="relative mb-3">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer pr-8"
        >
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Add billing notes or payment Login Credentials..."
        className="flex-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[120px]"
      />

      {/* Save button */}
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSave}
          disabled={saving || !notes.trim()}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}

window.BillingNotesCard = BillingNotesCard;
