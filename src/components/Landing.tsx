import React from "react";
import { motion, useReducedMotion } from "motion/react";
export function Landing() {
  const reduced = useReducedMotion();
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 overflow-auto">
      <nav className="absolute z-10 top-0 inset-x-0 px-8 py-6 flex justify-between text-sm">
        <a href="/" className="font-semibold tracking-widest">
          SHADOWOPS
        </a>
        <a href="/app" className="text-indigo-300">
          Open workspace ↗
        </a>
      </nav>
      <section className="min-h-screen relative flex items-center border-b border-zinc-800 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(#52525b 1px,transparent 1px),linear-gradient(90deg,#52525b 1px,transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to left,black,transparent)",
          }}
        />
        <div className="relative w-full px-8 md:px-20 py-28">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="font-mono text-xs tracking-widest text-indigo-300 mb-8">
              OBSERVE → LEARN → COMPILE → EXECUTE
            </p>
            <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter mb-8">
              ShadowOps
            </h1>
            <h2 className="text-3xl md:text-5xl tracking-tight max-w-3xl leading-tight">
              Teach once.
              <br />
              Turn the work into a skill.
            </h2>
            <p className="text-zinc-400 max-w-lg mt-6 text-base leading-relaxed">
              Demonstrate a support resolution. Nemotron learns the workflow.
              Review the rule, approve the version, then run it on the next
              ticket.
            </p>
            <div className="flex flex-wrap gap-5 mt-10">
              <a
                href="/app"
                className="bg-indigo-500 hover:bg-indigo-400 transition-colors px-6 py-3 rounded-lg font-semibold"
              >
                Try the workspace →
              </a>
              <a href="/demo/shadowops-demo.mp4" className="px-3 py-3 text-zinc-300">
                Watch live demo ↗
              </a>
              <a href="#how" className="px-3 py-3 text-zinc-300">
                See how it works ↓
              </a>
            </div>
            <p className="text-xs text-zinc-500 mt-6">
              Controlled demo. Payments and customer messages are mock
              operations.
            </p>
          </motion.div>
        </div>
      </section>
      <section id="how" className="px-8 md:px-20 py-24">
        <h2 className="text-3xl mb-12">
          Human judgment becomes a reviewed workflow.
        </h2>
        {[
          [
            "01",
            "Observe",
            "Semantic actions capture the task, its inputs and verified outcomes.",
          ],
          [
            "02",
            "Learn",
            "NVIDIA Nemotron via Nebius compares demonstrations and proposes a reusable definition.",
          ],
          [
            "03",
            "Compile",
            "Validate references, skill contracts and conditions. Preserve each published version.",
          ],
          [
            "04",
            "Execute",
            "Run deterministic tools. Pause for manager approval. Keep receipts and the execution trace.",
          ],
        ].map(([n, title, copy]) => (
          <motion.div
            key={n}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-[80px_220px_1fr] gap-4 py-8 border-t border-zinc-800"
          >
            <span className="text-indigo-300 font-mono">{n}</span>
            <h3 className="text-xl">{title}</h3>
            <p className="text-zinc-400 max-w-xl">{copy}</p>
          </motion.div>
        ))}
      </section>
      <section className="px-8 md:px-20 py-20 border-t border-zinc-800">
        <h2 className="text-3xl mb-5">Start with one duplicate charge.</h2>
        <p className="text-zinc-400 max-w-xl mb-8">
          Maria teaches the sequence. Alex adds the approval rule. Daniel runs
          it. Sarah demonstrates why guardrails matter.
        </p>
        <a
          href="/app"
          className="text-indigo-300 text-lg hover:text-indigo-200"
        >
          Open the demo →
        </a>
      </section>
      <footer className="px-8 md:px-20 py-8 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between">
        <span>ShadowOps · Mikel Studio</span>
        <a href="https://github.com/vutienduong/mikel-nvdia-shadow-ops">
          Source & setup ↗
        </a>
      </footer>
    </main>
  );
}
