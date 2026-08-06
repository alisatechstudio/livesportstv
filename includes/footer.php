    <!-- Footer -->
    <footer class="site-footer border-t border-edge px-5 py-7 pb-12 text-center">
      <p
        class="text-muted max-w-[620px] mx-auto mb-3 leading-relaxed text-sm"
      >
        FreeTV indexes publicly available streams published by broadcasters. We host no video
        content and honor the iptv-org blocklist. Channels are streamed directly via HLS.
      </p>
      <a href="mailto:support@livesportstv.store?subject=Report a channel" class="report-link text-primary font-semibold text-sm">
        Report a channel
      </a>
    </footer>

    <!-- Player modal -->
    <div class="player-modal" id="playerModal" aria-hidden="true">
      <div class="player-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" data-close></div>
      <div
        class="player-dialog absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(960px,94vw)] max-h-[92vh] overflow-auto bg-surface border border-edge rounded-2xl p-4 shadow-glass"
      >
        <div class="player-top flex items-center justify-between mb-3">
          <div
            class="player-now inline-flex items-center gap-2 font-bold text-xs text-muted uppercase tracking-wider"
          >
            <span
              class="live-dot w-2.5 h-2.5 rounded-full bg-red-500 animate-livepulse"
            ></span>
            Now playing
          </div>
          <button
            class="player-close bg-transparent border border-edge text-ink w-9 h-9 rounded-full cursor-pointer text-base flex items-center justify-center"
            data-close
            aria-label="Close player"
          >
            ✕
          </button>
        </div>

        <div class="video-frame relative rounded-xl overflow-hidden bg-black aspect-video">
          <video
            id="player"
            controls
            playsinline
            preload="metadata"
            class="w-full h-full block bg-black"
          ></video>
          <div
            class="video-overlay absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-black/72 text-muted text-sm opacity-0 invisible transition-opacity duration-200 text-center p-5"
            id="videoOverlay"
          >
            <div
              class="spinner w-9 h-9 rounded-full border-[3px] border-white/18 border-t-accent animate-spin"
            ></div>
            <span id="overlayText">Connecting to stream…</span>
          </div>
        </div>

        <div class="player-meta flex justify-between items-start gap-4 mt-[14px] flex-wrap">
          <div>
            <h3 id="playerTitle" class="m-0 mb-1 text-xl">Select a channel</h3>
            <p id="playerDesc" class="m-0 text-muted leading-relaxed"></p>
          </div>
          <div class="player-badges flex gap-2 flex-wrap">
            <span
              class="badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 bg-primary-soft text-ink text-xs font-semibold"
            >
              <img
                id="playerFlag"
                alt=""
                class="flag w-5 h-[14px] rounded-sm object-cover flex-none"
              />
              <span id="playerCountry">—</span>
            </span>
            <span
              class="badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 bg-primary-soft text-ink text-xs font-semibold"
              id="playerCategory"
            >
              —
            </span>
          </div>
        </div>
      </div>
    </div>

    <script>
      window.__CHANNELS__ = <?php echo $channels_json ?? '[]'; ?>;
    </script>
    <script src="freetv.js"></script>
    <script async src="//wwr.giriudog.com/?tag=bea0966f"></script>
    <script async src="https://quge5.com/88/tag.min.js" data-zone="261743" data-cfasync="false"></script>
    <script async src="https://pl30444344.effectivecpmnetwork.com/82/48/78/824878b0986e4439539f1f4e2a716cbb.js"></script>
    <script async src="https://pl30444345.effectivecpmnetwork.com/97/0f/11/970f112cc56a513a8e5d1561cbe3558c.js"></script>

    <!-- Tailwind safelist for dynamic classes -->
    <div class="hidden" aria-hidden="true">
      <article
        class="group relative border border-edge bg-card rounded-xl p-3.5 cursor-pointer transition-all duration-160 flex flex-col gap-2.5 hover:-translate-y-0.75 hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] hover:shadow-card hover:bg-card-hover"
      >
        <button
          class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full border border-edge bg-[color:color-mix(in_srgb,var(--bg)_70%,transparent)] text-muted cursor-pointer text-sm flex items-center justify-center opacity-0 transition-all duration-160 group-hover:opacity-100 hover:scale-110"
        >
          ★
        </button>
        <div class="flex items-center gap-2.5">
          <img
            class="w-10 h-10 rounded-lg object-cover bg-black border border-edge flex-none"
            alt=""
          />
          <div class="font-bold text-sm leading-snug overflow-hidden line-clamp-2"></div>
        </div>
        <div class="flex items-center justify-between gap-2 mt-auto">
          <span class="flex items-center gap-1.5 text-muted text-xs">
            <img class="w-5 h-[14px] rounded-sm object-cover flex-none" alt="" />
             </span
            ><span
              class="text-muted text-xs bg-[var(--lang-bg)] px-2 py-0.5 rounded-full whitespace-nowrap"
            ></span
            ><span
              class="inline-flex items-center gap-[5px] text-xs font-semibold text-emerald bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.3)] px-2 py-0.5 rounded-full"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald"></span>Live</span
            >
          </span>
        </div>
      </article>
      <div
        class="col-span-full text-center text-muted p-10 border border-dashed border-edge rounded-xl"
      ></div>
    </div>
  </body>
</html>