import './globals.css';

export const metadata = {
  title: 'Dad Jokes | The Best Dad Jokes on the Internet',
  description: 'Get your daily dose of the cheesiest, most groan-worthy dad jokes. Click anywhere to get a new joke with a confetti celebration! Save, vote, and share your favorites.',
  keywords: 'dad jokes, funny jokes, humor, comedy, puns',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
