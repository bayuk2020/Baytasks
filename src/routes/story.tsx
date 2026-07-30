/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Send, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { storyApi, type Story } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Story — BayTasks" },
      {
        name: "description",
        content: "Feed personal ala Facebook/Instagram — foto dan momen harianmu.",
      },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storyApi
      .getAll()
      .then(setStories)
      .catch((error) => {
        console.error(error);
        toast.error("Gagal memuat Story");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearComposer = () => {
    setCaption("");
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!caption.trim() && !imageFile) {
      toast.error("Tulis sesuatu atau lampirkan gambar dulu ya");
      return;
    }
    setPosting(true);
    try {
      const created = await storyApi.create({
        caption: caption.trim() || undefined,
        image: imageFile ?? undefined,
      });
      setStories((prev) => [created, ...prev]);
      clearComposer();
      toast.success("Story berhasil diposting!");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal memposting Story");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Hapus Story ini?")) return;
    const prev = stories;
    setStories((s) => s.filter((story) => story.id !== id));
    try {
      await storyApi.remove(id);
    } catch (error) {
      console.error(error);
      setStories(prev);
      toast.error("Gagal menghapus Story");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Personal feed</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">
          Your <span className="neon-text">Story</span>
        </h1>
      </header>

      {/* ========================= */}
      {/* COMPOSER — "What's on your mind?" */}
      {/* ========================= */}
      <div className="glass rounded-2xl p-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Lagi mikirin apa, Bay?"
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />

        {previewUrl && (
          <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
            <img src={previewUrl} alt="Preview" className="max-h-80 w-full object-cover" />
            <button
              onClick={clearComposer}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur hover:bg-background transition"
              aria-label="Batalkan gambar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <ImageIcon className="h-4 w-4" />
            Foto
          </button>
          <Button onClick={submit} disabled={posting}>
            <Send className="mr-1 h-4 w-4" />
            {posting ? "Memposting..." : "Post"}
          </Button>
        </div>
      </div>

      {/* ========================= */}
      {/* FEED */}
      {/* ========================= */}
      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-10">Memuat feed…</div>
      ) : stories.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary mb-3" />
          <p className="text-muted-foreground">Belum ada Story. Mulai posting momen pertamamu!</p>
        </div>
      ) : (
        <div>
          <AnimatePresence>
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} onDelete={() => remove(s.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StoryCard({ story, onDelete }: { story: Story; onDelete: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass rounded-2xl overflow-hidden mb-4 group"
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full grid place-items-center bg-[var(--gradient-neon)] text-sm font-semibold text-primary-foreground">
            B
          </div>
          <div>
            <div className="text-sm font-medium">Bayu</div>
            <div className="text-xs text-muted-foreground">
              {new Date(story.createdAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-accent"
          aria-label="Hapus Story"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {story.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">{story.caption}</p>
      )}

      {story.imageUrl && (
        <img
          src={story.imageUrl}
          alt="Story"
          className="w-full max-h-[560px] object-cover"
          loading="lazy"
        />
      )}
    </motion.div>
  );
}
