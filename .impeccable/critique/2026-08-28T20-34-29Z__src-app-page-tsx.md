---
target: home page
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-28T20-34-29Z
slug: src-app-page-tsx
---
# Sportship home-page critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Selected states and live filter feedback work, but results are far from controls on mobile. |
| 2 | Match with the real world | 3/4 | Local language is clear; “Tonight” conflicts with “Tue 18:30.” |
| 3 | User control and freedom | 3/4 | Filters are resettable but are lost on refresh. |
| 4 | Consistency and standards | 2/4 | CSS reorders mobile sections without matching DOM and focus order. |
| 5 | Error prevention | 3/4 | Inputs are constrained; hard-coded dynamic claims can become contradictory. |
| 6 | Recognition rather than recall | 3/4 | Labels are visible, but mobile hides navigation and delays the value proposition. |
| 7 | Flexibility and efficiency | n/a | Not applicable to this persuasion surface. |
| 8 | Aesthetic and minimalist design | 2/4 | Strong desktop hierarchy; mobile sport wall and dead-end organizer section dilute focus. |
| 9 | Error recognition and recovery | 3/4 | Empty state recovers well, but “Showing groups” is inaccurate when the result count is zero. |
| 10 | Help and documentation | n/a | Not required for this landing-page scope. |
| **Total** | | **22/32** | **Acceptable** |

## Design Specificity Verdict

The floorball photography, Stockholm context, attendance cues, warm coral palette, and sport-specific colors make the page feel more authored than a generic template. The floating statistic cards, three competing hero actions, pastel category grid, and generic group-card pattern could still belong to a wellness or event-discovery product. Sportship’s most ownable material is local trust: skill level, commitment, organizer credibility, venue character, and availability.

The deterministic scan returned zero findings for `src/app/page.tsx`. Browser evidence found no console errors, horizontal overflow, clipping, or overlap at 1440×900 and 390×844. The browser API was read-only, so no reliable overlay was injected.

## Overall Impression

Desktop has a persuasive social arc and strong visual warmth. Mobile reverses that arc by asking users to choose from a long sport wall before explaining Sportship, then places the filtered result far below the control. The biggest opportunity is to restore a coherent mobile journey and make every dynamic claim credible.

## What’s Working

- The warm, energetic visual language avoids aggressive fitness branding.
- The hero makes the product tangible with a real sport, local group, attendance, and time.
- Selection states, `aria-pressed`, polite status updates, focus styles, reduced-motion support, and the actionable empty state are thoughtfully implemented.

## Priority Issues

### [P1] Mobile visual order conflicts with DOM and focus order

Sighted visitors see sports before the hero, while keyboard and screen-reader users encounter the hero first. Keep hero-before-sports across breakpoints, or change the markup itself if sports-first remains intentional.

### [P1] “Live” social proof can be visibly false

“Tonight in Stockholm” conflicts with “Tue 18:30.” Use one session source, or change the label to date-neutral “Upcoming in Stockholm.”

### [P2] Sport selection is an option wall with a remote outcome

Eight simultaneous actions occupy more than one mobile viewport, and the affected groups are far below. Place a compact sport picker directly above results and keep status feedback beside the result count.

### [P2] Several mobile tap targets are undersized

Explore sports, See every sport, the city select, and View group links measure roughly 20–26px high. Give them a 44px minimum hit area while preserving their visual treatment.

### [P2] The organizer conversion section is a dead end

The section creates intent but has no action and reads unfinished on desktop. Add Start a group, a secondary explanation link, and concise organizer benefits.

## Persona Red Flags

**Jordan, first-timer:** sees a seven-tile picker before learning what the product does; mobile navigation disappears; there is no reassurance about joining unfamiliar people.

**Riley, stress tester:** finds contradictory time claims, refresh-lost filter state, and hard-coded counts that look live.

**Casey, distracted mobile user:** must cross more than one viewport before the main proposition, uses undersized text links, and must scroll far from filter to result.

## Minor Observations

- Core palette contrast is strong and no horizontal overflow appeared at 390px.
- Display tracking has character but should be watched with fallback fonts.
- Sport counts deserve more visual weight because they signal marketplace activity.
- The footer is pleasant but cannot compensate for the organizer section’s missing action.
