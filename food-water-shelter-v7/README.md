# Food, Water, Shelter: Explore the Sagebrush Steppe

Version 6, based on version 5 and Ileah's feedback of October 14, 2026.

## Play
Open index.html in a modern browser. Keep src, assets and styles.css beside it.
Read the introduction, choose Drought and/or Wildfire if desired, then select Start.
Click a lizard and its matching resource, or drag and drop. Keyboard: Tab, Enter/Space; Escape cancels selection.

Each lizard has 10 seconds from its appearance. A successful match removes the parent and resource immediately. Their two squares remain blank for 2 seconds of simulation time. Two offspring then appear with random needs and a full 10-second lifespan.
Pause, the wildfire lesson and leaving the tab suspend simulation time, including pending births.
Zero visible lizards does not end the session while births are pending. Reset cancels all pending births and clears the session.

The initial habitat contains 10 lizards and 30 randomly distributed resources. An unmatched lizard dies and returns a random resource. During the reproduction delay, active lizards plus resources temporarily fall below the initial total.
Drought makes water half as likely as either other resource. Wildfire occurs every 15–30 simulated seconds and removes half the current shelter (rounded up), followed by a paused lesson.

## Layout and sound
The right sidebar contains the STEM Education logo, Controls, Options, Live Counters and Time Elapsed, in that order. Small screens stack the layout.
Sound is off by default. Enable it with Sound: off. Recorded munch, grunt and fire effects accompany matches, deaths and wildfires. Pause, Reset, mute and leaving the tab stop playback.
The visible Info / Feedback panel is removed; screen-reader announcements remain.

CSV and PNG download buttons export the current session. Results remain in the page until reset or closed.

## Sources and checks
See assets/SOURCES.md for image and audio sources.
Run node --test for engine, controller, layout structure, sound lifecycle and export tests. Controller tests use a simulated DOM; they do not certify actual rendering, touch gestures, audio playback or accessibility compliance.
Version 5 is preserved separately. Version 6 has not been published.
