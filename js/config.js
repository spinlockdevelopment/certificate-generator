// js/config.js

export const SIZE_MODES = {
  '85x11': { w: 816,  h: 1056, certW: '8.5in', certH: '11in',  pageMargin: '0'            },
  '8x10':  { w: 768,  h: 960,  certW: '8in',   certH: '10in',  pageMargin: '0.5in 0.25in' },
};

export const FONT_PAIRS = [
  { name: 'Classic',     heading: 'Cinzel',             bodyFf: 'EB Garamond'       },
  { name: 'Romantic',    heading: 'Playfair Display',   bodyFf: 'Lora'              },
  { name: 'Refined',     heading: 'Cormorant Garamond', bodyFf: 'Libre Baskerville' },
  { name: 'Traditional', heading: 'Libre Caslon Text',  bodyFf: 'Source Serif 4'    },
  { name: 'Stately',     heading: 'Cinzel Decorative',  bodyFf: 'Crimson Text'      },
];

export const PALETTES = [
  { name: 'Crimson & Gold',  accent:'#8B0000', accentLt:'#A52020', gold:'#B8953A', cream:'#FDFAF2', ink:'#1A1A1A', inkMid:'#3A3330', inkMuted:'#6B6560' },
  { name: 'Navy & Silver',   accent:'#1a2c5c', accentLt:'#2a3d6e', gold:'#8a9bb0', cream:'#F5F7FA', ink:'#0a0f1f', inkMid:'#1a2030', inkMuted:'#556070' },
  { name: 'Forest & Brass',  accent:'#1e4028', accentLt:'#2d5438', gold:'#8a6f3a', cream:'#F5F7F2', ink:'#111a0f', inkMid:'#253020', inkMuted:'#4a5a44' },
  { name: 'Midnight & Rose', accent:'#2d1b4e', accentLt:'#3d2a5e', gold:'#c4a0b0', cream:'#FAF7FC', ink:'#1a0f2a', inkMid:'#2a1f3a', inkMuted:'#6a5a72' },
];

// Base pixel sizes for each font-size slider (used to compute print px display)
export const FONT_SIZE_BASES = {
  org:         13,
  title:       22,
  recipient:   38,
  body:        17.5,
  presentedTo: 15,
  sig:         11,
  presentedBy: 10,
  date:        14,
};

// Default spacing values in px
export const DEFAULT_SPACING = {
  logo:         20,
  org:          10,
  title:        12,   // above and below title (equal)
  presentedTo:   0,   // offset added to auto-calculated margin
  recipient:     6,   // gap above recipient
  paragraph:    16,   // uniform gap: above HR, below HR, below paragraph
  sig:          19,   // gap below signatures
  presentedBy:  12,   // gap above "Presented By"
  date:         10,   // above and below date (equal)
};

// Compute tomorrow's date as default
function tomorrowFormatted() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const DEFAULT_CERT_DATA = {
  content: {
    title:       'Certificate of Recognition',
    orgName:     'Springfield Volunteer Fire Department',
    recipient:   'Jimmy Smith',
    body:
      'In recognition of *exceptional service* and outstanding contributions to the community. ' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ' +
      'ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco ' +
      'laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in ' +
      'voluptate velit esse cillum dolore eu fugiat nulla pariatur. *Excepteur sint occaecat* ' +
      'cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    presentedBy: 'Presented by Springfield Volunteer Fire Department',
    date:        tomorrowFormatted(),
    sigs: [
      { name: 'Peter Parker', title: 'Photographer' },
      { name: 'Clark Kent', title: 'Daily Planet, Reporter' },
    ],
  },
  format: {
    fontSizes: { logo: 1, org: 1, title: 1, recipient: 1, body: 1, presentedTo: 1, sig: 1, presentedBy: 1, date: 1 },
    spacing:     { ...DEFAULT_SPACING },
    borderMargin:  63,
    fontPairIndex: 0,
    paletteIndex:  0,
    cardStock:     PALETTES[0].cream,
    sizeMode:      '85x11',
  },
};
