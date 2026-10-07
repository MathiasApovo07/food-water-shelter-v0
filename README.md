# Food, Water, Shelter — Desert Simulation

Version 0 of the DRI Fellowship simulation, shared for review and feedback.

This prototype explores how access to food, water, and shelter affects a population of sagebrush lizards.

## How to play

1. Select **Start**.
2. Drag each lizard to the resource it needs, or select the lizard and then the matching resource.
3. Watch the population and resource counters, graph, and feedback.
4. Use **Pause / Resume** to pause or continue, and **Reset** to start again.

Each lizard has **8 seconds from the moment it appears** to reach its required resource.

- A successful match consumes the resource and replaces the parent with two offspring.
- Each offspring receives a random need and a fresh eight-second timer.
- A lizard that does not reach its resource in time dies, and a random resource appears.
- The session ends when no lizards remain. Select **Reset** to try again.

## Starting conditions

The standard simulation begins with **10 lizards and 30 resources**: 10 Food, 10 Water, and 10 Shelter.

The balanced starting distribution and spacing of objects are prototype design choices for review.

## Optional settings

- **Drought:** water is half as likely to appear as either food or shelter. The starting resources are adjusted to 12 Food, 6 Water, and 12 Shelter.
- **Wildfire:** fires occur at random intervals of 20–40 seconds and remove all shelter. Shelter can return through subsequent resource generation.

Both settings are off by default. Their timing and effects remain open to educational review and calibration.

## Controls and accessibility

The prototype supports drag-and-drop interaction and a select-then-match alternative.

Keyboard controls:
- **Tab:** navigate between controls and objects.
- **Enter / Space:** select.
- **Escape:** cancel selection.

The layout adapts to smaller screens. A table accompanies the graph. Further accessibility and device testing is needed; Section 508 compliance has not been certified.

## Running a downloaded copy

Download and extract the entire project, then open **index.html** in Chrome, Edge, or Firefox. Keep **styles.css** and the **src** folder alongside **index.html**.

No installation or student account is required. Simulation results remain in the browser page and are cleared when the session is reset or the page is closed.

## Review status

This is an initial working prototype, not a final release. Feedback is welcome on the scientific behavior, instructions, visuals, usability, accessibility, and optional settings.

Automated tests are included in the **tests** folder. With Node.js installed, run them from the project folder using:

`node --test`

GitHub Pages publication is the next step for providing direct browser access.
