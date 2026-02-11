import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function NewIdeaPage() {
  return (
    <section className="space-y-6">
      <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
          <FaArrowLeft /> 
          Back to ideas
      </Link>

      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Create Idea</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">Submit proposal</h1>

        <form className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Title</span>
            <input
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="Proposal title"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Category</span>
            <select className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50">
              <option value="1">1 - My Project</option>
              <option value="2">2 - Community Utility</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Summary</span>
            <textarea
              className="min-h-36 rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="Describe expected impact, milestones, and success metrics"
            />
          </label>

          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" className="rounded-lg bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white">
              Submit idea
            </button>
            <button type="button" className="rounded-lg border border-white/20 bg-[#313443] px-6 py-3 text-sm font-semibold text-slate-100">
              Save draft
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
