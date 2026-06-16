import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Plus } from 'lucide-react';

const API_BASE = 'https://api.opengolfapi.org/v1';

export default function CourseSearch({ onSelectCourse, selectedCourse }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHoles, setCustomHoles] = useState(18);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/courses/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults((data.courses || []).slice(0, 10));
        setShowResults(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleSelect(course) {
    setLoading(true);
    setShowResults(false);
    try {
      const res = await fetch(`${API_BASE}/courses/${course.id}`);
      const full = await res.json();

      const scorecard = full.scorecard || [];
      const holes = [];
      for (let i = 0; i < (full.holes_count || 18); i++) {
        const holeData = scorecard[i] || {};
        holes.push({
          number: i + 1,
          par: holeData.par || 4,
          yardage: holeData.yardage || null,
          handicap: holeData.handicap_index || null,
        });
      }

      onSelectCourse({
        id: full.id,
        name: full.course_name || full.club_name || course.course_name,
        city: full.city || course.city,
        state: full.state || course.state,
        holesCount: full.holes_count || 18,
        parTotal: full.par_total || holes.reduce((s, h) => s + h.par, 0),
        holes,
        source: 'opengolfapi',
      });
      setQuery('');
    } catch {
      const holes = Array.from({ length: course.holes_count || 18 }, (_, i) => ({
        number: i + 1,
        par: 4,
        yardage: null,
        handicap: null,
      }));
      onSelectCourse({
        id: course.id,
        name: course.course_name || course.club_name,
        city: course.city,
        state: course.state,
        holesCount: course.holes_count || 18,
        parTotal: course.par_total || 72,
        holes,
        source: 'opengolfapi',
      });
      setQuery('');
    }
    setLoading(false);
  }

  function handleCustomCourse() {
    if (!customName.trim()) return;
    const holes = Array.from({ length: customHoles }, (_, i) => ({
      number: i + 1,
      par: 4,
      yardage: null,
      handicap: null,
    }));
    onSelectCourse({
      id: `custom-${Date.now()}`,
      name: customName,
      city: null,
      state: null,
      holesCount: customHoles,
      parTotal: customHoles * 4,
      holes,
      source: 'custom',
    });
    setCustomName('');
    setShowCustom(false);
  }

  return (
    <div className="course-search">
      <label className="course-search-label">Course</label>

      {selectedCourse ? (
        <div className="selected-course">
          <div className="selected-course-info">
            <span className="selected-course-name">{selectedCourse.name}</span>
            {selectedCourse.city && (
              <span className="selected-course-location">
                <MapPin size={12} /> {selectedCourse.city}{selectedCourse.state ? `, ${selectedCourse.state}` : ''}
              </span>
            )}
            <span className="selected-course-detail">
              {selectedCourse.holesCount} holes | Par {selectedCourse.parTotal}
            </span>
          </div>
          <button className="btn-icon" onClick={() => onSelectCourse(null)} title="Change course">
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search 15,000+ golf courses..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            {loading && <Loader2 size={16} className="spin search-loader" />}
          </div>

          {showResults && results.length > 0 && (
            <div className="search-results">
              {results.map(c => (
                <button key={c.id} className="search-result" onClick={() => handleSelect(c)}>
                  <span className="result-name">{c.course_name || c.club_name}</span>
                  <span className="result-location">
                    <MapPin size={12} />
                    {[c.city, c.state].filter(Boolean).join(', ') || 'US'}
                    {c.holes_count ? ` | ${c.holes_count}H` : ''}
                    {c.par_total ? ` | Par ${c.par_total}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!showCustom ? (
            <button className="btn-text" onClick={() => setShowCustom(true)}>
              <Plus size={14} /> Add custom course
            </button>
          ) : (
            <div className="custom-course-form">
              <input
                type="text"
                placeholder="Course name"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
              <select value={customHoles} onChange={e => setCustomHoles(parseInt(e.target.value))}>
                <option value={9}>9 holes</option>
                <option value={18}>18 holes</option>
              </select>
              <button className="btn btn-secondary" onClick={handleCustomCourse}>Add</button>
              <button className="btn-icon" onClick={() => setShowCustom(false)}><X size={14} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
