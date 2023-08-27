import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SliderProvider } from '../components/SliderContext'; // Import your CanvasProvider

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SliderProvider> {/* Wrap your app in your provider */}
      <Component {...pageProps} />
    </SliderProvider>
  );
}

export default MyApp;
