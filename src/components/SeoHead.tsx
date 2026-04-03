import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

const SeoHead = ({ title, description, path, ogImage = '/og-image.png' }: SeoHeadProps) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const url = `https://creationation.app${path}`;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', ogImage.startsWith('http') ? ogImage : `https://creationation.app${ogImage}`);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    return () => {
      // Reset to defaults on unmount
      document.title = 'CreationNation — Premium Digital Product Studio';
    };
  }, [title, description, path, ogImage]);

  return null;
};

export default SeoHead;
