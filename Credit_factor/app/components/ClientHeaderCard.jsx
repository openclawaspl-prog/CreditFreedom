function ClientHeaderCard({ name, email, referredBy, status }) {
  const Cell = ({ label, value }) => (
    <div>
      <p className="text-blue-200 text-xs mb-0.5">{label}</p>
      <p className="text-white font-semibold text-sm">{value || '—'}</p>
    </div>
  );

  return (
    <div
      className="rounded-xl px-6 py-5"
      style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)' }}
    >
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        <Cell label="Name"        value={name} />
        <Cell label="Referred by" value={referredBy} />
        <Cell label="Email"       value={email} />
        <Cell label="Status"      value={status} />
      </div>
    </div>
  );
}

window.ClientHeaderCard = ClientHeaderCard;
