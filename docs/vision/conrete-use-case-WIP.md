## A Concrete Example: Developing a YouTube Script

Watch how you orchestrate your own thinking process:

You start with a vague idea: "YouTube video about productivity apps"

You know this is too broad, so you open your pattern library and select **"Underserved Niche Discovery"**—a workflow you built last month. It automatically spawns three parallel investigations:
- **Research** tab: Current landscape analysis
- **Gaps** tab: What's missing in existing content  
- **Audiences** tab: Who's being ignored

Results stream in. The Research tab shows 850+ recent videos—clearly oversaturated. But the Gaps tab surfaces interesting complaints about "app fatigue" and "productivity theater."

You select these insights and pin them to your workspace context as `@pain-points`. Now any flow can reference these findings.

In the Audiences tab, the AI presents several underserved groups. One catches your eye: "ADHD professionals struggling with neurotypical productivity advice." You copy this from `$audiences#3`.

You open your **"Deep Dive"** pattern. It shows three required parameters:
- **topic**: What to research
- **sources**: Where to look  
- **extraction_focus**: What specific information to extract

You map your inputs:
- **topic**: You paste the ADHD professionals text from `$audiences#3`
- **sources**: You select "Reddit, YouTube, Forums" from the dropdown
- **extraction_focus**: You type "specific frustrations with existing productivity tools"

The visual flow starts running:
- **Input node** receives your parameters
- **Splitter node** creates three parallel branches based on your sources
- You watch as the Reddit branch lights up green—data is flowing through
- Numbers appear on connections: "12 threads found" → "47 relevant comments extracted"
- The YouTube branch shows it's still processing with a pulsing animation

You click on the Reddit search node to see inside:
- Prompt being sent: "Search Reddit for discussions about [topic]. Extract [extraction_focus]"
- Actual prompt with your values: "Search Reddit for discussions about ADHD professionals struggling with neurotypical productivity advice. Extract specific frustrations with existing productivity tools"

All branches complete and converge in the **Synthesis node**. The output is a structured list of pain points. You save this to your context as `@audience-pain-points`.

Next, you open **"Content Angle Generator"**. This flow requires:
- **audience_insights**: Main audience understanding
- **market_gap**: What's missing in current content

You wire up:
- **audience_insights**: You drag `@audience-pain-points` from your context
- **market_gap**: You connect `$gaps#2` (the "productivity theater" finding)

The flow generates several angles. One stands out: "Why Every Productivity App Failed Me Until I Understood My ADHD"

Now you run your **"Hook Crafter"** flow. You open it to see what's happening inside:

The flow expects two inputs:
- Video angle (required)
- Supporting context (optional)

You wire in:
- The selected angle text
- `@adhd-struggles` from your context

Inside the flow, you see:
- **Template node** loads your saved hook framework
- **Prompt builder node** combines: "Using this angle: [your angle] and these pain points: [adhd-struggles], create 3 hooks following this framework: [template]"
- **AI node** processes the prompt
- Output shows three hooks—but the first is generic: "Productivity apps don't work for ADHD"

You inspect the prompt builder node and see the issue—it's not actually using the pain points in the prompt, just listing them. You edit the node's template to say: "...create 3 hooks that directly address one of these specific frustrations: [adhd-struggles]"

You run it again. Much better: "I hyperfocused on productivity apps for 6 months. Here's why they're designed to fail ADHD brains."

Next, you run **"Thumbnail Generator"** flow. It has parameters:
- **main_text**: Text overlay for thumbnail
- **style_guide**: Visual branding rules
- **emotion_targets**: What feelings to evoke

You map:
- **main_text**: You paste your refined hook
- **style_guide**: You drag in `@channel-style` from your saved contexts
- **emotion_targets**: You type "frustrated but hopeful, overwhelmed seeking clarity"

The flow generates thumbnail concepts following your parameters. You pick the one showing a brain made of tangled app icons—it perfectly captures the ADHD overwhelm while maintaining your brand's neon accent style.

Finally, **"Script Synthesizer"** weaves everything together, pulling from all your pinned contexts and selected options.

The entire process took 12 minutes. But you also improved your flows—the Hook Crafter now knows to check for specific pain points, and you've created a new branch in Thumbnail Generator for ADHD-related visuals.

You save this entire workspace as **"Neurodivergent Content Creation"**—a new pattern that includes all your discoveries and refinements.
