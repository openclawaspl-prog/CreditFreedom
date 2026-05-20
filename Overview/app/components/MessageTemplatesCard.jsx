const { useState: useTplState } = React;

function MessageTemplatesCard() {
  const [state, setState] = useTplState({ 1: false, 2: false, 3: true });

  function toggle(n) {
    setState(prev => ({ ...prev, [n]: !prev[n] }));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Message Templates</h2>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(n => (
          <div key={n} className="text-center">
            <p className="text-xs text-gray-500 mb-2">Month {n}</p>
            <button
              onClick={() => toggle(n)}
              className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                state[n]
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {state[n] ? 'Updated' : 'Update'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

window.MessageTemplatesCard = MessageTemplatesCard;
