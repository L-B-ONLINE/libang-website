# L.B ONLINE design system

## Identity

The brand is an inviting Minecraft community, expressed through an original
landscape, restrained blue, readable Korean typography and square controls.
The existing small Warden mark remains the recognition point. A sans wordmark
and Pretendard body text keep navigation and long articles readable; Monocraft
is reserved for Minecraft profile content.

The landscape is explicitly labeled as a concept illustration, not a screenshot
of a running server. Server names, modes, availability and guide instructions
remain factual. No player counts, testimonials or posts are invented.

Warm paper, white and charcoal form the light theme; neutral charcoal and lighter
blue form the dark theme. Color identifies actions, selection and focus. Angular
controls, quiet separators and consistent spacing replace decorative cards,
clipped corners, oversized logos and title ornaments. The image overlay exists
to make text legible.

## Structure

All pages share navigation, content width, heading scale and control grammar.
Their internal layouts follow their jobs: the homepage introduces the world
and connection action; servers use a visual directory; the forum uses a
searchable list; the guide uses document navigation and a reading column;
account and administration use labeled forms.

Three primary routes stay visible at 320px. The 44px account trigger opens an
anchored Radix menu with collision handling, keyboard navigation, Escape and
focus return. Login and signup remain separate entries. Existing authenticated
settings and role controls remain in place.

The main action copies libang.online, beside connection instructions. Unreleased
servers lead to notices rather than misleading play actions. Guide documents
retain hash links, history and administrator editing. Java and Bedrock steps
are separated when the stored content supports it. Only the newest forum
notice is pinned; older notices keep their chronological position.

## Interaction

Recommendation selection and the square progress outline share one five-second
clock. Hover, focus and the pause control stop rotation. Reduced motion starts
rotation paused and disables optional movement. No entrance sequence delays
page entry. The square forum pencil tilt and logo triple-click easter egg remain.

Copy feedback stays in its button. Clipboard rejection falls back to the browser
copy command, then a selectable address. Mobile editable controls use 16px type.
Forms retain labels, errors and existing server-side authorization. The composer
reaches the bottom edge and closes through Cancel.

## Research and interpretation

Apple's hierarchy, legibility and purposeful motion inform restraint and detail.
Pumpkin demonstrates how distinctive type, color and specific content work
together. Leaf demonstrates a limited type and spacing system. These principles
are applied without copying layouts or claiming identical audiences.

- https://developer.apple.com/design/human-interface-guidelines/typography
- https://developer.apple.com/design/human-interface-guidelines/motion
- https://pumpkinmc.org/
- https://leafmc.one/
- https://www.nngroup.com/articles/consistency-and-standards/
- https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- https://www.reddit.com/r/Frontend/comments/1ret0ol/why_are_websites_starting_to_look_like_this/

Reddit comments describe perceptions, not a reliable authorship test.
Interchangeable cards, excess effects and generic promotional language were
avoided because they obscure this community's real content. No user study or
conversion uplift is claimed.

## Verification

Browser checks covered desktop, 390px and 320px layouts in light and dark modes,
account-menu placement and signup navigation, server links, guide selection and
history, search, filtering, pagination, notice pinning, composer cancellation,
post-detail return navigation and address copying verified by pasting.
Disposable fixtures and a local preview post were removed afterward.

The final TypeScript check and production build run through the Sites source
workflow before publication. Production account and administrator mutations,
and Microsoft linking, were not exercised during this redesign. Existing
authentication, database APIs, records and permissions are preserved.

## October 24 administration and controls

The footer now groups real routes under Play, Servers, Community and Help,
with one real Discord destination, the retained brand, copyright and attribution
disclaimer. Desktop uses four columns, small screens two. Edition marketing
labels have been removed; edition-specific connection instructions remain.

All icons used by the site share components/site-icons.tsx: square caps, miter
joins, angular silhouettes and sharp copy/document corners. The profile glyph
is 17px while its 44px target is retained.

The administrator workspace has overview, accounts, posts and guides. Accounts
include page-scoped search and role filters, email verification and login dates,
ID copying, information editing and existing role/recovery actions. Posts use
server-side search and pagination with existing edit/delete APIs. All seven
guide documents can be edited in the workspace. Unsaved edits prompt before
leaving, and ownership transfer requires a verified destination email.

Administrator data is authenticated on every request and owner-only. Responses
are private/no-store. Subadministrator permissions are unchanged. No schema
migration or new external service is required.

Local browser fixtures verified account editing requests, post filtering and
editing with the modified marker, delete cancellation, guide saves, desktop
and 390px administration, the 320px home/footer and lack of horizontal overflow.
The real administrative API rejected an unauthenticated request. Sixteen
isolated route checks, with external authentication and data dependencies
stubbed, verified unauthenticated/member/subadministrator rejection and the
missing service-key response. Unauthorized requests never reached data access. Fixtures were
removed before the final build. No production account or content mutation was
performed during verification.
