import './globals.css';

export const metadata = {
  title: 'Review Request System',
  description: 'Collect and manage customer reviews',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
