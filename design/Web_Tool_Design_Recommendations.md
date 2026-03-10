# CaRM Cannabis Myths Web Tool: Design & Implementation Recommendations

## Executive Summary

This document provides comprehensive recommendations for transforming the CaRM (Cannabis Consumption - Risks and Myths) research findings into an interactive, evidence-based web tool. The research contains **39 scientifically classified cannabis myths**, data from **2,777 participants**, and detailed insights for **5 target groups** (Adults 18-70, Minors 16-17, Consumers, Young Adults 18-26, Parents).

### Key Data Assets

-   39 myths classified on 4-point scale (correct, rather correct, rather incorrect, incorrect)
-   5 distinct target groups with different knowledge levels and prevention needs
-   Multi-dimensional metrics: knowledge, significance, correctness, prevention significance, risk significance
-   Comprehensive survey data with sociodemographic breakdowns
-   Evidence-based prevention pathway recommendations

------------------------------------------------------------------------

## Part 1: Data Visualization Best Practices & Principles

### Core Principles for Health Communication Data Viz

#### 1. **Progressive Disclosure** (Edward Tufte Principle)

-   Start simple, allow users to dive deeper
-   Don't overwhelm with all 39 myths at once
-   Layer complexity based on user interest and expertise

**Implementation:** - Homepage: Show 3-5 "most important" myths based on user's profile - Middle layer: Category view (Physical, Psychological, Social, Legal) - Deep layer: Full myth explorer with all data and cross-tabs

#### 2. **User-Centered Pathways** (Nielsen Norman Group)

Different audiences need different entry points:

**General Public:** "What should I know?" → Quiz → Personalized results **Parents:** "How do I talk to my teen?" → Age-specific guidance → Conversation starters **Specialists:** "Show me the data" → Full dataset explorer → Downloadable reports

#### 3. **Data-to-Action Bridge** (Perceptual Edge - Stephen Few)

Every visualization must answer: "So what? Now what?"

**For each myth:** - What it means (interpretation) - Why it matters (significance) - What to do (action)

------------------------------------------------------------------------

## Part 2: Interactive Elements & Features

### 2.1 Myth Knowledge Quiz (Gamification)

#### Concept: "Test Your Cannabis IQ"

**Design Pattern:** BuzzFeed-style quiz meets educational assessment

**Mechanics:** 1. **Personalization Entry** (3 questions) - Age group selection - Role selection (parent, consumer, educator, general) - Knowledge level (curious, informed, expert)

2.  **Adaptive Quiz Flow** (10-15 questions)
    -   Present myths as statements
    -   User selects: Correct / Rather Correct / Rather Incorrect / Incorrect
    -   Immediate feedback with scientific classification
    -   Explanation cards that unfold
3.  **Personalized Results Dashboard**
    -   "Your Cannabis Knowledge Score: 72/100"
    -   Myth categories: Strengths vs. Knowledge Gaps
    -   Comparison to your demographic group
    -   "3 Things You Should Know" tailored to your profile
    -   Share results (anonymized) option

**Award-Winning Example:** - **BBC's "Climate Change Quiz"** - https://www.bbc.com/news/science-environment-46384067 - Clean design, immediate feedback - Data visualization of results - Built with: React, D3.js, responsive design

**Technical Implementation:**

``` javascript
// Tech Stack Recommendation
- Framework: React or Vue.js
- Quiz Logic: State management (Redux/Pinia)
- Animations: Framer Motion or GSAP
- Data viz: Chart.js or Recharts for results
- Backend: Node.js API for result tracking (optional)
```

**Gamification Elements:** - Progress bar with milestones - Achievement badges ("Myth Buster", "Evidence Explorer") - Encouraging micro-copy ("Great! You're more informed than 68% of users") - Visual feedback (checkmarks, animated corrections)

------------------------------------------------------------------------

### 2.2 Interactive Treemap: "The Myth Landscape"

#### Concept: Hierarchical Myth Explorer

**Purpose:** Show the relative importance of myths across dimensions

**Treemap Structure:**

```         
Root
├── Physical Health (10 myths)
│   ├── Cardiovascular (size by prevention significance)
│   ├── Respiratory
│   └── Fetal health
├── Psychological Health (11 myths)
│   ├── Mood disorders (Depression, Anxiety)
│   ├── Cognitive effects
│   └── Psychosis
├── Social Impact (5 myths)
├── Legal/Substance (5 myths)
└── Cross-cutting (4 myths)
```

**Interaction Design:** - **Size encoding:** Prevention significance (larger = more important to address) - **Color encoding:** - Green: Correctly classified myths - Red: Incorrectly classified myths - Yellow: "Rather correct/incorrect" - Gray: No scientific consensus - **Hover states:** Show myth text + classification + % who know it - **Click action:** Open detailed myth card with full data

**Filter Controls:** - By target group (toggle: Adults/Minors/Parents/Consumers/Young Adults) - By metric (Prevention significance / Population risk / Knowledge gaps) - By classification (Correct / Incorrect / Mixed evidence)

**Award-Winning Example:** - **The Pudding's "Film Dialogue Treemap"** - https://pudding.cool/2017/03/film-dialogue/ - Beautiful hierarchical visualization - Smooth animations and transitions - Built with: D3.js v4, scrollytelling

**Technical Implementation:**

``` javascript
// Recommended Stack
- D3.js v7 treemap layout
- Observable Plot (modern D3 alternative)
- Transitions: d3-transition
- Tooltip library: Popper.js
- Responsive: SVG viewBox scaling
```

**Code Example (D3.js):**

``` javascript
const treemap = d3.treemap()
  .size([width, height])
  .padding(2)
  .round(true);

const root = d3.hierarchy(mythData)
  .sum(d => d.preventionSignificance)
  .sort((a, b) => b.value - a.value);

treemap(root);

svg.selectAll("rect")
  .data(root.leaves())
  .join("rect")
    .attr("fill", d => colorScale(d.data.classification))
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .on("click", openMythDetail);
```

------------------------------------------------------------------------

### 2.3 Myth Comparison Tool

#### ! Concept: "People vs. Science"

**Visualization:** Diverging bar chart

```         
Cannabis relieves pain
├─ What people think: 70% believe it's correct ████████████████
└─ Scientific reality: Rather incorrect        ████
   Gap: 66 percentage points
```

**Features:** - Side-by-side comparison for each myth - Sort by: Largest gaps, Most known, Highest risk - Filter by target group to see demographic differences - "Why the gap exists" educational callouts

**Example:** - **Pew Research Center's "Quiz" Results** - https://www.pewresearch.org/ - Clean comparison charts - Educational annotations - Built with: Highcharts/custom D3

------------------------------------------------------------------------

### 2.4 "Your Risk Profile" Personalized Dashboard

#### Concept: Netflix-style recommendations for health info

**User Flow:** 1. Quick questionnaire (age, parent status, consumption patterns) 2. Generate personalized dashboard 3. Show "Top 5 Myths You Should Know About" 4. Recommended reading based on knowledge gaps 5. "Share with your teen" conversation starters (for parents)

**Design Pattern:** Card-based layout with progressive disclosure

**Technical:** - Logic engine for recommendation algorithm - localStorage for user preferences (privacy-first) - Optional: Account creation for saved progress

------------------------------------------------------------------------

### 2.5 Scrollytelling: "The Journey of a Cannabis Myth"

#### Concept: Narrative-driven data story

**Story Arc:** 1. How myths form (social media, word of mouth) 2. What people believe (survey data visualized) 3. What science says (research evidence) 4. The consequences of misinformation 5. How to spot and correct myths

**Scrolling Reveals:** - Animated charts that build as you scroll - Key statistics highlighted - Myth "life cycle" visualization - Call-to-action: Take the quiz

**Award-Winning Examples:**

1.  **The Pudding's Scrollytelling Stories** - https://pudding.cool/
    -   "The Diversity of Spotify Playlists"
    -   "Why Are K-Pop Groups So Big?"
    -   Built with: Scrollama.js, D3.js, GSAP
2.  **NYT's "How the Virus Won"** - https://www.nytimes.com/interactive/2020/us/coronavirus-spread.html
    -   Masterclass in scrollytelling
    -   Built with: Custom React, D3.js
3.  **The Upshot's "You Draw It"** - https://www.nytimes.com/interactive/2017/01/15/us/politics/you-draw-obama-legacy.html
    -   Interactive prediction before revealing data
    -   Built with: D3.js

**Technical Stack:**

``` javascript
- Scrollama.js (intersection observer-based scrollytelling)
- GSAP ScrollTrigger (animation on scroll)
- D3.js for data viz
- React/Vue for component structure
```

------------------------------------------------------------------------

## Part 3: Three Website Structure Proposals

### Option A: "Public Health Portal" (Multi-Audience Hub)

**Target:** All audiences with smart routing

**Homepage:**

```         
Hero: "Cannabis Myths: What's Real, What's Not?"

┌─────────────────────────────────────────┐
│  I am a:                                 │
│  [Parent] [Young Adult] [Educator]      │
│  [Health Pro] [Just Curious]            │
└─────────────────────────────────────────┘

Below:
- Featured myth of the week
- Quick quiz CTA
- Latest research updates
```

**Navigation Structure:**

```         
├── Explore Myths
│   ├── By Category (Health/Social/Legal)
│   ├── By Classification (True/False)
│   └── Interactive Treemap
├── Test Your Knowledge
│   └── Adaptive Quiz
├── For Parents
│   ├── Talk to Your Teen Guide
│   ├── Age-Appropriate Facts
│   └── Conversation Starters
├── For Educators
│   ├── Classroom Resources
│   └── Presentation Downloads
├── The Research
│   ├── Full Report
│   ├── Methodology
│   └── Data Explorer (for specialists)
└── About
```

**Pros:** - Serves all audiences - Clear pathways - Scalable for future content

**Cons:** - Risk of feeling "corporate" - May dilute focus

**Best For:** Government health agencies, academic institutions

**Award-Winning Example:** - **Our World in Data** - https://ourworldindata.org/ - Multi-audience, data-rich - Interactive charts throughout - Built with: WordPress + Custom React components + D3.js

------------------------------------------------------------------------

### Option B: "Myth-Busting Experience" (Engagement-First)

**Target:** General public, youth, parents

**Homepage:**

```         
Full-screen immersive:

"Think you know cannabis?
 Most people get 7 out of 10 myths wrong.

 [Start the Challenge]"

Scroll down → Scrollytelling intro
→ Quiz
→ Personalized results with myth explorer
```

**Navigation:**

```         
├── The Challenge (Quiz)
├── Myth Explorer
│   ├── Sort by Most Believed
│   ├── Sort by Most Dangerous
│   └── Interactive Treemap
├── Your Results (personalized)
├── Learn More
│   ├── For Parents
│   ├── For Teens
│   └── The Science
└── Share
```

**Design Language:** - Bold, modern, youth-friendly - Bright colors, animations - Mobile-first - Social sharing built-in

**Pros:** - High engagement - Viral potential - Memorable experience

**Cons:** - May seem less authoritative - Specialist users might skip

**Best For:** Public awareness campaigns, NGOs, youth outreach

**Award-Winning Examples:**

1.  **BBC's "How Addictive is Your Smartphone?"** - https://www.bbc.com/news/technology-44640959
    -   Quiz-first approach
    -   Beautiful data viz of results
    -   Built with: Custom BBC framework + D3.js
2.  **The Marshall Project's "The Language of Prison"** - https://www.themarshallproject.org/2018/08/14/the-language-of-prison-glossary
    -   Engaging, interactive storytelling
    -   Built with: React + Mapbox

------------------------------------------------------------------------

### Option C: "Evidence-Based Dashboard" (Data-First for Professionals)

**Target:** Researchers, policymakers, health professionals

**Homepage:**

```         
Clean, academic:

"CaRM Study: Evidence-Based Cannabis Myth Assessment
Research Data Portal"

┌─────────────────────────────────────────┐
│  Quick Stats:                           │
│  • 39 myths analyzed                    │
│  • 2,777 participants                   │
│  • 5 target groups                      │
│  • Published: 2025                      │
└─────────────────────────────────────────┘

Main Dashboard:
- Data Explorer (filterable tables)
- Visualizations (downloadable)
- Research Tools
```

**Navigation:**

```         
├── Dashboard
│   ├── Overview
│   ├── Target Group Comparisons
│   └── Myth Classifications
├── Data Explorer
│   ├── Full Dataset (interactive table)
│   ├── Custom Queries
│   └── Export Options (CSV/JSON)
├── Visualizations
│   ├── Treemap
│   ├── Heatmaps
│   ├── Comparison Charts
│   └── Download SVG/PNG
├── Methodology
├── Publications
└── API Access
```

**Features:** - Advanced filtering and sorting - Download datasets - Embed widgets for external sites - API for programmatic access

**Pros:** - Credible, authoritative - Powerful for researchers - Reusable data

**Cons:** - Less accessible to general public - Lower engagement metrics

**Best For:** Academic institutions, research portals

**Award-Winning Examples:**

1.  **COVID-19 Dashboard by Johns Hopkins** - https://coronavirus.jhu.edu/map.html
    -   Data-first approach
    -   Professional, trusted
    -   Built with: ArcGIS + custom JavaScript
2.  **Gapminder** - https://www.gapminder.org/tools/
    -   Interactive data exploration
    -   Built with: Custom JavaScript framework + D3.js
3.  **ProPublica's Data Store** - https://www.propublica.org/datastore/
    -   Downloadable datasets
    -   Clean, professional
    -   Built with: Django + JavaScript

------------------------------------------------------------------------

## Part 4: Recommended Hybrid Approach

### **Best Solution: Layered Experience**

Combine elements from all three options:

**Layer 1: Engagement (Public Entrance)** - Quiz-first homepage - Scrollytelling introduction - Mobile-optimized

**Layer 2: Education (Myth Explorer)** - Interactive treemap - Comparison tools - Target group filters

**Layer 3: Data (Professional Tools)** - Full data dashboard - Export capabilities - Academic resources

**Progressive Enhancement:** - Casual users: Stay in Layer 1-2 - Engaged users: Explore Layer 2 deeply - Professionals: Access Layer 3

------------------------------------------------------------------------

## Part 5: Technical Stack Recommendations

### Front-End Framework

**Recommended: Next.js (React)**

**Why:** - Server-side rendering (SEO-critical for public health info) - Fast performance - Great developer experience - Static site generation option - Large ecosystem

**Alternative: Nuxt.js (Vue)** - If team prefers Vue

### Data Visualization Libraries

**Primary: D3.js v7** - Industry standard - Maximum flexibility - Huge community - Examples: https://observablehq.com/@d3/gallery

**Modern Alternative: Observable Plot** - Simpler API than D3 - Built by D3 creator (Mike Bostock) - Perfect for common chart types - Examples: https://observablehq.com/plot/

**For Quick Charts: Chart.js or Recharts** - Easier learning curve - Good for standard charts - Recharts integrates well with React

### Specialized Libraries

**Scrollytelling:**

``` javascript
- Scrollama.js - https://github.com/russellgoldenberg/scrollama
  - Lightweight, dependency-free
  - Intersection Observer API
  - Works with any framework

- GSAP ScrollTrigger - https://greensock.com/scrolltrigger/
  - Advanced animations
  - Commercial license required for some uses
```

**Treemap Specific:**

``` javascript
// D3.js treemap
import { treemap, hierarchy } from 'd3-hierarchy';
import { scaleOrdinal } from 'd3-scale';

// Or use Observable Plot
import * as Plot from "@observablehq/plot";
```

**Quiz/Assessment:**

``` javascript
- Custom state management (recommended)
- Or: Survey.js - https://surveyjs.io/
  - Pre-built quiz components
  - JSON-based configuration
  - Can be styled to match brand
```

### Backend & Data

**Static Site Option (Recommended for v1):** - Pre-process all data into JSON - Host on Netlify/Vercel (free tier) - No server costs - Fast, secure

**Dynamic Option (If needed):** - Node.js + Express API - PostgreSQL for data storage - User accounts, result saving - Analytics tracking

### Hosting & Deployment

**Recommended: Vercel or Netlify** - Automatic deployments from Git - Global CDN - Free tier available - SSL included

------------------------------------------------------------------------

## Part 6: Award-Winning Examples Deep Dive

### 1. **The Pudding** - https://pudding.cool/

**Why It's Excellent:** - Engaging storytelling with data - Innovative visualizations - Mobile-first responsive design - High shareability

**Key Techniques:** - Scrollytelling - Interactive predictions ("You Draw It" style) - Playful but informative tone

**Cannabis Tool Application:** "The Myth Journey" - scrolling story of how a cannabis myth spreads, gets believed, and can be corrected

**Tech Stack:** - D3.js - Scrollama.js - Custom HTML/CSS/JS - Hosted on GitHub Pages

------------------------------------------------------------------------

### 2. **ProPublica's "Dollars for Docs"** - https://projects.propublica.org/docdollars/

**Why It's Excellent:** - Searchable database - Clear data visualization - Public interest journalism - Accessible to non-experts

**Key Features:** - Search functionality - Sortable, filterable tables - Individual record pages - Download options

**Cannabis Tool Application:** "Myth Database Explorer" - searchable, sortable table of all 39 myths with full data

**Tech Stack:** - Ruby on Rails backend - PostgreSQL database - D3.js for charts - Responsive tables

------------------------------------------------------------------------

### 3. **Our World in Data** - https://ourworldindata.org/

**Why It's Excellent:** - Authoritative, research-based - Interactive charts on every topic - Educational content - Downloadable data

**Key Features:** - Dual audience (public + researchers) - Every chart is interactive - Clear explanations - Open data philosophy

**Cannabis Tool Application:** Full model - charts, explanations, research, downloads

**Tech Stack:** - WordPress (CMS) - Custom React components - D3.js charts - MySQL database

------------------------------------------------------------------------

### 4. **FiveThirtyEight's Interactive Projects** - https://projects.fivethirtyeight.com/

**Why It's Excellent:** - Data journalism gold standard - Predictive models - Clear uncertainty communication - Beautiful design

**Example: "How Popular Is Donald Trump?"** - Live updating data - Historical comparisons - Uncertainty bars - Mobile-optimized

**Cannabis Tool Application:** "Myth Belief Tracker" - showing how belief in myths changes over time (if collecting longitudinal data)

**Tech Stack:** - React - D3.js - Python data processing - AWS hosting

------------------------------------------------------------------------

### 5. **The New York Times - The Upshot** - https://www.nytimes.com/section/upshot

**Example: "You Draw It: What Got Better or Worse During Obama's Presidency"**

**Why It's Excellent:** - User prediction before revealing truth - Engaging interaction - Data-driven - Memorable

**Cannabis Tool Application:** "Guess the Myth" - users predict whether myths are true before seeing scientific classification

**Tech Stack:** - D3.js - Custom React - NYT graphics team framework

------------------------------------------------------------------------

### 6. **UK's NHS Website** - https://www.nhs.uk/

**Example: "Medicines A-Z"**

**Why It's Excellent:** - Trusted health information - Simple, accessible design - Multi-audience content - Mobile-first

**Key Features:** - Plain language - Clear action steps - Related content links - Accessibility compliant (WCAG 2.1 AA)

**Cannabis Tool Application:** Structure and tone for myth fact sheets

**Tech Stack:** - Progressive web app - React components - Accessible design patterns - UK Government Digital Service standards

------------------------------------------------------------------------

## Part 7: Design System Recommendations

### Visual Identity

**Color Palette (Evidence-Based Design):**

```         
Primary Colors:
- Trust Blue: #0066CC (for scientific facts)
- Alert Red: #DC3545 (for "incorrect" myths)
- Neutral Gray: #6C757D (for "no consensus")
- Success Green: #28A745 (for correct understanding)
- Warning Yellow: #FFC107 (for "rather correct/incorrect")

Accent:
- Highlight: #FF6B6B (for interactive elements)

Background:
- White: #FFFFFF
- Light Gray: #F8F9FA
```

**Typography:**

```         
Headings: Inter or Roboto (clean, modern, readable)
Body: Open Sans or Source Sans Pro (highly legible)
Data: Roboto Mono (for numbers and tables)
```

**Accessibility:** - WCAG 2.1 AA compliance minimum - Color is not sole indicator of meaning - Screen reader friendly - Keyboard navigation - High contrast mode option

### Component Library

**Recommended: Build on Existing System**

**Option 1: Material UI (React)** - Comprehensive components - Accessible by default - Customizable - https://mui.com/

**Option 2: Headless UI + Tailwind CSS** - Maximum flexibility - Utility-first CSS - Modern approach - https://headlessui.com/

**Option 3: Ant Design** - Enterprise-grade - Data-heavy interfaces - Good for dashboards - https://ant.design/

------------------------------------------------------------------------

## Part 8: User Experience Flow Examples

### Flow 1: Casual Visitor (Mobile)

1.  **Land on homepage** → See engaging headline
2.  **Scroll down** → Brief scrollytelling intro (30 sec)
3.  **CTA: "Take the Quiz"** → Start quiz
4.  **5-7 question quiz** → With immediate feedback
5.  **Results page** → "You got 4/7 correct"
    -   Show which myths they got wrong
    -   Brief explanations
    -   "Learn more" links
6.  **Explore section** → Optional deeper dive
7.  **Share results** → Social media share

**Time Investment:** 2-5 minutes **Goal:** Awareness + 1-2 corrected myths

------------------------------------------------------------------------

### Flow 2: Parent Seeking Guidance (Desktop)

1.  **Land on homepage** → Select "I'm a Parent"
2.  **Parent Dashboard** → See teen-specific myths
3.  **Priority Myths** → "Top 5 Myths Your Teen Might Believe"
4.  **Myth Detail Page** → Click on "Cannabis helps with stress"
    -   Scientific classification: "Rather incorrect"
    -   Explanation with sources
    -   "How to talk about this" section
    -   Age-appropriate language suggestions
5.  **Download PDF** → Conversation guide
6.  **Join newsletter** → Get monthly updates

**Time Investment:** 10-15 minutes **Goal:** Equipped with facts + communication strategies

------------------------------------------------------------------------

### Flow 3: Researcher/Policymaker (Desktop)

1.  **Land on homepage** → Navigate to "Research" section
2.  **Dashboard view** → See all 39 myths in table
3.  **Filter & Sort** →
    -   By target group
    -   By prevention significance
    -   By knowledge gap
4.  **Data Visualization** → Switch to treemap view
5.  **Detailed Analysis** → Click myth → See full data
    -   Survey breakdowns
    -   Cross-tabs by demographics
    -   Statistical significance notes
6.  **Export Data** → Download CSV or API access
7.  **Cite Research** → Copy citation, download full report

**Time Investment:** 30-60 minutes **Goal:** Deep understanding + usable data

------------------------------------------------------------------------

## Part 9: Success Metrics & Analytics

### Key Performance Indicators (KPIs)

**Engagement Metrics:** - Quiz completion rate (target: \>60%) - Time on site (target: 3+ minutes average) - Pages per session (target: 4+) - Return visitor rate (target: 20%+)

**Educational Metrics:** - Quiz score improvement (pre/post knowledge) - "Aha moments" (myths where users changed understanding) - Resource downloads (PDFs, data) - Social shares of corrected myths

**Technical Metrics:** - Page load time (\<3 seconds) - Mobile vs. desktop usage - Browser compatibility - Accessibility violations (target: 0)

**Analytics Tools:** - Google Analytics 4 (or Plausible for privacy-focused) - Hotjar for heatmaps - Custom event tracking for quiz interactions

------------------------------------------------------------------------

## Part 10: Development Roadmap

### Phase 1: MVP (8-12 weeks)

**Core Features:** - Responsive homepage with quiz CTA - 10-question adaptive quiz - Results page with personalized insights - Myth explorer (list/grid view) - 5 detailed myth pages (templates for rest) - Basic analytics

**Tech Stack:** - Next.js + React - Chart.js for simple charts - Tailwind CSS for styling - Static site (JSON data files) - Netlify hosting

**Budget Estimate:** \$25k-\$40k (2-3 developers)

------------------------------------------------------------------------

### Phase 2: Enhanced (4-6 weeks after MVP)

**Additional Features:** - Interactive treemap - Scrollytelling intro section - All 39 myth detail pages - Target group specific pathways - Downloadable resources - Newsletter signup

**Additional Libraries:** - D3.js for treemap - Scrollama.js for scrollytelling - EmailOctopus or Mailchimp API

**Budget Estimate:** +\$15k-\$25k

------------------------------------------------------------------------

### Phase 3: Advanced (6-8 weeks after Phase 2)

**Power Features:** - User accounts (save progress) - Data dashboard for researchers - API access for external use - Advanced filters and comparisons - Multi-language support (if needed) - Educator resources section

**Infrastructure:** - Backend API (Node.js) - Database (PostgreSQL) - Authentication (Auth0 or Clerk) - AWS/GCP hosting

**Budget Estimate:** +\$30k-\$50k

------------------------------------------------------------------------

## Part 11: Content Strategy

### Myth Detail Page Template

Every myth should have:

**1. The Myth Statement** (large, clear) "Cannabis helps relieve depression"

**2. Scientific Classification** (visual badge) \[INCORRECT\] - Red badge

**3. What People Believe** (data viz) "63% of adults think this is correct" Bar chart showing belief by target group

**4. What Science Says** (evidence summary) - Plain language explanation - Key research findings - Nuance and caveats - Sources/citations

**5. Why This Matters** (impact) - For individuals - For public health - Prevention implications

**6. Learn More** - Related myths - External resources - Research papers

**7. Share This** - Social media buttons - "Did you know?" shareable graphics

------------------------------------------------------------------------

### Content Tone & Voice

**Principles:** - **Authoritative but not condescending** - ✅ "Research shows..." - ❌ "Obviously, this is wrong..."

-   **Nuanced, not absolute**
    -   ✅ "Current evidence suggests..."
    -   ❌ "This is definitely true..."
-   **Accessible but accurate**
    -   ✅ "Cannabis can increase heart rate"
    -   ❌ "Cannabis causes tachycardia" (too technical)
-   **Action-oriented**
    -   ✅ "If you're concerned, talk to your doctor"
    -   ❌ Just presenting facts without guidance

------------------------------------------------------------------------

## Part 12: Accessibility & Inclusion

### WCAG 2.1 AA Compliance

**Must-Haves:** - Alt text for all images and charts - Keyboard navigation for all interactions - ARIA labels for interactive elements - Sufficient color contrast (4.5:1 minimum) - Resizable text without loss of functionality - No flashing/seizure-inducing animations

**Testing Tools:** - axe DevTools - WAVE browser extension - Lighthouse accessibility audit - Manual screen reader testing (NVDA/JAWS)

### Multi-Language Considerations

**German First, Then:** - English (already done) - Turkish (if relevant for German population) - Arabic - Other languages based on target demographics

**Internationalization (i18n):** - Use i18next library - Separate content from code - Right-to-left (RTL) layout support - Number/date formatting by locale

------------------------------------------------------------------------

## Part 13: Maintenance & Updates

### Content Updates

-   **Quarterly:** Review for new research
-   **Annually:** Major content refresh
-   **As needed:** Add new myths as they emerge

### Technical Maintenance

-   **Monthly:** Dependency updates
-   **Quarterly:** Performance audits
-   **Annually:** Accessibility re-assessment

### Community Engagement

-   User feedback form
-   Myth suggestion system
-   Expert review panel

------------------------------------------------------------------------

## Part 14: Budget Summary

### Total Estimated Costs

**Development (One-Time):** - Phase 1 (MVP): \$25k-\$40k - Phase 2 (Enhanced): \$15k-\$25k - Phase 3 (Advanced): \$30k-\$50k - **Total:** \$70k-\$115k

**Ongoing (Annual):** - Hosting: \$0-\$500 (Netlify/Vercel) - Domain: \$50 - Analytics: \$0 (Google Analytics) - Maintenance: \$5k-\$10k - Content updates: \$3k-\$5k - **Total:** \$8k-\$16k/year

**Lean Alternative (MVP Only):** - Use open-source templates - No custom backend - Static site only - Student developers or volunteers - **Cost:** \$10k-\$20k

------------------------------------------------------------------------

## Part 15: Recommended Starting Point

### **"Myth Buster" Interactive Quiz + Explorer**

**Why Start Here:** 1. High engagement 2. Immediate value to all audiences 3. Validates interest before major investment 4. Iteratively improvable

**Minimum Viable Product:**

**Homepage:** - Hero: "Test Your Cannabis Knowledge" - 10-question quiz - Immediate results with explanations - "Explore All Myths" CTA

**Myth Explorer:** - Grid of 39 myths - Filter by category - Click for detail page

**Detail Pages:** - Myth statement - Classification badge - Brief explanation - Sources

**Tech Stack:** - Next.js (React framework) - Tailwind CSS (styling) - Chart.js (simple charts) - Static site (Netlify hosting)

**Timeline:** 6-8 weeks **Budget:** \$20k-\$30k **Team:** 1 developer + 1 designer

------------------------------------------------------------------------

## Conclusion & Next Steps

### Recommendation Matrix

| Audience Priority | Recommended Structure | Key Features | Tech Complexity | Budget |
|---------------|---------------|---------------|---------------|---------------|
| General Public | Option B: Myth-Busting | Quiz, Scrollytelling | Medium | $$-$$\$ |
| Multi-Audience | Option A: Public Portal | All features, layered | High | $$$-$$$$ |
| Researchers | Option C: Data Dashboard | Explorer, API | Medium-High | $$$-$$$$ |
| **Recommended** | **Hybrid Layered** | **Quiz + Explorer + Data** | **Medium-High** | **$$\$\$\*\* |

### Immediate Action Items

1.  **Stakeholder Alignment** (Week 1-2)
    -   Define primary audience
    -   Set goals and success metrics
    -   Approve budget range
2.  **Content Preparation** (Week 2-4)
    -   Extract myth data to JSON
    -   Write plain-language explanations
    -   Prepare fact sheets
3.  **Design Phase** (Week 4-8)
    -   Create wireframes
    -   Design system
    -   User testing (prototype)
4.  **Development** (Week 8-16)
    -   Build MVP
    -   User testing
    -   Iterate
5.  **Launch** (Week 16-18)
    -   Soft launch
    -   Gather feedback
    -   Full launch

------------------------------------------------------------------------

## Additional Resources

### Learning Resources

**Data Visualization:** - Book: "The Visual Display of Quantitative Information" - Edward Tufte - Book: "Information Dashboard Design" - Stephen Few - Course: "Data Visualization and D3.js" - Udacity - Blog: https://flowingdata.com/

**Health Communication:** - CDC Clear Communication Index - Health Literacy Online (HHS) - Plain Language Guidelines (plainlanguage.gov)

**Web Development:** - https://web.dev/ (Google's web best practices) - https://css-tricks.com/ - https://kentcdodds.com/ (React tutorials)

**D3.js Specific:** - https://observablehq.com/@d3/gallery (examples) - https://www.d3-graph-gallery.com/ (code snippets) - Book: "Interactive Data Visualization for the Web" - Scott Murray

### Example Repositories

**Scrollytelling:** - https://github.com/russellgoldenberg/scrollama - https://pudding.cool/process/responsive-scrollytelling/

**Quiz/Survey:** - https://github.com/surveyjs/survey-library

**Treemap:** - https://observablehq.com/@d3/treemap - https://github.com/vasturiano/treemap-chart

**Data Dashboard:** - https://github.com/apache/superset (full BI platform) - https://github.com/cube-js/cube.js (analytics framework)

------------------------------------------------------------------------

## Final Thoughts

The CaRM research represents valuable, evidence-based insights that deserve an equally thoughtful digital presentation. The key is to:

1.  **Start with user needs** - Quiz for engagement, education for depth
2.  **Layer complexity** - Simple entry, deep exploration available
3.  **Build iteratively** - MVP first, enhance based on actual usage
4.  **Prioritize accessibility** - Health information must be inclusive
5.  **Make it shareable** - Correct misinformation by spreading truth

The combination of engaging storytelling (quiz, scrollytelling), powerful exploration (treemap, filters), and authoritative data (full reports, exports) will serve all audiences while maintaining scientific rigor.

**The impact**: Thousands of people correcting their misconceptions, armed with evidence to make informed decisions and educate others.

------------------------------------------------------------------------

*Document prepared for the CaRM Cannabis Myths Web Tool project* *Version 1.0 - January 2026*