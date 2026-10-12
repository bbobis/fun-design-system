import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FileUpload } from './file-upload';

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Receipts' },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

const MB = 1024 * 1024;
const sample = (name: string, type: string, size: number) =>
  new File([new Uint8Array(size)], name, { type });

/**
 * Drag files onto the box, paste them (Ctrl/⌘+V while it's focused), or use Browse.
 * Try a file over 10 MB or a .zip: it's refused with the reason.
 */
export const Default: Story = {
  render: function Render() {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <FileUpload
        label="Receipts"
        description="PDF or images, up to 10 MB each."
        accept={['application/pdf', 'image/*']}
        maxSize={10 * MB}
        value={files}
        onChange={setFiles}
      />
    );
  },
};

/** With files already chosen. Remove moves focus to the next file's Remove button. */
export const WithFiles: Story = {
  args: {
    description: 'PDF or images, up to 10 MB each.',
    defaultValue: [
      sample('INV-2041-receipt.pdf', 'application/pdf', 248 * 1024),
      sample('taxi-2026-10-02.jpg', 'image/jpeg', 1.4 * MB),
    ],
  },
};

/** `multiple={false}`: one file; choosing another replaces it. */
export const SingleFile: Story = {
  args: {
    label: 'Company logo',
    description: 'PNG or SVG.',
    multiple: false,
    accept: ['image/png', 'image/svg+xml'],
  },
};

/** `error`: your own validation, linked to the group for screen readers. */
export const WithError: Story = {
  args: { required: true, error: 'Attach at least one receipt.' },
};
