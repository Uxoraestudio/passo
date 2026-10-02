# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General public in Chile who attend concerts, sports, theatre and festivals. They discover events, buy tickets, and later open their account (mostly on a phone) to check and present their e-tickets on event day.

Secondary audience: staff/admins who manage events, branding and SEO through the separate `admin/` app.

## Product Purpose

Passo is a ticketing platform (web + admin panel) for selling event tickets in Chile. Success means a visitor finds an event, buys without friction, and trusts that their ticket will work at the door.

## Positioning

Experience and trust: a simple, fast purchase flow, a dynamic QR e-ticket that resists fraud, and 24/7 human support ("Concierge de Eventos").

## Operating Context

- Public site `web/` (Next.js 16, CSS Modules) reads events, sectors, venues, branding and SEO from Supabase; edits made in `admin/` show up on the site immediately.
- Purchase flow: event detail (referential map + prices) → login required → `entradas` (sector/qty selection) → `asientos` (seat selection) → checkout.
- Users authenticate with Supabase Auth (email/password; Google/Apple buttons exist in UI but are not wired).
- Prices in Chilean pesos (CLP); all copy in Spanish (Chile).

## Capabilities and Constraints

- Real data: events (`events`, `event_sectors`, `venues`), `profiles` (role), `branding`, `site_settings`, `seo_settings`.
- Undecided / not built: there is no orders/tickets table yet. "Mis entradas" uses example tickets built from real Supabase events until purchases are persisted.
- Favorites are stored per browser (localStorage), not per account.
- Brand name in UI is configurable via admin branding (logo URL); the codebase and public URL use "Passo" (some legacy copy says "Aforiq").

## Brand Commitments

- Name: Passo. Tagline in use: "Tu lugar en lo extraordinario" / "La vida se vive aquí".
- Existing visual language in `web/` is the incumbent identity (purple + orange, bracket "[ ]" motifs).

## Evidence on Hand

- Real event photos in `web/public/images/` (some Wikimedia CC BY-SA photos that still need visible attribution).
- No real testimonials, sales numbers or partner logos; do not fabricate them.

## Product Principles

1. Trust at the door: ticket state, date, place and seat must be unmistakable at a glance.
2. Mobile first for the attendee; the ticket is used on a phone in a noisy crowd.
3. Never make the buyer repeat work: preserve context across login and purchase steps.
4. Real data over decoration: show only what the system actually knows.
