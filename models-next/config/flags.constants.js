/**
 * Flag constants for defining content features
 */

// Flag metadata with display options
export const FLAG_META = {
  featured: {
    label: 'Featured',
    icon: '🌟',
    color: '#ffc107',
    description: 'Marks this item as highlighted or promoted.',
  },
  pinned: {
    label: 'Pinned',
    icon: '📌',
    color: '#e91e63',
    description: 'Keeps this item fixed at the top of a list.',
  },
  hidden: {
    label: 'Hidden',
    icon: '🙈',
    color: '#9e9e9e',
    description: 'Hides this item from public view.',
  },
  highlighted: {
    label: 'Highlighted',
    icon: '💡',
    color: '#03a9f4',
    description: 'Draws extra attention to this item.',
  },
};

// List of flag enum values
export const FLAG_ENUMS = Object.keys(FLAG_META); 