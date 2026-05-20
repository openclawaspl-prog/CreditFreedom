const { useState: useBillingState } = React;

function BillingNotesCard() {
  const [selectedTypes, setSelectedTypes] = useBillingState(['Happy']);
  const [notes,    setNotes]    = useBillingState('');
  const [saving,   setSaving]   = useBillingState(false);
  const [saved,    setSaved]    = useBillingState(false);

  const noteTypes = [
    'Unhappy (Not satisfied with results)',
    'Happy',
    'Nasty (Mean and Unpleasant)',
    'Cancelled (Stop Paying)',
    'Good Referrer',
    'Other',
  ];

  function toggleType(type) {
    setSelectedTypes(prev => (
      prev.includes(type)
        ? prev.filter(item => item !== type)
        : [...prev, type]
    ));
  }

  function handleSave() {
    if (!notes.trim()) return;
    setSaving(true);
    // TODO: ZOHO.CRM.API.updateRecord or addNotes with billing note
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 800);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Billing Notes</h2>

      <div className="grid grid-cols-1 gap-y-2 mb-3">
        {noteTypes.map(type => (
          <label key={type} className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
            />
            <span className="leading-snug">{type}</span>
          </label>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Add billing notes or payment Login Credentials..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[120px]"
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
