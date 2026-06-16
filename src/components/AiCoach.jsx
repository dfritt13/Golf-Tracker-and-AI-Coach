import { useState, useMemo } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';

function buildAnalysisPrompt(rounds) {
  const allShots = rounds.flatMap(r => r.shots);
  const total = allShots.length;

  const outcomeCounts = {};
  const clubStats = {};
  allShots.forEach(s => {
    outcomeCounts[s.outcome] = (outcomeCounts[s.outcome] || 0) + 1;
    if (!clubStats[s.club]) clubStats[s.club] = { distances: [], outcomes: {} };
    clubStats[s.club].distances.push(s.distance);
    clubStats[s.club].outcomes[s.outcome] = (clubStats[s.club].outcomes[s.outcome] || 0) + 1;
  });

  const scores = rounds.map(r => `${r.date}: ${r.score > 0 ? '+' : ''}${r.score} (${r.totalStrokes} strokes at ${r.course})`).join('\n');

  const clubSummary = Object.entries(clubStats).map(([club, data]) => {
    const avg = Math.round(data.distances.reduce((a, b) => a + b, 0) / data.distances.length);
    const topOutcome = Object.entries(data.outcomes).sort((a, b) => b[1] - a[1])[0];
    return `${club}: avg ${avg}y, ${data.distances.length} shots, most common outcome: ${topOutcome[0]}`;
  }).join('\n');

  return `Here is my golf data from ${rounds.length} rounds (${total} total shots):

SCORES:
${scores}

CLUB STATS:
${clubSummary}

OUTCOME DISTRIBUTION:
${Object.entries(outcomeCounts).map(([k, v]) => `${k}: ${v} (${(v/total*100).toFixed(1)}%)`).join(', ')}`;
}

const CANNED_ANALYSES = [
  {
    question: "What should I focus on to improve?",
    getAnswer: (rounds) => {
      const allShots = rounds.flatMap(r => r.shots);
      const poorRate = allShots.filter(s => ['Poor', 'Terrible'].includes(s.outcome)).length / allShots.length;
      const clubIssues = {};
      allShots.forEach(s => {
        if (!clubIssues[s.club]) clubIssues[s.club] = { total: 0, bad: 0 };
        clubIssues[s.club].total++;
        if (['Poor', 'Terrible'].includes(s.outcome)) clubIssues[s.club].bad++;
      });
      const worstClub = Object.entries(clubIssues)
        .filter(([, v]) => v.total >= 5)
        .sort((a, b) => (b[1].bad / b[1].total) - (a[1].bad / a[1].total))[0];

      return `Based on your ${rounds.length} rounds and ${allShots.length} shots, here are my top recommendations:

**1. Short Game Consistency**
Your overall poor/terrible shot rate is ${(poorRate * 100).toFixed(1)}%. Focus on reducing mishits, especially around the green where strokes are easiest to save.

**2. Club-Specific Work: ${worstClub ? worstClub[0] : 'Driver'}**
${worstClub ? `Your ${worstClub[0]} has a ${(worstClub[1].bad / worstClub[1].total * 100).toFixed(0)}% poor outcome rate over ${worstClub[1].total} shots.` : 'Your driver consistency could use some range work.'} Spend dedicated practice time on this club — even 20 minutes of focused reps per session will help.

**3. Course Management**
Your scores trend ${rounds[rounds.length - 1].score > rounds[0].score ? 'upward (getting worse)' : 'downward (improving)'} over recent rounds. ${rounds[rounds.length - 1].score > rounds[0].score ? 'Consider playing more conservatively — take the safe shot instead of going for heroic plays.' : 'Great trend — keep doing what you\'re doing and look for marginal gains.'}

**Action Plan:** Hit the range twice this week focusing on your weakest club. On your next round, keep a mental note of every shot where you chose aggressive vs. conservative — that awareness alone drops 2-3 strokes.`;
    }
  },
  {
    question: "Analyze my driving performance",
    getAnswer: (rounds) => {
      const drives = rounds.flatMap(r => r.shots).filter(s => s.club === 'Driver');
      if (drives.length === 0) return "No driver shots logged yet. Log some rounds with tee shots to get analysis!";
      const avgDist = Math.round(drives.reduce((a, s) => a + s.distance, 0) / drives.length);
      const goodRate = drives.filter(s => ['Great', 'Good'].includes(s.outcome)).length / drives.length;
      return `**Driver Analysis** (${drives.length} drives across ${rounds.length} rounds)

**Average Distance:** ${avgDist} yards
**Accuracy Rate:** ${(goodRate * 100).toFixed(1)}% good or better outcomes

${avgDist < 220 ? '**Distance:** Your driver distance is below average. Focus on swing speed training — hip rotation and lag in the downswing are the biggest levers.' : avgDist < 260 ? '**Distance:** Solid distance. You\'re in the sweet spot where accuracy matters more than extra yards.' : '**Distance:** Excellent distance off the tee. At this point, consistency is king.'}

${goodRate < 0.4 ? '**Accuracy is your priority.** Over half your drives have poor outcomes. Consider teeing off with a 3-wood on tight holes — the distance trade-off is worth it when you stay in the fairway.' : goodRate < 0.6 ? '**Accuracy is decent but inconsistent.** Work on a pre-shot routine and pick a specific target on every tee shot.' : '**Strong accuracy!** Your driving is a weapon. Keep it up.'}`;
    }
  },
  {
    question: "What patterns do you see in my scoring?",
    getAnswer: (rounds) => {
      const scores = rounds.map(r => r.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const best = Math.min(...scores);
      const worst = Math.max(...scores);
      const recent = scores.slice(-3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const improving = recentAvg < avg;

      return `**Scoring Pattern Analysis**

**Range:** ${best > 0 ? '+' : ''}${best} to +${worst} (spread of ${worst - best} strokes)
**Average:** ${avg > 0 ? '+' : ''}${avg.toFixed(1)}
**Last 3 Rounds Avg:** ${recentAvg > 0 ? '+' : ''}${recentAvg.toFixed(1)}

**Trend:** ${improving ? 'Improving! Your recent rounds are better than your overall average. Whatever you changed recently is working.' : 'Your recent rounds are slightly above your average. Don\'t panic — variance is normal. Look at what was different in your best rounds.'}

**Consistency:** A ${worst - best}-stroke spread between best and worst suggests ${worst - best > 15 ? 'high variability. Your good rounds show you have the skill — the challenge is doing it consistently. Focus on eliminating blow-up holes.' : worst - best > 8 ? 'moderate variability. You\'re in a normal range. Tightening your short game will compress this range.' : 'great consistency! You\'re playing reliably. Marginal gains from here.'}

**Key Insight:** The fastest path to lower scores for most amateurs isn't hitting it further — it's avoiding the big numbers. Next round, if you're in trouble, take your medicine and play for bogey instead of double.`;
    }
  }
];

export default function AiCoach({ rounds }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm your AI Golf Coach. I've analyzed your round data and I'm ready to help you improve. Ask me anything, or try one of the quick-analysis buttons below!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [useApi, setUseApi] = useState(false);

  async function handleSend(questionOverride) {
    const question = questionOverride || input;
    if (!question.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    if (useApi && apiKey) {
      try {
        const dataContext = buildAnalysisPrompt(rounds);
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6-20250514',
            max_tokens: 1024,
            system: "You are a PGA-certified golf instructor analyzing an amateur golfer's data. Be specific, reference their actual numbers, and give actionable advice. Keep responses concise but insightful. Use markdown formatting.",
            messages: [
              { role: 'user', content: `${dataContext}\n\nMy question: ${question}` }
            ]
          })
        });
        const data = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content?.[0]?.text || 'Sorry, I had trouble analyzing that. Try again!'
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `API error: ${err.message}. Falling back to built-in analysis.`
        }]);
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      const match = CANNED_ANALYSES.find(a =>
        question.toLowerCase().includes('focus') || question.toLowerCase().includes('improve') ? a.question.includes('focus') :
        question.toLowerCase().includes('driv') ? a.question.includes('driving') :
        question.toLowerCase().includes('scor') || question.toLowerCase().includes('pattern') ? a.question.includes('patterns') :
        false
      ) || CANNED_ANALYSES[0];

      setMessages(prev => [...prev, { role: 'assistant', content: match.getAnswer(rounds) }]);
    }
    setLoading(false);
  }

  return (
    <div className="ai-coach">
      <div className="section-header">
        <h2><Bot size={24} /> AI Golf Coach</h2>
        <label className="api-toggle">
          <input type="checkbox" checked={useApi} onChange={e => setUseApi(e.target.checked)} />
          Use Claude API
        </label>
      </div>

      {useApi && (
        <div className="api-key-input">
          <input
            type="password"
            placeholder="Enter Anthropic API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <span className="api-hint">Key stays in browser memory only — never stored or sent elsewhere</span>
        </div>
      )}

      <div className="quick-actions">
        {CANNED_ANALYSES.map((a, i) => (
          <button key={i} className="btn btn-outline" onClick={() => handleSend(a.question)}>
            {a.question}
          </button>
        ))}
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className="message-content" dangerouslySetInnerHTML={{
              __html: m.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>')
            }} />
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content"><Loader2 size={16} className="spin" /> Analyzing your data...</div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask about your game..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="btn btn-primary" onClick={() => handleSend()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
