# Project Reflection

## Overview
### What Was Hard
- Debugging async issues, especially after “vibecoding” parts of the front end too early.
- Deciding which concepts should handle what and how data should flow between them.

### What Was Easy
- Once the concept structure was clear, adding actions and syncs felt straightforward.
- The backend sync design made updates cleaner and reduced state inconsistencies.

### What Went Well
- The final app matched my original vision and worked reliably.
- Clear separation between SportsStats, ItemTracking, PasswordAuth, and Sessioning made the system stable.

### Mistakes and Lessons
- Coded too quickly at first without planning dependencies or data flow.
- Learned to think ahead about concept responsibilities before implementing.

### Skills Acquired
- Stronger design thinking and understanding of concept-driven architecture.
- Experience defining syncs and system actions across multiple layers.

### Skills to Develop Further
- Better debugging intuition for async and cross-layer logic.
- More architectural foresight and front-end planning discipline.

## Technical Challenges & Breakthroughs
- The biggest shift was restructuring how users could set specific stats for each sport for their tracked teams. I initially had this logic in the **SportsStats** concept, but I realized I could simplify that concept to just maintain sports statistics for teams and leagues. I realized that the idea of configuring which stats to track *per user* fit more naturally into **ItemTracking**. This was exciting as I began to see how concepts could be reused for multiple purposes (ItemTracking for sports and stats) to create a more flexible app.
- Learned to design and trigger syncs properly, connecting authentication events with background updates. This was a good exercise in event-driven design and thinking through the user journey.

## Tools, Context, and Workflow
- The Context tool was difficult to use at first; the flow between actions, queries, and syncs felt opaque. I eventually saw its value in keeping data flow explicit, though I’d still prefer coding directly or using an agentic assistant (especially for the front end).
- Used Copilot agent effectively for the first time. It accelerated routine coding but required careful debugging since it occasionally missed somewhat obvious logic errors. It was especially helpful for Vue and front-end development, where I had little prior experience.
- Learned the importance of*working incrementally and adapting quickly; even small changes sometimes required large code updates, especially on the front end.

## Development Skills & Mindset
- Strengthened my understanding of modularity and the importance of clear, consistent abstractions between concepts.
- Improved at reading stack traces and identifying which part of the system caused an error.
- Recognized that building reliable systems requires balancing automation (through LLMs) with deliberate design decisions.
- Learned a lot about front-end structure and interaction, especially how clear concepts help drive which features to build and how best to integrate them.

## Reflections on LLMs in Software Development
- LLMs are powerful for idea generation, learning, and scaffolding, but they can slow work when they pursue the wrong path.
- Their best role is as collaborative tools; humans still need to guide architecture, correctness, and debugging.
- I now view AI assistance as the next abstraction layer in software engineering, similar to how Python once made programming more expressive.
