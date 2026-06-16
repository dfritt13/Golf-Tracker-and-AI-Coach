import { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CLUBS, SHOT_TYPES, OUTCOMES } from '../data/seedData';
import CourseSearch from './CourseSearch';

export default function ShotLogger({ rounds, onAddRound }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shots, setShots] = useState([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [currentShot, setCurrentShot] = useState({
    club: 'Driver', distance: '', shotType: 'Tee Shot', outcome: 'OK'
  });

  const holePar = selectedCourse?.holes?.[currentHole - 1]?.par || 4;
  const holeYardage = selectedCourse?.holes?.[currentHole - 1]?.yardage;
  const holeHandicap = selectedCourse?.holes?.[currentHole - 1]?.handicap;
  const maxHoles = selectedCourse?.holesCount || 18;

  const shotsThisHole = shots.filter(s => s.hole === currentHole);

  function addShot() {
    setShots(prev => [...prev, {
      ...currentShot,
      hole: currentHole,
      par: holePar,
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

  function nextHole() {
    if (currentHole < maxHoles) {
      setCurrentHole(h => h + 1);
      setCurrentShot(prev => ({
        ...prev,
        club: 'Driver',
        distance: '',
        shotType: 'Tee Shot',
        outcome: 'OK',
      }));
    }
  }

  function prevHole() {
    if (currentHole > 1) setCurrentHole(h => h - 1);
  }

  function saveRound() {
    if (shots.length === 0) return;
    const holesPlayed = [...new Set(shots.map(s => s.hole))];
    const totalPar = holesPlayed.reduce((sum, h) => {
      return sum + (selectedCourse?.holes?.[h - 1]?.par || shots.find(s => s.hole === h)?.par || 4);
    }, 0);
    const courseName = selectedCourse?.name || 'Unknown Course';
    onAddRound({
      id: `round-${Date.now()}`,
      date,
      course: courseName,
      courseData: selectedCourse,
      shots,
      totalStrokes: shots.length,
      totalPar,
      score: shots.length - totalPar,
    });
    setShots([]);
    setSelectedCourse(null);
    setCurrentHole(1);
    setIsOpen(false);
  }

  function cancelRound() {
    setShots([]);
    setSelectedCourse(null);
    setCurrentHole(1);
    setIsOpen(false);
  }

  return (
    <div className="shot-logger">
      <div className="section-header">
        <h2>Shot Logger</h2>
        <button className="btn btn-primary" onClick={() => isOpen ? cancelRound() : setIsOpen(true)}>
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
          </div>

          <CourseSearch selectedCourse={selectedCourse} onSelectCourse={setSelectedCourse} />

          {selectedCourse && (
            <>
              <div className="hole-navigator">
                <button className="btn-icon" onClick={prevHole} disabled={currentHole === 1}>
                  <ChevronLeft size={20} />
                </button>
                <div className="hole-info">
                  <span className="hole-number">Hole {currentHole}</span>
                  <span className="hole-detail">
                    Par {holePar}
                    {holeYardage ? ` | ${holeYardage}y` : ''}
                    {holeHandicap ? ` | HCP ${holeHandicap}` : ''}
                  </span>
                  {shotsThisHole.length > 0 && (
                    <span className="hole-shots-count">{shotsThisHole.length} shot{shotsThisHole.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <button className="btn-icon" onClick={nextHole} disabled={currentHole === maxHoles}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="hole-scorecard-mini">
                {selectedCourse.holes.map((h, i) => {
                  const holeShots = shots.filter(s => s.hole === h.number);
                  const isActive = h.number === currentHole;
                  const hasShots = holeShots.length > 0;
                  const vspar = hasShots ? holeShots.length - h.par : null;
                  return (
                    <button
                      key={i}
                      className={`scorecard-hole ${isActive ? 'active' : ''} ${hasShots ? 'played' : ''} ${vspar !== null ? (vspar > 0 ? 'over' : vspar < 0 ? 'under' : 'even') : ''}`}
                      onClick={() => setCurrentHole(h.number)}
                    >
                      <span className="sc-hole-num">{h.number}</span>
                      <span className="sc-hole-par">P{h.par}</span>
                      {hasShots && <span className="sc-hole-score">{holeShots.length}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="form-row">
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
                  <div className="shots-summary">
                    <h4>Round Progress</h4>
                    <span>{shots.length} shots across {[...new Set(shots.map(s => s.hole))].length} holes</span>
                  </div>
                  <div className="shots-table">
                    <table>
                      <thead>
                        <tr><th>Hole</th><th>Club</th><th>Dist</th><th>Type</th><th>Result</th></tr>
                      </thead>
                      <tbody>
                        {shots.slice().reverse().slice(0, 10).map((s, i) => (
                          <tr key={i}>
                            <td>{s.hole}</td><td>{s.club}</td><td>{s.distance}y</td>
                            <td>{s.shotType}</td>
                            <td><span className={`outcome ${s.outcome.toLowerCase()}`}>{s.outcome}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {shots.length > 10 && <p className="more-shots">+ {shots.length - 10} more shots</p>}
                  </div>
                  <button className="btn btn-primary" onClick={saveRound}>Save Round ({shots.length} shots)</button>
                </div>
              )}
            </>
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
