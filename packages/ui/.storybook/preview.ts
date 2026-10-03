import type { Preview } from '@storybook/react-vite';

// Load the library's styles (fonts + Tailwind) into every story.
import '../src/styles/index.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
};

export default preview;
