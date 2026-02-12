import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const MODES = ['royaledle', 'pixel-royale', 'emoji-riddle', 'higher-lower', 'impostor', 'wordle', 'tapone', 'sound-quiz'];

export default function CardAdminCreate() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('/images/cards/1.webp');
  const [rarity, setRarity] = useState('common');
  const [unlockRules, setUnlockRules] = useState([]);
  const [ruleType, setRuleType] = useState('level');
  const [ruleParams, setRuleParams] = useState({});
  const [message, setMessage] = useState('');

  if (!user || user.role !== 'admin') return <div>Admin only</div>;

  const addRule = () => {
    setUnlockRules([...unlockRules, { type: ruleType, ...ruleParams }]);
    setRuleParams({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, imageUrl, rarity, unlockRules }),
    });
    if (res.ok) setMessage('Card created!');
    else setMessage('Error creating card');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-slate-900 rounded-xl border border-amber-700/30">
      <h2 className="text-lg font-bold mb-4">Create Collectible Card</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="mb-2 w-full p-2 rounded" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="mb-2 w-full p-2 rounded" />
      <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" className="mb-2 w-full p-2 rounded" />
      <select value={rarity} onChange={e => setRarity(e.target.value)} className="mb-2 w-full p-2 rounded">
        {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Unlock Rules</h3>
        <select value={ruleType} onChange={e => setRuleType(e.target.value)} className="mb-2 w-full p-2 rounded">
          <option value="level">Reach Level</option>
          <option value="gamesPlayed">Play Games</option>
          <option value="streak">Streak</option>
          <option value="date">Date</option>
          <option value="custom">Custom</option>
        </select>
        {/* Dynamic rule params UI */}
        {ruleType === 'level' && (
          <input type="number" placeholder="Min Level" onChange={e => setRuleParams({ minLevel: Number(e.target.value) })} className="mb-2 w-full p-2 rounded" />
        )}
        {ruleType === 'gamesPlayed' && (
          <>
            <select onChange={e => setRuleParams({ ...ruleParams, mode: e.target.value })} className="mb-2 w-full p-2 rounded">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" placeholder="Games Count" onChange={e => setRuleParams({ ...ruleParams, count: Number(e.target.value) })} className="mb-2 w-full p-2 rounded" />
          </>
        )}
        {ruleType === 'streak' && (
          <>
            <select onChange={e => setRuleParams({ ...ruleParams, mode: e.target.value })} className="mb-2 w-full p-2 rounded">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" placeholder="Days" onChange={e => setRuleParams({ ...ruleParams, days: Number(e.target.value) })} className="mb-2 w-full p-2 rounded" />
          </>
        )}
        {ruleType === 'date' && (
          <>
            <input type="date" placeholder="After" onChange={e => setRuleParams({ ...ruleParams, after: e.target.value })} className="mb-2 w-full p-2 rounded" />
            <input type="date" placeholder="Before" onChange={e => setRuleParams({ ...ruleParams, before: e.target.value })} className="mb-2 w-full p-2 rounded" />
          </>
        )}
        {ruleType === 'custom' && (
          <input placeholder="Description" onChange={e => setRuleParams({ description: e.target.value })} className="mb-2 w-full p-2 rounded" />
        )}
        <button type="button" onClick={addRule} className="px-3 py-1 bg-amber-500 rounded text-black font-bold">Add Rule</button>
        <ul className="mt-2">
          {unlockRules.map((rule, i) => (
            <li key={i} className="text-xs text-amber-200">{JSON.stringify(rule)}</li>
          ))}
        </ul>
      </div>
      <button type="submit" className="px-4 py-2 bg-green-500 rounded text-black font-bold">Create Card</button>
      {message && <div className="mt-3 text-green-400">{message}</div>}
    </form>
  );
}
