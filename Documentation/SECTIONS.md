# Shared Sections Pattern

**Note**: This section demonstrates the shared sections pattern using examples like `TeamSection`, `TestimonialSection`, and `NewsletterSection`. These are illustrative examples showing the architectural pattern - NOT requirements to build these specific sections. Apply the pattern to whatever reusable page sections make sense for your application.

Shared sections are reusable page components that combine UI, data fetching, and consistent styling. They allow rapid page composition from tested, production-ready building blocks.

## What Are Reusable Sections

**Sections are:**
- Self-contained page components (hero, team, testimonials, newsletter, etc.)
- Include their own data fetching logic
- Have consistent props interfaces
- Follow responsive design patterns
- Tested and production-ready

**Example sections you might build:**
- `TeamSection` - Display team members with photos/bios
- `TestimonialSection` - Rotating customer testimonials
- `NewsletterSection` - Email signup form
- `HeroSection` - Page header with CTA
- `CTASection` - Call-to-action block
- `LogoSection` - Partner/client logos

## Section Composition Patterns

```typescript
// src/shared/sections/TeamSection.tsx
'use client'

import { useEffect, useState } from 'react'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  imageUrl: string
}

interface TeamSectionProps {
  title?: string
  subtitle?: string
  backgroundColor?: 'white' | 'gray' | 'blue'
}

export function TeamSection({
  title = 'Our Team',
  subtitle = 'Meet the people behind our success',
  backgroundColor = 'white',
}: TeamSectionProps) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeam() {
      const response = await fetch('/api/team')
      const data = await response.json()
      setTeam(data)
      setLoading(false)
    }
    fetchTeam()
  }, [])

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>
  }

  const bgClass = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    blue: 'bg-blue-50',
  }[backgroundColor]

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <div key={member.id} className="text-center">
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{member.role}</p>
              <p className="text-sm text-gray-700">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

## How Features Consume Sections

```typescript
// src/features/about/components/AboutPage.tsx
import { TeamSection } from '@/shared/sections/TeamSection'
import { TestimonialSection } from '@/shared/sections/TestimonialSection'
import { NewsletterSection } from '@/shared/sections/NewsletterSection'

export function AboutPage() {
  return (
    <div>
      <section className="py-20 bg-blue-600 text-white text-center">
        <h1 className="text-5xl font-bold mb-4">About Us</h1>
        <p className="text-xl">Learn about our mission and team</p>
      </section>

      <TeamSection
        title="Leadership Team"
        subtitle="The visionaries behind our platform"
        backgroundColor="gray"
      />

      <TestimonialSection
        title="What Our Clients Say"
        backgroundColor="white"
      />

      <NewsletterSection
        title="Stay Updated"
        backgroundColor="blue"
      />
    </div>
  )
}
```

## Section Conventions

**Props interface:**
- `title?: string` - Section heading (optional, with default)
- `subtitle?: string` - Section subheading (optional)
- `backgroundColor?: 'white' | 'gray' | 'blue'` - Background color (optional)
- Any section-specific props

**Styling:**
- Container: `container mx-auto px-4`
- Padding: `py-20` (top/bottom)
- Responsive: Mobile-first grid (`grid-cols-1 md:grid-cols-3`)
- Consistent spacing: `mb-4`, `mb-8`, `mb-12`

**Data fetching:**
- Client-side fetch in `useEffect`
- Loading state with spinner/skeleton
- Error handling with fallback UI

**Responsive:**
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3+ columns
