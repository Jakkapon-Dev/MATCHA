import React from 'react';
import { Droplet, Sun, Layers, Eye } from 'lucide-react';

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    image: '/images/personal_test/undertone.jpg',
    icon: <Droplet size={18} className="text-matcha-primary" />,
    options: [
      { 
        letter: 'A',
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/warm-skin.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B',
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/cool-skin.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C',
        score: 'Neutral', 
        weight: 2,
        image: '/images/personal_test/neutral-skin.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 2,
    image: '/images/personal_test/acc.jpg',
    icon: <Sun size={18} className="text-matcha-accent" />,
    options: [
      { 
        letter: 'A', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/acc-gold.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/acc-silver.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/acc-gold-silver.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 3,
    image: '/images/personal_test/skin.jpg',
    icon: <Sun size={18} className="text-amber-600" />,
    options: [
      { 
        letter: 'A', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/tans-easily.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/burn-easily.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/skin-neutral.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 4,
    image: '/images/personal_test/fabric.jpg',
    icon: <Layers size={18} className="text-matcha-primary" />,
    options: [
      { 
        letter: 'A', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/fabric-warm.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/fabric-cool.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/fabric-neutral.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 5,
    image: '/images/personal_test/intensity-tone.jpg',
    icon: <Eye size={18} className="text-matcha-text" />,
    options: [
      { 
        letter: 'A', 
        score: 'Spring', 
        weight: 3,
        image: '/images/personal_test/intensity-spring.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Summer', 
        weight: 3,
        image: '/images/personal_test/intensity-summer.jpg',
        imagePosition: '0% center' 
      },
      { 
        letter: 'C', 
        score: 'Autumn', 
        weight: 3,
        image: '/images/personal_test/intensity-autumnn.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'D', 
        score: 'Winter', 
        weight: 3,
        image: '/images/personal_test/intensity-winter.jpg',
        imagePosition: '0% center' 
      }
    ]
  }
];

export default QUIZ_QUESTIONS;
