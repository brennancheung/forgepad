# Introducing the Domain-Specific Intermediary Language (DSIL)

## Overview

Effective communication between developers and AI tooling throughout the software development lifecycle (SDLC) is critical but often challenging. Natural language descriptions can be ambiguous, while code is too detailed and implementation-specific. Our Domain-Specific Intermediary Language bridges this gap, offering concise, clear, and intuitive documentation of intent specifically tailored to facilitate communication between developers and AI models (LLMs).

## The Problem

In software development projects, accurately capturing and clearly communicating functional intent between developers and AI tooling can be problematic. Traditional natural language specifications often lack precision and lead to misunderstandings, while direct code-level specifications are too detailed, inflexible, and cumbersome to quickly iterate upon. As a result, misalignment occurs, leading to inefficiencies, delays, and increased development costs. The Domain-Specific Intermediary Language addresses these challenges by providing a concise, clear, and flexible medium designed specifically for effective communication and iterative refinement between developers and AI tools throughout the SDLC.

## Goals of the Domain-Specific Intermediary Language

This language is:

- **Readable**: Easy-to-understand syntax inspired by YAML.
- **Concise**: Fewer tokens, faster inference.
- **Flexible**: Allows intuitive edits and notes without rigid grammar.
- **Descriptive**: Captures domain-specific appearance, intent, and basic functionality without delving into technical implementation details.
- **Context-Rich**: Includes descriptive context for improved comprehension by developers and AI tools.
- **Efficient**: Facilitates quicker clarifications and edits compared to lengthy prompts
- **Alignment**: Ensures human and AI are aligned before proceeding to the more expensive code generation step.

## Why Use It?

- **Clearer Communication**: Reduces misunderstandings between developers and AI.
- **Faster Iterations**: Enables rapid, precise feedback loops.
- **AI Integration**: Easily interpreted by AI for generating high-quality code.

## Syntax Example

```yaml
App:
  Pages:
    UserProfile:
      Description: >
        Allows users to view and update their personal details and preferences.

      Header:
        Title: "User Profile"
        Button: "Edit"

      Body:
        Sections:
          Basic Info:
            Fields:
              - Name (text)
              - Email (text)
              - Birthday (date picker)

          Preferences:
            Controls:
              - Receive promotional emails (toggle)
              - Language (dropdown: ["English", "Spanish"])

      Notes:
        - Edit mode enables fields and displays a save button.
```

## Integrating with AI

Pairing this intermediary language with LLM-driven tooling dramatically improves developer productivity. It provides AI tools with clear, structured inputs, allowing automated generation of accurate and consistent React components based on concise domain-specific specifications.

## What the DSIL is not

- It is not an executable, parseable or formal specification
- It is not a context-free grammar
- It is not defined for each domain (no schema per domain)

## Refining Specifications

Refining specifications at this intermediary language level offers a significant advantage over both natural language and full-code refinements. Natural language descriptions tend to be ambiguous, leaving room for misinterpretation and confusion. At the other extreme, refining directly in code involves considerable technical overhead and complexity, significantly slowing iteration cycles.

Using the Domain-Specific Intermediary Language strikes an ideal balance. It provides clarity without the technical burden, making iterative refinement quick, intuitive, and accessible. Developers and LLMs can swiftly modify specifications, clearly communicate nuanced details, and maintain flexibility. This agile process helps ensure that the final implementation accurately reflects intended functionality and user experience, significantly improving overall project outcomes.

## How to Use

To effectively utilize the Domain-Specific Intermediary Language:

1. **Initial Creation**: Begin by clearly describing your idea using the provided structured template. Provide high-level context to inform the AI of your intent.

2. **Iterative Refinement**:

   - **Human edits**: Quickly adjust and clarify details directly in the intermediary specification. For example, if the AI initially generates a profile page with incorrect input fields, you can directly edit the specification to clarify or correct fields to reflect your intended design.
   - **LLM-driven refinements**: Alternatively, use prompts to ask the AI to refine the specification based on your feedback. For instance, if the initial specification is missing notification settings, prompt the AI explicitly (e.g., "Include toggle options for email and SMS notifications") to revise the spec accordingly.

Through rapid back-and-forth edits, both manual and AI-assisted, your specification evolves efficiently and accurately, capturing your exact intent clearly and concisely.

3. **Finalization and Code Generation**: Once satisfied, leverage the refined intermediary language as a definitive guide for AI-driven code generation, ensuring alignment between your specification and the resulting implementation.

Simplify your development lifecycle and enhance developer-AI communication today with the Domain-Specific Intermediary Language.

## Prompt Example

Use the following XML-based prompt template to instruct the LLM to generate concise YAML-like domain-specific specifications as described:

```xml
<uxSpecRequest>
  <instructions>
    Use this prompt template to instruct the LLM clearly. The goal is to generate concise,
    structured YAML-like specifications from natural language.  Clearly specify appearance,
    intent, and high-level functionality.  Provide detailed examples and relevant context.
    This helps the LLM accurately capture your intent,
    ensuring precise communication between developers and AI.
</instructions>

  <description>
    Clearly and concisely describe the functionality, intent, and user
    experience of the UI you have in mind.
  </description>

  <examples>
    <example>
      <input>
        A user profile page with basic user info (name, email, birthday) and
        preferences (email notifications, language selection). Editing info
        is initially disabled until the user clicks "Edit".
      </input>
      <output>
App:
  Pages:
    UserProfile:
      Description: >
        Users view and update personal information, including basic details
        and preferences. Editing is enabled by clicking "Edit".

      Header:
        Title: "User Profile"
        Button: "Edit"

      Body:
        Sections:
          Basic Info:
            Fields:
              - Name (text)
              - Email (text)
              - Birthday (date picker)

          Preferences:
            Controls:
              - Email notifications (toggle)
              - Language (dropdown: ["English", "Spanish"])
      </output>
    </example>

    <example>
      <input>
        A dashboard showing recent activity, statistics in chart format,
        and quick-action buttons for creating a project and uploading files.
        Includes buttons to refresh the data and adjust settings.
      </input>
      <output>
App:
  Pages:
    Dashboard:
      Description: >
        Aggregates recent activities, statistical summaries, and provides quick actions. Includes manual refresh and access to settings.

      Header:
        Title: "Dashboard"
        Buttons:
          - "Refresh"
          - "Settings"

      Body:
        Widgets:
          - RecentActivity (list)
          - Statistics (charts)
          - QuickActions (buttons: ["New Project", "Upload File"])
      </output>
    </example>
  </examples>

  <userInput>
    Provide your UX description here...
  </userInput>
</uxSpecRequest>
```