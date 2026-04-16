# Jasper.AI

Jasper.AI is an AI-powered technical interview preparation platform built to make interview prep more structured, personalized, and useful.

Instead of forcing every candidate through the same generic question lists, Jasper.AI creates a custom interview prep roadmap based on your target role, company, available time, and current confidence level across key concepts. It also includes voice-based mock interviews that simulate real practice and return structured, actionable feedback.

## Why Jasper.AI?

Interview prep is usually messy.

Most candidates jump between LeetCode, blogs, Reddit threads, Glassdoor experiences, and random notes with no clear plan. On top of that, most prep tools treat everyone the same, even though preparation should depend on:

- target role
- target company
- current strengths and weaknesses
- available timeline
- readiness level

Jasper.AI was built to solve that problem.

The idea was simple: interview prep should adapt to the candidate the same way a good trainer adapts to someone's goals, starting point, and time constraints.

## What it does

Jasper.AI helps users prepare for technical interviews in two major ways:

### 1. Personalized roadmap generation

For a given company and role, the platform:

- identifies the most relevant interview concepts
- ranks them by importance and expected interview frequency
- combines that with the user's confidence scores
- generates a day-by-day study roadmap based on the user's timeline

This means users spend more time on high-impact weak areas and less time reviewing things they already know well.

### 2. Role-specific mock interviews

Jasper.AI also includes a voice-driven mock interview system that:

- generates questions tailored to the selected role and company
- asks questions out loud using text-to-speech
- listens to spoken answers using browser speech recognition
- scores responses with structured rubrics
- returns concept-level feedback and improvement suggestions

This closes the loop between planning and evaluation. Users do not just study. They actively test whether they are actually improving.

## Core features

### Role-based concept prioritization
The system identifies the most important concepts for a specific role, such as Software Engineer or ML Engineer, and ranks them by relevance and interview weight.

### Confidence mapping
Users rate how confident they feel in each concept area. This helps the platform distinguish between:

- high-priority weak areas
- lower-priority weak areas
- strong areas that need less attention

### Timeline-aware planning
The roadmap generator uses concept importance, confidence levels, available days, and hours per day to produce a prep plan that is realistic and time-aware.

### Voice mock interviews
Users can practice with AI-generated interview questions in a more natural format by speaking their answers aloud.

### Structured feedback
After the mock interview, Jasper.AI returns scoring and specific feedback instead of vague comments, making the next steps much clearer.

## How it works

## System architecture

Jasper.AI is split into two main parts:

- **Frontend:** React + TypeScript app deployed on Vercel
- **Backend:** FastAPI service deployed on Render

It also uses:

- **Firebase Authentication** for Google sign-in
- **Firestore** for storing users, roadmaps, and progress
- **Google Gemini** for concept prioritization, roadmap generation, and interview evaluation
- **ElevenLabs** for text-to-speech in mock interviews
- **Web Speech API** for spoken answer capture in the browser

## Roadmap generation flow

1. The user enters:
   - target role
   - target company
   - optional job posting link
   - prep timeline
   - daily study hours

2. The backend uses Gemini with live web search tools to research real interview experiences and discussions from sources like:
   - Reddit
   - Glassdoor
   - LeetCode discussions

3. The system identifies the most important DSA and core fundamentals topics for that company and role.

4. The user rates their confidence for each concept.

5. The backend combines:
   - concept importance
   - confidence score
   - available timeline

6. A roadmap is generated with:
   - prioritized focus areas
   - daily study tasks
   - verified learning resources
   - LeetCode problem links where relevant

## Mock interview flow

1. The user starts a mock interview session.
2. Gemini generates role-specific interview questions.
3. ElevenLabs reads the questions aloud.
4. The user answers verbally.
5. The browser captures speech using the Web Speech API.
6. Gemini evaluates the final transcript using a structured rubric.
7. The UI displays:
   - overall score
   - per-question breakdown
   - suggested ideal responses
   - actionable improvement areas

## Tech stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Router
- Three.js
- @react-three/fiber

### Backend
- FastAPI
- Python
- Firebase Admin SDK
- python-dotenv

### AI / ML / APIs
- Google Gemini
- Google Search + URL grounding tools
- ElevenLabs TTS
- Web Speech API

### Auth / Database / Infra
- Firebase Authentication
- Google Cloud Firestore
- Vercel
- Render

## Challenges

### Balancing priority vs confidence
A topic with low confidence is not always the most urgent one. We had to carefully combine concept importance with skill gap size to compute a useful focus score.

### Making feedback actually helpful
Generic AI feedback is not useful in interview prep. We designed structured rubrics so the feedback would be more specific, measurable, and actionable.

### URL hallucination
When generating study resources, the model sometimes produced invalid links. We reduced this by validating links through live search and grounding recommendations in verified sources.

### Feedback latency
Detailed rubric-based evaluation improved quality, but it also increased response time. We had to optimize the evaluation flow to keep the system responsive.

## What we learned

- Priority matters more than volume in interview prep
- Personalized planning is more effective than generic question lists
- Mock interviews become much more valuable when feedback is structured
- Time constraints should shape the roadmap, not just shorten it
- Simpler scoring systems are easier for users to trust and act on

## Accomplishments

- Built a priority-weighted roadmap engine
- Designed a scalable concept-ranking workflow
- Implemented role-specific mock interviews
- Created structured feedback with measurable suggestions
- Connected study planning with active readiness evaluation

## What's next

We plan to improve Jasper.AI with:

- dynamic roadmap updates based on mock interview performance
- real-time roadmap adjustment as users improve
- advanced analytics such as readiness score and confidence growth
- better long-term tracking of performance over time