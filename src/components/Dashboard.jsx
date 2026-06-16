import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard({ rounds }) {
  const stats = useMemo(() => {
    if (rounds.length === 0) return null;

    const allShots = rounds.flatMap(r => r.shots);

    const scoreOverTime = rounds.map(r => ({
      date: r.date.slice(5),
      score: r.score,
      strokes: r.totalStrokes,
    }));

    const clubCounts = {};
    const clubDistances = {};
    const clubOutcomes = {};
    allShots.forEach(s => {
      clubCounts[s.club] = (clubCounts[s.club] || 0) + 1;
      if (!clubDistances[s.club]) clubDistances[s.club] = [];
      clubDistances[s.club].push(s.distance);
      if (!clubOutcomes[s.club]) clubOutcomes[s.club] = { Great: 0, Good: 0, OK: 0, Poor: 0, Terrible: 0 };
      clubOutcomes[s.club][s.outcome]++;
    });

    const clubAvgDistance = Object.entries(clubDistances).map(([club, dists]) => ({
      club,
      avg: Math.round(dists.reduce((a, b) => a + b, 0) / dists.length),
      count: dists.length,
    })).sort((a, b) => b.avg - a.avg);

    const shotTypeDist = {};
    allShots.forEach(s => { shotTypeDist[s.shotType] = (shotTypeDist[s.shotType] || 0) + 1; });
    const shotTypePie = Object.entries(shotTypeDist).map(([name, value]) => ({ name, value }));

    const outcomeDist = { Great: 0, Good: 0, OK: 0, Poor: 0, Terrible: 0 };
    allShots.forEach(s => { outcomeDist[s.outcome]++; });
    const outcomePie = Object.entries(outcomeDist).map(([name, value]) => ({ name, value }));

    const avgScore = rounds.reduce((s, r) => s + r.score, 0) / rounds.length;
    const bestRound = rounds.reduce((best, r) => r.score < best.score ? r : best, rounds[0]);
    const totalShots = allShots.length;

    return { scoreOverTime, clubAvgDistance, shotTypePie, outcomePie, avgScore, bestRound, totalShots, rounds: rounds.length };
  }, [rounds]);

  if (!stats) {
    return <div className="dashboard empty-state"><p>Play some rounds to see your stats!</p></div>;
  }

  return (
    <div className="dashboard">
      <h2>Performance Dashboard</h2>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.rounds}</div>
          <div className="stat-label">Rounds Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgScore > 0 ? '+' : ''}{stats.avgScore.toFixed(1)}</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.bestRound.score > 0 ? '+' : ''}{stats.bestRound.score}</div>
          <div className="stat-label">Best Round</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalShots}</div>
          <div className="stat-label">Total Shots</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.scoreOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Avg Distance by Club</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.clubAvgDistance.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="club" stroke="#888" angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
              <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Shot Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.shotTypePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {stats.shotTypePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Shot Outcomes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.outcomePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill="#10b981" />
                <Cell fill="#3b82f6" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
                <Cell fill="#7f1d1d" />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
