/**
 * The 404 page shows one of these at random where the "0" would be. Each is a classic meme
 * format rebuilt in the site's own colour blocks and type — no image files, so they follow
 * the theme, stay sharp at any size and need nothing beyond the site's own CSP.
 *
 * `name` is the format's common name; it is shown as the caption under the card.
 */
export type Meme = { id: string; name: string } & (
  | { format: 'drake'; nope: string; yep: string }
  | { format: 'nobody'; lines: string[]; punchline: string }
  | { format: 'brain'; steps: string[] }
  | { format: 'buttons'; left: string; right: string; caption: string; aside: string }
  | { format: 'dialog'; title: string; message: string; detail: string }
  | { format: 'fine'; status: string; quote: string }
  | { format: 'sign'; claim: string; dare: string }
)

export const memes: Meme[] = [
  {
    id: 'drake',
    name: 'Drakeposting',
    format: 'drake',
    nope: 'The page you clicked on',
    yep: 'A meme where that page should be',
  },
  {
    id: 'nobody',
    name: 'Nobody:',
    format: 'nobody',
    lines: ['Nobody:', 'Absolutely nobody:', 'This link:'],
    punchline: '404',
  },
  {
    id: 'brain',
    name: 'Expanding brain',
    format: 'brain',
    steps: ['Typing the URL', 'Typing it from memory', 'Landing on a 404', 'Staying for the memes'],
  },
  {
    id: 'buttons',
    name: 'Two buttons',
    format: 'buttons',
    left: 'Go back home',
    right: 'One more meme',
    caption: 'Every visitor, right now:',
    aside: '(sweating)',
  },
  {
    id: 'dialog',
    name: 'Task failed successfully',
    format: 'dialog',
    title: 'error.exe',
    message: 'Task failed successfully.',
    detail: 'Page: not found. Meme: found.',
  },
  {
    id: 'fine',
    name: 'This is fine',
    format: 'fine',
    status: 'Server status: all good',
    quote: 'This is fine.',
  },
  {
    id: 'sign',
    name: 'Change my mind',
    format: 'sign',
    claim: 'This 404 is the best page on the site.',
    dare: 'Change my mind.',
  },
]
