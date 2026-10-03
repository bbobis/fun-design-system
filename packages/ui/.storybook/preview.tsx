import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

// Fonts + Tailwind + tokens, plus the Storybook-only swatch classes.
import './preview.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
  decorators: [
    // Toolbar toggle. Sets data-theme="light" | "dark" on <html>, same as an app would.
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
    // Every story sits on the page background with the page text color, like it would in an app.
    (Story) => (
      <div className="min-h-full bg-bg p-6 font-sans text-fg">
        <Story />
      </div>
    ),
  ],
};

export default preview;
