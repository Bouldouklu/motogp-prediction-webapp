import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/10 mt-auto bg-black/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-400 text-sm">
                        <p>Built by <span className="text-motogp-red font-semibold">Jeremy Cabaret (Bouldouklu)</span></p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-500">
                        <p>For entertainment purposes only. Not affiliated with Dorna Sports S.L.</p>
                        <div className="hidden md:block w-1 h-1 bg-gray-700 rounded-full"></div>
                        <a
                            href="mailto:contact@jeremycabaret.com"
                            className="hover:text-white transition-colors"
                        >
                            Contact
                        </a>
                        <div className="hidden md:block w-1 h-1 bg-gray-700 rounded-full"></div>
                        <Link
                            href="/scoring"
                            className="hover:text-white transition-colors"
                        >
                            Scoring
                        </Link>
                        <div className="hidden md:block w-1 h-1 bg-gray-700 rounded-full"></div>
                        <Link
                            href="https://github.com/Bouldouklu/motogp-prediction-webapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-white transition-colors"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                            </svg>
                            <span>Source Code</span>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
