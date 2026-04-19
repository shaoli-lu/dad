export default function manifest() {
  return {
    name: 'Dad Jokes | The Best Dad Jokes on the Internet',
    short_name: 'Dad Jokes',
    description: 'Get your daily dose of the cheesiest, most groan-worthy dad jokes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
