import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Contest Submission Token | AktionFilmAI',
  description: 'Purchase your submission token for the AktionFilm Contest. $10 for first token, $5 for additional. Each token includes 1 submission and 3 votes.',
  openGraph: {
    title: 'Buy Contest Submission Token | AktionFilmAI',
    description: 'Purchase your submission token for the AktionFilm Contest. $10 for first token, $5 for additional. Each token includes 1 submission and 3 votes.',
    type: 'website',
    images: [
      {
        url: '/og-image-token.png', // You'll need to create this image
        width: 1200,
        height: 630,
        alt: 'AktionFilmAI Contest Token',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Contest Submission Token | AktionFilmAI',
    description: 'Purchase your submission token for the AktionFilm Contest. $10 for first token, $5 for additional. Each token includes 1 submission and 3 votes.',
    images: ['/og-image-token.png'],
  },
};

export default function BuyTokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
