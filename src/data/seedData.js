const CLUBS = [
  'Driver', '3-Wood', '5-Wood', '3-Hybrid', '4-Iron', '5-Iron', '6-Iron',
  '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'LW', 'Putter'
];

const SHOT_TYPES = ['Tee Shot', 'Fairway', 'Approach', 'Chip', 'Putt', 'Bunker', 'Recovery'];

const OUTCOMES = ['Great', 'Good', 'OK', 'Poor', 'Terrible'];

const COURSES = [
  'Pine Valley GC', 'Shadow Creek', 'Oak Ridge Municipal', 'Riverside Links', 'Cedar Hills CC'
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTypicalDistance(club) {
  const distances = {
    'Driver': [200, 280], '3-Wood': [180, 240], '5-Wood': [170, 220],
    '3-Hybrid': [160, 210], '4-Iron': [150, 200], '5-Iron': [140, 190],
    '6-Iron': [130, 175], '7-Iron': [120, 165], '8-Iron': [110, 150],
    '9-Iron': [100, 140], 'PW': [80, 130], 'SW': [40, 100],
    'LW': [20, 80], 'Putter': [2, 60],
  };
  const [min, max] = distances[club] || [50, 150];
  return randomBetween(min, max);
}

function getShotTypeForClub(club) {
  if (club === 'Driver') return 'Tee Shot';
  if (club === 'Putter') return 'Putt';
  if (['SW', 'LW'].includes(club)) return randomFrom(['Chip', 'Bunker', 'Approach']);
  if (['PW', '9-Iron', '8-Iron'].includes(club)) return randomFrom(['Approach', 'Chip']);
  return randomFrom(['Fairway', 'Approach']);
}

function weightedOutcome() {
  const r = Math.random();
  if (r < 0.08) return 'Great';
  if (r < 0.30) return 'Good';
  if (r < 0.60) return 'OK';
  if (r < 0.85) return 'Poor';
  return 'Terrible';
}

function generateRound(dateStr, courseIndex) {
  const shots = [];
  const holesPlayed = 18;
  let shotId = 0;

  for (let hole = 1; hole <= holesPlayed; hole++) {
    const par = randomFrom([3, 4, 4, 4, 5, 5]);
    const numShots = par + randomBetween(-1, 3);

    for (let s = 0; s < numShots; s++) {
      let club;
      if (s === 0 && par > 3) club = 'Driver';
      else if (s === numShots - 1) club = 'Putter';
      else club = randomFrom(['3-Wood', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW']);

      shots.push({
        id: `${dateStr}-${hole}-${shotId++}`,
        hole,
        par,
        club,
        distance: getTypicalDistance(club),
        shotType: getShotTypeForClub(club),
        outcome: weightedOutcome(),
      });
    }
  }

  return shots;
}

function generateSeedRounds() {
  const rounds = [];
  const baseDate = new Date(2026, 4, 1);

  for (let i = 0; i < 10; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * randomBetween(3, 7));
    const dateStr = d.toISOString().split('T')[0];
    const course = COURSES[i % COURSES.length];
    const shots = generateRound(dateStr, i);

    const totalStrokes = shots.length;
    const totalPar = [...new Set(shots.map(s => s.hole))].reduce((sum, hole) => {
      return sum + shots.find(s => s.hole === hole).par;
    }, 0);

    rounds.push({
      id: `round-${i}`,
      date: dateStr,
      course,
      shots,
      totalStrokes,
      totalPar,
      score: totalStrokes - totalPar,
    });
  }

  return rounds;
}

export { CLUBS, SHOT_TYPES, OUTCOMES, COURSES, generateSeedRounds };
