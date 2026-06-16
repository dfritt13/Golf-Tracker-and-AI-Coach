import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CLUBS, SHOT_TYPES, OUTCOMES, COURSES } from '../data/seedData';

export default function ShotLogger({ rounds, onAddRound }) {
  const [isOpen, setIsOpen] = useState(false);
  const [course, setCourse] = useState(COURSES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shots, setShots] = useState([]);
  const [currentShot, setCurrentShot] = useState({
    hole: 1, par: 4, club: 'Driver', distance: '', shotType: 'Tee Shot', outcome: 'OK'
  });

  function addShot() {
    setShots(prev => [...prev, {
      ...currentShot,
      id: `new-${Date.now()}-${prev.length}`,
      distance: parseInt(currentShot.distance) || 0,
    }]);
    setCurrentShot(prev => ({
      ...prev,
      club: '7-Iron',
      distance: '',
      shotType: 'Approach',
      outcome: 'OK',
    }));
  }

  function saveRound() {
    if (shots.length === 0) return;
    const holes = [...new Set(shots.map(s => s.hole))];
    const totalPar = holes.reduce((sum, h) => sum + (shots.find(s => s.hole === h)?.par || 4), 0);
    onAddRound({
      id: `round-${Date.now()}`,
      date,
      course,
      shots,
      totalStrokes: shots.length,
      totalPar,
      score: shots.length - totalPar,
    });
    setShots([]);
    setIsOpen(false);
  }

  return (
    <div className="shot-logger">
      <div className="section-header">
        <h2>Shot Logger</h2>
        <button className="btn btn-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Round</>}
        </button>
      </div>

      {isOpen && (
        <div className="logger-form">
          <div className="form-row">
            <label>
              Date
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label>
              Course
              <select value={course} onChange={e => setCourse(e.target.value)}>
                {COURSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Hole
              <input type="number" min="1" max="18" value={currentShot.hole}
                onChange={e => setCurrentShot(p => ({ ...p, hole: parseInt(e.target.value) || 1 }))} />
            </label>
            <label>
              Par
              <select value={currentShot.par} onChange={e => setCurrentShot(p => ({ ...p, par: parseInt(e.target.value) }))}>
                {[3, 4, 5].map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label>
              Club
              <select value={currentShot.club} onChange={e => setCurrentShot(p => ({ ...p, club: e.target.value }))}>
                {CLUBS.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Distance (yds)
              <input type="number" min="0" max="400" value={currentShot.distance}
                onChange={e => setCurrentShot(p => ({ ...p, distance: e.target.value }))} />
            </label>
          </div>

          <div className="form-row">
            <label>
              Shot Type
              <select value={currentShot.shotType} onChange={e => setCurrentShot(p => ({ ...p, shotType: e.target.value }))}>
                {SHOT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Outcome
              <select value={currentShot.outcome} onChange={e => setCurrentShot(p => ({ ...p, outcome: e.target.value }))}>
                {OUTCOMES.map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
            <button className="btn btn-secondary" onClick={addShot}>Add Shot</button>
          </div>

          {shots.length > 0 && (
            <div className="shots-preview">
              <h4>Shots logged: {shots.length}</h4>
              <div className="shots-table">
                <table>
                  <thead>
                    <tr><th>Hole</th><th>Club</th><th>Dist</th><th>Type</th><th>Result</th></tr>
                  </thead>
                  <tbody>
                    {shots.map((s, i) => (
                      <tr key={i}>
                        <td>{s.hole}</td><td>{s.club}</td><td>{s.distance}y</td>
                        <td>{s.shotType}</td>
                        <td><span className={`outcome ${s.outcome.toLowerCase()}`}>{s.outcome}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary" onClick={saveRound}>Save Round ({shots.length} shots)</button>
            </div>
          )}
        </div>
      )}

      <div className="rounds-list">
        <h3>Recent Rounds</h3>
        {rounds.length === 0 ? (
          <p className="empty-state">No rounds yet. Log your first round above!</p>
        ) : (
          rounds.slice().reverse().map(r => (
            <div key={r.id} className="round-card">
              <div className="round-header">
                <span className="round-course">{r.course}</span>
                <span className="round-date">{r.date}</span>
              </div>
              <div className="round-stats">
                <span className={`round-score ${r.score > 0 ? 'over' : r.score < 0 ? 'under' : 'even'}`}>
                  {r.score > 0 ? `+${r.score}` : r.score === 0 ? 'E' : r.score}
                </span>
                <span className="round-strokes">{r.totalStrokes} strokes</span>
                <span className="round-shots">{r.shots.length} shots logged</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
