# BUDI PORTFOLIO — PREMIUM UI REFINEMENT & DESIGN CONSISTENCY

## YOUR ROLE

Act as a Principal Creative Frontend Engineer, Senior UI/UX Designer, Design Systems Architect, and Frontend Quality Engineer.

You are working inside the existing BUDI Portfolio project.

Your mission is to refine and elevate the existing design, resolve layout issues, unify the visual identity, and improve the interactive experience.

**This is an in-place improvement, NOT a project rebuild.**

The portfolio is evolving toward a premium interactive digital museum aesthetic.

Your implementation must respect that direction while preserving the existing brand identity.

---

# 0. CRITICAL RULES

Before editing, inspect the relevant existing components, styles, design tokens, and data sources.

Follow these rules strictly:

- Never rebuild the project from scratch.
- Preserve all existing functionality.
- Preserve existing real data and Supabase integration, if present.
- Preserve existing themes and translations.
- Do not overwrite unrelated changes.
- Do not remove existing animations unless they cause issues.
- Do not introduce unnecessary dependencies.
- Do not create mock projects, skills, certificates, or services.
- Do not change database schemas.
- Do not push to GitHub.
- Do not deploy to Vercel.
- Do not create Git commits without permission.
- Keep all modifications local.
- Do not print entire files or verbose logs.
- Use the existing design system wherever possible.

Inspect the current Skills section first.

**The current Skills section is the primary visual reference for the other exhibition sections.**

Identify its actual background treatment, blue frame/glow, section heading style, border geometry, spacing, typography, and visual hierarchy.

Reuse the underlying design language instead of inventing a conflicting one.

---

# 1. GLOBAL DESIGN CONSISTENCY

## Objective

Unify the following sections:

- Services
- Skills
- Projects
- Certificates
- Contact
- Support & Donations

The result should feel like one carefully designed premium portfolio.

Avoid inconsistent colors, random card dimensions, excessive gradients, and unrelated visual effects.

## Visual Direction

Maintain the existing BUDI branding.

Use:

- Premium glassmorphism
- Transparent layered surfaces
- Controlled blue/purple accent lighting
- Elegant section frames
- Subtle borders
- Soft architectural shadows
- Refined typography
- Balanced whitespace
- Consistent corner radii
- Cohesive hover animations

Do not redesign the entire website unnecessarily.

Improve only the requested areas and their directly related shared components.

---

# 2. PROJECTS & CERTIFICATES — MATCH SKILLS SECTION BACKGROUND

## Critical Design Requirement

The existing Skills section contains a distinctive blue-toned framed background.

I want the Projects and Certificates sections to use the same visual background language.

This includes:

- Blue illuminated background treatment
- Framed section container
- Border and glow behavior
- Background layering
- Section heading presentation
- Consistent horizontal alignment
- Consistent spacing
- Responsive frame behavior

Do not simply copy arbitrary CSS values.

Extract reusable styling patterns or design tokens where appropriate.

## Projects Section

Redesign the Projects section background and outer frame to visually match the Skills section.

Preserve all project content, links, data integration, and interactions.

Improve:

- Heading typography
- Section subtitle
- Background frame
- Internal spacing
- Project layout
- Visual balance
- Responsive behavior

The Projects section should feel like another exhibition hall belonging to the same museum.

## Certificates Section

Apply the same framed background design language to Certificates.

Improve:

- Certificate presentation
- Frame spacing
- Heading typography
- Responsive layout
- Internal padding
- Visual hierarchy

The Certificates section should feel visually connected to Skills and Projects.

## Services Section

Refine the Services section to match the same brand identity without making every section visually identical.

Use a coherent background, heading treatment, spacing system, and premium visual hierarchy.

---

# 3. SECTION HEADINGS — PREMIUM TYPOGRAPHY

Redesign the heading presentation for:

- Services
- Skills
- Projects
- Certificates

The headings must look more intentional and premium.

Use:

- Strong typography
- Balanced font sizes
- Refined letter spacing
- Elegant accent styling
- Subtle decorative lines
- Consistent alignment
- Controlled highlight effects

Avoid oversized text that causes overlap.

Avoid unnecessary text animations that reduce readability.

Each section should have a distinctive title while sharing a consistent heading component.

Respect all supported languages and Arabic RTL layout.

---

# 4. COUNTERS — COMPLETE VISUAL REFINEMENT

## Current Problem

The existing counters need a more polished visual presentation and better positioning.

## Required Changes

Redesign the counters to feel like premium museum statistics.

Examples:

- Total Skills
- Total Projects
- Total Certificates
- Total Services, where applicable

## Layout

Counters must be:

- Properly centered
- Evenly spaced
- Visually balanced
- Responsive
- Aligned with the section heading and content
- Clearly readable

Do not place counters awkwardly near section borders.

## Visual Style

Use:

- Elegant typography
- Strong numeric hierarchy
- Subtle accent illumination
- Premium compact containers
- Consistent padding
- Smooth entrance animations
- Accessible number presentation

Avoid excessive bouncing or continuous animations.

## Dynamic Data

All counter values must come from existing real data.

Never hardcode totals.

Counters must update when the underlying data changes.

## Replace Generic Exhibit Labels

Remove the generic word:

`EXHIBITS`

Replace it with the correct localized category label.

Examples:

- 11 Skills
- 3 Projects
- 5 Certificates
- 4 Services

These numbers are examples only.

Always calculate actual values.

## Localization

Support proper singular/plural rules.

English examples:

- 1 Skill
- 2 Skills

Arabic examples:

- مهارة واحدة
- مهارتان
- 11 مهارة
- 3 مشاريع

Use the existing localization infrastructure and appropriate pluralization rules.

Do not create a second translation system.

---

# 5. OFFICIAL SKILL & SERVICE LOGOS

## Main Requirement

Every skill and service should display an appropriate recognizable official logo or icon.

For example:

- React → React logo
- Next.js → Next.js logo
- TypeScript → TypeScript logo
- JavaScript → JavaScript logo
- Supabase → Supabase logo

These are illustrative mappings only.

Use the actual skills and services found in the project.

## Logo Strategy

1. Inspect the existing assets.
2. Reuse official logos already available.
3. Inspect the existing icon libraries.
4. Use a verified official brand asset when necessary.
5. Prefer optimized SVG or existing supported assets.
6. Preserve correct aspect ratios.
7. Preserve recognizable brand colors where appropriate.
8. Ensure good contrast against dark backgrounds.

Do not invent official-looking logos.

Do not use unrelated generic symbols for known technology brands.

Do not use emojis as replacements for official technology logos.

If an official logo is unavailable, use a clearly neutral fallback rather than a fake brand mark.

## Service Icons

Not every service has an official brand logo.

For generic services such as Web Development or UI/UX Design, use a consistent professional icon system.

Do not falsely represent generic services as official brands.

## Performance

Avoid loading large external icon packages unnecessarily.

Prefer existing dependencies and optimized local assets.

---

# 6. PROJECT BADGES — MATCH WEBSITE BADGE DESIGN

## Current Problem

Project badges are visually less refined than the badges used elsewhere in the portfolio.

## Requirement

Inspect the existing website badges.

Identify their:

- Border treatment
- Background opacity
- Typography
- Accent colors
- Padding
- Border radius
- Hover behavior
- Icon alignment

Apply that same design language to project badges.

Use a shared badge component if practical.

## Expected Result

Project technology badges and category badges should feel native to the BUDI design system.

Avoid inconsistent chip shapes, excessive saturation, and awkward spacing.

Preserve badge semantics and actual project data.

---

# 7. CONTACT SECTION — COMPLETE LAYOUT REPAIR

## Highest Priority

The Contact section currently has spacing, alignment, and overlapping-element problems.

This must be fixed thoroughly.

## Required Audit

Inspect the Contact section DOM/component structure and all related CSS.

Find and fix:

- Overlapping cards
- Incorrect margins
- Incorrect padding
- Broken grid alignment
- Inconsistent card dimensions
- Crowded typography
- Insufficient gaps
- Elements extending outside containers
- Incorrect absolute positioning
- Unnecessary fixed heights
- Responsive overflow
- Misaligned buttons
- Inconsistent section spacing
- Decorative elements covering content

Do not hide problems using `overflow: hidden` unless clipping is genuinely intended.

Fix the actual layout causes.

## New Contact Design

Redesign the Contact section using a premium transparent glass aesthetic.

Visual characteristics:

- Transparent glass cards
- Controlled backdrop blur
- Soft accent borders
- Subtle blue/purple lighting
- Elegant shadows
- Refined typography
- Generous but balanced spacing
- Clear visual hierarchy
- Consistent card dimensions

## Layout Structure

Organize the section into logical visual groups:

1. Contact introduction
2. Contact methods
3. Contact form, if present
4. Support and donation area
5. Secondary contact actions, if present

Avoid excessive vertical gaps.

Avoid placing unrelated elements too close together.

## Contact Cards

Cards should:

- Have consistent visual proportions
- Align cleanly
- Use predictable padding
- Have sufficient icon-to-text spacing
- Support long translated text
- Maintain equal heights where visually appropriate
- Adapt naturally to content height
- Work on mobile without horizontal scrolling

## Contact Form

If a contact form exists:

- Preserve its current submission behavior.
- Preserve validation.
- Preserve error and success states.
- Improve field spacing and label alignment.
- Ensure readable focus states.
- Do not break backend integration.

## Responsive Behavior

Test at representative widths including:

- 360px
- 390px
- 768px
- 1024px
- 1440px

Also inspect intermediate widths.

There must be no overlapping text, clipped cards, or unintended horizontal overflow.

---

# 8. CONTACT SECTION IMAGE — REPLACE EXISTING VISUAL

Inspect the current decorative image used in the Contact section.

Replace it with a more appropriate premium visual that fits the new BUDI identity.

## Creative Direction

The replacement should feel:

- Modern
- Professional
- Elegant
- Technologically relevant
- Consistent with the museum-inspired design
- Visually balanced with glass contact cards

Preferred concept:

A refined futuristic communication or digital connection illustration with controlled blue/purple lighting and architectural depth.

Avoid:

- Generic corporate stock photos
- Random cartoon illustrations
- Overly bright colors
- Low-resolution assets
- Unnecessary heavy 3D graphics

Reuse an appropriate existing asset if available.

Otherwise create or source an appropriately licensed visual using available project tools.

Do not substitute an unrelated image merely to satisfy the requirement.

Optimize the asset and provide suitable alt text or mark it decorative when appropriate.

---

# 9. SUPPORT & DONATIONS — PREMIUM PAYMENT EXPERIENCE

## Core Requirement

Redesign the Support & Donations subsection.

The payment methods must no longer look like ordinary generic cards.

They should resemble premium payment instruments or elegant payment receipts.

The experience should feel valuable, polished, and trustworthy.

## Creative Direction

Use a combination of:

- Luxury payment-card aesthetics
- Refined receipt-inspired information layout
- Premium glass surfaces
- Subtle metallic accents
- Controlled reflections
- Clear payment branding
- Sophisticated typography
- Small decorative diamond-like highlights

The diamond concept refers to visual elegance, not excessive decoration.

Do not imitate official banking interfaces in a misleading way.

## Payment Method Cards

Inspect the actual payment methods already supported by the project.

Potential methods may include:

- Vodafone Cash
- InstaPay
- PayPal

Only display methods that are actually configured.

## Brand-Specific Colors

Each payment card should reflect its payment provider's recognizable identity.

Examples:

Vodafone Cash:
- Red accents
- White text where appropriate
- Dark premium supporting surfaces

InstaPay:
- Purple/violet accents
- Elegant gradient highlights
- Premium dark supporting surfaces

PayPal:
- Blue accents
- Clean payment-inspired typography
- Subtle glass effects

Do not force every payment method into the same accent color.

Maintain a consistent card structure while allowing brand-specific visual styling.

## Card Information

Use existing configured payment information.

Where applicable, display:

- Payment method name
- Official logo
- Payment identifier
- Copy button
- Optional QR code if already supported
- Clear instructions

Do not invent account numbers or payment details.

Do not expose unrelated private information.

## Interactions

Implement polished microinteractions:

- Subtle hover elevation
- Gentle light reflection
- Smooth copy feedback
- Clear active states
- Accessible buttons

The copy action must copy the correct existing payment identifier.

Provide visible confirmation after copying.

Never claim payment was completed merely because a user copied an identifier.

## Responsive Layout

Payment cards must remain elegant on mobile.

Avoid tiny text, clipped account numbers, or horizontal overflow.

---

# 10. LANGUAGE SWITCHER — FIX INTERACTION

## Current Problem

Clicking the current language flag immediately switches the language.

This is not the desired behavior.

## Required Interaction

Clicking the language icon or flag should OPEN a language selection menu.

It must NOT immediately change the language.

The visitor should explicitly select the desired language.

## Expected Flow

1. Visitor clicks the language control.
2. A polished dropdown or popover opens.
3. All supported languages are displayed.
4. The current language is clearly marked.
5. Visitor selects another language.
6. The website updates to the selected language.
7. The menu closes.
8. The selected language persists using the existing persistence mechanism.

## Language Options

Read supported languages from the existing project configuration.

If the project supports:

- Arabic
- English
- French
- Spanish
- Turkish

Display all five correctly.

## Visual Design

Use:

- Premium glass dropdown
- Proper spacing
- Language name
- Appropriate flag or language icon
- Current selection indicator
- Elegant hover states
- Smooth opening animation

## Accessibility

Support:

- Keyboard navigation
- Escape to close
- Outside click to close
- Focus management
- Screen-reader labels
- Correct menu positioning
- RTL layout

Do not break existing translation loading or fallback behavior.

---

# 11. RESPONSIVE & CROSS-SECTION QUALITY

Audit all modified sections together.

Ensure:

- Consistent section spacing
- No overlapping elements
- No clipped text
- No broken image ratios
- No unintended horizontal scroll
- No inconsistent card widths
- No oversized empty areas
- Correct RTL rendering
- Correct theme compatibility
- Functional interactive elements

Avoid unnecessary fixed heights.

Prefer flexible Grid and Flexbox layouts.

Use consistent spacing tokens.

---

# 12. IMPLEMENTATION ORDER

Work in this exact order.

## Stage 1 — Focused Audit

Inspect:

- Skills section visual styling
- Projects section
- Certificates section
- Services section
- Contact section
- Donation components
- Counters
- Language switcher
- Existing badges and logos

Identify relevant files and root causes.

Keep the audit concise.

## Stage 2 — Contact Repair

First fix overlapping elements, card dimensions, spacing, and responsiveness.

Then apply the premium glass redesign.

Verify the layout before continuing.

## Stage 3 — Support & Donations

Redesign payment cards with brand-specific visual identities.

Preserve all payment functionality.

## Stage 4 — Exhibition Sections

Unify Projects and Certificates backgrounds with the existing Skills section.

Refine Services to match the design language.

Improve headings, counters, logos, and badges.

## Stage 5 — Language Switcher

Implement the explicit language-selection dropdown.

Preserve existing translation behavior.

## Stage 6 — Final Polish

Refine:

- Spacing
- Typography
- Alignment
- Shadows
- Border consistency
- Hover effects
- Responsive layouts
- Accessibility
- Performance

---

# 13. VALIDATION & ACCEPTANCE CRITERIA

The implementation is complete only when:

- Contact section overlaps are resolved.
- Contact card dimensions and spacing are consistent.
- Contact cards use refined transparent glass styling.
- The Contact image is improved.
- Payment cards use recognizable provider-specific colors.
- Payment identifiers and copy actions still work.
- Projects and Certificates match the Skills section's framed blue background language.
- Services visually belongs to the same design system.
- Section headings are refined and consistent.
- Counters are centered and visually improved.
- The generic EXHIBITS label is removed.
- Counters display real localized category names.
- Technology skills display correct official logos where available.
- Services use appropriate official or neutral icons.
- Project badges match the existing website badge style.
- Clicking the language icon opens a selection menu.
- Language changes only after explicit selection.
- Existing themes and translations still work.
- No real data or functionality is lost.
- No unintended horizontal overflow remains.
- Mobile and desktop layouts are validated.
- No GitHub push or Vercel deployment occurs.

Run available targeted checks and the production build where feasible.

If browser-based visual testing is available, inspect the actual rendered pages at multiple viewport sizes.

Fix detected issues rather than merely reporting them.

Do not claim visual validation if no browser inspection was performed.

---

# 14. TOKEN-EFFICIENT EXECUTION

Work efficiently.

- Follow the existing AGENTS.md instructions.
- Inspect relevant files rather than dumping the entire repository.
- Reuse existing design tokens and components.
- Avoid repeated project-wide audits.
- Do not install unnecessary dependencies.
- Avoid unrelated refactoring.
- Use concise progress updates.
- Do not print complete source files.
- Run focused tests first.
- Stop when all requested changes are implemented and validated.

At the end, report:

1. Modified files.
2. Main improvements.
3. Issues fixed.
4. Tests performed and results.
5. Any remaining limitations.

Keep the final report concise.

---

# FINAL DESIGN DIRECTIVE

The result must look like a cohesive premium digital portfolio inspired by modern interactive museum design.

Prioritize:

**Visual consistency, originality, excellent spacing, professional typography, functional reliability, responsive behavior, and performance.**

Do not make superficial cosmetic changes.

Solve the underlying layout problems and deliver a polished, production-quality interface.

Preserve the existing BUDI identity and make the requested sections feel like they belong to the same premium design system.

Implement the improvements locally without committing, pushing, or deploying.


# BUDI Portfolio — Agent Rules

## Project
Existing portfolio with a new interactive museum.

## Efficiency
- Inspect only files relevant to the task.
- Reuse existing components and dependencies.
- Avoid unnecessary refactoring.
- Do not print entire source files.
- Keep explanations concise.
- Do not repeat completed repository audits.
- Do not install dependencies without justification.
- Use targeted tests before full validation.
- Summarize changes in 5 bullets maximum.

## Safety
- Preserve existing functionality and real data.
- Never overwrite unrelated user changes.
- No Git push, commits, or deployments.
- Never expose environment secrets.

## Workflow
1. Identify relevant files.
2. Implement one scoped feature.
3. Run targeted validation.
4. Report changes and remaining issues.
5. Stop and wait for the next task.
