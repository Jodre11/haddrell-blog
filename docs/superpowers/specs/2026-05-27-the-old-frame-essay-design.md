# Design — *The old frame* (essay)

## Summary

A short essay (~600–900 words) for `/essays` arguing that the establishment
voice of any technological transition tends to misframe the new technology
through the criteria of the old. The worry is rarely stupid; the *lens* is
what's wrong. The pattern is illustrated through four historical cases, then
pivoted to a positive close: real concerns about agentic tooling exist, but
the solutions will come from people who weren't bound by yesterday's frames.

This essay is distinct from the existing placeholder `the-adoption-gap.md`,
which is parked for a later post about competitive dynamics among current
senior engineers. *The old frame* is a generational-adaptation argument, not
a competitive-dynamics one.

## Frontmatter

- **File:** `src/content/essays/the-old-frame.md`
- **Title:** *The old frame*
- **Description:** drafted with the essay (one line, to be set on the draft pass)
- **pubDate:** `2026-05-27` placeholder; updated on publish
- **tags:** `["agentic-tools", "ai", "history"]`
- **draft:** `true` until ready to publish
- **featured:** `false`

`ai` and `history` are new tags. They cleanly cross-cut existing content and
both are useful as future-essay tags.

## Thesis

When transformative technology arrives, the established voices of the day
misframe it through old criteria. They are not always wrong about the
*concern* — sometimes the concern is real, as with the Luddites' livelihoods.
They are wrong about the *frame*: they judge the new thing by what the old
thing measured, and propose solutions that are more of the old thing. The
next generation, unencumbered by that frame, finds uses the establishment
couldn't have imagined and solutions that don't look like anything that came
before.

The essay is positive in tone. It is not a dunk on the worried. It is a
prompt to recognise the pattern and to invest in the new thinking that
genuine concerns (security at machine speed; AI safety) actually require.

## Structure (~750 words target)

### Act 1 — The worry as voiced (~180 words)

Open by naming the contemporary artefact: the LinkedIn-clickbait genre of
"how will juniors learn to code if they're managing agents?" Concede the
worry has citable evidence behind it — Anthropic's own 2024 RCT (52
mostly-junior engineers; AI-assisted developers scored 17 percentage
points lower on comprehension and debugging quizzes) is the strongest
single piece, made stronger because Anthropic itself published it.

Then make the move: the *data* is real; the *interpretation* (juniors
won't learn engineering) is the old frame applied to new tooling. The
question is whether the skill being measured is the skill that will
matter. The establishment voice, formed by yesterday's frame, is asking
yesterday's question.

### Act 2 — The pattern (~370 words)

Pattern claim opens the act. Then four beats, deliberately compressed —
the argument is the *repetition*, not any one example.

- **Socrates on writing (~80 words).** *Phaedrus*, Theuth myth; writing
  will produce people who "seem to know much while knowing nothing".
- **Print-overload, 1545 (~80 words).** Gessner on the "confusing and
  harmful abundance of books"; Ann Blair's *Too Much to Know* as the
  scholarly anchor.
- **Luddites (~110 words).** Carries slightly more weight. Right about
  the threat to livelihoods; wrong about the lever. The frame ("preserve
  the old industry") was the trap. This beat proves the thesis isn't
  "the worried were stupid" — it's "the old frame couldn't see the new
  lever".
- **1990s internet (~80 words).** Stoll, *Newsweek* Feb 1995; Krugman
  1998's "no greater than the fax machine". Brings the pattern into
  living memory.

One in-discipline echo to assembly→FORTRAN reception fits as a single
sentence at the close of the act, if the draft sustains it. No fifth
beat — the word budget doesn't carry it.

### Act 3 — The pivot (~200 words)

Restate the pattern in its sharpest form: the wise weren't wrong about
the worry, they were applying yesterday's criteria, and the criteria
were about to change.

Forward move:

- The next generation will find uses we haven't imagined; they're not
  held back by our frame.
- One-sentence Keynes nod (*Economic Possibilities for our Grandchildren*,
  1930) as evidence the "what will people do?" question is older than
  agents and survives.
- Real concerns exist. Security at machine speed: vulnerabilities surface
  faster than humans can patch them; the answer is to harness the same
  tools that surface them. Geoffrey Hinton is named as a pioneer
  *applying* fresh thinking to AI safety, not retreating into the old
  frame.
- Close: the solutions will be new, fresh, and exciting — and they'll
  come from people who weren't bound by yesterday's frames. Positive
  landing.

## Sourcing

Links to verify and include during the writing pass. If any source can't
be substantiated, the surrounding claim is rewritten rather than fudged.

- Anthropic, *How AI assistance impacts the formation of coding skills*
  (2024) — `anthropic.com/research/AI-assistance-coding-skills`. The
  load-bearing piece of evidence behind Act 1's worry.
- Plato, *Phaedrus* — Perseus Digital Library translation, Theuth passage
  (274c–275b).
- Ann Blair, *Too Much to Know* — Yale University Press page.
- Conrad Gessner, *Bibliotheca Universalis* (1545) — scholarly citation
  for the "confusing and harmful abundance" passage (via Blair or a
  direct primary source).
- Luddite history — substantial secondary (Hobsbawm's *Captain Swing* or
  similar British Library / Smithsonian treatment).
- Clifford Stoll, "Why the Web Won't Be Nirvana", *Newsweek*, February
  1995.
- Paul Krugman, 1998 *Red Herring* essay (the "fax machine" prediction)
  or accepted secondary.
- John Maynard Keynes, *Economic Possibilities for our Grandchildren*
  (1930) — public-domain text.
- Geoffrey Hinton — primary interview (NYT May 2023 resignation piece or
  Nobel 2024 coverage).

## Images

Two to four total, sourced from Wikimedia public-domain (or another
clean-licence source). The essay is short, so each image needs to earn
its place; a slideshow is not the goal.

Candidate images, in priority order:

- A Gutenberg-era printing-press woodcut — print-overload beat. Strong
  public-domain availability.
- A Luddite-era illustration of a power loom or the machine-breaking
  itself — Luddite beat. Strong public-domain availability.
- A bust or portrait of Socrates, or a *Phaedrus* manuscript leaf —
  Socrates beat. Public-domain candidates exist on Wikimedia.
- A 1990s-internet artefact (e.g. a period magazine cover or screenshot)
  — internet beat. Hardest to source cleanly; likely omitted unless a
  clear-licence option turns up.

Final selection driven by what's actually available with a clean licence
and a credible attribution. Two strong images beat four weak ones.

Image handling matches build #001: PNG/JPG into `public/`, attribution
in a `<figcaption>`, sized to sit inside the measure.

## Voice and register

Matches build #001 (`001-haddrell-from-scratch.md`).

- First person used sparingly, for judgements not narration.
- Calm, declarative sentences; no hype, no exclamation, no breezy
  closings.
- Inline links; link text reads as the named thing.
- At most one short blockquote per primary source where it earns its
  place — not every beat needs one.
- No emoji, no "TL;DR".

## Out of scope

- The competitive-dynamics argument among current senior engineers —
  belongs in *the adoption gap* placeholder, not here.
- A full essay on the post-work question (Keynes lineage). Referenced in
  one sentence in Act 3; a longer treatment is a separate piece.
- A fifth historical example. Word budget can't carry it without
  thinning the existing four.

## Open questions for the draft pass

- Final one-line `description:` for frontmatter.
- Whether the assembly→FORTRAN echo earns its sentence in the final
  draft.
- Final image selection — driven by what's actually available with a
  clean public-domain licence and a credible source.
