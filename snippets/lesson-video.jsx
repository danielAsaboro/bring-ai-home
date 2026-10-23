export const LessonVideo = ({ youtubeId, playlistId, title = "Lesson video" }) => {
  const src = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}`
    : playlistId
      ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`
      : null;

  if (!src) {
    return (
      <div className="not-prose rounded-2xl border border-zinc-950/10 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-5 py-6 my-6 flex items-center gap-4">
        <div className="shrink-0 size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg">▶</div>
        <div>
          <p className="m-0 font-semibold text-zinc-900 dark:text-zinc-100">Video in production</p>
          <p className="m-0 text-sm text-zinc-600 dark:text-zinc-400">The written lesson below is complete. The video for this lesson will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-zinc-950/10 dark:border-white/10" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={src}
        title={title}
        className="w-full h-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};
