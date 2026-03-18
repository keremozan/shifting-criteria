import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-6">
      <header className="flex items-baseline justify-between py-5 border-b border-gray-800">
        <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
          about
        </h1>
        <Link
          href="/"
          className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors"
        >
          back
        </Link>
      </header>

      <main className="flex-1 py-10 space-y-5 text-[12px] text-gray-400 leading-[1.8]">
        <div className="text-[11px] text-gray-300 font-medium">
          Entity Tries to Satisfy Shifting Criteria
        </div>

        <p>
          A document lives inside a group of autonomous agents. Each cycle, new fragments
          enter from a pool of sourced sentences. Other agents evaluate these fragments against
          a set of formal criteria and remove the ones that fail. The criteria shift over time,
          so a fragment that passes in one cycle may fail in the next.
        </p>

        <p>
          The source material comes from a real conversation between the artist and an AI
          architect, recorded during the making of this project. That conversation is visible
          in the metalog, alongside the artist's highlights and annotations. The work, the
          discussion about the work, and the marks left on that discussion are all presented
          together.
        </p>

        <p>
          This is an ongoing project. The conversation continues, the source pool grows,
          and the criteria may change.
        </p>

        <p>
          Press <s className="text-gray-600">cycle</s> run to begin. Each viewer gets their own sequence. Nothing is saved.
        </p>

        <div className="border-t border-gray-800 pt-4 text-[10px] text-gray-600">
          Kerem Ozan Bayraktar, 2026. Built with Claude.
        </div>
      </main>
    </div>
  );
}
