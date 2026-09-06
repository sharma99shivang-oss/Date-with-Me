import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Coffee, Copy,
  Film, Heart, MapPin, Music2, Pencil, Send, Sparkles, Utensils, Volume2,
  VolumeX, WandSparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from './api.js';
import Admin from './Admin.jsx';

const DRAFT_KEY = 'dateMeDraft';
const steps = ['welcome', 'intro', 'answer', 'dateType', 'place', 'cuisine', 'food', 'extras', 'date', 'time', 'location', 'message', 'guest', 'review', 'success'];
const dateTypes = [
  ['restaurant', 'Dinner date', Utensils, 'A table for two and your favourite flavours.'],
  ['cafe', 'Cute café', Coffee, 'Coffee, cake, and nowhere else to be.'],
  ['movie', 'Movie night', Film, 'Your pick, my popcorn.'],
  ['sunset', 'Sunset stroll', WandSparkles, 'Golden hour, hand in hand.'],
  ['surprise', 'Surprise me', Sparkles, 'A little mystery never hurt.']
];
const cuisines = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Korean', 'Japanese', 'Fast Food', 'South Indian', 'North Indian', 'Street Food'];
const foodExamples = {
  Chinese: ['Momos', 'Hakka Noodles', 'Fried Rice', 'Spring Rolls', 'Manchurian'],
  Indian: ['Paneer Butter Masala', 'Biryani', 'Butter Naan', 'Dal Makhani', 'Chole Bhature'],
  Italian: ['Pizza', 'Pasta', 'Lasagna', 'Risotto'],
  Mexican: ['Tacos', 'Burrito', 'Nachos', 'Quesadilla']
};
const extras = ['Cake', 'Coffee', 'Ice Cream', 'Brownie', 'Bubble Tea', 'Mojito', 'Cheesecake', 'Donut'];
const placeExamples = ['Domino’s', 'Pizza Hut', 'Starbucks', 'Cafe Coffee Day', 'McDonald’s', 'Burger King', 'KFC', 'Barbeque Nation'];
const locationExamples = ['Mall', 'Cinema', 'Park', 'Cafe', 'Temple', 'Home'];
const movieExamples = ['The Notebook', 'La La Land', 'Jab We Met', 'Your Name', 'A Quiet Place', 'Interstellar'];
const initialDraft = {
  answer: '', noReason: '', dateType: '', restaurant: '', cuisine: '', foods: [],
  desserts: [], movie: '', detail: '', date: '', time: '', timePeriod: '',
  location: '', message: '', guestName: '', guestPhone: '', guestEmail: '', music: true
};

function loadDraft() {
  try { return { ...initialDraft, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') }; }
  catch { return initialDraft; }
}

function FloatingMagic() {
  const pieces = useMemo(() => Array.from({ length: 20 }, (_, id) => ({ id, left: `${(id * 19) % 100}%`, delay: `${id % 5}s`, duration: `${7 + id % 5}s` })), []);
  return <div className="magic-layer" aria-hidden="true">{pieces.map((piece) => <span key={piece.id} style={{ left: piece.left, animationDelay: piece.delay, animationDuration: piece.duration }}>{piece.id % 3 ? '♡' : '✦'}</span>)}</div>;
}

function App() {
  return <Routes><Route path="/admin/login" element={<Admin />} /><Route path="/invite/:inviteCode" element={<Invitation />} /><Route path="*" element={<OwnerCreate />} /></Routes>;
}

function Invitation() {
  const { inviteCode } = useParams();
  const [draft, setDraft] = useState(loadDraft);
  const [step, setStep] = useState('welcome');
  const [invitation, setInvitation] = useState(null);
  const [sending, setSending] = useState(false);
  useEffect(() => { api.get(`/invitations/${inviteCode}`).then(({ data }) => setInvitation(data.invitation)).catch(() => toast.error('This invitation is unavailable.')); }, [inviteCode]);
  useEffect(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)), [draft]);
  const update = useCallback((patch) => setDraft((current) => ({ ...current, ...patch })), []);
  const index = steps.indexOf(step);
  const go = useCallback((target) => setStep(target), []);
  const back = () => setStep(steps[Math.max(0, index - 1)]);
  const submit = async () => {
    setSending(true);

    try {
      const { data } = await api.post("/responses", {
        ...draft,
        inviteCode,
        dateDate: draft.date,
        dateTime: draft.time,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      localStorage.removeItem(DRAFT_KEY);

      toast.success("Response Saved ❤️");

      // WhatsApp automatically open
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }

      go("success");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  };
  if (!invitation) return <main className="app-shell"><div className="content-card narrow centered"><div className="hero-heart small"><Heart size={30} fill="currentColor" /></div><h2>Opening your invitation…</h2><p className="body-copy">A little pink envelope is on its way.</p></div></main>;
  return <main className="app-shell" style={{ '--pink': invitation.theme === 'lavender' ? '#9a83d7' : undefined }}><FloatingMagic /><header className="topbar"><button className="brand" onClick={() => go('welcome')}><span>♡</span> {invitation.nickname || 'Date With Me'}</button><div className="top-actions"><button className="icon-button" onClick={() => update({ music: !draft.music })} aria-label="Toggle music">{draft.music ? <Volume2 size={18} /> : <VolumeX size={18} />}</button></div></header>
    {index > 0 && index < steps.length - 1 && <Progress index={index} />}
    <AnimatePresence mode="wait"><motion.section key={step} className="stage" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .3 }}>
      {step === 'welcome' && <Welcome onNext={() => go('intro')} />}
      {step === 'intro' && <Intro onNext={() => go('answer')} />}
      {step === 'answer' && <Answer draft={draft} update={update} onNext={() => go(draft.answer === 'yes' ? 'dateType' : 'message')} />}
      {step === 'dateType' && <DateType draft={draft} update={update} next={() => go('place')} back={back} />}
      {step === 'place' && <Place draft={draft} update={update} next={() => go('cuisine')} back={back} />}
      {step === 'cuisine' && <Cuisine draft={draft} update={update} next={() => go('food')} back={back} />}
      {step === 'food' && <Food draft={draft} update={update} next={() => go('extras')} back={back} />}
      {step === 'extras' && <Extras draft={draft} update={update} next={() => go('date')} back={back} />}
      {step === 'date' && <DateStep draft={draft} update={update} next={() => go('time')} back={back} />}
      {step === 'time' && <TimeStep draft={draft} update={update} next={() => go('location')} back={back} />}
      {step === 'location' && <LocationStep draft={draft} update={update} next={() => go('message')} back={back} />}
      {step === 'message' && <MessageStep draft={draft} update={update} next={() => go('guest')} back={back} />}
      {step === 'guest' && <GuestStep draft={draft} update={update} next={() => go('review')} back={back} />}
      {step === 'review' && <Review draft={draft} owner={invitation} edit={go} submit={submit} sending={sending} back={back} />}
      {step === 'success' && <Success draft={draft} />}
    </motion.section></AnimatePresence>
  </main>;
}

function Progress({ index }) {
  return <div className="progress-wrap"><div className="progress-label"><span>Our little plan</span><span>{index + 1} / {steps.length}</span></div><div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div></div>;
}
function Shell({ eyebrow, title, children, back, next, disabled, nextLabel = 'Continue' }) {
  return <div className="content-card wide"><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{children}<div className="nav-buttons"><button className="back-link" onClick={back}><ArrowLeft size={15} /> back</button><button className="primary-button" onClick={next} disabled={disabled}>{nextLabel} <ArrowRight size={17} /></button></div></div>;
}
function Welcome({ onNext }) { return <div className="hero-card centered"><div className="eyebrow"><Sparkles size={15} /> a tiny question for you</div><div className="hero-heart"><Heart size={52} fill="currentColor" /></div><h1>Date With Me,<br /><em>Princess?</em></h1><p className="lead">I have a little plan, a lot of butterflies,<br />and one very important question.</p><button className="primary-button" onClick={onNext}>Open your invitation <ArrowRight size={18} /></button><p className="microcopy">made with intention & a suspicious amount of pink ✦</p></div>; }
function Intro({ onNext }) { return <Shell eyebrow="chapter one · the setup" title="Before we get to the good part…" back={() => { }} next={onNext} nextLabel="I am listening"><p className="body-copy">There is a person who makes ordinary Tuesdays feel like movie endings. A person whose laugh is my favourite sound and whose company I keep choosing, in every universe.</p><div className="quote-card"><span>“</span><p>Some people are worth melting for.<br /><small>— the very scientific truth</small></p></div></Shell>; }
function Answer({ draft, update, onNext }) { return <Shell eyebrow="chapter two · no pressure (mostly)" title="So, what do you say?" back={() => { }} next={onNext} disabled={!draft.answer} nextLabel="Continue"><p className="body-copy">Pick the answer your heart is whispering. Both buttons are valid; one may make me do a tiny happy dance.</p><div className="answer-grid"><button className={`answer-card yes ${draft.answer === 'yes' ? 'selected' : ''}`} onClick={() => update({ answer: 'yes' })}><span className="answer-icon">♡</span><strong>Yes, absolutely</strong><small>Let’s make a memory.</small></button><button className={`answer-card no ${draft.answer === 'no' ? 'selected' : ''}`} onClick={() => update({ answer: 'no' })}><span className="answer-icon">☁</span><strong>Not this time</strong><small>Honesty is lovely too.</small></button></div></Shell>; }
function DateType({ draft, update, next, back }) { return <Shell eyebrow="chapter three · choose your adventure" title="What kind of date feels like us?" back={back} next={next} disabled={!draft.dateType} nextLabel="Choose the details"><p className="body-copy">Choose a mood. We can make the details delicious together.</p><div className="date-options">{dateTypes.map(([id, label, Icon, helper]) => <button key={id} className={`date-option ${draft.dateType === id ? 'selected' : ''}`} onClick={() => update({ dateType: id })}><span className="date-option-icon"><Icon size={22} /></span><span><strong>{label}</strong><small>{helper}</small></span><Check className="check-icon" size={18} /></button>)}</div></Shell>; }
function SearchField({ value, onChange, placeholder, suggestions = [], onPick }) { const filtered = suggestions.filter((item) => !value || item.toLowerCase().includes(value.toLowerCase())); return <div className="autocomplete"><input className="field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />{value && filtered.length > 0 && <div className="suggestions">{filtered.map((item) => <button key={item} onClick={() => onPick(item)}>{item}<ChevronDown size={14} /></button>)}</div>}</div>; }
function Place({ draft, update, next, back }) { const field = draft.dateType === 'restaurant' ? 'restaurant' : draft.dateType === 'movie' ? 'movie' : 'detail'; const title = draft.dateType === 'restaurant' ? 'Where shall we eat?' : draft.dateType === 'movie' ? 'What should we watch?' : draft.dateType === 'cafe' ? 'Which café is calling us?' : draft.dateType === 'sunset' ? 'Where should we watch the sky?' : 'Any clues for your surprise?'; const suggestions = draft.dateType === 'restaurant' ? placeExamples : draft.dateType === 'movie' ? movieExamples : []; return <Shell eyebrow="chapter four · make it yours" title={title} back={back} next={next} disabled={!draft[field]} nextLabel="Next little detail"><p className="body-copy">Type anything you like. The examples are only inspiration, never a limit.</p><SearchField value={draft[field]} onChange={(value) => update({ [field]: value })} onPick={(value) => update({ [field]: value })} placeholder={draft.dateType === 'movie' ? 'Search your favourite movie...' : 'Type any restaurant name...'} suggestions={suggestions} /></Shell>; }
function Cuisine({ draft, update, next, back }) { const options = draft.dateType === 'movie' ? ['Romantic', 'Comedy', 'Horror', 'Drama', 'Action', 'Anime', 'Thriller'] : draft.dateType === 'cafe' ? ['Coffee', 'Tea', 'Bakery', 'Brunch', 'Dessert'] : cuisines; return <Shell eyebrow="chapter five · flavours" title={draft.dateType === 'movie' ? 'What should we watch?' : 'What are we craving?'} back={back} next={next} disabled={!draft.cuisine} nextLabel="Pick the food"><div className="chip-grid">{options.map((item) => <button className={`chip ${draft.cuisine === item ? 'selected' : ''}`} key={item} onClick={() => update({ cuisine: item })}>{item}</button>)}</div></Shell>; }
function ChipInput({ values, update, examples, placeholder }) { const [value, setValue] = useState(''); const add = (item) => { const clean = item.trim(); if (clean && !values.includes(clean)) update([...values, clean]); setValue(''); }; return <><SearchField value={value} onChange={setValue} onPick={add} placeholder={placeholder} suggestions={examples} /><div className="selected-chips">{values.map((item) => <button className="selected-chip" key={item} onClick={() => update(values.filter((value) => value !== item))}>{item} ×</button>)}</div><button className="secondary-button add-chip" onClick={() => add(value)} disabled={!value.trim()}>Add custom</button></>; }
function Food({ draft, update, next, back }) { const examples = foodExamples[draft.cuisine] || ['Pizza', 'Burger', 'Pasta', 'Noodles', 'Rice']; return <Shell eyebrow="chapter six · the good stuff" title="What should we order?" back={back} next={next} nextLabel="Dessert & drinks"><p className="body-copy">Pick as many as you want, then add your own favourites.</p><ChipInput values={draft.foods} update={(foods) => update({ foods })} examples={examples} placeholder={`Search ${draft.cuisine || 'food'}...`} /></Shell>; }
function Extras({ draft, update, next, back }) { return <Shell eyebrow="chapter seven · something sweet" title="Desserts & drinks?" back={back} next={next} nextLabel="Pick a day"><p className="body-copy">A little treat for the two of us.</p><ChipInput values={draft.desserts} update={(desserts) => update({ desserts })} examples={extras} placeholder="Search dessert or drink..." /></Shell>; }
function DateStep({ draft, update, next, back }) { const min = new Date().toISOString().split('T')[0]; return <Shell eyebrow="chapter eight · calendar magic" title="When should we press pause on the world?" back={back} next={next} disabled={!draft.date} nextLabel="Choose a time"><input className="field date-field" type="date" min={min} value={draft.date} onChange={(e) => update({ date: e.target.value })} /><p className="helper-text">Previous dates are tucked away. Weekends are highlighted by your browser calendar.</p></Shell>; }
function TimeStep({ draft, update, next, back }) { return <Shell eyebrow="chapter nine · set the mood" title="What time feels right?" back={back} next={next} disabled={!draft.time} nextLabel="Choose a place"><div className="chip-grid">{['Morning', 'Afternoon', 'Evening', 'Night'].map((item) => <button key={item} className={`chip ${draft.timePeriod === item ? 'selected' : ''}`} onClick={() => update({ timePeriod: item })}>{item}</button>)}</div><label className="field-label">Or choose an exact time</label><input className="field" type="time" value={draft.time} onChange={(e) => update({ time: e.target.value })} /></Shell>; }
function LocationStep({ draft, update, next, back }) { return <Shell eyebrow="chapter ten · meet me there" title="Where do you want to meet?" back={back} next={next} disabled={!draft.location} nextLabel="Write a note"><SearchField value={draft.location} onChange={(location) => update({ location })} onPick={(location) => update({ location })} placeholder="Where do you want to meet?" suggestions={locationExamples} /></Shell>; }
function MessageStep({ draft, update, next, back }) { return <Shell eyebrow="chapter eleven · just between us" title="Anything you'd like me to know?" back={back} next={next} nextLabel="Read it back to me"><textarea className="field textarea" maxLength={500} rows="7" value={draft.message} onChange={(e) => update({ message: e.target.value })} placeholder="Tell me anything... 💌" /><div className="message-footer"><span>{draft.message.length}/500</span><span>✨ {draft.message ? 'saved as you type' : 'a quiet note is okay too'}</span></div></Shell>; }
function GuestStep({ draft, update, next, back }) { return <Shell eyebrow="chapter twelve · one last thing" title="How should I thank you?" back={back} next={next} disabled={!draft.guestName || !draft.guestPhone} nextLabel="Review our date"><input className="field" placeholder="Your name" value={draft.guestName} onChange={(e) => update({ guestName: e.target.value })} /><input className="field" placeholder="Your WhatsApp number" value={draft.guestPhone} onChange={(e) => update({ guestPhone: e.target.value })} /><input className="field" type="email" placeholder="Your email (optional)" value={draft.guestEmail} onChange={(e) => update({ guestEmail: e.target.value })} /></Shell>; }
function Review({ draft, owner, edit, submit, sending, back }) { const date = dateTypes.find(([id]) => id === draft.dateType)?.[1]; const sections = [['guest', '👑 Name', `${draft.guestName} · ${draft.guestPhone}`], ['answer', '❤️ Answer', draft.answer === 'yes' ? 'Yes, absolutely' : `No — ${draft.noReason || 'not this time'}`], ['dateType', '🍽 Date Type', date], ['place', '🏠 Restaurant / Place', draft.restaurant || draft.movie || draft.detail], ['cuisine', '🍜 Cuisine', draft.cuisine], ['food', '🍕 Foods', draft.foods.join(', ')], ['extras', '🍰 Desserts & Drinks', draft.desserts.join(', ')], ['date', '📅 Date', draft.date], ['time', '⏰ Time', `${draft.timePeriod || ''} ${draft.time}`], ['location', '📍 Location', draft.location], ['message', '💌 Message', draft.message || 'No extra note']]; return <div className="content-card wide review-card"><div className="eyebrow">chapter thirteen · sealed with a kiss</div><h2>One last beautiful look.</h2><p className="body-copy">Everything you chose, all in one little love letter for {owner.ownerName}.</p><div className="review-cards">{sections.filter(([, , value]) => value).map(([key, label, value]) => <div className="review-section" key={key}><div><small>{label}</small><strong>{value}</strong></div><button className="edit-button" onClick={() => edit(key)}><Pencil size={14} /> Edit</button></div>)}</div><div className="review-actions"><button className="back-link" onClick={back}><ArrowLeft size={15} /> back</button><button className="primary-button" onClick={submit} disabled={sending}>{sending ? 'Sending...' : <><Send size={17} /> Send my answer</>}</button></div></div>; }
function Success({ draft }) { const [seconds, setSeconds] = useState(0); useEffect(() => { const tick = () => setSeconds(Math.max(0, new Date(`${draft.date}T${draft.time || '00:00'}`) - new Date())); tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, [draft.date, draft.time]); const days = Math.floor(seconds / 86400000); return <div className="content-card narrow centered"><div className="success-orbit"><Heart size={43} fill="currentColor" /></div><div className="eyebrow"><Sparkles size={15} /> invitation delivered</div><h1>It’s a date!</h1><p className="lead">I can't wait to see you ❤️</p><div className="countdown"><span>{days}</span><small>days until our date</small></div><div className="confirmation-note">♡ saved in my favourite memories</div><button className="secondary-button" onClick={() => window.location.reload()}><Copy size={17} /> Start over</button></div>; }

export default App;

function OwnerCreate() {
  const [form, setForm] = useState({ ownerName: '', ownerEmail: '', ownerPhone: '', nickname: '', theme: 'pink' });
  const [share, setShare] = useState(null);
  const submit = async (event) => {
    event.preventDefault();

    try {
      const { data } = await api.post("/invitations", form);

      setShare(data);
      toast.success("Your invitation is ready ❤️");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not create invitation."
      );
    }
  };

  const copy = async () => { await navigator.clipboard.writeText(share.shareUrl); toast.success('Link copied.'); };
  if (share) return <main className="app-shell"><div className="content-card narrow centered"><div className="hero-heart small"><Heart size={30} fill="currentColor" /></div><div className="eyebrow">your invitation is ready</div><h2>Send a little magic.</h2><p className="body-copy">{share.shareUrl}</p><div className="share-actions"><button className="primary-button" onClick={copy}><Copy size={17} /> Copy Link</button><a className="secondary-button" href={`https://wa.me/?text=${encodeURIComponent(`I made you a little surprise: ${share.shareUrl}`)}`}>WhatsApp</a><a className="secondary-button" href={`mailto:?subject=Someone has a surprise for you&body=${encodeURIComponent(share.shareUrl)}`}>Email</a><button className="secondary-button" onClick={() => window.open(`https://quickchart.io/qr?text=${encodeURIComponent(share.shareUrl)}&size=300`, '_blank')}>QR Code</button></div></div></main>;
  return <main className="app-shell"><div className="content-card narrow"><div className="eyebrow">create your invitation</div><h1>Date With Me,<br /><em>Princess?</em></h1><p className="body-copy">Add your details, create one private link, and send it to someone special.</p><form className="owner-form" onSubmit={submit}><input className="field" required placeholder="Full Name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /><input className="field" required type="email" placeholder="Email Address" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /><input
    className="field"
    type="tel"
    required
    placeholder="WhatsApp Number (10 digits)"
    value={form.ownerPhone}
    onChange={(e) =>
      setForm({
        ...form,
        ownerPhone: e.target.value.replace(/\D/g, "").slice(0, 10),
      })
    }
  /><input className="field" placeholder="Relationship Nickname (optional)" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} /><select className="field" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}><option value="pink">Pink theme</option><option value="lavender">Lavender theme</option></select><button className="primary-button full">Create My Invitation 💖</button></form></div></main>;
}
